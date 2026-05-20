import os
from pathlib import Path
from typing import List, Optional

import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

from services.analytics_service import compute_kpis, get_top_articles
from services.export_service import load_analysis_csv, save_analysis_csv
from services.forecast_service import forecast_sentiment
from services.news_service import fetch_news
from services.sentiment_service import analyze_sentiment
from services.slack_service import send_alert

# =====================================
# FASTAPI APP
# =====================================

app = FastAPI()

# =====================================
# CORS
# =====================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ROOT_DIR = Path(__file__).resolve().parents[2]
CSV_FILE_PATH = ROOT_DIR / "data" / "final_analysis.csv"

# =====================================
# REQUEST MODELS
# =====================================

class NewsRequest(BaseModel):
    keyword: str
    articles: int
    start_date: str = None
    end_date: str = None
    date_mode: str = "daily"


class AlertRequest(BaseModel):
    message: Optional[str] = None
    forecast_data: Optional[List[dict]] = None
    sentiment_label: Optional[str] = None


# =====================================
# HOME ROUTE
# =====================================

@app.get("/")
def home():
    return {"message": "Backend Running Successfully"}


def format_forecast_alert_message(forecast_data: list):
    if not forecast_data:
        return None

    lines = []
    for index, item in enumerate(forecast_data[:7], start=1):
        date_value = item.get("date")
        try:
            date_str = pd.to_datetime(date_value).strftime("%Y-%m-%d")
        except Exception:
            date_str = str(date_value)

        prediction = float(item.get("prediction", 0.0) or 0.0)
        lower = float(item.get("lower", 0.0) or 0.0)
        upper = float(item.get("upper", 0.0) or 0.0)
        trend_icon = "▲" if prediction > 0 else "▼" if prediction < 0 else "→"

        lines.append(
            f"{index}. {date_str}: {trend_icon} {prediction:+.2f}"
            f" (low {lower:.2f}, high {upper:.2f})"
        )

    header = "7-day sentiment forecast alert:\n"
    return header + "\n".join(lines)


def evaluate_alerts(news_df: pd.DataFrame, forecast_data: list):
    if news_df.empty:
        return None

    total = len(news_df)
    negative_count = int((news_df["sentiment"] == "NEGATIVE").sum())
    negative_rate = negative_count / total if total else 0.0
    average_score = news_df["score"].mean() if "score" in news_df.columns else 0.0

    alerts = []

    if negative_rate >= 0.4:
        alerts.append(
            f"Negative sentiment spike detected: {negative_rate:.0%} of articles are negative."
        )

    if average_score < -0.05:
        alerts.append(
            f"Average sentiment score is trending negative at {average_score:.2f}."
        )

    forecast_negative = any(
        item.get("prediction", 0) < -0.1 for item in forecast_data
    )
    if forecast_negative:
        alerts.append("Forecast indicates a potential downward sentiment trend in the next 7 days.")

    if not alerts:
        return None

    return "\n".join(alerts)


# =====================================
# FETCH NEWS API
# =====================================

@app.post("/fetch-news")
def fetch_news_api(data: NewsRequest):
    start_date = None
    end_date = None

    if data.start_date:
        start_parts = list(map(int, data.start_date.split("-")))
        start_date = tuple(start_parts)

    if data.end_date:
        end_parts = list(map(int, data.end_date.split("-")))
        end_date = tuple(end_parts)

    news_df = fetch_news(
        query=data.keyword,
        limit=data.articles,
        start_date=start_date,
        end_date=end_date,
    )

    sentiments = []
    confidences = []
    scores = []

    for _, row in news_df.iterrows():
        sentiment, confidence = analyze_sentiment(row["title"])
        sentiments.append(sentiment)
        confidences.append(confidence)
        scores.append(confidence if sentiment == "POSITIVE" else -confidence if sentiment == "NEGATIVE" else 0.0)

    news_df["sentiment"] = sentiments
    news_df["confidence"] = confidences
    news_df["score"] = scores

    news_df["publishedAt"] = pd.to_datetime(
        news_df["publishedAt"],
        errors="coerce",
    )
    news_df = news_df.dropna(subset=["publishedAt"])

    save_analysis_csv(news_df, CSV_FILE_PATH)

    kpis = compute_kpis(news_df)
    distribution = kpis.pop("distribution")

    if data.date_mode == "weekly":
        news_df["trend_period"] = news_df["publishedAt"].dt.to_period("W").dt.start_time.dt.strftime("%Y-%m-%d")
    elif data.date_mode == "monthly":
        news_df["trend_period"] = news_df["publishedAt"].dt.to_period("M").dt.strftime("%Y-%m")
    elif data.date_mode == "yearly":
        news_df["trend_period"] = news_df["publishedAt"].dt.to_period("Y").dt.strftime("%Y")
    else:
        news_df["trend_period"] = news_df["publishedAt"].dt.strftime("%Y-%m-%d")

    trend_df = (
        news_df.groupby("trend_period")["score"]
        .mean()
        .reset_index()
    )
    trend_df.columns = ["date", "score"]
    trend_data = trend_df.to_dict(orient="records")

    forecast_data = forecast_sentiment(news_df)
    alert_message = evaluate_alerts(news_df, forecast_data)
    alert_sent = False

    top_articles = get_top_articles(news_df)

    return {
        "articles": news_df.to_dict(orient="records"),
        "kpis": kpis,
        "distribution": distribution,
        "trend_data": trend_data,
        "forecast_data": forecast_data,
        "top_positive_articles": top_articles["top_positive_articles"],
        "top_negative_articles": top_articles["top_negative_articles"],
        "alert_message": alert_message,
        "alert_sent": alert_sent,
    }


@app.get("/download-csv")
def download_csv():
    return FileResponse(
        CSV_FILE_PATH,
        media_type="text/csv",
        filename="final_analysis.csv",
    )


@app.get("/analytics-summary")
def analytics_summary():
    try:
        archive_df = load_analysis_csv(CSV_FILE_PATH)
    except FileNotFoundError:
        return {"error": "No analysis CSV file found. Run /fetch-news first."}

    kpis = compute_kpis(archive_df)
    top_articles = get_top_articles(archive_df)

    return {
        "kpis": kpis,
        "top_positive_articles": top_articles["top_positive_articles"],
        "top_negative_articles": top_articles["top_negative_articles"],
    }


@app.post("/send-alert")
def send_alert_api(data: AlertRequest):
    message_parts = []

    if data.sentiment_label:
        message_parts.append(f"Overall sentiment: {data.sentiment_label}.")

    if data.message:
        message_parts.append(data.message)

    if data.forecast_data:
        forecast_message = format_forecast_alert_message(data.forecast_data)
        if forecast_message:
            message_parts.append(forecast_message)

    if not message_parts:
        message_parts.append("Slack alert triggered, but no forecast data was available to attach.")

    full_message = "\n\n".join(message_parts)
    success = send_alert(full_message)
    return {
        "success": success,
        "message": "Slack alert sent." if success else "Failed to send Slack alert.",
    }
