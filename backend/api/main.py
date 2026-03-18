import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router as hospital_router

# ---------------------------------------------------------------------------
# IMPORTANT: Set your Google Maps API key before running
# Option 1 — environment variable (recommended for production):
#     Windows:  set GOOGLE_MAPS_API_KEY=your_key_here
#     Linux/Mac: export GOOGLE_MAPS_API_KEY=your_key_here
#
# Option 2 — paste directly in routes.py line:
#     GOOGLE_API_KEY = "your_key_here"
# ---------------------------------------------------------------------------

app = FastAPI(
    title="MedCompare AI",
    description="AI-powered medical center discovery using Google Maps APIs",
    version="3.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(hospital_router, prefix="/api/v1")

@app.get("/")
async def root():
    api_key_set = os.getenv("GOOGLE_MAPS_API_KEY", "YOUR_API_KEY_HERE") != "YOUR_API_KEY_HERE"
    return {
        "project":     "MedCompare AI",
        "version":     "3.0.0",
        "status":      "Online",
        "google_api":  "Configured" if api_key_set else "NOT SET — add GOOGLE_MAPS_API_KEY",
        "endpoints": {
            "search":  "POST /api/v1/search",
            "sos":     "POST /api/v1/sos",
            "heatmap": "POST /api/v1/heatmap",
            "docs":    "/docs",
        },
    }

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=True)