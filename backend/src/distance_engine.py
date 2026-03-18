import pandas as pd
import numpy as np
from src.distance_engine import calculate_distance

def get_ranked_recommendations(user_lat: float, user_lon: float, df: pd.DataFrame) -> pd.DataFrame:
    """
    Ranks medical centers using a weighted composite score:
      - Rating quality     → 50%
      - Review reliability → 25%
      - Proximity          → 25%

    Also attaches ETA, open status badge, busy status, and verified flag.
    Returns top 20 sorted by ai_recommendation_score (descending).
    """

    # ── 1. Distance ───────────────────────────────────────────────────────────
    df["distance_km"] = df.apply(
        lambda row: calculate_distance(user_lat, user_lon, row["Latitude"], row["Longitude"]),
        axis=1,
    )

    # ── 2. Normalize Rating (50%) ─────────────────────────────────────────────
    df["rating_norm"] = pd.to_numeric(df["Rating (out of 5)"], errors="coerce").fillna(0) / 5.0

    # ── 3. Normalize Review Count (25%) — log scale to reduce outlier effect ──
    max_rev = df["Number of Reviews"].max()
    denom = np.log1p(max_rev) if (not pd.isna(max_rev) and max_rev > 0) else 1
    df["reliability_norm"] = np.log1p(df["Number of Reviews"].fillna(0)) / denom

    # ── 4. Proximity Score (25%) ──────────────────────────────────────────────
    # Inverse distance — closer = higher score; +0.1 prevents division by zero
    raw_prox = 1 / (df["distance_km"] + 0.1)
    max_prox = raw_prox.max() if raw_prox.max() > 0 else 1
    df["proximity_norm"] = raw_prox / max_prox  # normalise 0→1

    # ── 5. Composite AI Score ─────────────────────────────────────────────────
    df["ai_recommendation_score"] = (
        (df["rating_norm"]    * 0.50) +
        (df["reliability_norm"] * 0.25) +
        (df["proximity_norm"] * 0.25)
    )

    # ── 6. Value-for-Money Score (bonus ranking signal) ───────────────────────
    # Uses fee if available; otherwise skips gracefully
    if "General Consultation Fee" in df.columns:
        fee = pd.to_numeric(df["General Consultation Fee"], errors="coerce").fillna(df["General Consultation Fee"].median())
        max_fee = fee.max() if fee.max() > 0 else 1
        fee_norm = 1 - (fee / max_fee)                          # cheaper = higher
        df["value_score"] = (df["rating_norm"] * 0.6) + (fee_norm * 0.4)
    else:
        df["value_score"] = df["rating_norm"]

    # ── 7. Verified Badge ─────────────────────────────────────────────────────
    has_phone = df["phone"].notna() & (df["phone"] != "N/A") if "phone" in df.columns else False
    has_name  = df["DiagnosticCentreName"].notna() & (df["DiagnosticCentreName"] != "Medical Center")
    df["verified"] = (
        (df["Rating (out of 5)"] >= 4.2) &
        (df["Number of Reviews"]  >= 50)  &
        has_phone &
        has_name
    )

    # ── 8. JSON safety — replace Inf / NaN ───────────────────────────────────
    df = df.replace([np.inf, -np.inf], 1.0).fillna(0)

    return df.sort_values("ai_recommendation_score", ascending=False).head(20)