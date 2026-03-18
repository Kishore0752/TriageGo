import time
import hashlib
import requests
import re
import math
import os
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from difflib import get_close_matches
from typing import Optional

router = APIRouter()

# ---------------------------------------------------------------------------
# CONFIG
# ---------------------------------------------------------------------------
GOOGLE_API_KEY = "AIzaSyDWMf5GAHWzGMU-eZllo31hgDdfiIFlo3U"  # paste key here

PLACES_NEARBY_URL   = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
PLACES_TEXT_URL     = "https://maps.googleapis.com/maps/api/place/textsearch/json"
DISTANCE_MATRIX_URL = "https://maps.googleapis.com/maps/api/distancematrix/json"

# ---------------------------------------------------------------------------
# CACHE
# ---------------------------------------------------------------------------
_cache: dict = {}
CACHE_TTL = 300

def _cache_key(*parts):
    return hashlib.md5("_".join(str(p) for p in parts).encode()).hexdigest()

def _get_cache(key):
    e = _cache.get(key)
    return e["data"] if e and (time.time() - e["ts"]) < CACHE_TTL else None

def _set_cache(key, data):
    _cache[key] = {"ts": time.time(), "data": data}

# ---------------------------------------------------------------------------
# MODELS
# ---------------------------------------------------------------------------
class SearchRequest(BaseModel):
    lat: float
    lon: float
    query: str = ""
    mode: str = "symptoms"

class SOSRequest(BaseModel):
    lat: float
    lon: float

# ---------------------------------------------------------------------------
# SYMPTOM MAP
# Bug fix: removed "type" field — do NOT pass type to Nearby Search alongside
# keyword. Using keyword-only gives far more results.
# ---------------------------------------------------------------------------
SYMPTOM_MAP = {
    "accident":       "emergency hospital",
    "emergency":      "emergency hospital",
    "stroke":         "emergency hospital",
    "heart attack":   "cardiac emergency hospital",
    "fracture":       "orthopedic hospital",
    "burn":           "emergency hospital",
    "seizure":        "neurology hospital",
    "fever":          "general physician clinic",
    "cold":           "general physician clinic",
    "flu":            "general physician clinic",
    "cough":          "general physician clinic",
    "headache":       "general physician",
    "migraine":       "neurologist clinic",
    "vomiting":       "gastroenterologist",
    "diarrhea":       "gastroenterologist",
    "stomach pain":   "gastroenterologist",
    "abdominal pain": "gastroenterology hospital",
    "heart":          "cardiology hospital",
    "chest pain":     "cardiac hospital",
    "blood pressure": "cardiologist",
    "cholesterol":    "cardiologist",
    "asthma":         "pulmonologist",
    "breathlessness": "pulmonology hospital",
    "pneumonia":      "pulmonology hospital",
    "tb":             "tuberculosis hospital",
    "neuro":          "neurology hospital",
    "brain":          "neurology hospital",
    "epilepsy":       "neurology hospital",
    "vertigo":        "ENT specialist",
    "joint pain":     "orthopedic doctor",
    "back pain":      "physiotherapy clinic",
    "arthritis":      "rheumatologist",
    "ortho":          "orthopedic hospital",
    "physiotherapy":  "physiotherapy centre",
    "skin":           "dermatologist",
    "rash":           "dermatologist",
    "allergy":        "allergy specialist",
    "dermatology":    "dermatologist",
    "eye":            "ophthalmologist eye hospital",
    "vision":         "ophthalmologist",
    "blurred vision": "ophthalmologist",
    "cataract":       "eye hospital",
    "glaucoma":       "eye hospital",
    "ear":            "ENT specialist",
    "ent":            "ENT hospital",
    "tonsil":         "ENT hospital",
    "tooth":          "dental clinic",
    "teeth":          "dental clinic",
    "dental":         "dentist",
    "toothache":      "dental clinic",
    "gynecology":     "gynecologist",
    "pregnancy":      "maternity hospital",
    "maternity":      "maternity hospital",
    "pcos":           "gynecologist",
    "infertility":    "fertility hospital",
    "child":          "pediatrician",
    "baby":           "pediatrician",
    "pediatric":      "children hospital",
    "vaccination":    "vaccination clinic",
    "mental":         "psychiatrist",
    "depression":     "psychiatrist",
    "anxiety":        "psychologist",
    "psychiatry":     "psychiatry hospital",
    "diabetes":       "diabetologist",
    "thyroid":        "endocrinologist",
    "obesity":        "bariatric clinic",
    "kidney":         "nephrology hospital",
    "dialysis":       "dialysis centre",
    "uti":            "urologist",
    "liver":          "gastroenterology hospital",
    "hepatitis":      "hepatology hospital",
    "gastro":         "gastroenterologist",
    "cancer":         "cancer hospital",
    "oncology":       "oncology hospital",
    "chemotherapy":   "cancer hospital",
    "mri":            "MRI diagnostic centre",
    "xray":           "X-ray diagnostic centre",
    "ct scan":        "CT scan centre",
    "ultrasound":     "ultrasound centre",
    "ecg":            "cardiac clinic",
    "lab":            "diagnostic lab",
    "pathology":      "pathology lab",
    "blood test":     "blood test lab",
    "medicine":       "pharmacy",
    "pharmacy":       "pharmacy",
    "surgery":        "surgical hospital",
    "operation":      "surgical hospital",
    "hospital":       "hospital",
    "clinic":         "clinic",
    "doctor":         "doctor",
    "diagnostic":     "diagnostic centre",
    "nursing home":   "nursing home",
}

