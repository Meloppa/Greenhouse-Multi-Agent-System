import os
import sys

# Support running directly via 'uvicorn main:app --reload' from backend/app or backend folder
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import time
from typing import Dict, Any, List

from app.models import global_state, SensorReading, PlantSelection, ActuatorState, ChatMessage
from app.agents.plant_expert import PlantExpertAgent
from app.agents.scheduler import TaskSchedulerAgent
from app.agents.diagnostics import DiagnosticsAgent
from app.agents.actuator import ActuatorControlAgent
from app.services.telegram_bot import TelegramBotService
from app.services.email_service import EmailService
from app.model_config import get_active_model, get_all_models, set_active_model, get_agent_bindings, set_agent_binding
from app.config import SUPABASE_URL, SUPABASE_KEY, IS_SUPABASE_CONFIGURED, IS_TELEGRAM_CONFIGURED, TELEGRAM_CHAT_ID
import threading
import requests



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

@app.get("/api/status")
async def get_system_status():
    """Returns the complete current state of the greenhouse dashboard."""
    # Generate daily tasks on demand to keep them updated
    daily_tasks = TaskSchedulerAgent.generate_daily_tasks(
        global_state.current_plant,
        global_state.growth_stage,
        global_state.age_days
    )
    
    # Check if Ollama is running and get installed models
    ollama_connected = False
    ollama_models = []
    try:
        r = requests.get("http://127.0.0.1:11434/api/tags", timeout=0.5)
        if r.status_code == 200:
            ollama_connected = True
            ollama_models = [m["name"] for m in r.json().get("models", [])]
    except Exception:
        pass
    
    # Helper to check if model matches installed models
    def is_installed(model_name: str) -> bool:
        normalized = model_name.replace("-", ":").lower()
        for m in ollama_models:
            m_lower = m.lower()
            if normalized in m_lower or m_lower in normalized:
                return True
            # Check base name (e.g. qwen3-vl vs qwen3-vl:4b)
            base_sel = model_name.split("-")[0].lower()
            base_m = m.split(":")[0].lower()
            if base_sel == base_m:
                return True
        return False

    active_model = get_active_model()
    active_model_installed = is_installed(active_model) if ollama_connected else False
    
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
        "last_seen_chat_id": global_state.last_seen_chat_id
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
        
    # Inject alert log of model shifting
    from app.services.telegram_bot import TelegramBotService
    TelegramBotService.send_alert(f"🤖 System Model reconfigured. Active LLM/VLM backing shifted to '{model_name}'.")
    
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
        "light": reading.light,
        "soil_moisture": reading.soil_moisture
    })
    if len(global_state.sensor_history) > 12:
        global_state.sensor_history.pop(0)
        
    # 2b. Push to Supabase database in a non-blocking background thread
    if IS_SUPABASE_CONFIGURED:
        sb_thread = threading.Thread(target=push_to_supabase_worker, args=(reading,), daemon=True)
        sb_thread.start()


    # 3. Invoke Actuator Control Agent
    prev_pump = global_state.actuators.pump
    prev_fan = global_state.actuators.fan
    
    new_actuators, logs = ActuatorControlAgent.process_readings(
        reading, global_state.targets, global_state.actuators
    )
    global_state.actuators = new_actuators

    # 4. Dispatch Telegram and Email Alerts on hardware activation or threshold warnings
    for log in logs:
        # Construct messages
        subject = f"Hardware State Change: {log['device']} {log['action']}"
        body_msg = f"The {log['device']} was {log['action'].lower()} automatically. Reason: {log['reason']}."
        
        # Fire agents
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
    
    # 1. Plant Expert Agent returns thresholds
    new_targets = PlantExpertAgent.get_targets(selection.plant_type, selection.growth_stage)
    global_state.targets = new_targets
    
    # 2. Notify system alert of plant target shifting
    alert_msg = f"Target bounds updated for {selection.plant_type} ({selection.growth_stage} phase). System reconfigured."
    TelegramBotService.send_alert(alert_msg)
    
    return {
        "status": "Reconfigured",
        "plant": selection.plant_type,
        "stage": selection.growth_stage,
        "targets": global_state.targets
    }

