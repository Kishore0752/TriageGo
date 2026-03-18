import requests
from ..config.settings import GOOGLE_API_KEY, DISTANCE_MATRIX_URL, MAX_DESTINATIONS_PER_REQUEST
from ..utils.geo import eta_from_seconds

def get_real_etas(user_lat: float, user_lon: float, destinations: list) -> dict:
    """Get real ETAs and distances from Google Distance Matrix API"""
    if not destinations:
        return {}
    
    results = {}
    
    for i in range(0, len(destinations), MAX_DESTINATIONS_PER_REQUEST):
        batch = destinations[i:i+MAX_DESTINATIONS_PER_REQUEST]
        dest_str = "|".join(f"{d['lat']},{d['lng']}" for d in batch)
        
        try:
            r = requests.get(DISTANCE_MATRIX_URL, params={
                "origins": f"{user_lat},{user_lon}",
                "destinations": dest_str,
                "mode": "driving",
                "key": GOOGLE_API_KEY,
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
                        "eta": eta_from_seconds(elem["duration"]["value"]),
                    }
                else:
                    results[pid] = {"distance_km": 9999, "eta": "N/A"}
        
        except Exception as e:
            print(f"[DMatrix] Exception: {e}")
            for d in batch:
                results[d["id"]] = {"distance_km": 9999, "eta": "N/A"}
    
    return results
