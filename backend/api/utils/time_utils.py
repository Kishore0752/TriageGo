from datetime import datetime

def get_busy_status() -> dict:
    """Get current busy status based on time of day"""
    hour = datetime.now().hour
    is_wknd = datetime.now().weekday() >= 5
    
    # Peak hours
    if any(s <= hour < e for s, e in [(8, 11), (17, 21)]):
        return {
            "status": "busy",
            "label": "Peak Hours",
            "color": "red",
            "wait_mins": 35 if is_wknd else 25
        }
    # Moderate hours
    if any(s <= hour < e for s, e in [(12, 17), (7, 9)]):
        return {
            "status": "moderate",
            "label": "Moderate Wait",
            "color": "amber",
            "wait_mins": 15
        }
    # Quiet hours
    return {
        "status": "quiet",
        "label": "Usually Quiet",
        "color": "green",
        "wait_mins": 5
    }