SPECIALTY_HINT_MAP = {
    "blurred vision": "Ophthalmologist", "eye": "Ophthalmologist",
    "chest pain":     "Cardiologist",    "heart": "Cardiologist",
    "back pain":      "Orthopedic Surgeon", "joint pain": "Rheumatologist",
    "depression":     "Psychiatrist",    "anxiety": "Psychiatrist",
    "skin":           "Dermatologist",   "rash": "Dermatologist",
    "diabetes":       "Endocrinologist", "thyroid": "Endocrinologist",
    "kidney":         "Nephrologist",    "cancer": "Oncologist",
    "brain":          "Neurologist",     "seizure": "Neurologist",
    "child":          "Pediatrician",    "baby": "Pediatrician",
    "pregnancy":      "Gynecologist",    "pcos": "Gynecologist",
    "tooth":          "Dentist",         "dental": "Dentist",
    "ear":            "ENT Specialist",  "ent": "ENT Specialist",
    "liver":          "Gastroenterologist",
}

ALL_KEYWORDS = list(SYMPTOM_MAP.keys())

# ---------------------------------------------------------------------------
# AUTOCORRECT
# ---------------------------------------------------------------------------
def autocorrect_query(query: str) -> tuple:
    query = query.lower().strip()
    matched, corrected = [], []
    tokens = re.findall(r"[a-z]+", query)
    i = 0
    while i < len(tokens):
        if i + 1 < len(tokens):
            phrase = f"{tokens[i]} {tokens[i+1]}"
            if phrase in SYMPTOM_MAP:
                matched.append(phrase); corrected.extend([tokens[i], tokens[i+1]]); i += 2; continue
            close = get_close_matches(phrase, ALL_KEYWORDS, n=1, cutoff=0.75)
            if close:
                matched.append(close[0]); corrected.extend([tokens[i], tokens[i+1]]); i += 2; continue
        word = tokens[i]
        if word in SYMPTOM_MAP:
            matched.append(word); corrected.append(word)
        else:
            close = get_close_matches(word, ALL_KEYWORDS, n=1, cutoff=0.75)
            if close:
                matched.append(close[0]); corrected.append(close[0])
            else:
                corrected.append(word)
        i += 1
    return " ".join(corrected), matched

