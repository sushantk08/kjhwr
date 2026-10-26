import os
from pathlib import Path

from fastapi.staticfiles import StaticFiles
from functools import lru_cache

import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from app.metrics import compute_metrics, metrics_by_day, metrics_by_horizon
from app.processing import DEFAULT_CUTOFF_HOUR, build_dataset

app = FastAPI(title="Wind Forecast Portal API")

# Allow the React frontend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

CutoffHour = Query(
    DEFAULT_CUTOFF_HOUR,
    ge=0,
    le=23,
    description="Decision cutoff hour (UK time) on the day before delivery",
)


@lru_cache(maxsize=24)
def get_dataset(cutoff_hour: int) -> pd.DataFrame:
    # Build the dataset once per cutoff hour and reuse it.
    return build_dataset(cutoff_hour)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/days")
def list_days(cutoff_hour: int = CutoffHour):
    # Delivery days that have a forecast available at decision time.
    df = get_dataset(cutoff_hour)
    return {"cutoff_hour": cutoff_hour, "days": sorted(df["delivery_day"].unique().tolist())}


@app.get("/api/forecast")
def get_forecast(day: str, cutoff_hour: int = CutoffHour):
    # Decision-time forecast (and actuals) for one delivery day.
    df = get_dataset(cutoff_hour)
    day_df = df[df["delivery_day"] == day]
    if day_df.empty:
        raise HTTPException(status_code=404, detail=f"No data for delivery day {day}")

    points = []
    for row in day_df.itertuples():
        points.append({
            "time": row.start_time.isoformat(),
            "forecast": float(row.forecast),
            "actual": None if pd.isna(row.actual) else float(row.actual),
            "publish_time": row.publish_time.isoformat(),
            "horizon_hours": float(row.horizon_hours),
        })

    return {
        "day": day,
        "cutoff_hour": cutoff_hour,
        "decision_cutoff": day_df.iloc[0]["cutoff"].isoformat(),
        "metrics": compute_metrics(day_df),
        "points": points,
    }


@app.get("/api/metrics")
def get_metrics(cutoff_hour: int = CutoffHour):
    # Forecast accuracy across all of January 2026 decisions.
    df = get_dataset(cutoff_hour)
    return {
        "cutoff_hour": cutoff_hour,
        "overall": compute_metrics(df),
        "by_day": metrics_by_day(df),
        "by_horizon": metrics_by_horizon(df),
    }

# Serve the built React app (present in the Docker image, absent in local dev)
STATIC_DIR = Path(os.environ.get("STATIC_DIR", Path(__file__).resolve().parent.parent / "static"))
if STATIC_DIR.is_dir():
    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")