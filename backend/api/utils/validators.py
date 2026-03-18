"""
Validators for request data and coordinates
"""
import re
from typing import Tuple, Dict, Any

class ValidationError(Exception):
    """Custom validation error"""
    pass

def validate_coordinates(lat: float, lon: float) -> Tuple[float, float]:
    """Validate geographic coordinates"""
    if not isinstance(lat, (int, float)) or not isinstance(lon, (int, float)):
        raise ValidationError("Latitude and longitude must be numbers")
    
    if lat < -90 or lat > 90:
        raise ValidationError("Latitude must be between -90 and 90")
    
    if lon < -180 or lon > 180:
        raise ValidationError("Longitude must be between -180 and 180")
    
    return float(lat), float(lon)

def validate_query(query: str, min_length: int = 0, max_length: int = 200) -> str:
    """Validate search query"""
    if not isinstance(query, str):
        raise ValidationError("Query must be a string")
    
    query = query.strip()
    
    if len(query) < min_length:
        raise ValidationError(f"Query must be at least {min_length} characters")
    
    if len(query) > max_length:
        raise ValidationError(f"Query must be no more than {max_length} characters")
    
    # Remove potentially dangerous characters
    if re.search(r'[<>"\']', query):
        raise ValidationError("Query contains invalid characters")
    
    return query

def validate_mode(mode: str) -> str:
    """Validate search mode"""
    valid_modes = ['symptoms', 'hospitals']
    
    if mode not in valid_modes:
        raise ValidationError(f"Mode must be one of: {', '.join(valid_modes)}")
    
    return mode

def validate_place_id(place_id: str) -> str:
    """Validate place ID"""
    if not place_id or not isinstance(place_id, str):
        raise ValidationError("Place ID must be a non-empty string")
    
    return place_id.strip()

def validate_radius(radius: int, min_radius: int = 1000, max_radius: int = 50000) -> int:
    """Validate search radius in meters"""
    if not isinstance(radius, int):
        raise ValidationError("Radius must be an integer")
    
    if radius < min_radius or radius > max_radius:
        raise ValidationError(f"Radius must be between {min_radius} and {max_radius} meters")
    
    return radius
