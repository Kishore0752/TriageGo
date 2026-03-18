import requests

def build_ride_links(lat, lng, name):
    """Build ride service links (Uber, Google Maps, Ola)"""
    enc_name = requests.utils.quote(str(name))
    return {
        "uber": f"https://m.uber.com/ul/?action=setPickup&dropoff[latitude]={lat}&dropoff[longitude]={lng}&dropoff[nickname]={enc_name}",
        "google_maps": f"https://www.google.com/maps/dir/?api=1&destination={lat},{lng}",
        "ola": f"olacabs://app/booking?lat={lat}&lng={lng}&name={enc_name}"
    }

def parse_open_status(place: dict) -> dict:
    """Parse opening status from place data"""
    is_open = place.get("opening_hours", {}).get("open_now")
    if is_open is True:
        return {"is_open": True, "label": "Open Now", "color": "green"}
    if is_open is False:
        return {"is_open": False, "label": "Closed Now", "color": "red"}
    return {"is_open": None, "label": "Hours Unknown", "color": "gray"}

def extract_facility_tags(place: dict) -> list:
    """Extract facility tags from place types"""
    tags, seen = [], set()
    labels = {
        "hospital": "Full Hospital",
        "dentist": "Dental",
        "pharmacy": "Pharmacy",
        "physiotherapist": "Physiotherapy",
        "doctor": "Doctor"
    }
    for t in place.get("types", []):
        if t in labels and t not in seen:
            tags.append({"label": labels[t]})
            seen.add(t)
    if place.get("business_status") == "OPERATIONAL":
        tags.append({"label": "Operational"})
    return tags[:4]