def get_keyword(matched: list) -> str:
    for kw in matched:
        if kw in SYMPTOM_MAP:
            return SYMPTOM_MAP[kw]
    return "hospital"

def get_specialty_hint(kws):
    for kw in kws:
        if kw in SPECIALTY_HINT_MAP: return SPECIALTY_HINT_MAP[kw]
    return None

# ---------------------------------------------------------------------------
# UTILITIES
# ---------------------------------------------------------------------------
def haversine(lat1, lon1, lat2, lon2) -> float:
    try:
        R    = 6371
        dlat = math.radians(float(lat2) - float(lat1))
        dlon = math.radians(float(lon2) - float(lon1))
        a    = math.sin(dlat/2)**2 + math.cos(math.radians(float(lat1))) * math.cos(math.radians(float(lat2))) * math.sin(dlon/2)**2
        return round(R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a)), 2)
    except:
        return 9999.0

def eta_from_seconds(secs: int) -> str:
    mins = int(secs / 60)
    if mins < 1:  return "< 1 min"
    if mins < 60: return f"{mins} min"
    return f"{mins//60}h {mins%60}m"

def eta_fallback(dist_km: float) -> str:
    if dist_km >= 9999: return "N/A"
    mins = (dist_km / 20) * 60
    return "< 1 min" if mins < 1 else (f"{int(mins)} min" if mins < 60 else f"{int(mins//60)}h {int(mins%60)}m")

def get_busy_status() -> dict:
    hour = datetime.now().hour
    is_wknd = datetime.now().weekday() >= 5
    if any(s <= hour < e for s, e in [(8,11),(17,21)]):
        return {"status":"busy",     "label":"Peak Hours",    "color":"red",   "wait_mins": 35 if is_wknd else 25}
    if any(s <= hour < e for s, e in [(12,17),(7,9)]):
        return {"status":"moderate", "label":"Moderate Wait", "color":"amber", "wait_mins":15}
    return     {"status":"quiet",    "label":"Usually Quiet", "color":"green", "wait_mins":5}

def parse_open_status(place: dict) -> dict:
    is_open = place.get("opening_hours", {}).get("open_now")
    if is_open is True:  return {"is_open":True,  "label":"Open Now",      "color":"green"}
    if is_open is False: return {"is_open":False, "label":"Closed Now",    "color":"red"}
    return                      {"is_open":None,  "label":"Hours Unknown", "color":"gray"}

def extract_facility_tags(place: dict) -> list:
    tags, seen = [], set()
    labels = {"hospital":"Full Hospital","dentist":"Dental","pharmacy":"Pharmacy",
              "physiotherapist":"Physiotherapy","doctor":"Doctor"}
    for t in place.get("types",[]):
        if t in labels and t not in seen:
            tags.append({"label":labels[t]}); seen.add(t)
    if place.get("business_status") == "OPERATIONAL":
        tags.append({"label":"Operational"})
    return tags[:4]

def build_ride_links(lat, lng, name):
    enc_name = requests.utils.quote(str(name))
    return {
        # Opens Uber web on PC, or Uber App on Mobile
        "uber": f"https://m.uber.com/ul/?action=setPickup&dropoff[latitude]={lat}&dropoff[longitude]={lng}&dropoff[nickname]={enc_name}",
        
        # Standard Google Maps direction link
        "google_maps": f"https://www.google.com/maps/dir/?api=1&destination={lat},{lng}",
        
        # Ola deep link (usually only works on mobile)
        "ola": f"olacabs://app/booking?lat={lat}&lng={lng}&name={enc_name}"
    }

def compute_ai_score(rating, reviews, dist_km, is_open) -> float:
    r  = max(0.0, (float(rating  or 0) - 1) / 4)
    rv = math.log1p(min(int(reviews or 0), 5000)) / math.log1p(5000)
    p  = 1 / (1 + float(dist_km or 9999) * 0.3)
    s  = (r * 0.50) + (rv * 0.25) + (p * 0.25)
    if is_open is True: s = min(s + 0.05, 1.0)
    return round(s, 3)