@app.post("/api/diagnose")
async def upload_leaf_image(file: UploadFile = File(...)):
    """Receives plant leaf images and returns AI Diagnostics analysis."""
    contents = await file.read()
    file_size = len(contents)
    
    # 1. Try real vision analysis using Ollama if connected and model is vision-capable
    from app.model_config import get_agent_bindings
    active_vision_model = get_agent_bindings().get("vision", "qwen3-vl-4b")
    normalized = active_vision_model.replace("-", ":").lower()
    
    report = None
    try:
        r_tags = requests.get("http://127.0.0.1:11434/api/tags", timeout=0.5)
        if r_tags.status_code == 200:
            models = [m["name"] for m in r_tags.json().get("models", [])]
            matching_model = None
            for m in models:
                m_lower = m.lower()
                if normalized in m_lower or m_lower in normalized or active_vision_model.split("-")[0].lower() in m_lower:
                    matching_model = m
                    break
                    
            if matching_model:
                import base64
                import json
                image_b64 = base64.b64encode(contents).decode("utf-8")
                url = "http://127.0.0.1:11434/api/chat"
                payload = {
                    "model": matching_model,
                    "messages": [
                        {
                            "role": "user",
                            "content": (
                                "Analyze this greenhouse leaf photo and diagnose any plant disease. "
                                "Respond ONLY in a valid JSON matching this schema exactly, and do not include any markdown backticks outside of the raw json block:\n"
                                "{\n"
                                "  \"status\": \"Infected\" or \"Healthy\",\n"
                                "  \"diagnosis\": \"disease name / Healthy Leaf Tissues\",\n"
                                "  \"severity\": \"High/Medium/Low/None\",\n"
                                "  \"confidence\": 95.0,\n"
                                "  \"symptoms\": \"visible spots, dust coating, or fine web markings\",\n"
                                "  \"urgent_action\": \"ventilation adjustment, pruning, or isolation\",\n"
                                "  \"organic_treatment\": \"neem oil or potassium bicarbonate\",\n"
                                "  \"chemical_treatment\": \"sulfur or organic fungicides\"\n"
                                "}"
                            ),
                            "images": [image_b64]
                        }
                    ],
                    "options": {"temperature": 0.2},
                    "stream": False,
                    "format": "json"
                }
                # Timeout of 15s for vision inference
                res = requests.post(url, json=payload, timeout=15)
                if res.status_code == 200:
                    raw_content = res.json().get("message", {}).get("content", "").strip()
                    parsed = json.loads(raw_content)
                    report = {
                        "filename": file.filename,
                        "file_size_kb": round(file_size / 1024, 1),
                        "processed_by_model": matching_model,
                        **parsed
                    }
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
        alert_msg = f"🏥 *DISEASE DETECTED* 🏥\nLeaf Photo: {report['filename']}\nDiagnosis: {report['diagnosis']}\nSeverity: {report['severity']}\nOrganic Cure: {report['organic_treatment']}"
        TelegramBotService.send_alert(alert_msg)
        EmailService.send_alert(f"DISEASE DETECTED: {report['diagnosis']}", alert_msg.replace("*", ""))

    return report

