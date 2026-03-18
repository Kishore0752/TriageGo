import pandas as pd
import numpy as np
from src.distance_engine import calculate_distance

def get_ranked_recommendations(user_lat, user_lon, df):
    """
    Ranks medical centers based on Quality, Trust, and Proximity.
    """
    # 1. Distance Calculation
    # We apply the formula to every row to get distance from the user's current GPS
    df['distance_km'] = df.apply(
        lambda row: calculate_distance(
            user_lat, user_lon, 
            row['Latitude'], row['Longitude']
        ), axis=1
    )

    # 2. Score Normalization
    # Handle Rating (50% weight) - Scale 0 to 1
    df['rating_norm'] = pd.to_numeric(df['Rating (out of 5)'], errors='coerce').fillna(0) / 5.0
    
    # Handle Reliability/Trust (25% weight) - Log scale of reviews
    # np.log1p handles cases where review count is 0
    max_rev = df['Number of Reviews'].max()
    denominator = np.log1p(max_rev) if (not pd.isna(max_rev) and max_rev > 0) else 1
    df['reliability_norm'] = np.log1p(df['Number of Reviews'].fillna(0)) / denominator
    
    # Proximity Score (25% weight)
    # We add 0.1 to avoid dividing by zero if the user is AT the hospital
    df['proximity_score'] = 1 / (df['distance_km'] + 0.1)

    # 3. Final AI Weighted Score
    df['ai_recommendation_score'] = (
        (df['rating_norm'] * 0.5) + 
        (df['reliability_norm'] * 0.25) + 
        (df['proximity_score'] * 0.25)
    )

    # 4. JSON Safety Cleanup
    # Replaces 'Infinity' with a high number and 'NaN' with 0 so the API doesn't crash
    df = df.replace([np.inf, -np.inf], 1.0).fillna(0)

    # Return top 20 results sorted by the highest AI Score
    return df.sort_values(by='ai_recommendation_score', ascending=False).head(20)