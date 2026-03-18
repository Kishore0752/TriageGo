from typing import Optional, Dict
import math
from ..utils.geo import haversine, eta_fallback
from ..utils.time_utils import get_busy_status
from ..utils.scoring import compute_ai_score
from ..utils.formatting import build_ride_links, parse_open_status, extract_facility_tags

def format_place(place: dict, user_lat: float, user_lon: float, eta_info: dict, contact_details: dict = None) -> Optional[dict]:
    """Format Google Places API response into application's hospital format"""
    loc = place.get("geometry", {}).get("location", {})
    h_lat = loc.get("lat")
    h_lng = loc.get("lng")
    
    if h_lat is None or h_lng is None:
        return None
    
    name = place.get("name", "Medical Center")
    place_id = place.get("place_id", "")
    rating = float(place.get("rating") or 0)
    reviews = int(place.get("user_ratings_total") or 0)
    vicinity = place.get("vicinity") or place.get("formatted_address") or "Nearby"
    
    # Use Distance Matrix result if valid, fall back to haversine
    dist_km = eta_info.get("distance_km", 9999)
    eta = eta_info.get("eta", "N/A")
    if dist_km >= 9999:
        dist_km = haversine(user_lat, user_lon, h_lat, h_lng)
        eta = eta_fallback(dist_km)
    
    open_status = parse_open_status(place)
    verified = (rating >= 4.0 and reviews >= 20 
                and place.get("business_status") == "OPERATIONAL")
    ai_score = compute_ai_score(rating, reviews, dist_km, open_status.get("is_open"))
    
    # Use contact details if provided, otherwise set defaults
    phone = "N/A"
    website = "N/A"
    hours = []
    
    if contact_details:
        phone = contact_details.get("phone", "N/A")
        website = contact_details.get("website", "N/A")
        hours = contact_details.get("hours", [])
    
    return {
        "id": place_id,
        "DiagnosticCentreName": name,
        "DiagnosticCentreAddress": vicinity,
        "amenity_type": (place.get("types") or ["hospital"])[0],
        "phone": phone,
        "website": website,
        "opening_hours": hours if hours else "See Google Maps",
        "open_status": open_status,
        "busy_status": get_busy_status(),
        "facility_tags": extract_facility_tags(place),
        "verified": verified,
        "Rating (out of 5)": round(rating, 1),
        "Number of Reviews": reviews,
        "distance_km": dist_km,
        "eta": eta,
        "ride_links": build_ride_links(h_lat, h_lng, name),
        "ai_recommendation_score": ai_score,
        "google_maps_url": f"https://www.google.com/maps/place/?q=place_id:{place_id}",
        "lat": h_lat,
        "lng": h_lng,
    }
