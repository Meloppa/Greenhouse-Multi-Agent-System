import os
import sys

# Support running directly via 'uvicorn main:app --reload' from backend/app or backend folder
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
import time
from typing import Dict, Any, List

from passlib.context import CryptContext
from jose import jwt, JWTError

from app.models import global_state, SensorReading, PlantSelection, ActuatorState, ChatMessage, ESP8266State
from app.agents.plant_expert import PlantExpertAgent
from app.agents.scheduler import TaskSchedulerAgent
from app.agents.diagnostics import DiagnosticsAgent
from app.agents.actuator import ActuatorControlAgent
from app.services.telegram_bot import TelegramBotService
from app.services.email_service import EmailService
from app.services.web_search import WebSearchService
from app.model_config import (
    get_active_model, get_all_models, set_active_model,
    get_agent_bindings, set_agent_binding, find_installed_model
)
from app.config import (
    SUPABASE_URL, SUPABASE_KEY, IS_SUPABASE_CONFIGURED,
    IS_TELEGRAM_CONFIGURED, TELEGRAM_CHAT_ID, SEARCH_ENABLED,
    JWT_SECRET_KEY, JWT_ALGORITHM, JWT_ACCESS_TOKEN_EXPIRE_MINUTES
)
import threading
import requests

# ─── PASSWORD HASHING & JWT UTILITIES ────────────────────────────────────────

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(plain_password: str) -> str:
    """Returns a bcrypt hash of the given plain-text password."""
    return _pwd_context.hash(plain_password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain-text password against a stored bcrypt hash."""
    return _pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Creates a signed JWT access token with an expiry timestamp."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


app = FastAPI(
    title="Zentra Flora - Greenhouse Multi-Agent API",
    description="Multi-agent automated system for real-time plant care, hardware actuation, and vision diagnostic alerts."
)

# Allow CORS for development dashboard access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup bot daemon
@app.on_event("startup")
async def startup_event():
    TelegramBotService.start_polling()

@app.on_event("shutdown")
async def shutdown_event():
    TelegramBotService.stop_polling()


def _get_ollama_models() -> tuple[bool, list]:
    """Returns (connected, model_names_list) from local Ollama instance."""
    try:
        r = requests.get("http://127.0.0.1:11434/api/tags", timeout=0.8)
        if r.status_code == 200:
            names = [m["name"] for m in r.json().get("models", [])]
            return True, names
    except Exception:
        pass
    return False, []


@app.get("/api/status")
async def get_system_status():
    """Returns the complete current state of the greenhouse dashboard."""
    # Generate daily tasks on demand to keep them updated
    daily_tasks = TaskSchedulerAgent.generate_daily_tasks(
        global_state.current_plant,
        global_state.growth_stage,
        global_state.age_days
    )

    ollama_connected, ollama_models = _get_ollama_models()

    active_model = get_active_model()
    active_model_installed = bool(find_installed_model(active_model, ollama_models)) if ollama_connected else False

    return {
        "current_plant": global_state.current_plant,
        "growth_stage": global_state.growth_stage,
        "age_days": global_state.age_days,
        "sensors": global_state.sensors,
        "targets": global_state.targets,
        "actuators": global_state.actuators,
        "sensor_history": global_state.sensor_history,
        "chat_history": global_state.chat_history,
        "alerts_history": global_state.alerts_history,
        "diagnostics_history": global_state.diagnostics_history,
        "tasks": daily_tasks,
        "active_model": active_model,
        "agent_bindings": get_agent_bindings(),
        "models": get_all_models(),
        "ollama_connected": ollama_connected,
        "ollama_models": ollama_models,
        "active_model_installed": active_model_installed,
        "is_supabase_configured": IS_SUPABASE_CONFIGURED,
        "is_telegram_configured": IS_TELEGRAM_CONFIGURED,
        "telegram_chat_id_set": bool(TELEGRAM_CHAT_ID and TELEGRAM_CHAT_ID != "your_chat_id_here"),
        "last_seen_chat_id": global_state.last_seen_chat_id,
        "search_enabled": SEARCH_ENABLED,
        "manual_mode": global_state.manual_mode,
        "esp8266": global_state.esp8266
    }

@app.post("/api/model/select")
async def select_system_model(payload: Dict[str, str]):
    """Selects which LLM/VLM is backing plant diagnostics and automated schedules."""
    model_name = payload.get("model")
    if not model_name:
        raise HTTPException(status_code=400, detail="Model name is required")

    success = set_active_model(model_name)
    if not success:
        raise HTTPException(status_code=400, detail=f"Model '{model_name}' is not supported")

    from app.services.telegram_bot import TelegramBotService
    TelegramBotService.send_alert(f"🤖 System Model reconfigured. Active LLM/VLM backing shifted to '{get_active_model()}'.")

    return {
        "status": "Model Shifted",
        "active_model": get_active_model(),
        "details": get_all_models()[get_active_model()]
    }

@app.post("/api/model/bind")
async def bind_agent_model(payload: Dict[str, str]):
    """Binds a specific AI agent to a chosen LLM/VLM model."""
    agent_name = payload.get("agent")
    model_name = payload.get("model")
    if not agent_name or not model_name:
        raise HTTPException(status_code=400, detail="Both 'agent' and 'model' are required fields")

    success = set_agent_binding(agent_name, model_name)
    if not success:
        raise HTTPException(status_code=400, detail=f"Invalid agent '{agent_name}' or model '{model_name}'")

    from app.services.telegram_bot import TelegramBotService
    TelegramBotService.send_alert(f"🤖 Agent Binding updated. '{agent_name}' agent is now powered by '{model_name}'.")

    return {
        "status": "Success",
        "agent": agent_name,
        "model": model_name,
        "agent_bindings": get_agent_bindings()
    }


def push_to_supabase_worker(reading: SensorReading):
    """Pushes physical sensor data directly into the user's Supabase database table."""
    if not IS_SUPABASE_CONFIGURED:
        return

    try:
        url = f"{SUPABASE_URL}/rest/v1/sensor_readings"
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        }
        payload = {
            "temperature": reading.temperature,
            "humidity": reading.humidity,
            "light": reading.light,
            "soil_moisture": reading.soil_moisture
        }
        r = requests.post(url, json=payload, headers=headers, timeout=5)
        if r.status_code in [200, 201]:
            print(f"[Supabase Push Success]: Recorded readings in database.")
        else:
            print(f"[Supabase Push Warning]: Table insert failed (HTTP {r.status_code}: {r.text}).")
            if r.status_code == 404:
                print("\n💡 SUPABASE TABLE SETUP REQUIRED 💡")
                print("Your Supabase database does not have the 'sensor_readings' table.")
                print("Please execute the following statement inside your Supabase SQL Editor:")
                print("""
CREATE TABLE sensor_readings (
    id bigint generated by default as identity primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    temperature float8,
    humidity float8,
    light float8,
    soil_moisture float8
);
                """)
    except Exception as e:
        print(f"[Supabase Push Error]: Network or connection failed - {str(e)}")


