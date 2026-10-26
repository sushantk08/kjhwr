# Wind Forecast Portal

A web app that helps a UK energy utility's day-ahead buying desk to:

1. See the **latest wind generation forecast that was available at decision time** (the day before delivery).
2. **Quantify how accurate** those forecasts were, using MAE, RMSE and bias.

Data: national UK wind generation from Elexon BMRS only, for **January 2026 purchase decisions**.

**Live app:** https://kjhwr-alpha.vercel.app/

## AI tools used

## Development

I built this project myself, from implementation to testing. Whenever I encountered difficulties, I used Claude by Anthropic as a support tool to clarify concepts, troubleshoot issues, and explore solutions. I reviewed, ran, and tested the code, and I take ownership of the final implementation and project.

## Tech stack

- Backend: Python, FastAPI, pandas
- Frontend: React (Vite), Recharts
- Packaging: Docker (single container serving API and frontend)
- Hosting: Vercel (static frontend and a Python function)

## How the analysis works

- **Actuals:** Elexon `FUELHH` dataset, `fuelType = WIND` (`startTime`, `generation`).
- **Forecasts:** Elexon `WINDFOR` dataset (`startTime`, `publishTime`, `generation`).
- Each target time has many forecasts published at different times. For each target time, the app keeps the **latest forecast published at or before the decision cutoff**, then joins it to the actual generation.
- **Error = forecast − actual** (MW). Positive error means the forecast was too high.
- **MAE** is the average size of the error. **RMSE** is similar but penalises large misses more. **Bias** is the mean signed error, so a positive bias means over-forecasting.
- **Horizon** is the time between when the forecast was published and the target time. Accuracy is also reported by horizon bucket (6-hour buckets).

## Assumptions

- **Decision cutoff:** 09:00 UK time on the day before delivery. This is an assumption. It can be changed from 06:00 to 12:00 in the UI (the `cutoff_hour` API parameter).
- **Decision period:** decisions are made in January 2026, so delivery days run from 2 Jan to 1 Feb 2026 (31 days).
- **Resolution:** the WINDFOR forecasts are hourly while FUELHH actuals are half-hourly. Accuracy is computed on the forecast timestamps (744 hours), and the half-hourly actuals in between are not used.
- **Units:** all values are in MW.
- **Data snapshot:** Elexon data is downloaded once and stored in `backend/data/`. The app does not call Elexon at runtime, which keeps it fast and reproducible.
- **Missing data:** hours with no matching actual are excluded from the metrics. For the current data there are none.

## Limitations

- Wind only and national level, as per the scope. No demand, solar or price data.
- Accuracy is based on one month of data, so it is a pilot indication and does not guarantee future performance.
- Forecasts are selected on a 09:00 cutoff by default, and a real desk may use a different time.
- Horizon buckets cover a narrow range (about 16 to 40 hours) because of the cutoff rule, so the horizon view mainly shows that accuracy is similar across this range.

## Files and directories

```
.
├── README.md                  This file
├── Dockerfile                 Multi-stage build: React build, then Python image serving API and frontend
├── .dockerignore              Files excluded from the Docker image
├── .gitignore                 Files excluded from git
├── vercel.json                Vercel build and routing config
├── requirements.txt           Python runtime dependencies used by Vercel
├── .python-version            Python version used by Vercel
├── api/
│   └── index.py               Vercel entry point, exposes the FastAPI app
├── backend/
│   ├── requirements.txt       Python dependencies (including pytest)
│   ├── conftest.py            Lets pytest import the app package
│   ├── app/
│   │   ├── main.py            FastAPI app and API endpoints
│   │   ├── elexon.py          Client for the Elexon FUELHH and WINDFOR APIs
│   │   ├── fetch_data.py      Script that downloads and saves the data
│   │   ├── processing.py      Forecast selection at the cutoff and join with actuals
│   │   └── metrics.py         MAE, RMSE, bias, and breakdowns by day and horizon
│   ├── data/
│   │   ├── actuals.json       Saved FUELHH (WIND) data
│   │   └── forecasts.json     Saved WINDFOR data
│   └── tests/
│       ├── test_metrics.py    Unit tests for the metrics
│       └── test_processing.py Unit tests for the forecast selection logic
└── frontend/
    ├── package.json           Frontend dependencies and scripts
    ├── vite.config.js         Vite config, proxies /api to the backend in dev
    └── src/
        ├── main.jsx           React entry point
        ├── App.jsx            App shell with Forecast and Accuracy tabs
        ├── api.js             Functions that call the backend API
        ├── constants.js       Shared constants (cutoff options)
        ├── format.js          Time and MW formatting helpers
        ├── index.css          Styles
        ├── components/
        │   └── ForecastChart.jsx   Forecast vs actual chart
        └── pages/
            ├── ForecastPage.jsx    Forecast view
            └── AccuracyPage.jsx    Accuracy view
```

## API

| Endpoint | Description |
| --- | --- |
| `GET /api/health` | Health check |
| `GET /api/days?cutoff_hour=9` | Delivery days with data |
| `GET /api/forecast?day=2026-01-15&cutoff_hour=9` | Decision-time forecast and actuals for one day |
| `GET /api/metrics?cutoff_hour=9` | Overall accuracy, plus breakdowns by day and horizon |

Interactive API docs are available at `/docs` when running locally.

## How to start the application

### Option 1: Docker (recommended)

Requires Docker.

```bash
docker build -t wind-portal .
docker run -p 8080:8000 wind-portal
```

Open http://localhost:8080 (the app and the API are served from the same container).

### Option 2: Run locally without Docker

Requires Python 3.10+ and Node 18+.

Backend (terminal 1):

```bash
cd backend
python -m venv .venv
# Mac/Linux: source .venv/bin/activate
# Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Frontend (terminal 2):

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The dev server proxies `/api` to the backend on port 8000.

### Run the tests

```bash
cd backend
pytest
```

### Refresh the data (optional)

The data is already included in `backend/data/`. To re-download it from Elexon:

```bash
cd backend
python -m app.fetch_data
```

## Deployment

Deployed on Vercel. `vercel.json` builds the React app into static files and runs the FastAPI app as a Python function, with `/api/*` requests routed to it.