import os

# Google Maps API Configuration
GOOGLE_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "")

# API Endpoints
PLACES_NEARBY_URL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
PLACES_TEXT_URL = "https://maps.googleapis.com/maps/api/place/textsearch/json"
DISTANCE_MATRIX_URL = "https://maps.googleapis.com/maps/api/distancematrix/json"
PLACES_DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json"

# Cache Configuration
CACHE_TTL = 300  # 5 minutes

# Search Configuration
DEFAULT_SEARCH_RADIUS = 10000  # meters
SOS_SEARCH_RADIUS = 15000  # meters
HEATMAP_SEARCH_RADIUS = 15000  # meters

# Distance Matrix
MAX_DESTINATIONS_PER_REQUEST = 25