@app.post("/api/sensors")
async def update_sensor_readings(reading: SensorReading):
    """Receives JSON data from IoT sensors, evaluates thresholds, actuates components, and triggers alarms."""
    timestamp = datetime.now().strftime("%I:%M:%S %p")
    reading.timestamp = timestamp

    # 1. Update live reading
    global_state.sensors = reading

    # 2. Append to history queue (rolling max 12 items for clean chart renders)
    global_state.sensor_history.append({
        "time": timestamp.split(" ")[0][:-3],  # HH:MM format
        "temperature": reading.temperature,
        "humidity": reading.humidity,
        "light": global_state.last_light_pct,
        "soil_moisture": reading.soil_moisture
    })
    if len(global_state.sensor_history) > 12:
        global_state.sensor_history.pop(0)

    # 2b. Push to Supabase database in a non-blocking background thread
    if IS_SUPABASE_CONFIGURED:
        sb_thread = threading.Thread(target=push_to_supabase_worker, args=(reading,), daemon=True)
        sb_thread.start()

    # 3. Invoke Actuator Control Agent (if not in manual mode)
    logs = []
    if not global_state.manual_mode:
        new_actuators, logs = ActuatorControlAgent.process_readings(
            reading, global_state.targets, global_state.actuators
        )
        global_state.actuators = new_actuators

        # 4. Dispatch Telegram and Email Alerts on hardware activation or threshold warnings
        for log in logs:
            subject = f"Hardware State Change: {log['device']} {log['action']}"
            body_msg = f"The {log['device']} was {log['action'].lower()} automatically. Reason: {log['reason']}."
            TelegramBotService.send_alert(f"⚠️ *{subject}*\n{body_msg}")
            EmailService.send_alert(subject, body_msg)

    return {
        "status": "Success",
        "actuators": global_state.actuators,
        "triggered_actions": logs
    }

