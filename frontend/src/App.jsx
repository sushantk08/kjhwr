import { useState } from 'react'
import ForecastPage from './pages/ForecastPage'

export default function App() {
  const [tab, setTab] = useState('forecast')

  return (
    <div className="container">
      <h1>Wind Forecast Portal</h1>
      <p className="muted">
        UK national wind generation, Elexon data, January 2026 day-ahead decisions
      </p>

      <div className="tabs">
        <button className={tab === 'forecast' ? 'active' : ''} onClick={() => setTab('forecast')}>
          Forecast
        </button>
        <button className={tab === 'accuracy' ? 'active' : ''} onClick={() => setTab('accuracy')}>
          Accuracy
        </button>
      </div>

      {tab === 'forecast' && <ForecastPage />}
      {tab === 'accuracy' && <p>Accuracy view coming in the next step.</p>}
    </div>
  )
}