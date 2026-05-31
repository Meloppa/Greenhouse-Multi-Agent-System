import os
import random
from typing import Dict, Any

class DiagnosticsAgent:
    @staticmethod
    def analyze_leaf_photo(filename: str, file_size: int) -> Dict[str, Any]:
        # Perform dynamic diagnosis based on filename terms or fallback to mock probability
        fn_lower = filename.lower()
        
        # Possible disease profiles
        DISEASES = {
            "spider_mites": {
                "diagnosis": "Two-Spotted Spider Mite Infestation (Tetranychus urticae)",
                "status": "Infected",
                "severity": "High",
                "confidence": round(random.uniform(88.0, 97.5), 1),
                "symptoms": "Fine silk webbing on undersides of leaves, pale yellow stippling (tiny dots) on upper surfaces, leaf curling.",
                "urgent_action": "Isolate affected pots immediately. Increase local humidity levels as mites thrive in warm, dry environments.",
                "organic_treatment": "Spray leaves thoroughly with cold-pressed Neem Oil mixture or release predatory mites (Phytoseiulus persimilis).",
                "chemical_treatment": "Apply Bifenthrin or Abamectin-based miticide strictly matching greenhouse guidelines.",
                "affected_areas": ["Leaf margins", "Lower canopy"]
            },
            "powdery_mildew": {
                "diagnosis": "Powdery Mildew Infection (Podosphaera macularis)",
                "status": "Infected",
                "severity": "Medium",
                "confidence": round(random.uniform(90.0, 99.0), 1),
                "symptoms": "White, flour-like powdery spots spreading over leaves and petioles, leaf distortion, reduced photosynthesis rates.",
                "urgent_action": "Reduce exhaust humidity, prune dense centers to enhance airflow, and stop overhead sprinkler watering.",
                "organic_treatment": "Spray leaves with potassium bicarbonate solution or diluted milk spray (1:9 ratio) under bright lights.",
                "chemical_treatment": "Apply Myclobutanil or sulfur-based vaporizations if systemic spreading is detected.",
                "affected_areas": ["Upper leaf surfaces", "New shoots"]
            },
            "leaf_spot": {
                "diagnosis": "Septoria Leaf Spot (Septoria lycopersici)",
                "status": "Infected",
                "severity": "Medium",
                "confidence": round(random.uniform(85.0, 95.0), 1),
                "symptoms": "Circular spots with dark brown margins and gray centers, small black fruiting bodies inside spots, premature foliage loss.",
                "urgent_action": "Remove infected leaves immediately and wash hands before handling healthy plants. Clean all tools.",
                "organic_treatment": "Apply copper-based organic fungicides or horsetail (Equisetum) extract spray.",
                "chemical_treatment": "Apply Chlorothalonil or Mancozeb protective fungicides on active foliage.",
                "affected_areas": ["Oldest leaves", "Stems"]
            },
            "healthy": {
                "diagnosis": "Healthy Leaf Tissues",
                "status": "Healthy",
                "severity": "None",
                "confidence": round(random.uniform(95.0, 99.8), 1),
                "symptoms": "Uniform deep green coloring, robust turgor pressure (no wilting), clean stomata, no fungal coatings or insect bite markings.",
                "urgent_action": "No remediation required. Maintain current nutrition and irrigation cycles.",
                "organic_treatment": "Apply seaweed extract foliar spray monthly to promote natural plant immune resistance.",
                "chemical_treatment": "None required.",
                "affected_areas": []
            }
        }
        
        # Match keywords in filename
        if "mite" in fn_lower or "spider" in fn_lower:
            result = DISEASES["spider_mites"]
        elif "mildew" in fn_lower or "white" in fn_lower or "fungus" in fn_lower:
            result = DISEASES["powdery_mildew"]
        elif "spot" in fn_lower or "brown" in fn_lower:
            result = DISEASES["leaf_spot"]
        elif "healthy" in fn_lower or "green" in fn_lower:
            result = DISEASES["healthy"]
        else:
            # Random choice if no keyword matches to keep simulation dynamic
            choice = random.choice(["spider_mites", "powdery_mildew", "leaf_spot", "healthy"])
            result = DISEASES[choice]
            
        return {
            "filename": filename,
            "file_size_kb": round(file_size / 1024, 1),
            **result
        }