@app.post("/api/plant/select")
async def select_active_plant(selection: PlantSelection):
    """Executes the Plant Expert Agent to adjust ranges, and resets schedule intervals."""
    global_state.current_plant = selection.plant_type
    global_state.growth_stage = selection.growth_stage
    global_state.age_days = selection.age_days

    new_targets = PlantExpertAgent.get_targets(selection.plant_type, selection.growth_stage)
    global_state.targets = new_targets

    alert_msg = f"Target bounds updated for {selection.plant_type} ({selection.growth_stage} phase). System reconfigured."
    TelegramBotService.send_alert(alert_msg)

    return {
        "status": "Reconfigured",
        "plant": selection.plant_type,
        "stage": selection.growth_stage,
        "targets": global_state.targets
    }


# ─── VISION DIAGNOSTICS ─────────────────────────────────────────────────────

_VISION_PROMPT = """You are a professional plant pathologist and agricultural expert analyzing a greenhouse plant leaf photo.
Perform a comprehensive health assessment covering:
1. Disease identification (fungal, bacterial, viral)
2. Pest damage (spider mites, aphids, whitefly, thrips)
3. Nutrient deficiencies (nitrogen, iron, magnesium, calcium)
4. Abiotic stress (overwatering, drought, light burn, cold damage)

Respond ONLY with valid JSON matching this exact schema (no markdown, no backticks):
{
  "status": "Infected" or "Healthy",
  "diagnosis": "specific disease/pest/deficiency name, or 'Healthy Leaf'",
  "category": "Disease" or "Pest" or "Nutrient Deficiency" or "Abiotic Stress" or "Healthy",
  "severity": "Critical" or "High" or "Medium" or "Low" or "None",
  "confidence": 87.5,
  "symptoms": "visible symptoms observed in the image",
  "affected_area_pct": 15,
  "urgent_action": "most urgent recommended action",
  "organic_treatment": "organic/biological treatment option",
  "chemical_treatment": "chemical treatment option if needed",
  "prevention": "preventive measures to avoid recurrence",
  "recovery_days": 7
}"""


