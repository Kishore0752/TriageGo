from typing import Optional, List
from pydantic import BaseModel

class SearchRequest(BaseModel):
    lat: float
    lon: float
    query: Optional[str] = ""
    mode: str = "symptoms"

class SOSRequest(BaseModel):
    lat: float
    lon: float

class HeatmapRequest(BaseModel):
    lat: float
    lon: float
    query: Optional[str] = ""

class ContactDetailsRequest(BaseModel):
    place_id: str
