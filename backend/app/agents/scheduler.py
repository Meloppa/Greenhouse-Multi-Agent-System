from typing import List, Dict, Any

class TaskSchedulerAgent:
    @staticmethod
    def generate_daily_tasks(plant_type: str, growth_stage: str, age_days: int) -> List[Dict[str, Any]]:
        tasks = []
        
        # General checks based on stage
        if growth_stage == "Seedling":
            tasks.append({
                "id": "t1",
                "category": "Hydration",
                "task": "Perform fine misting on soil surface",
                "priority": "High",
                "completed": False,
                "notes": "Ensure delicate roots are moist but not waterlogged."
            })
            tasks.append({
                "id": "t2",
                "category": "Lighting",
                "task": "Maintain distance of lights at 10-12 inches",
                "priority": "Medium",
                "completed": False,
                "notes": "Prevents seedling stretching or leggy growth."
            })
        elif growth_stage == "Vegetative":
            tasks.append({
                "id": "t1",
                "category": "Nutrition",
                "task": "Apply nitrogen-rich nutrient mix (high N in N-P-K)",
                "priority": "High",
                "completed": False,
                "notes": "Supports rapid stem and foliage development."
            })
            tasks.append({
                "id": "t2",
                "category": "Maintenance",
                "task": "Prune lower fan leaves shading root zones",
                "priority": "Medium",
                "completed": False,
                "notes": "Enhances air circulation and light penetration."
            })
        elif growth_stage == "Flowering":
            tasks.append({
                "id": "t1",
                "category": "Pollination",
                "task": "Gently shake flower clusters or run fan high for 15 mins",
                "priority": "High",
                "completed": False,
                "notes": "Simulates wind to assist self-pollination mechanisms."
            })
            tasks.append({
                "id": "t2",
                "category": "Nutrition",
                "task": "Shift nutrient profile to high phosphorus and potassium",
                "priority": "High",
                "completed": False,
                "notes": "Promotes bud count and strong bloom nodes."
            })
        elif growth_stage == "Fruiting":
            tasks.append({
                "id": "t1",
                "category": "Harvest",
                "task": "Check fruit skin firmness and color saturation",
                "priority": "High",
                "completed": False,
                "notes": "Harvest ripe fruits to allow smaller yields to bulk up."
            })
            tasks.append({
                "id": "t2",
                "category": "Pruning",
                "task": "Remove runner stems and yellowing old growth",
                "priority": "Medium",
                "completed": False,
                "notes": "Redirects energy to active fruit clusters."
            })

        # Add checks based on age milestones
        if age_days % 7 == 0:
            tasks.append({
                "id": "t_milestone_1",
                "category": "Hygiene",
                "task": "Sanitize and flush hydroponic lines / topsoil flush",
                "priority": "Medium",
                "completed": False,
                "notes": "Milestone: Weekly system flushing to avoid salt build-up."
            })
        if age_days >= 30 and age_days < 35:
            tasks.append({
                "id": "t_milestone_2",
                "category": "Diagnostics",
                "task": "Inspect undersides of leaves for spider mite webbing",
                "priority": "High",
                "completed": False,
                "notes": "Milestone: Plant entering high-risk mature vegetative phase."
            })

        # General housekeeping
        tasks.append({
            "id": "t_gen_1",
            "category": "Safety",
            "task": "Wipe down ambient light sensor and check battery levels",
            "priority": "Low",
            "completed": True,
            "notes": "Keeps target automatic thresholds accurate."
        })

        return tasks