@app.post("/api/diagnose")
async def upload_leaf_image(file: UploadFile = File(...)):
    """Receives plant leaf images and returns AI Diagnostics analysis using qwen3-vl:4b."""
    contents = await file.read()
    file_size = len(contents)

    # Get the vision agent's assigned model
    bindings = get_agent_bindings()
    active_vision_model = bindings.get("vision", "qwen3-vl:4b")

    report = None

    try:
        ollama_connected, installed_models = _get_ollama_models()
        if ollama_connected:
            matching_model = find_installed_model(active_vision_model, installed_models)

            if matching_model:
                import base64
                import json

                # Verify model is actually vision-capable
                model_info = get_all_models().get(active_vision_model, {})
                if not model_info.get("is_vision_capable", True):
                    print(f"[Vision Warning]: Bound model '{active_vision_model}' is not vision-capable. Falling back to simulation.")
                else:
                    image_b64 = base64.b64encode(contents).decode("utf-8")
                    url = "http://127.0.0.1:11434/api/chat"
                    payload = {
                        "model": matching_model,
                        "messages": [
                            {
                                "role": "user",
                                "content": _VISION_PROMPT,
                                "images": [image_b64]
                            }
                        ],
                        "options": {"temperature": 0.1},
                        "stream": False,
                        "format": "json"
                    }
                    # 30s timeout for vision inference (larger model)
                    res = requests.post(url, json=payload, timeout=30)
                    if res.status_code == 200:
                        raw_content = res.json().get("message", {}).get("content", "").strip()
                        # Strip any accidental markdown fences
                        if raw_content.startswith("```"):
                            raw_content = raw_content.strip("`").lstrip("json").strip()
                        parsed = json.loads(raw_content)
                        report = {
                            "filename": file.filename,
                            "file_size_kb": round(file_size / 1024, 1),
                            "processed_by_model": matching_model,
                            **parsed
                        }
                    else:
                        print(f"[Vision Error]: Ollama returned HTTP {res.status_code}")
            else:
                print(f"[Vision Warning]: Model '{active_vision_model}' not found in installed Ollama models.")
    except Exception as e:
        print(f"[Ollama Vision Fallback]: {str(e)}")

    if not report:
        # Fallback to simulation
        report = DiagnosticsAgent.analyze_leaf_photo(file.filename, file_size)

    # Append report to diagnostic history queue
    report["timestamp"] = datetime.now().strftime("%b %d, %I:%M %p")
    global_state.diagnostics_history.insert(0, report)

    # Send telegram notification if diseased
    if report.get("status") == "Infected":
        severity = report.get("severity", "Unknown")
        category = report.get("category", "Disease")
        alert_msg = (
            f"🏥 *{category.upper()} DETECTED* 🏥\n"
            f"File: {report['filename']}\n"
            f"Diagnosis: {report['diagnosis']}\n"
            f"Severity: {severity}\n"
            f"Action: {report.get('urgent_action', 'See dashboard')}"
        )
        TelegramBotService.send_alert(alert_msg)
        EmailService.send_alert(f"{category} DETECTED: {report['diagnosis']}", alert_msg.replace("*", ""))

    return report


# ─── WEB SEARCH ENDPOINT ───────────────────────────────────────────────────

@app.get("/api/search")
async def web_search(q: str, max_results: int = 4):
    """Performs a DuckDuckGo web search with agricultural context enhancement."""
    if not q or not q.strip():
        raise HTTPException(status_code=400, detail="Query parameter 'q' is required")
    if not SEARCH_ENABLED:
        raise HTTPException(status_code=503, detail="Web search is disabled. Set SEARCH_ENABLED=true in .env")

    results = WebSearchService.search(q.strip(), max_results=max_results)
    return {
        "query": q,
        "results": results,
        "count": len(results)
    }


# ─── CHAT ENDPOINT (with optional web search tool) ─────────────────────────

