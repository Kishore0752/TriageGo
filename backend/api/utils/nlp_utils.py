import re
from difflib import get_close_matches

# Symptom to search keyword mapping
SYMPTOM_MAP = {
    "accident": "emergency hospital",
    "emergency": "emergency hospital",
    "stroke": "emergency hospital",
    "heart attack": "cardiac emergency hospital",
    "fracture": "orthopedic hospital",
    "burn": "emergency hospital",
    "seizure": "neurology hospital",
    "fever": "general physician clinic",
    "cold": "general physician clinic",
    "flu": "general physician clinic",
    "cough": "general physician clinic",
    "headache": "general physician",
    "migraine": "neurologist clinic",
    "vomiting": "gastroenterologist",
    "diarrhea": "gastroenterologist",
    "stomach pain": "gastroenterologist",
    "abdominal pain": "gastroenterology hospital",
    "heart": "cardiology hospital",
    "chest pain": "cardiac hospital",
    "blood pressure": "cardiologist",
    "cholesterol": "cardiologist",
    "asthma": "pulmonologist",
    "breathlessness": "pulmonology hospital",
    "pneumonia": "pulmonology hospital",
    "tb": "tuberculosis hospital",
    "neuro": "neurology hospital",
    "brain": "neurology hospital",
    "epilepsy": "neurology hospital",
    "vertigo": "ENT specialist",
    "joint pain": "orthopedic doctor",
    "back pain": "physiotherapy clinic",
    "arthritis": "rheumatologist",
    "ortho": "orthopedic hospital",
    "physiotherapy": "physiotherapy centre",
    "skin": "dermatologist",
    "rash": "dermatologist",
    "allergy": "allergy specialist",
    "dermatology": "dermatologist",
    "eye": "ophthalmologist eye hospital",
    "vision": "ophthalmologist",
    "blurred vision": "ophthalmologist",
    "cataract": "eye hospital",
    "glaucoma": "eye hospital",
    "ear": "ENT specialist",
    "ent": "ENT hospital",
    "tonsil": "ENT hospital",
    "tooth": "dental clinic",
    "teeth": "dental clinic",
    "dental": "dentist",
    "toothache": "dental clinic",
    "gynecology": "gynecologist",
    "pregnancy": "maternity hospital",
    "maternity": "maternity hospital",
    "pcos": "gynecologist",
    "infertility": "fertility hospital",
    "child": "pediatrician",
    "baby": "pediatrician",
    "pediatric": "children hospital",
    "vaccination": "vaccination clinic",
    "mental": "psychiatrist",
    "depression": "psychiatrist",
    "anxiety": "psychologist",
    "psychiatry": "psychiatry hospital",
    "diabetes": "diabetologist",
    "thyroid": "endocrinologist",
    "obesity": "bariatric clinic",
    "kidney": "nephrology hospital",
    "dialysis": "dialysis centre",
    "uti": "urologist",
    "liver": "gastroenterology hospital",
    "hepatitis": "hepatology hospital",
    "gastro": "gastroenterologist",
    "cancer": "cancer hospital",
    "oncology": "oncology hospital",
    "chemotherapy": "cancer hospital",
    "mri": "MRI diagnostic centre",
    "xray": "X-ray diagnostic centre",
    "ct scan": "CT scan centre",
    "ultrasound": "ultrasound centre",
    "ecg": "cardiac clinic",
    "lab": "diagnostic lab",
    "pathology": "pathology lab",
    "blood test": "blood test lab",
    "medicine": "pharmacy",
    "pharmacy": "pharmacy",
    "surgery": "surgical hospital",
    "operation": "surgical hospital",
    "hospital": "hospital",
    "clinic": "clinic",
    "doctor": "doctor",
    "diagnostic": "diagnostic centre",
    "nursing home": "nursing home",
}

SPECIALTY_HINT_MAP = {
    "blurred vision": "Ophthalmologist",
    "eye": "Ophthalmologist",
    "chest pain": "Cardiologist",
    "heart": "Cardiologist",
    "back pain": "Orthopedic Surgeon",
    "joint pain": "Rheumatologist",
    "depression": "Psychiatrist",
    "anxiety": "Psychiatrist",
    "skin": "Dermatologist",
    "rash": "Dermatologist",
    "diabetes": "Endocrinologist",
    "thyroid": "Endocrinologist",
    "kidney": "Nephrologist",
    "cancer": "Oncologist",
    "brain": "Neurologist",
    "seizure": "Neurologist",
    "child": "Pediatrician",
    "baby": "Pediatrician",
    "pregnancy": "Gynecologist",
    "pcos": "Gynecologist",
    "tooth": "Dentist",
    "dental": "Dentist",
    "ear": "ENT Specialist",
    "ent": "ENT Specialist",
    "liver": "Gastroenterologist",
}

ALL_KEYWORDS = list(SYMPTOM_MAP.keys())

def autocorrect_query(query: str) -> tuple:
    """Auto-correct user query using symptom mapping and fuzzy matching"""
    query = query.lower().strip()
    matched, corrected = [], []
    tokens = re.findall(r"[a-z]+", query)
    i = 0
    
    while i < len(tokens):
        # Try two-word phrases first
        if i + 1 < len(tokens):
            phrase = f"{tokens[i]} {tokens[i+1]}"
            if phrase in SYMPTOM_MAP:
                matched.append(phrase)
                corrected.extend([tokens[i], tokens[i+1]])
                i += 2
                continue
            close = get_close_matches(phrase, ALL_KEYWORDS, n=1, cutoff=0.75)
            if close:
                matched.append(close[0])
                corrected.extend([tokens[i], tokens[i+1]])
                i += 2
                continue
        
        # Try single word
        word = tokens[i]
        if word in SYMPTOM_MAP:
            matched.append(word)
            corrected.append(word)
        else:
            close = get_close_matches(word, ALL_KEYWORDS, n=1, cutoff=0.75)
            if close:
                matched.append(close[0])
                corrected.append(close[0])
            else:
                corrected.append(word)
        i += 1
    
    return " ".join(corrected), matched

def get_keyword(matched: list) -> str:
    """Get primary search keyword from matched symptoms"""
    for kw in matched:
        if kw in SYMPTOM_MAP:
            return SYMPTOM_MAP[kw]
    return "hospital"

def get_specialty_hint(kws) -> str:
    """Get specialty hint from keywords for UI"""
    for kw in kws:
        if kw in SPECIALTY_HINT_MAP:
            return SPECIALTY_HINT_MAP[kw]
    return None
