import requests
import time
from ..config.settings import (
    GOOGLE_API_KEY,
    PLACES_NEARBY_URL,
    PLACES_TEXT_URL,
    PLACES_DETAILS_URL,
    DEFAULT_SEARCH_RADIUS
)

def get_place_details(place_id: str):
    """Fetch contact details (phone, website, hours) from Google Places Details API"""
    params = {
        "place_id": place_id,
        "fields": "formatted_phone_number,website,opening_hours,formatted_address",
        "key": GOOGLE_API_KEY
    }
    try:
        response = requests.get(PLACES_DETAILS_URL, params=params, timeout=10)
        result = response.json().get("result", {})
        return {
            "phone": result.get("formatted_phone_number", "N/A"),
            "website": result.get("website", "#"),
            "hours": result.get("opening_hours", {}).get("weekday_text", []),
            "address": result.get("formatted_address", "N/A")
        }
    except Exception as e:
        print(f"Error fetching details: {e}")
        return {"phone": "N/A", "website": "#", "hours": [], "address": "N/A"}

def places_nearby(lat: float, lon: float, keyword: str, radius: int = DEFAULT_SEARCH_RADIUS) -> list:
    """Search for nearby places using keyword (no type filter to maximize results)"""
    params = {
        "location": f"{lat},{lon}",
        "radius": radius,
        "keyword": keyword,
        "key": GOOGLE_API_KEY,
    }
    all_results = []
    
    try:
        r = requests.get(PLACES_NEARBY_URL, params=params, timeout=10)
        r.raise_for_status()
        data = r.json()
        status = data.get("status")
        errmsg = data.get("error_message", "")
        print(f"[Nearby] keyword='{keyword}' status={status} count={len(data.get('results',[]))} err={errmsg}")
        
        if status == "REQUEST_DENIED":
            print(f"[Nearby] REQUEST_DENIED — check API key and that Places API is enabled")
            return []
        if status not in ("OK", "ZERO_RESULTS"):
            return []
        
        all_results = data.get("results", [])
        
        # Fetch next page if available
        next_token = data.get("next_page_token")
        pages = 0
        while next_token and pages < 2:
            time.sleep(2)  # Required delay before next_page_token becomes valid
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

def places_text_search(query: str, lat: float, lon: float, radius: int = 15000) -> list:
    """Search for places by name/text"""
    params = {
        "query": query,
        "location": f"{lat},{lon}",
        "radius": radius,
        "key": GOOGLE_API_KEY,
    }
    try:
        r = requests.get(PLACES_TEXT_URL, params=params, timeout=10)
        r.raise_for_status()
        data = r.json()
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
