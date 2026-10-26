async function getJson(url) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`)
  }
  return response.json()
}

export const fetchDays = (cutoffHour) =>
  getJson(`/api/days?cutoff_hour=${cutoffHour}`)

export const fetchForecast = (day, cutoffHour) =>
  getJson(`/api/forecast?day=${day}&cutoff_hour=${cutoffHour}`)

export const fetchMetrics = (cutoffHour) =>
  getJson(`/api/metrics?cutoff_hour=${cutoffHour}`)