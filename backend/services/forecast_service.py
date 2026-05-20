from typing import List
from datetime import datetime, timedelta


def forecast_sentiment(news_df) -> List[dict]:
    """Stub forecast implementation returning a simple 7-day mock forecast."""
    start = datetime.utcnow().date()
    forecast = []
    trend = 0.1
    for offset in range(1, 8):
        date = (start + timedelta(days=offset)).isoformat()
        prediction = round(trend * offset, 2)
        forecast.append({
            "date": date,
            "prediction": prediction,
            "lower": round(prediction - 0.08, 2),
            "upper": round(prediction + 0.08, 2),
        })
    return forecast
