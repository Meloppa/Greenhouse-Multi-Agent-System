from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

class SensorReading(BaseModel):
    temperature: float = Field(..., description="Air temperature in Celsius")
    humidity: float = Field(..., description="Relative humidity percentage")
    light: float = Field(..., description="Ambient light intensity in Lux")
    soil_moisture: float = Field(..., description="Soil moisture level percentage")
    timestamp: Optional[str] = None

class TargetSettings(BaseModel):
    min_temp: float
    max_temp: float
    min_humidity: float
    max_humidity: float
    min_light: float
    max_light: float
    min_soil_moisture: float
    max_soil_moisture: float

class PlantSelection(BaseModel):
    plant_type: str
    growth_stage: str
    age_days: int = 1

class ActuatorState(BaseModel):
    pump: bool = False
    fan: bool = False
    grow_lights: bool = False

class ESP8266State(BaseModel):
    photoresistor: int = 0
    led1: bool = False
    led2: bool = False
    led3: bool = False
    led4: bool = False
    led5: bool = False
    led6: bool = False
    last_seen: Optional[str] = None

class ChatMessage(BaseModel):
    sender: str  # "User", "Bot", "System"
    message: str
    timestamp: str

class AlertNotification(BaseModel):
    type: str  # "Telegram", "Email", "System"
    subject: str
    body: str
    timestamp: str

class SystemState(BaseModel):
    current_plant: str = "Strawberry"
    growth_stage: str = "Fruiting"
    age_days: int = 45
    manual_mode: bool = False
    sensors: SensorReading = Field(default_factory=lambda: SensorReading(temperature=24.5, humidity=65.0, light=450.0, soil_moisture=42.0, timestamp=datetime.now().strftime("%I:%M:%S %p")))
    targets: TargetSettings = Field(default_factory=lambda: TargetSettings(
        min_temp=18.0, max_temp=26.0,
        min_humidity=60.0, max_humidity=80.0,
        min_light=300.0, max_light=800.0,
        min_soil_moisture=50.0, max_soil_moisture=70.0
    ))
    actuators: ActuatorState = Field(default_factory=ActuatorState)
    esp8266: ESP8266State = Field(default_factory=ESP8266State)
    sensor_history: List[Dict[str, Any]] = Field(default_factory=list)
    chat_history: List[ChatMessage] = Field(default_factory=list)
    alerts_history: List[AlertNotification] = Field(default_factory=list)
    diagnostics_history: List[Dict[str, Any]] = Field(default_factory=list)
    last_seen_chat_id: Optional[str] = None

# Global State Container
global_state = SystemState()

# Initialize some sensor history for charts
initial_time = datetime.now()
import random
for i in range(12):
    time_str = (initial_time).strftime("%b")
    # We will use months like Jan, Feb, Mar, Apr etc to simulate a beautiful chart resembling the "Cash flow" chart in Zentra image.
    # The reference chart shows Jan to Dec cash flow. Let's record history entries with labels matching months or hours!
    # For live readings, we'll store hourly history:
    hour_str = f"{i*2}:00"
    global_state.sensor_history.append({
        "time": hour_str,
        "temperature": round(22 + random.uniform(-2, 3), 1),
        "humidity": round(65 + random.uniform(-5, 5), 1),
        "light": round(450 + random.uniform(-100, 100), 1),
        "soil_moisture": round(45 + random.uniform(-8, 5), 1),
    })

# Add initial greeting message
global_state.chat_history.append(ChatMessage(
    sender="Bot",
    message="Hello! I am your Greenhouse Assistant Bot. Send /status to query real-time analytics, or upload a leaf photo to diagnose diseases.",
    timestamp=datetime.now().strftime("%I:%M %p")
))
