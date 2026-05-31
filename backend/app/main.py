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

app = FastAPI(
    title="Zentra Flora - Greenhouse Multi-Agent API",
    description="Multi-agent automated system for real-time plant care, hardware actuation, and vision diagnostic alerts."
)

# Allow CORS for development dashboard access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
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
        "tasks": daily_tasks
    }

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
    
    # Execute Diagnostics Agent
    report = DiagnosticsAgent.analyze_leaf_photo(file.filename, file_size)
    
    # Append report to diagnostic history queue
    report["timestamp"] = datetime.now().strftime("%b %d, %I:%M %p")
    global_state.diagnostics_history.insert(0, report)
    
    # Send telegram notification if diseased
    if report["status"] == "Infected":
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
    reply_text = TelegramBotService.process_incoming_message(msg_text)
    
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
