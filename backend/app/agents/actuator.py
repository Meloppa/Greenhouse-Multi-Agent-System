from typing import Tuple, List, Dict, Any
from app.models import SensorReading, TargetSettings, ActuatorState

class ActuatorControlAgent:
    @staticmethod
    def process_readings(sensors: SensorReading, targets: TargetSettings, current_actuators: ActuatorState) -> Tuple[ActuatorState, List[Dict[str, Any]]]:
        new_actuators = ActuatorState(
            pump=current_actuators.pump,
            fan=current_actuators.fan,
            grow_lights=current_actuators.grow_lights
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

        # 3. Light Intensity Control -> Grow Lights
        if sensors.light < targets.min_light:
            if not current_actuators.grow_lights:
                new_actuators.grow_lights = True
                logs.append({
                    "device": "Grow Lights",
                    "action": "Activated",
                    "reason": f"Light level ({sensors.light} Lux) fell below ideal minimum ({targets.min_light} Lux)"
                })
        elif sensors.light >= targets.max_light:
            if current_actuators.grow_lights:
                new_actuators.grow_lights = False
                logs.append({
                    "device": "Grow Lights",
                    "action": "Deactivated",
                    "reason": f"Light level ({sensors.light} Lux) meets target maximum ({targets.max_light} Lux)"
                })

        return new_actuators, logs
