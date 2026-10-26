import { useEffect, useState } from 'react'
import { fetchDays, fetchForecast } from '../api'
import ForecastChart from '../components/ForecastChart'
import { formatDateTime, formatMW, formatTime } from '../format'
import { CUTOFF_OPTIONS, DEFAULT_CUTOFF_HOUR } from '../constants'

export default function ForecastPage() {
  const [cutoffHour, setCutoffHour] = useState(DEFAULT_CUTOFF_HOUR)
  const [days, setDays] = useState([])
  const [day, setDay] = useState('')
  const [data, setData] = useState(null)
  const [showActual, setShowActual] = useState(false)
  const [error, setError] = useState(null)

  // Load available delivery days whenever the cutoff changes
  useEffect(() => {
    fetchDays(cutoffHour)
      .then((result) => {
        setDays(result.days)
        setDay((current) => (result.days.includes(current) ? current : result.days[0]))
        setError(null)
      })
      .catch((err) => setError(err.message))
  }, [cutoffHour])

  // Load the forecast for the selected day
  useEffect(() => {
    if (!day) return
    fetchForecast(day, cutoffHour)
      .then((result) => {
        setData(result)
        setError(null)
      })
      .catch((err) => setError(err.message))
  }, [day, cutoffHour])

  const handleDayChange = (event) => {
    if (days.includes(event.target.value)) setDay(event.target.value)
  }

  let peak = null
  let low = null
  if (data) {
    peak = data.points.reduce((a, b) => (b.forecast > a.forecast ? b : a))
    low = data.points.reduce((a, b) => (b.forecast < a.forecast ? b : a))
  }

  return (
    <div>
      <div className="controls">
        <label>
          Delivery day
          <input
            type="date"
            value={day}
            min={days[0]}
            max={days[days.length - 1]}
            onChange={handleDayChange}
          />
        </label>
        <label>
          Decision cutoff (UK time, day before)
          <select value={cutoffHour} onChange={(e) => setCutoffHour(Number(e.target.value))}>
            {CUTOFF_OPTIONS.map((hour) => (
              <option key={hour} value={hour}>
                {String(hour).padStart(2, '0')}:00
              </option>
            ))}
          </select>
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={showActual}
            onChange={(e) => setShowActual(e.target.checked)}
          />
          Show actual generation
        </label>
      </div>

      {error && <p className="error">Error: {error}</p>}
      {!data && !error && <p>Loading...</p>}

      {data && (
        <>
          <div className="cards">
            <div className="card">
              <div className="card-label">Decision cutoff</div>
              <div className="card-value">{formatDateTime(data.decision_cutoff)}</div>
            </div>
            <div className="card">
              <div className="card-label">Peak forecast wind</div>
              <div className="card-value">{formatMW(peak.forecast)}</div>
              <div className="muted">at {formatTime(peak.time)}</div>
            </div>
            <div className="card">
              <div className="card-label">Lowest forecast wind</div>
              <div className="card-value">{formatMW(low.forecast)}</div>
              <div className="muted">at {formatTime(low.time)}</div>
            </div>
            {showActual && data.metrics.count > 0 && (
              <div className="card">
                <div className="card-label">Forecast error this day</div>
                <div className="card-value">MAE {formatMW(data.metrics.mae)}</div>
                <div className="muted">bias {formatMW(data.metrics.bias)}</div>
              </div>
            )}
          </div>

          <div className="panel">
            <ForecastChart points={data.points} showActual={showActual} />
            <p className="muted">
              Each point is the latest forecast published before the cutoff. Forecasts published
              later are excluded because they were not available when the decision was made.
            </p>
          </div>
        </>
      )}
    </div>
  )
}