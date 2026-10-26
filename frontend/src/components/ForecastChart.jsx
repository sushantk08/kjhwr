import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatDateTime, formatMW, formatTime } from '../format'

function ChartTooltip({ active, payload, showActual }) {
  if (!active || !payload || !payload.length) return null
  const point = payload[0].payload
  return (
    <div className="tooltip">
      <strong>{formatTime(point.time)} (UK time)</strong>
      <div>Forecast: {formatMW(point.forecast)}</div>
      {showActual && point.actual !== null && <div>Actual: {formatMW(point.actual)}</div>}
      <div className="muted">
        Published {formatDateTime(point.publish_time)} ({point.horizon_hours.toFixed(1)}h ahead)
      </div>
    </div>
  )
}

export default function ForecastChart({ points, showActual }) {
  return (
    <ResponsiveContainer width="100%" height={380}>
      <LineChart data={points} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e1e6ee" />
        <XAxis dataKey="time" tickFormatter={formatTime} minTickGap={30} />
        <YAxis
          domain={[0, 'auto']}
          tickFormatter={(value) => `${(value / 1000).toFixed(0)} GW`}
        />
        <Tooltip content={<ChartTooltip showActual={showActual} />} />
        <Legend />
        <Line
          type="monotone"
          dataKey="forecast"
          name="Forecast at decision time"
          stroke="#2563eb"
          strokeWidth={2}
          dot={false}
        />
        {showActual && (
          <Line
            type="monotone"
            dataKey="actual"
            name="Actual"
            stroke="#f97316"
            strokeWidth={2}
            dot={false}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  )
}