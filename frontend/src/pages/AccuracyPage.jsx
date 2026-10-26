import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { fetchMetrics } from '../api'
import { CUTOFF_OPTIONS, DEFAULT_CUTOFF_HOUR } from '../constants'
import { formatMW } from '../format'

const shortDay = (day) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })

const gwTick = (value) => `${(value / 1000).toFixed(1)} GW`
const mwTooltip = (value) => formatMW(value)

export default function AccuracyPage() {
  const [cutoffHour, setCutoffHour] = useState(DEFAULT_CUTOFF_HOUR)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchMetrics(cutoffHour)
      .then((result) => {
        setData(result)
        setError(null)
      })
      .catch((err) => setError(err.message))
  }, [cutoffHour])

  const overall = data?.overall
  const biasWord = overall && overall.bias > 0 ? 'over-forecast' : 'under-forecast'

  return (
    <div>
      <div className="controls">
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
      </div>

      {error && <p className="error">Error: {error}</p>}
      {!data && !error && <p>Loading...</p>}

      {data && (
        <>
          <div className="cards">
            <div className="card">
              <div className="card-label">MAE (average miss)</div>
              <div className="card-value">{formatMW(overall.mae)}</div>
              <div className="muted">typical size of the error</div>
            </div>
            <div className="card">
              <div className="card-label">RMSE</div>
              <div className="card-value">{formatMW(overall.rmse)}</div>
              <div className="muted">penalises large misses</div>
            </div>
            <div className="card">
              <div className="card-label">Bias</div>
              <div className="card-value">{formatMW(overall.bias)}</div>
              <div className="muted">forecast minus actual</div>
            </div>
            <div className="card">
              <div className="card-label">Hours compared</div>
              <div className="card-value">{overall.count}</div>
              <div className="muted">forecast vs actual</div>
            </div>
          </div>

          <div className="panel note">
            <strong>How to read this.</strong> Over January 2026, the forecast available at the
            decision cutoff was off by {formatMW(overall.mae)} on average. A positive bias means it{' '}
            {biasWord}ed wind by {formatMW(Math.abs(overall.bias))} on average, so a buyer who
            trusted it blindly would have {overall.bias > 0 ? 'under-bought' : 'over-bought'}{' '}
            other power by about that amount. This is historical accuracy for this one month and
            does not guarantee future performance.
          </div>

          <h2>Error by delivery day</h2>
          <div className="panel">
            <ResponsiveContainer width="100%" height={340}>
              <LineChart data={data.by_day} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e1e6ee" />
                <XAxis dataKey="day" tickFormatter={shortDay} minTickGap={20} />
                <YAxis tickFormatter={gwTick} />
                <Tooltip formatter={mwTooltip} labelFormatter={shortDay} />
                <Legend />
                <ReferenceLine y={0} stroke="#6b778c" />
                <Line type="monotone" dataKey="mae" name="MAE" stroke="#2563eb" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="rmse" name="RMSE" stroke="#7c3aed" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="bias" name="Bias" stroke="#f97316" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <h2>Error by forecast horizon</h2>
          <p className="muted">
            Horizon = hours between when the forecast was published and the delivery hour.
          </p>
          <div className="panel">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.by_horizon} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e1e6ee" />
                <XAxis dataKey="horizon" />
                <YAxis tickFormatter={gwTick} />
                <Tooltip formatter={mwTooltip} />
                <Legend />
                <Bar dataKey="mae" name="MAE" fill="#2563eb" />
                <Bar dataKey="rmse" name="RMSE" fill="#7c3aed" />
                <Bar dataKey="bias" name="Bias" fill="#f97316" />
              </BarChart>
            </ResponsiveContainer>

            <table>
              <thead>
                <tr>
                  <th>Horizon</th>
                  <th>Hours</th>
                  <th>MAE</th>
                  <th>RMSE</th>
                  <th>Bias</th>
                </tr>
              </thead>
              <tbody>
                {data.by_horizon.map((row) => (
                  <tr key={row.horizon}>
                    <td>{row.horizon}</td>
                    <td>{row.count}</td>
                    <td>{formatMW(row.mae)}</td>
                    <td>{formatMW(row.rmse)}</td>
                    <td>{formatMW(row.bias)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}