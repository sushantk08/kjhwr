import pandas as pd

from app.processing import select_latest_forecasts


def make_forecasts(publish_times, values):
    return pd.DataFrame({
        "start_time": pd.to_datetime(["2026-01-10 12:00"] * len(values), utc=True),
        "publish_time": pd.to_datetime(publish_times, utc=True),
        "forecast": values,
    })


def test_picks_latest_forecast_before_cutoff():
    # Cutoff for delivery on 10 Jan is 09:00 on 9 Jan (UK time = UTC in January)
    df = make_forecasts(
        ["2026-01-08 12:00", "2026-01-09 08:00", "2026-01-09 10:00"],
        [100.0, 200.0, 300.0],
    )
    result = select_latest_forecasts(df)
    assert len(result) == 1
    assert result.loc[0, "forecast"] == 200.0  # the 10:00 forecast is too late


def test_no_forecast_if_all_published_after_cutoff():
    df = make_forecasts(["2026-01-09 10:00"], [300.0])
    assert select_latest_forecasts(df).empty


def test_horizon_hours():
    df = make_forecasts(["2026-01-09 08:00"], [200.0])
    result = select_latest_forecasts(df)
    assert result.loc[0, "horizon_hours"] == 28.0  # 08:00 on the 9th to 12:00 on the 10th