# ---------------------------------------------------------------------------
# BUG FIX: format_place now takes user_lat/user_lon for haversine fallback
# ---------------------------------------------------------------------------
def format_place(place: dict, user_lat: float, user_lon: float, eta_info: dict) -> Optional[dict]:
    loc   = place.get("geometry", {}).get("location", {})
    h_lat = loc.get("lat")
    h_lng = loc.get("lng")
    if h_lat is None or h_lng is None:
        return None

    name     = place.get("name", "Medical Center")
    place_id = place.get("place_id", "")
    rating   = float(place.get("rating")              or 0)
    reviews  = int(place.get("user_ratings_total")    or 0)
    vicinity = place.get("vicinity") or place.get("formatted_address") or "Nearby"

    # Use Distance Matrix result if valid, fall back to haversine
    dist_km = eta_info.get("distance_km", 9999)
    eta     = eta_info.get("eta", "N/A")
    if dist_km >= 9999:
        dist_km = haversine(user_lat, user_lon, h_lat, h_lng)
        eta     = eta_fallback(dist_km)

    open_status = parse_open_status(place)
    verified    = (rating >= 4.0 and reviews >= 20
                   and place.get("business_status") == "OPERATIONAL")
    ai_score    = compute_ai_score(rating, reviews, dist_km, open_status.get("is_open"))

    # Fetch contact details from Google Places Details API
    contact_details = get_place_details(place_id)

    return {
        "id":                      place_id,
        "DiagnosticCentreName":    name,
        "DiagnosticCentreAddress": vicinity,
        "amenity_type":            (place.get("types") or ["hospital"])[0],
        "phone":                   contact_details.get("phone", "N/A"),
        "website":                 contact_details.get("website", "N/A"),
        "opening_hours":           contact_details.get("hours", []),
        "open_status":             open_status,
        "busy_status":             get_busy_status(),
        "facility_tags":           extract_facility_tags(place),
        "verified":                verified,
        "Rating (out of 5)":       round(rating, 1),
        "Number of Reviews":       reviews,
        "distance_km":             dist_km,
        "eta":                     eta,
        "ride_links":              build_ride_links(h_lat, h_lng, name),
        "ai_recommendation_score": ai_score,
        "google_maps_url":         f"https://www.google.com/maps/place/?q=place_id:{place_id}",
        "lat": h_lat,
        "lng": h_lng,
    }

# ---------------------------------------------------------------------------
# BUG FIX: places_nearby — keyword ONLY, no type param
# Passing both type + keyword restricts results heavily and causes ZERO_RESULTS
# ---------------------------------------------------------------------------
def places_nearby(lat: float, lon: float, keyword: str, radius: int = 10000) -> list:
    params = {
        "location": f"{lat},{lon}",
        "radius":   radius,
        "keyword":  keyword,          # keyword only — no type filter
        "key":      GOOGLE_API_KEY,
    }
    all_results = []
    try:
        r      = requests.get(PLACES_NEARBY_URL, params=params, timeout=10)
        r.raise_for_status()
        data   = r.json()
        status = data.get("status")
        errmsg = data.get("error_message", "")
        print(f"[Nearby] keyword='{keyword}' status={status} count={len(data.get('results',[]))} err={errmsg}")

        if status == "REQUEST_DENIED":
            print(f"[Nearby] REQUEST_DENIED — check API key and that Places API is enabled in Google Cloud Console")
            return []
        if status not in ("OK", "ZERO_RESULTS"):
            return []

        all_results = data.get("results", [])

        # Page 2
        next_token = data.get("next_page_token")
        pages = 0
        while next_token and pages < 2:
            time.sleep(2)  # required delay before next_page_token becomes valid
            r2 = requests.get(PLACES_NEARBY_URL,
                              params={"pagetoken": next_token, "key": GOOGLE_API_KEY}, timeout=10)
            r2.raise_for_status()
            d2 = r2.json()
            all_results.extend(d2.get("results", []))
            next_token = d2.get("next_page_token")
            pages += 1

    except Exception as e:
        print(f"[Nearby] Exception: {e}")
    return all_results

