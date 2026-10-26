const timeFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/London',
  hour: '2-digit',
  minute: '2-digit',
})

const dateTimeFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/London',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

export const formatTime = (iso) => timeFormat.format(new Date(iso))
export const formatDateTime = (iso) => dateTimeFormat.format(new Date(iso))
export const formatMW = (value) => `${Math.round(value).toLocaleString('en-GB')} MW`