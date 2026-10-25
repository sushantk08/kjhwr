import requests
from datetime import date, timedelta

BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1/datasets"


def _get(dataset: str, params: dict) -> list:
    # Call an Elexon stream endpoint and return the JSON list.
    response = requests.get(f"{BASE_URL}/{dataset}/stream", params=params, timeout=120)
    response.raise_for_status()
    return response.json()


def fetch_actuals(start: date, end: date) -> list:
    # Actual wind generation (FUELHH, fuelType WIND), fetched in 7-day chunks.
    rows = []
    current = start
    while current <= end:
        chunk_end = min(current + timedelta(days=6), end)
        data = _get("FUELHH", {
            "settlementDateFrom": current.isoformat(),
            "settlementDateTo": chunk_end.isoformat(),
            "fuelType": "WIND",
        })
        rows.extend(data)
        current = chunk_end + timedelta(days=1)
    return [r for r in rows if r.get("fuelType") == "WIND"]


def fetch_forecasts(start: date, end: date) -> list:
    # Wind forecasts (WINDFOR) published between start and end (inclusive), in 7-day chunks.
    rows = []
    current = start
    while current <= end:
        chunk_end = min(current + timedelta(days=7), end + timedelta(days=1))
        data = _get("WINDFOR", {
            "publishDateTimeFrom": f"{current.isoformat()}T00:00:00Z",
            "publishDateTimeTo": f"{chunk_end.isoformat()}T00:00:00Z",
        })
        rows.extend(data)
        current = chunk_end
    return rows