# ---------------------------------------------------------------------------
# places_text_search — for hospital name mode
# ---------------------------------------------------------------------------
def places_text_search(query: str, lat: float, lon: float, radius: int = 15000) -> list:
    params = {
        "query":    query,
        "location": f"{lat},{lon}",
        "radius":   radius,
        "key":      GOOGLE_API_KEY,
    }
    try:
        r      = requests.get(PLACES_TEXT_URL, params=params, timeout=10)
        r.raise_for_status()
        data   = r.json()
        status = data.get("status")
        errmsg = data.get("error_message", "")
        print(f"[Text] query='{query}' status={status} count={len(data.get('results',[]))} err={errmsg}")

        if status == "REQUEST_DENIED":
            print(f"[Text] REQUEST_DENIED — check API key and that Places API is enabled")
            return []
        if status not in ("OK", "ZERO_RESULTS"):
            return []
        return data.get("results", [])
    except Exception as e:
        print(f"[Text] Exception: {e}")
        return []
def get_place_details(place_id: str):
    """Fetches contact data fields from Google Places Details API."""
    DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json"
    params = {
        "place_id": place_id,
        # 'fields' is critical to avoid extra billing and get specific data
        "fields": "formatted_phone_number,website,opening_hours",
        "key": GOOGLE_API_KEY
    }
    try:
        response = requests.get(DETAILS_URL, params=params)
        result = response.json().get("result", {})
        return {
            "phone": result.get("formatted_phone_number", "N/A"),
            "website": result.get("website", "#"),
            "hours": result.get("opening_hours", {}).get("weekday_text", [])
        }
    except Exception as e:
        print(f"Error fetching details: {e}")
        return {"phone": "N/A", "website": "#", "hours": []}
# ---------------------------------------------------------------------------
# Distance Matrix
# ---------------------------------------------------------------------------
def get_real_etas(user_lat: float, user_lon: float, destinations: list) -> dict:
    if not destinations:
        return {}
    results = {}
    for i in range(0, len(destinations), 25):
        batch    = destinations[i:i+25]
        dest_str = "|".join(f"{d['lat']},{d['lng']}" for d in batch)
        try:
            r = requests.get(DISTANCE_MATRIX_URL, params={
                "origins":      f"{user_lat},{user_lon}",
                "destinations": dest_str,
                "mode":         "driving",
                "key":          GOOGLE_API_KEY,
            }, timeout=10)
            r.raise_for_status()
            data = r.json()
            print(f"[DMatrix] status={data.get('status')} rows={len(data.get('rows',[]))}")
            rows = data.get("rows", [{}])[0].get("elements", [])
            for j, elem in enumerate(rows):
                pid = batch[j]["id"]
                if elem.get("status") == "OK":
                    results[pid] = {
                        "distance_km": round(elem["distance"]["value"] / 1000, 2),
                        "eta":         eta_from_seconds(elem["duration"]["value"]),
                    }
                else:
                    results[pid] = {"distance_km": 9999, "eta": "N/A"}
        except Exception as e:
            print(f"[DMatrix] Exception: {e}")
            for d in batch:
                results[d["id"]] = {"distance_km": 9999, "eta": "N/A"}
    return results