@app.post("/api/chat")
async def send_chat_message(payload: Dict[str, Any]):
    """Receives chat input and generates AI response. Supports web search tool for real-time info."""
    msg_text = payload.get("message", "")
    use_search = payload.get("use_search", False)  # explicit search toggle from UI
    if not msg_text:
        raise HTTPException(status_code=400, detail="Empty text message")

    timestamp = datetime.now().strftime("%I:%M %p")

    # Add User message
    global_state.chat_history.append(ChatMessage(
        sender="User",
        message=msg_text,
        timestamp=timestamp
    ))

    # Intercept direct hardware commands to bypass LLM and execute immediately
    cleaned_msg = msg_text.strip().lower()
    is_command = msg_text.startswith("/") or \
                 any(k in cleaned_msg for k in ["pump on", "pump off", "fan on", "fan off"]) or \
                 any(f"led{i}" in cleaned_msg.replace(" ", "") for i in range(1, 7)) or \
                 "all led" in cleaned_msg or "all leds" in cleaned_msg

    if is_command:
        from app.services.telegram_bot import TelegramBotService
        reply_text = TelegramBotService.process_incoming_message(msg_text)
        
        global_state.chat_history.append(ChatMessage(
            sender="Bot",
            message=reply_text,
            timestamp=timestamp
        ))
        
        return {
            "user_message": msg_text,
            "bot_reply": reply_text,
            "search_used": False,
            "search_results": []
        }

    # ── Step 1: Check if web search is warranted ──
    search_context = ""
    search_results = []
    should_search = use_search or (SEARCH_ENABLED and WebSearchService.is_search_intent(msg_text))

    if should_search and SEARCH_ENABLED:
        try:
            search_results = WebSearchService.search(msg_text, max_results=3)
            if search_results:
                search_context = WebSearchService.format_for_llm_context(search_results)
                print(f"[WebSearch]: Retrieved {len(search_results)} results for: {msg_text}")
        except Exception as e:
            print(f"[WebSearch Error]: {str(e)}")

    # ── Step 2: Try Ollama LLM (expert model = gemma3:1b) ──
    reply_text = None

    bindings = get_agent_bindings()
    active_expert_model = bindings.get("expert", "gemma3:1b")

    try:
        ollama_connected, installed_models = _get_ollama_models()
        if ollama_connected:
            matching_model = find_installed_model(active_expert_model, installed_models)

            if matching_model:
                system_prompt = (
                    "You are Zentra Flora, an AI Greenhouse Expert. "
                    "Your specialty is answering questions about smart greenhouse operations, "
                    "plants, crops, soil, pests, diseases, watering schedules, and sensor readings. "
                    "If the user asks an off-topic question unrelated to agriculture, plants, or greenhouse systems, "
                    "politely decline and redirect to your area of expertise. "
                    "Be concise, practical, and helpful."
                )

                # Build user message, optionally injecting web search context
                user_content = msg_text
                if search_context:
                    user_content = (
                        f"{search_context}\n\n"
                        f"Using the above web search results as reference context, "
                        f"please answer the following question:\n{msg_text}"
                    )

                url = "http://127.0.0.1:11434/api/chat"
                ollama_payload = {
                    "model": matching_model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_content}
                    ],
                    "options": {"temperature": 0.5},
                    "stream": False
                }
                res = requests.post(url, json=ollama_payload, timeout=12)
                if res.status_code == 200:
                    reply_text = res.json().get("message", {}).get("content", "").strip()
    except Exception as e:
        print(f"[Ollama Chat Fallback]: {str(e)}")

    # ── Step 3: Fallback heuristic responses ──
    if not reply_text:
        msg = msg_text.lower()
        if "temp" in msg or "heat" in msg or "hot" in msg:
            reply_text = "Keeping temperature within bounds is critical. Currently, targets are set per plant stage (e.g. 16–23°C for Fruiting Strawberries). If it gets too hot, the exhaust fan turns on automatically."
        elif "water" in msg or "soil" in msg or "moisture" in msg or "pump" in msg:
            reply_text = "Soil moisture target is set between 50% and 60% for optimal root intake. The water pump will trigger automatically if moisture falls below 50%."
        elif "light" in msg or "lux" in msg:
            reply_text = "Ambient light targets ensure optimal photosynthesis. The grow lights turn on automatically when the photoresistor reading falls below the target minimum for your selected plant."
        elif "pest" in msg or "disease" in msg or "mildew" in msg or "mite" in msg:
            reply_text = "To inspect for diseases, upload a leaf photo in the Diagnostics tab. Our vision model (qwen3-vl:4b) scans for spider mites, powdery mildew, leaf spots, and nutrient deficiencies."
        elif "search" in msg or "find" in msg or "look up" in msg:
            reply_text = "I can search the web for plant care information! Enable the web search toggle and ask your question — I'll fetch real-time results and summarize them for you."
        else:
            reply_text = "I am your greenhouse agricultural expert powered by Gemma 3. Ask me about your plants, target settings, schedules, or automatic actuators. I can also search the web for up-to-date plant care information."

    # Add Bot reply with search metadata
    bot_message = reply_text
    if search_results:
        sources = [r["url"] for r in search_results if r.get("url")]
        if sources:
            bot_message += f"\n\n📡 *Sources searched:* {len(search_results)} web results"

    global_state.chat_history.append(ChatMessage(
        sender="Bot",
        message=bot_message,
        timestamp=timestamp
    ))

    return {
        "user_message": msg_text,
        "bot_reply": bot_message,
        "search_used": bool(search_results),
        "search_results": search_results if search_results else []
    }


@app.post("/api/actuators/toggle")
async def toggle_actuator(payload: Dict[str, Any]):
    """Allows manual override toggle of hardware devices."""
    device = payload.get("device")
    state = payload.get("state")

    if device == "pump":
        global_state.actuators.pump = bool(state)
        action = "ON" if state else "OFF"
        TelegramBotService.send_alert(f"🔧 Manual Override: Water Pump turned {action}.")
    elif device == "fan":
        global_state.actuators.fan = bool(state)
        action = "ON" if state else "OFF"
        TelegramBotService.send_alert(f"🔧 Manual Override: Ventilation Fan turned {action}.")
    else:
        raise HTTPException(status_code=400, detail="Invalid hardware device")

    return {"status": "Updated", "actuators": global_state.actuators}


