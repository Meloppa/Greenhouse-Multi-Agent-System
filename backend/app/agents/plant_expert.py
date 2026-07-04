from app.models import TargetSettings

# Highly specific plant requirements per stage.
# min_light/max_light are a 0-100 percentage (derived from the greenhouse
# node's photoresistor reading), not lux — the hardware has no lux sensor.
PLANT_DATABASE = {
    "Strawberry": {
        "Seedling": {
            "min_temp": 18.0, "max_temp": 24.0,
            "min_humidity": 70.0, "max_humidity": 85.0,
            "min_light": 20.0, "max_light": 40.0,
            "min_soil_moisture": 60.0, "max_soil_moisture": 80.0
        },
        "Vegetative": {
            "min_temp": 20.0, "max_temp": 26.0,
            "min_humidity": 60.0, "max_humidity": 75.0,
            "min_light": 40.0, "max_light": 60.0,
            "min_soil_moisture": 55.0, "max_soil_moisture": 70.0
        },
        "Flowering": {
            "min_temp": 18.0, "max_temp": 25.0,
            "min_humidity": 55.0, "max_humidity": 65.0,
            "min_light": 50.0, "max_light": 80.0,
            "min_soil_moisture": 50.0, "max_soil_moisture": 65.0
        },
        "Fruiting": {
            "min_temp": 16.0, "max_temp": 23.0,
            "min_humidity": 50.0, "max_humidity": 60.0,
            "min_light": 60.0, "max_light": 100.0,
            "min_soil_moisture": 50.0, "max_soil_moisture": 60.0
        }
    },
    "Tomato": {
        "Seedling": {
            "min_temp": 20.0, "max_temp": 25.0,
            "min_humidity": 65.0, "max_humidity": 75.0,
            "min_light": 30.0, "max_light": 50.0,
            "min_soil_moisture": 65.0, "max_soil_moisture": 75.0
        },
        "Vegetative": {
            "min_temp": 21.0, "max_temp": 27.0,
            "min_humidity": 60.0, "max_humidity": 70.0,
            "min_light": 50.0, "max_light": 70.0,
            "min_soil_moisture": 60.0, "max_soil_moisture": 70.0
        },
        "Flowering": {
            "min_temp": 20.0, "max_temp": 26.0,
            "min_humidity": 50.0, "max_humidity": 65.0,
            "min_light": 60.0, "max_light": 90.0,
            "min_soil_moisture": 55.0, "max_soil_moisture": 65.0
        },
        "Fruiting": {
            "min_temp": 18.0, "max_temp": 24.0,
            "min_humidity": 50.0, "max_humidity": 60.0,
            "min_light": 70.0, "max_light": 100.0,
            "min_soil_moisture": 50.0, "max_soil_moisture": 60.0
        }
    },
    "Lettuce": {
        "Seedling": {
            "min_temp": 15.0, "max_temp": 20.0,
            "min_humidity": 65.0, "max_humidity": 75.0,
            "min_light": 15.0, "max_light": 30.0,
            "min_soil_moisture": 60.0, "max_soil_moisture": 70.0
        },
        "Vegetative": {
            "min_temp": 16.0, "max_temp": 22.0,
            "min_humidity": 55.0, "max_humidity": 65.0,
            "min_light": 30.0, "max_light": 50.0,
            "min_soil_moisture": 55.0, "max_soil_moisture": 65.0
        },
        "Flowering": {  # Lettuce bolted/flowering represents late lifecycle
            "min_temp": 14.0, "max_temp": 18.0,
            "min_humidity": 50.0, "max_humidity": 60.0,
            "min_light": 40.0, "max_light": 60.0,
            "min_soil_moisture": 50.0, "max_soil_moisture": 60.0
        },
        "Fruiting": {  # Seed harvest stage
            "min_temp": 15.0, "max_temp": 21.0,
            "min_humidity": 45.0, "max_humidity": 55.0,
            "min_light": 40.0, "max_light": 70.0,
            "min_soil_moisture": 45.0, "max_soil_moisture": 55.0
        }
    },
    "Orchid": {
        "Seedling": {
            "min_temp": 22.0, "max_temp": 28.0,
            "min_humidity": 70.0, "max_humidity": 80.0,
            "min_light": 10.0, "max_light": 20.0,
            "min_soil_moisture": 40.0, "max_soil_moisture": 55.0
        },
        "Vegetative": {
            "min_temp": 21.0, "max_temp": 27.0,
            "min_humidity": 60.0, "max_humidity": 70.0,
            "min_light": 15.0, "max_light": 25.0,
            "min_soil_moisture": 35.0, "max_soil_moisture": 50.0
        },
        "Flowering": {
            "min_temp": 18.0, "max_temp": 24.0,
            "min_humidity": 50.0, "max_humidity": 60.0,
            "min_light": 20.0, "max_light": 35.0,
            "min_soil_moisture": 30.0, "max_soil_moisture": 45.0
        },
        "Fruiting": {
            "min_temp": 18.0, "max_temp": 25.0,
            "min_humidity": 50.0, "max_humidity": 65.0,
            "min_light": 20.0, "max_light": 35.0,
            "min_soil_moisture": 30.0, "max_soil_moisture": 45.0
        }
    },
    "Basil": {
        "Seedling": {
            "min_temp": 20.0, "max_temp": 26.0,
            "min_humidity": 65.0, "max_humidity": 75.0,
            "min_light": 25.0, "max_light": 40.0,
            "min_soil_moisture": 60.0, "max_soil_moisture": 70.0
        },
        "Vegetative": {
            "min_temp": 22.0, "max_temp": 29.0,
            "min_humidity": 55.0, "max_humidity": 65.0,
            "min_light": 40.0, "max_light": 70.0,
            "min_soil_moisture": 50.0, "max_soil_moisture": 65.0
        },
        "Flowering": {
            "min_temp": 20.0, "max_temp": 27.0,
            "min_humidity": 50.0, "max_humidity": 60.0,
            "min_light": 50.0, "max_light": 80.0,
            "min_soil_moisture": 45.0, "max_soil_moisture": 60.0
        },
        "Fruiting": {
            "min_temp": 20.0, "max_temp": 28.0,
            "min_humidity": 50.0, "max_humidity": 60.0,
            "min_light": 50.0, "max_light": 80.0,
            "min_soil_moisture": 45.0, "max_soil_moisture": 55.0
        }
    },
    "Cactus": {
        "Seedling": {
            "min_temp": 20.0, "max_temp": 28.0,
            "min_humidity": 35.0, "max_humidity": 45.0,
            "min_light": 30.0, "max_light": 50.0,
            "min_soil_moisture": 25.0, "max_soil_moisture": 35.0
        },
        "Vegetative": {
            "min_temp": 22.0, "max_temp": 32.0,
            "min_humidity": 30.0, "max_humidity": 40.0,
            "min_light": 50.0, "max_light": 70.0,
            "min_soil_moisture": 20.0, "max_soil_moisture": 30.0
        },
        "Flowering": {
            "min_temp": 20.0, "max_temp": 30.0,
            "min_humidity": 25.0, "max_humidity": 35.0,
            "min_light": 60.0, "max_light": 85.0,
            "min_soil_moisture": 15.0, "max_soil_moisture": 25.0
        },
        "Fruiting": {
            "min_temp": 20.0, "max_temp": 30.0,
            "min_humidity": 25.0, "max_humidity": 35.0,
            "min_light": 60.0, "max_light": 85.0,
            "min_soil_moisture": 15.0, "max_soil_moisture": 25.0
        }
    }
}

class PlantExpertAgent:
    @staticmethod
    def get_targets(plant_type: str, growth_stage: str) -> TargetSettings:
        # Fallback if plant_type or growth_stage is unknown
        plant_info = PLANT_DATABASE.get(plant_type, PLANT_DATABASE["Strawberry"])
        stage_info = plant_info.get(growth_stage, plant_info["Fruiting"])

        return TargetSettings(
            min_temp=stage_info["min_temp"],
            max_temp=stage_info["max_temp"],
            min_humidity=stage_info["min_humidity"],
            max_humidity=stage_info["max_humidity"],
            min_light=stage_info["min_light"],
            max_light=stage_info["max_light"],
            min_soil_moisture=stage_info["min_soil_moisture"],
            max_soil_moisture=stage_info["max_soil_moisture"]
        )