# ---------------------------------------------------------------------------
# DEBUG endpoint — visit in browser to diagnose issues
# GET /api/v1/debug?lat=17.385&lon=78.486
# ---------------------------------------------------------------------------
@router.get("/debug")
async def debug(lat: float = 17.385, lon: float = 78.486):
    key_ok = GOOGLE_API_KEY not in ("", "YOUR_KEY_HERE")
    out = {
        "api_key_set":     key_ok,
        "api_key_preview": (GOOGLE_API_KEY[:10] + "...") if key_ok else "NOT SET",
        "tests": {}
    }
    if not key_ok:
        out["fix"] = "Set GOOGLE_MAPS_API_KEY env var or paste key directly in routes.py"
        return out

    # Test nearby
    places = places_nearby(lat, lon, "hospital", radius=3000)
    out["tests"]["nearby_hospital"] = {
        "keyword":      "hospital",
        "radius_m":     3000,
        "result_count": len(places),
        "first_result": places[0].get("name") if places else None,
    }

    # Test text search
    places2 = places_text_search("Apollo Hospital", lat, lon)
    out["tests"]["text_search_apollo"] = {
        "result_count": len(places2),
        "first_result": places2[0].get("name") if places2 else None,
    }

    # Test distance matrix
    if places:
        loc  = places[0]["geometry"]["location"]
        dests = [{"id": places[0]["place_id"], "lat": loc["lat"], "lng": loc["lng"]}]
        dm   = get_real_etas(lat, lon, dests)
        out["tests"]["distance_matrix"] = dm.get(places[0]["place_id"], "no result")

    return out