@app.post("/api/actuators/mode")
async def toggle_actuator_mode(payload: Dict[str, Any]):
    """Sets whether the system is in manual override mode or automatic mode."""
    manual_mode = bool(payload.get("manual_mode", False))
    global_state.manual_mode = manual_mode
    mode_str = "Manual" if manual_mode else "Automatic"
    TelegramBotService.send_alert(f"🔧 System Control Mode changed to {mode_str}.")
    return {"status": "Updated", "manual_mode": global_state.manual_mode}


# ─── ESP8266 HARDWARE ENDPOINTS ─────────────────────────────────────────────

@app.post("/api/esp8266/sensor")
async def esp8266_sensor_push(payload: Dict[str, Any]):
    """Receives photoresistor reading from ESP8266 every ~2 s.
    Runs the ActuatorControlAgent's light logic (auto mode drives LEDs to keep
    light within the selected plant's target range) and returns the desired
    LED states so the ESP8266 can apply them immediately."""
    photoresistor = int(payload.get("photoresistor", 0))
    timestamp = datetime.now().strftime("%I:%M:%S %p")

    new_esp8266, light_pct, logs = ActuatorControlAgent.process_light(
        photoresistor, global_state.targets, global_state.esp8266
    )
    new_esp8266.last_seen = timestamp
    global_state.esp8266 = new_esp8266
    global_state.last_light_pct = light_pct

    for log in logs:
        subject = f"Hardware State Change: {log['device']} {log['action']}"
        body_msg = f"The {log['device']} was {log['action'].lower()} automatically. Reason: {log['reason']}."
        TelegramBotService.send_alert(f"⚠️ *{subject}*\n{body_msg}")
        EmailService.send_alert(subject, body_msg)

    return {
        "status": "OK",
        "led1": global_state.esp8266.led1,
        "led2": global_state.esp8266.led2,
        "led3": global_state.esp8266.led3,
        "led4": global_state.esp8266.led4,
        "led5": global_state.esp8266.led5,
        "led6": global_state.esp8266.led6
    }


@app.post("/api/esp8266/led")
async def esp8266_led_control(payload: Dict[str, Any]):
    """Sets desired LED state manually from the dashboard, switching lighting
    into manual mode so the auto light agent stops overriding it.
    The ESP8266 receives the new state on its next sensor push (≤2 s latency)."""
    led   = payload.get("led")    # "led1" | "led2" | "led3" | "led4" | "led5" | "led6" | "all"
    state = bool(payload.get("state", False))

    if led == "led1":
        global_state.esp8266.led1 = state
    elif led == "led2":
        global_state.esp8266.led2 = state
    elif led == "led3":
        global_state.esp8266.led3 = state
    elif led == "led4":
        global_state.esp8266.led4 = state
    elif led == "led5":
        global_state.esp8266.led5 = state
    elif led == "led6":
        global_state.esp8266.led6 = state
    elif led == "all":
        global_state.esp8266.led1 = state
        global_state.esp8266.led2 = state
        global_state.esp8266.led3 = state
        global_state.esp8266.led4 = state
        global_state.esp8266.led5 = state
        global_state.esp8266.led6 = state
    else:
        raise HTTPException(status_code=400, detail="Invalid LED. Use led1-led6, or all")

    global_state.esp8266.light_mode = "manual"

    action = "ON" if state else "OFF"
    label  = led.upper() if led != "all" else "All LEDs"
    TelegramBotService.send_alert(f"💡 ESP8266 {label} turned {action} via dashboard (manual mode).")

    return {
        "status": "OK",
        "led1": global_state.esp8266.led1,
        "led2": global_state.esp8266.led2,
        "led3": global_state.esp8266.led3,
        "led4": global_state.esp8266.led4,
        "led5": global_state.esp8266.led5,
        "led6": global_state.esp8266.led6,
        "light_mode": global_state.esp8266.light_mode
    }


