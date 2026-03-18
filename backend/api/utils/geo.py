import math

def haversine(lat1, lon1, lat2, lon2) -> float:
    """Calculate distance between two coordinates using Haversine formula"""
    try:
        R = 6371  # Earth radius in km
        dlat = math.radians(float(lat2) - float(lat1))
        dlon = math.radians(float(lon2) - float(lon1))
        a = math.sin(dlat/2)**2 + math.cos(math.radians(float(lat1))) * math.cos(math.radians(float(lat2))) * math.sin(dlon/2)**2
        return round(R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a)), 2)
    except:
        return 9999.0

def eta_from_seconds(secs: int) -> str:
    """Convert seconds to human readable ETA"""
    mins = int(secs / 60)
    if mins < 1:
        return "< 1 min"
    if mins < 60:
        return f"{mins} min"
    return f"{mins//60}h {mins%60}m"

def eta_fallback(dist_km: float) -> str:
    """Fallback ETA calculation based on distance (assuming 20 km/h average speed)"""
    if dist_km >= 9999:
        return "N/A"
    mins = (dist_km / 20) * 60
    return "< 1 min" if mins < 1 else (f"{int(mins)} min" if mins < 60 else f"{int(mins//60)}h {int(mins%60)}m")