# ---------------------------------------------------------------------------
# SEARCH
# ---------------------------------------------------------------------------
@router.post("/search")
async def search_hospitals(request: SearchRequest):
    try:
        raw  = request.query.strip()
        mode = request.mode

        # ── HOSPITAL NAME MODE ───────────────────────────────────────────
        if mode == "hospitals" and raw:
            key    = _cache_key("txt", round(request.lat,3), round(request.lon,3), raw.lower())
            cached = _get_cache(key)
            if cached: return cached

            places = places_text_search(f"{raw} hospital", request.lat, request.lon)
            if not places:
                return {"query_received":raw, "query_corrected":raw, "search_mode":"hospitals",
                        "total_results":0, "results":[], "specialty_hint":None, "keywords_matched":[]}

            dests   = [{"id":p["place_id"], "lat":p["geometry"]["location"]["lat"],
                        "lng":p["geometry"]["location"]["lng"]} for p in places]
            eta_map = get_real_etas(request.lat, request.lon, dests)
            results = [format_place(p, request.lat, request.lon,
                                    eta_map.get(p["place_id"], {"distance_km":9999,"eta":"N/A"}))
                       for p in places]
            results = sorted([r for r in results if r], key=lambda x: -x["ai_recommendation_score"])

            payload = {"query_received":raw, "query_corrected":raw, "search_mode":"hospitals",
                       "keywords_matched":[], "specialty_hint":None,
                       "total_results":len(results), "results":results}
            _set_cache(key, payload)
            return payload

        # ── SYMPTOM MODE ─────────────────────────────────────────────────
        corrected, matched = autocorrect_query(raw)
        keyword   = get_keyword(matched) if matched else "hospital"
        specialty = get_specialty_hint(matched)

        key    = _cache_key("nbr", round(request.lat,3), round(request.lon,3), keyword)
        cached = _get_cache(key)
        if cached:
            return {**cached, "query_received":raw, "query_corrected":corrected,
                    "keywords_matched":matched, "specialty_hint":specialty}

        places = places_nearby(request.lat, request.lon, keyword)
        if not places:
            return {"query_received":raw, "query_corrected":corrected, "search_mode":"symptoms",
                    "total_results":0, "results":[], "specialty_hint":specialty,
                    "keywords_matched":matched}

        dests   = [{"id":p["place_id"], "lat":p["geometry"]["location"]["lat"],
                    "lng":p["geometry"]["location"]["lng"]} for p in places]
        eta_map = get_real_etas(request.lat, request.lon, dests)
        results = [format_place(p, request.lat, request.lon,
                                eta_map.get(p["place_id"], {"distance_km":9999,"eta":"N/A"}))
                   for p in places]
        results = sorted([r for r in results if r], key=lambda x: -x["ai_recommendation_score"])

        payload = {"query_received":raw, "query_corrected":corrected, "keywords_matched":matched,
                   "specialty_hint":specialty, "search_mode":"symptoms",
                   "total_results":len(results), "results":results}
        _set_cache(key, payload)
        return payload

    except Exception as e:
        print(f"[Search Error] {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ---------------------------------------------------------------------------
# SOS
# ---------------------------------------------------------------------------
@router.post("/sos")
async def sos_nearest(request: SOSRequest):
    try:
        places = places_nearby(request.lat, request.lon, "emergency hospital", radius=15000)
        if not places:
            raise HTTPException(status_code=404, detail="No hospitals found nearby.")

        top    = places[:10]
        dests  = [{"id":p["place_id"], "lat":p["geometry"]["location"]["lat"],
                   "lng":p["geometry"]["location"]["lng"]} for p in top]
        eta_map = get_real_etas(request.lat, request.lon, dests)

        results = []
        for p in top:
            pid  = p["place_id"]
            loc  = p["geometry"]["location"]
            info = eta_map.get(pid, {"distance_km":9999,"eta":"N/A"})
            
            # Fetch contact details
            contact_details = get_place_details(pid)
            
            results.append({
                "id":          pid,
                "name":        p.get("name","Hospital"),
                "address":     p.get("vicinity","Nearby"),
                "phone":       contact_details.get("phone", "N/A"),
                "website":     contact_details.get("website", "N/A"),
                "hours":       contact_details.get("hours", []),
                "rating":      p.get("rating",0),
                "reviews":     p.get("user_ratings_total",0),
                "distance_km": info["distance_km"],
                "eta":         info["eta"],
                "is_24_7":     p.get("opening_hours",{}).get("open_now", False),
                "ride_links":  build_ride_links(loc["lat"], loc["lng"], p.get("name","")),
                "lat": loc["lat"], "lng": loc["lng"],
            })
        results.sort(key=lambda x: (not x["is_24_7"], x["distance_km"]))
        return {"nearest": results[:3], "total_scanned": len(results)}
    except HTTPException: raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ---------------------------------------------------------------------------
# CONTACT DETAILS
# ---------------------------------------------------------------------------
@router.post("/contact-details")
async def get_contact_details(request: dict):
    """
    Get contact details for a specific hospital by place_id.
    
    Request body: {"place_id": "ChIJN1blFLsB3ngR12ismZROKHw"}
    Returns: {"phone": "...", "website": "...", "hours": [...]}
    """
    try:
        place_id = request.get("place_id")
        if not place_id:
            raise HTTPException(status_code=400, detail="place_id is required")
        
        details = get_place_details(place_id)
        return {
            "place_id": place_id,
            "phone": details.get("phone", "N/A"),
            "website": details.get("website", "N/A"),
            "opening_hours": details.get("hours", []),
            "timestamp": datetime.now().isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ---------------------------------------------------------------------------
# HEATMAP
# ---------------------------------------------------------------------------
@router.post("/heatmap")
async def get_heatmap(request: SearchRequest):
    try:
        _, matched = autocorrect_query(request.query)
        keyword    = get_keyword(matched) if matched else "hospital"
        places     = places_nearby(request.lat, request.lon, keyword, radius=15000)
        points     = [{
            "lat":    p["geometry"]["location"]["lat"],
            "lng":    p["geometry"]["location"]["lng"],
            "weight": p.get("user_ratings_total", 1),
            "name":   p.get("name",""),
            "type":   (p.get("types") or [""])[0],
            "rating": p.get("rating",0),
        } for p in places if p.get("geometry")]
        return {"points": points, "total": len(points)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))