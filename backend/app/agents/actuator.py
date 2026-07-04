from typing import Tuple, List, Dict, Any
from app.models import SensorReading, TargetSettings, ActuatorState, ESP8266State

class ActuatorControlAgent:
    @staticmethod
    def process_readings(sensors: SensorReading, targets: TargetSettings, current_actuators: ActuatorState) -> Tuple[ActuatorState, List[Dict[str, Any]]]:
        new_actuators = ActuatorState(
            pump=current_actuators.pump,
            fan=current_actuators.fan
        )
        logs = []

        # 1. Soil Moisture Control -> Water Pump
        if sensors.soil_moisture < targets.min_soil_moisture:
            if not current_actuators.pump:
                new_actuators.pump = True
                logs.append({
                    "device": "Water Pump",
                    "action": "Activated",
                    "reason": f"Soil moisture ({sensors.soil_moisture}%) fell below target minimum ({targets.min_soil_moisture}%)"
                })
        elif sensors.soil_moisture >= targets.max_soil_moisture:
            if current_actuators.pump:
                new_actuators.pump = False
                logs.append({
                    "device": "Water Pump",
                    "action": "Deactivated",
                    "reason": f"Soil moisture ({sensors.soil_moisture}%) reached target maximum ({targets.max_soil_moisture}%)"
                })

        # 2. Temperature & Humidity Control -> Ventilation Fan
        needs_fan = (sensors.temperature > targets.max_temp) or (sensors.humidity > targets.max_humidity)
        cool_down_done = (sensors.temperature < targets.min_temp + 2.0) and (sensors.humidity < targets.max_humidity - 5.0)

        if needs_fan:
            if not current_actuators.fan:
                new_actuators.fan = True
                reason_str = []
                if sensors.temperature > targets.max_temp:
                    reason_str.append(f"Temperature ({sensors.temperature}°C > {targets.max_temp}°C)")
                if sensors.humidity > targets.max_humidity:
                    reason_str.append(f"Humidity ({sensors.humidity}% > {targets.max_humidity}%)")
                
                logs.append({
                    "device": "Ventilation Fan",
                    "action": "Activated",
                    "reason": f"Out of bounds: {', '.join(reason_str)}"
                })
        elif cool_down_done or sensors.temperature < targets.min_temp:
            if current_actuators.fan:
                new_actuators.fan = False
                logs.append({
                    "device": "Ventilation Fan",
                    "action": "Deactivated",
                    "reason": f"Temperature ({sensors.temperature}°C) and Humidity ({sensors.humidity}%) stabilized within bounds"
                })

        return new_actuators, logs

    @staticmethod
    def process_light(photoresistor: int, targets: TargetSettings, esp8266: ESP8266State) -> Tuple[ESP8266State, int, List[Dict[str, Any]]]:
        """Derives a 0-100% light level from the photoresistor and, when in
        auto mode, drives the 3 LED channels to keep it within the selected
        plant's target range. Manual mode leaves LED state untouched."""
        light_pct = round(photoresistor / 1023 * 100)

        new_state = ESP8266State(
            photoresistor=photoresistor,
            led1=esp8266.led1,
            led2=esp8266.led2,
            led3=esp8266.led3,
            light_mode=esp8266.light_mode,
            last_seen=esp8266.last_seen
        )
        logs = []

        if new_state.light_mode != "auto":
            return new_state, light_pct, logs

        all_on = new_state.led1 and new_state.led2 and new_state.led3
        any_on = new_state.led1 or new_state.led2 or new_state.led3

        if light_pct < targets.min_light:
            if not all_on:
                new_state.led1 = new_state.led2 = new_state.led3 = True
                logs.append({
                    "device": "Grow Lights",
                    "action": "Activated",
                    "reason": f"Light level ({light_pct}%) fell below target minimum ({targets.min_light}%)"
                })
        elif light_pct >= targets.max_light:
            if any_on:
                new_state.led1 = new_state.led2 = new_state.led3 = False
                logs.append({
                    "device": "Grow Lights",
                    "action": "Deactivated",
                    "reason": f"Light level ({light_pct}%) reached target maximum ({targets.max_light}%)"
                })

        return new_state, light_pct, logs