@app.post("/api/esp8266/light_mode")
async def esp8266_light_mode(payload: Dict[str, str]):
    """Switches the greenhouse node's lighting between automatic
    (ActuatorControlAgent drives LEDs from the photoresistor vs. plant
    target range) and manual (dashboard-only control)."""
    mode = payload.get("mode")
    if mode not in ("auto", "manual"):
        raise HTTPException(status_code=400, detail="Mode must be 'auto' or 'manual'")

    global_state.esp8266.light_mode = mode
    TelegramBotService.send_alert(f"💡 Lighting mode switched to {mode.upper()}.")

    return {
        "status": "OK",
        "light_mode": global_state.esp8266.light_mode,
        "led1": global_state.esp8266.led1,
        "led2": global_state.esp8266.led2,
        "led3": global_state.esp8266.led3,
        "led4": global_state.esp8266.led4,
        "led5": global_state.esp8266.led5,
        "led6": global_state.esp8266.led6
    }


# In-memory user database preloaded with a default developer credentials profile for offline testability.
# Passwords are stored as bcrypt hashes — the default admin password is "password123".
MOCK_USERS_DB = [
    {
        "username": "admin",
        "password": hash_password("password123"),
        "email": "aniqihtisyam4@gmail.com",
        "first_name": "Aniq",
        "second_name": "Ihtisyam"
    }
]

@app.post("/api/auth/signup")
async def user_sign_up(payload: Dict[str, str]):
    """Registers a new user profile using credentials. Password is bcrypt-hashed before storage.
    Pushes to Supabase users table (with hashed password) and sends bot link welcome email."""
    username = payload.get("username", "").strip()
    password = payload.get("password", "").strip()
    email = payload.get("email", "").strip().lower()
    first_name = payload.get("first_name", "").strip()
    second_name = payload.get("second_name", "").strip()

    if not username or not password or not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Username, password, and a valid email address are all required")

    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long")

    for user in MOCK_USERS_DB:
        if user["username"].lower() == username.lower():
            raise HTTPException(status_code=400, detail="Username is already taken")
        if user["email"].lower() == email.lower():
            raise HTTPException(status_code=400, detail="Email is already registered")

    # Hash the password before any storage
    hashed_pw = hash_password(password)

    new_user = {
        "username": username,
        "password": hashed_pw,   # Never store plain-text passwords
        "email": email,
        "first_name": first_name,
        "second_name": second_name
    }

    supabase_success = False
    if IS_SUPABASE_CONFIGURED:
        try:
            url = f"{SUPABASE_URL}/rest/v1/users"
            headers = {
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "Content-Type": "application/json",
                "Prefer": "return=minimal"
            }
            # Store hashed password in Supabase — never the plain-text value
            insert_payload = {
                "username": username, "password": hashed_pw, "email": email,
                "first_name": first_name, "second_name": second_name
            }
            r = requests.post(url, json=insert_payload, headers=headers, timeout=5)
            if r.status_code in [200, 201]:
                supabase_success = True
                print(f"[Supabase Signup Success]: Registered user {username} (password hashed).")
            else:
                print(f"[Supabase Signup Warning]: Failed to insert into 'users' table (HTTP {r.status_code}: {r.text}).")
        except Exception as e:
            print(f"[Supabase Signup Error]: Network or connection failed - {str(e)}")

    MOCK_USERS_DB.append(new_user)
    EmailService.send_welcome_email(email)
    TelegramBotService.send_alert(f"👤 New User Registered: {first_name} {second_name} ({username}). Welcome invite sent.")

    return {
        "status": "Success",
        "user": {
            "username": username, "email": email,
            "first_name": first_name, "second_name": second_name
        },
        "supabase_registered": supabase_success,
        "telegram_link": "https://t.me/melmalebot"
    }


