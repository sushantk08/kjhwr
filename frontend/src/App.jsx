import { useEffect, useState } from 'react'

export default function App() {
  const [days, setDays] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/days')
      .then((response) => response.json())
      .then((data) => setDays(data.days))
      .catch((err) => setError(err.message))
  }, [])

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1>Wind Forecast Portal</h1>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {!days && !error && <p>Loading...</p>}
      {days && (
        <p>
          Backend connected. {days.length} delivery days available ({days[0]} to{' '}
          {days[days.length - 1]}).
        </p>
      )}
    </div>
  )
}