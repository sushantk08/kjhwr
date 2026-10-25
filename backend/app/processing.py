import json
from pathlib import Path

import pandas as pd

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
UK_TZ = "Europe/London"
DEFAULT_CUTOFF_HOUR = 9  # 09:00 UK time on the day before delivery

# Decisions are made in January 2026, so delivery days are 2 Jan to 1 Feb 2026
FIRST_DELIVERY_DAY = "2026-01-02"
LAST_DELIVERY_DAY = "2026-02-01"


def load_actuals() -> pd.DataFrame:
    rows = json.loads((DATA_DIR / "actuals.json").read_text())
    df = pd.DataFrame(rows)
    df["start_time"] = pd.to_datetime(df["startTime"], utc=True)
    df = df.rename(columns={"generation": "actual"})[["start_time", "actual"]]
    return df.drop_duplicates("start_time").sort_values("start_time").reset_index(drop=True)


def load_forecasts() -> pd.DataFrame:
    rows = json.loads((DATA_DIR / "forecasts.json").read_text())
    df = pd.DataFrame(rows)
    df["start_time"] = pd.to_datetime(df["startTime"], utc=True)
    df["publish_time"] = pd.to_datetime(df["publishTime"], utc=True)
    df = df.rename(columns={"generation": "forecast"})
    return df[["start_time", "publish_time", "forecast"]]


def select_latest_forecasts(forecasts: pd.DataFrame, cutoff_hour: int = DEFAULT_CUTOFF_HOUR) -> pd.DataFrame:

    df = forecasts.copy()

    # Delivery day in UK local time, then the cutoff = previous day at cutoff_hour (UK time)
    local_start = df["start_time"].dt.tz_convert(UK_TZ).dt.tz_localize(None)
    cutoff_naive = local_start.dt.normalize() - pd.Timedelta(days=1) + pd.Timedelta(hours=cutoff_hour)
    df["cutoff"] = cutoff_naive.dt.tz_localize(
        UK_TZ, ambiguous="NaT", nonexistent="shift_forward"
    ).dt.tz_convert("UTC")

    # Only forecasts that were available at decision time
    eligible = df[df["publish_time"] <= df["cutoff"]]

    # Latest one per slot
    latest = (
        eligible.sort_values("publish_time")
        .drop_duplicates("start_time", keep="last")
        .sort_values("start_time")
        .reset_index(drop=True)
    )
    latest["horizon_hours"] = (latest["start_time"] - latest["publish_time"]).dt.total_seconds() / 3600
    return latest


def build_dataset(cutoff_hour: int = DEFAULT_CUTOFF_HOUR) -> pd.DataFrame:
    # Latest decision-time forecast joined with actuals, for January 2026 decisions.
    forecasts = select_latest_forecasts(load_forecasts(), cutoff_hour)
    actuals = load_actuals()

    df = forecasts.merge(actuals, on="start_time", how="left")
    df["error"] = df["forecast"] - df["actual"]  # positive = over-forecast

    delivery_day = df["start_time"].dt.tz_convert(UK_TZ).dt.strftime("%Y-%m-%d")
    df["delivery_day"] = delivery_day
    df = df[(delivery_day >= FIRST_DELIVERY_DAY) & (delivery_day <= LAST_DELIVERY_DAY)]
    return df.reset_index(drop=True)


if __name__ == "__main__":
    data = build_dataset()
    print("Rows:", len(data))
    print("Delivery days:", data["delivery_day"].nunique())
    print("Rows with no actual:", int(data["actual"].isna().sum()))
    print("Horizon hours (min / mean / max):",
          round(data["horizon_hours"].min(), 1),
          round(data["horizon_hours"].mean(), 1),
          round(data["horizon_hours"].max(), 1))
    print(data.head(10).to_string())