@app.post("/api/auth/login")
async def user_sign_in_login(payload: Dict[str, str]):
    """Authenticates a user via email OR username and matching password.
    Returns a signed JWT access token on success. Passwords are compared against bcrypt hashes."""
    identifier = payload.get("identifier", "").strip()
    password = payload.get("password", "").strip()

    if not identifier or not password:
        raise HTTPException(status_code=400, detail="Identifier (email or username) and password are required")

    user_found = None

    # ── Try Supabase first (hashed password comparison) ──
    if IS_SUPABASE_CONFIGURED:
        try:
            # Encode identifier to avoid URL injection issues
            from urllib.parse import quote
            safe_id = quote(identifier, safe="")
            url = f"{SUPABASE_URL}/rest/v1/users?or=(email.eq.{safe_id},username.eq.{safe_id})"
            headers = {
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}"
            }
            r = requests.get(url, headers=headers, timeout=5)
            if r.status_code == 200:
                results = r.json()
                if results and len(results) > 0:
                    db_user = results[0]
                    stored_hash = db_user.get("password", "")
                    # Support both bcrypt-hashed and legacy plain-text (migration safety)
                    if stored_hash.startswith("$2b$") or stored_hash.startswith("$2a$"):
                        password_ok = verify_password(password, stored_hash)
                    else:
                        password_ok = (stored_hash == password)
                    if password_ok:
                        user_found = {
                            "username": db_user.get("username"),
                            "email": db_user.get("email"),
                            "first_name": db_user.get("first_name", ""),
                            "second_name": db_user.get("second_name", "")
                        }
                        print(f"[Supabase Auth Success]: Validated {identifier}.")
                    else:
                        raise HTTPException(status_code=401, detail="Incorrect password credentials")
        except HTTPException as he:
            raise he
        except Exception as e:
            print(f"[Supabase Auth Error]: Network or connection failed, falling back to local memory - {str(e)}")

    # ── Fallback: in-memory MOCK_USERS_DB (bcrypt hashed passwords) ──
    if not user_found:
        for user in MOCK_USERS_DB:
            if user["username"].lower() == identifier.lower() or user["email"].lower() == identifier.lower():
                if verify_password(password, user["password"]):
                    user_found = {
                        "username": user["username"],
                        "email": user["email"],
                        "first_name": user["first_name"],
                        "second_name": user["second_name"]
                    }
                else:
                    raise HTTPException(status_code=401, detail="Incorrect password credentials")
                break

    if not user_found:
        raise HTTPException(status_code=404, detail="User account not found")

    # ── Generate JWT access token ──
    access_token = create_access_token(
        data={
            "sub": user_found["username"],
            "email": user_found["email"]
        },
        expires_delta=timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    TelegramBotService.send_alert(f"🔑 User Logged In: {user_found['first_name']} {user_found['second_name']} ({user_found['username']}). Dashboard session synchronized.")

    return {
        "status": "Success",
        "user": user_found,
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in_minutes": JWT_ACCESS_TOKEN_EXPIRE_MINUTES,
        "telegram_link": "https://t.me/melmalebot"
    }


@app.post("/api/telegram/save_chat_id")
async def save_telegram_chat_id(payload: Dict[str, str]):
    """Saves the Telegram Chat ID to the .env file and updates current state."""
    chat_id = payload.get("chat_id")
    if not chat_id:
        raise HTTPException(status_code=400, detail="Chat ID is required")

    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
    if not os.path.exists(env_path):
        env_path = os.path.abspath(".env")

    try:
        with open(env_path, "r", encoding="utf-8") as f:
            lines = f.readlines()

        chat_id_found = False
        for idx, line in enumerate(lines):
            if line.strip().startswith("TELEGRAM_CHAT_ID="):
                lines[idx] = f"TELEGRAM_CHAT_ID={chat_id}\n"
                chat_id_found = True
                break

        if not chat_id_found:
            lines.append(f"\nTELEGRAM_CHAT_ID={chat_id}\n")

        with open(env_path, "w", encoding="utf-8") as f:
            f.writelines(lines)

        os.environ["TELEGRAM_CHAT_ID"] = str(chat_id)

        import app.config as config
        config.TELEGRAM_CHAT_ID = str(chat_id)
        config.IS_TELEGRAM_CONFIGURED = True

        from app.services.telegram_bot import TelegramBotService
        TelegramBotService.send_alert(f"🤖 Telegram Bot Chat ID successfully configured to {chat_id}.")

        return {"status": "Success", "chat_id": chat_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update .env: {str(e)}")