@app.post("/api/chat")
async def send_chat_message(payload: Dict[str, str]):
    """Receives chat input from dashboard simulator and generates Bot response."""
    msg_text = payload.get("message", "")
    if not msg_text:
        raise HTTPException(status_code=400, detail="Empty text message")
        
    timestamp = datetime.now().strftime("%I:%M %p")
    
    # Add User message
    global_state.chat_history.append(ChatMessage(
        sender="User",
        message=msg_text,
        timestamp=timestamp
    ))
    
    # Generate bot response
    reply_text = None
    
    # 1. Try real Ollama chatbot query
    from app.model_config import get_agent_bindings
    active_expert_model = get_agent_bindings().get("expert", "gemma3-1b")
    normalized = active_expert_model.replace("-", ":").lower()
    
    try:
        r_tags = requests.get("http://127.0.0.1:11434/api/tags", timeout=0.5)
        if r_tags.status_code == 200:
            models = [m["name"] for m in r_tags.json().get("models", [])]
            matching_model = None
            for m in models:
                m_lower = m.lower()
                if normalized in m_lower or m_lower in normalized or active_expert_model.split("-")[0].lower() in m_lower:
                    matching_model = m
                    break
                    
            if matching_model:
                url = "http://127.0.0.1:11434/api/chat"
                system_prompt = (
                    "You are Zentra Flora, an AI Greenhouse Expert. Your sole duty is to answer questions about the smart greenhouse, "
                    "plants, crops, soil, pests, watering schedules, and sensor readings. "
                    "If the user asks an off-topic question (not related to agriculture, plants, or the greenhouse), "
                    "you must politely refuse to answer and remind them that you are restricted to greenhouse operations only. "
                    "Keep your response concise, helpful, and highly agricultural."
                )
                payload = {
                    "model": matching_model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": msg_text}
                    ],
                    "options": {"temperature": 0.5},
                    "stream": False
                }
                res = requests.post(url, json=payload, timeout=8)
                if res.status_code == 200:
                    reply_text = res.json().get("message", {}).get("content", "").strip()
    except Exception as e:
        print(f"[Ollama Chat Fallback]: {str(e)}")
        
    if not reply_text:
        # Fallback to simulation
        msg = msg_text.lower()
        if "temp" in msg or "heat" in msg or "hot" in msg:
            reply_text = "Keeping temperature within bounds is critical. Currently, targets are set per plant stage (e.g. 16-23°C for Fruiting Strawberries). If it gets too hot, the exhaust fan turns on automatically."
        elif "water" in msg or "soil" in msg or "moisture" in msg or "pump" in msg:
            reply_text = "Soil moisture target is set between 50% and 60% for optimal root intake. The water pump will trigger automatically if moisture falls below 50%."
        elif "light" in msg or "lux" in msg:
            reply_text = "Ambient light targets ensure optimal photosynthesis. The grow lights will supplement light if natural lux falls below target boundaries."
        elif "pest" in msg or "disease" in msg or "mildew" in msg or "mite" in msg:
            reply_text = "To inspect for diseases, upload a leaf photo in the Diagnostics tab. Our vision VLM scans for spider mites, powdery mildew, and leaf spots."
        else:
            reply_text = "I am your greenhouse agricultural expert. Ask me about your plants, target settings, schedules, or automatic actuators."
            
    # Add Bot reply
    global_state.chat_history.append(ChatMessage(
        sender="Bot",
        message=reply_text,
        timestamp=timestamp
    ))
    
    return {
        "user_message": msg_text,
        "bot_reply": reply_text
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
    elif device == "grow_lights":
        global_state.actuators.grow_lights = bool(state)
        action = "ON" if state else "OFF"
        TelegramBotService.send_alert(f"🔧 Manual Override: Grow Lights turned {action}.")
    else:
        raise HTTPException(status_code=400, detail="Invalid hardware device")
        
    return {"status": "Updated", "actuators": global_state.actuators}


# In-memory user database preloaded with a default developer credentials profile for offline testability
MOCK_USERS_DB = [
    {
        "username": "admin",
        "password": "password123",
        "email": "aniqihtisyam4@gmail.com",
        "first_name": "Aniq",
        "second_name": "Ihtisyam"
    }
]

@app.post("/api/auth/signup")
async def user_sign_up(payload: Dict[str, str]):
    """Registers a new user profile using credentials. Pushes to Supabase users table and sends bot link email."""
    username = payload.get("username", "").strip()
    password = payload.get("password", "").strip()
    email = payload.get("email", "").strip().lower()
    first_name = payload.get("first_name", "").strip()
    second_name = payload.get("second_name", "").strip()

    if not username or not password or not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Username, password, and a valid email address are all required")

    # Check local duplicate username or email
    for user in MOCK_USERS_DB:
        if user["username"].lower() == username.lower():
            raise HTTPException(status_code=400, detail="Username is already taken")
        if user["email"].lower() == email.lower():
            raise HTTPException(status_code=400, detail="Email is already registered")

    new_user = {
        "username": username,
        "password": password,
        "email": email,
        "first_name": first_name,
        "second_name": second_name
    }

    # 1. Push to Supabase users table if configured
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
            insert_payload = {
                "username": username,
                "password": password,
                "email": email,
                "first_name": first_name,
                "second_name": second_name
            }
            r = requests.post(url, json=insert_payload, headers=headers, timeout=5)
            if r.status_code in [200, 201]:
                supabase_success = True
                print(f"[Supabase Signup Success]: Registered user {username}.")
            else:
                print(f"[Supabase Signup Warning]: Failed to insert into 'users' table (HTTP {r.status_code}: {r.text}).")
                if r.status_code == 404:
                    print("\n💡 SUPABASE TABLE SETUP REQUIRED 💡")
                    print("Your Supabase database does not have the 'users' table with matching columns.")
                    print("Please execute the following statement inside your Supabase SQL Editor:")
                    print("""
CREATE TABLE users (
    id bigint generated by default as identity primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    username text unique not null,
    password text not null,
    email text unique not null,
    first_name text,
    second_name text,
    telegram_subscribed boolean default false
);
                    """)
        except Exception as e:
            print(f"[Supabase Signup Error]: Network or connection failed - {str(e)}")

    # Always append to local in-memory storage for immediate session usage or fallback
    MOCK_USERS_DB.append(new_user)

    # 2. Dispatch welcome email
    EmailService.send_welcome_email(email)
    
    # 3. Log alert
    TelegramBotService.send_alert(f"👤 New User Registered: {first_name} {second_name} ({username}). Welcome invite sent.")

    return {
        "status": "Success",
        "user": {
            "username": username,
            "email": email,
            "first_name": first_name,
            "second_name": second_name
        },
        "supabase_registered": supabase_success,
        "telegram_link": "https://t.me/melmalebot"
    }


@app.post("/api/auth/login")
async def user_sign_in_login(payload: Dict[str, str]):
    """Authenticates a user via email or username and matching password."""
    identifier = payload.get("identifier", "").strip()
    password = payload.get("password", "").strip()

    if not identifier or not password:
        raise HTTPException(status_code=400, detail="Identifier and password are required")

    user_found = None

    # 1. Query Supabase if configured
    if IS_SUPABASE_CONFIGURED:
        try:
            url = f"{SUPABASE_URL}/rest/v1/users?or=(email.eq.{identifier},username.eq.{identifier})"
            headers = {
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}"
            }
            r = requests.get(url, headers=headers, timeout=5)
            if r.status_code == 200:
                results = r.json()
                if results and len(results) > 0:
                    db_user = results[0]
                    if db_user.get("password") == password:
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

    # 2. Check local Mock Database as fallback
    if not user_found:
        for user in MOCK_USERS_DB:
            if user["username"].lower() == identifier.lower() or user["email"].lower() == identifier.lower():
                if user["password"] == password:
                    user_found = {
                        "username": user["username"],
                        "email": user["email"],
                        "first_name": user["first_name"],
                        "second_name": user["second_name"]
                    }
                    break
                else:
                    raise HTTPException(status_code=401, detail="Incorrect password credentials")

    if not user_found:
        raise HTTPException(status_code=404, detail="User account not found")

    # 3. Log alert
    TelegramBotService.send_alert(f"🔑 User Logged In: {user_found['first_name']} {user_found['second_name']} ({user_found['username']}). Dashboard session synchronized.")

    return {
        "status": "Success",
        "user": user_found,
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
        lines = []
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
            
        # Re-set in os.environ and config
        os.environ["TELEGRAM_CHAT_ID"] = str(chat_id)
        
        import app.config as config
        config.TELEGRAM_CHAT_ID = str(chat_id)
        config.IS_TELEGRAM_CONFIGURED = True
        
        # Inject alert log of chat id update
        from app.services.telegram_bot import TelegramBotService
        TelegramBotService.send_alert(f"🤖 Telegram Bot Chat ID successfully configured to {chat_id}.")
        
        return {"status": "Success", "chat_id": chat_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update .env: {str(e)}")

