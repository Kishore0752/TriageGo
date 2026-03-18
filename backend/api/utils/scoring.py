import math

def compute_ai_score(rating, reviews, dist_km, is_open) -> float:
    """
    Compute AI recommendation score based on:
    - Rating (50%): Hospital quality
    - Reviews (25%): Popularity and trust
    - Proximity (25%): Distance from user
    - Bonus: 5% if open now
    """
    r = max(0.0, (float(rating or 0) - 1) / 4)
    rv = math.log1p(min(int(reviews or 0), 5000)) / math.log1p(5000)
    p = 1 / (1 + float(dist_km or 9999) * 0.3)
    s = (r * 0.50) + (rv * 0.25) + (p * 0.25)
    if is_open is True:
        s = min(s + 0.05, 1.0)
    return round(s, 3)
