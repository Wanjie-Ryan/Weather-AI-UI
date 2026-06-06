// WMO weather interpretation codes
export function getWeatherIcon(code: number | string | undefined): string {
  const c = Number(code ?? 0)
  if (c === 0) return '☀️'
  if (c === 1) return '🌤️'
  if (c === 2) return '⛅'
  if (c === 3) return '☁️'
  if (c >= 45 && c <= 48) return '🌫️'
  if (c >= 51 && c <= 57) return '🌦️'
  if (c >= 61 && c <= 65) return '🌧️'
  if (c === 66 || c === 67) return '🌨️'
  if (c >= 71 && c <= 77) return '❄️'
  if (c >= 80 && c <= 82) return '🌦️'
  if (c === 85 || c === 86) return '🌨️'
  if (c >= 95 && c <= 99) return '⛈️'
  // WeatherAPI.com style codes (1000-series)
  if (c === 1000) return '☀️'
  if (c === 1003) return '⛅'
  if (c === 1006 || c === 1009) return '☁️'
  if (c >= 1030 && c <= 1035) return '🌫️'
  if (c >= 1063 && c <= 1069) return '🌦️'
  if (c >= 1072 && c <= 1087) return '🌨️'
  if (c >= 1114 && c <= 1135) return '❄️'
  if (c >= 1150 && c <= 1201) return '🌧️'
  if (c >= 1204 && c <= 1237) return '🌨️'
  if (c >= 1240 && c <= 1264) return '🌦️'
  if (c >= 1273 && c <= 1282) return '⛈️'
  return '🌡️'
}

// WMO codes → readable label
export function getWeatherLabel(code: number | string | undefined, conditionText?: string): string {
  if (conditionText) return conditionText
  const c = Number(code ?? 0)
  if (c === 0) return 'Clear Sky'
  if (c === 1) return 'Mainly Clear'
  if (c === 2) return 'Partly Cloudy'
  if (c === 3) return 'Overcast'
  if (c >= 45 && c <= 48) return 'Foggy'
  if (c >= 51 && c <= 53) return 'Light Drizzle'
  if (c >= 55 && c <= 57) return 'Heavy Drizzle'
  if (c >= 61 && c <= 63) return 'Light Rain'
  if (c >= 65 && c <= 67) return 'Heavy Rain'
  if (c >= 71 && c <= 73) return 'Light Snow'
  if (c >= 75 && c <= 77) return 'Heavy Snow'
  if (c >= 80 && c <= 82) return 'Rain Showers'
  if (c >= 85 && c <= 86) return 'Snow Showers'
  if (c >= 95 && c <= 99) return 'Thunderstorm'
  // WeatherAPI codes fallback
  if (c === 1000) return 'Clear Sky'
  if (c === 1003) return 'Partly Cloudy'
  if (c === 1006) return 'Cloudy'
  if (c === 1009) return 'Overcast'
  return 'Unknown'
}

export function getWindDirection(degrees: number | undefined): string {
  if (degrees === undefined || degrees === null) return '—'
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  return dirs[Math.round((degrees % 360) / 22.5) % 16]
}

export function getWeatherBackground(code: number | string | undefined, isDay: boolean): { from: string; via: string; to: string } {
  const c = Number(code ?? 0)
  if (!isDay) return { from: '#020409', via: '#070d1e', to: '#04080f' }
  if (c === 0) return { from: '#0a1f3d', via: '#113357', to: '#0a1f3d' }
  if (c <= 2) return { from: '#0f2744', via: '#1a3d6b', to: '#0f2744' }
  if (c === 3) return { from: '#181e30', via: '#232c45', to: '#181e30' }
  if (c >= 45 && c <= 48) return { from: '#1a1a2a', via: '#252535', to: '#1a1a2a' }
  if (c >= 51 && c <= 67) return { from: '#0c1824', via: '#132234', to: '#0c1824' }
  if (c >= 71 && c <= 77) return { from: '#0f1630', via: '#152040', to: '#0f1630' }
  if (c >= 95) return { from: '#080810', via: '#0f0f1e', to: '#080810' }
  // WeatherAPI codes
  if (c === 1000) return { from: '#0a1f3d', via: '#113357', to: '#0a1f3d' }
  if (c === 1003) return { from: '#0f2744', via: '#1a3d6b', to: '#0f2744' }
  return { from: '#0c1824', via: '#132234', to: '#0c1824' }
}

export function getDayLabel(dateStr: string | number, index: number): string {
  if (index === 0) return 'Today'
  if (index === 1) return 'Tomorrow'
  const date = new Date(typeof dateStr === 'number' ? dateStr * 1000 : dateStr)
  return date.toLocaleDateString('en-US', { weekday: 'long' })
}

export function getDayShort(dateStr: string | number): string {
  const date = new Date(typeof dateStr === 'number' ? dateStr * 1000 : dateStr)
  return date.toLocaleDateString('en-US', { weekday: 'short' })
}

export function formatHourLabel(timeStr: string | number, isFirst: boolean): string {
  if (isFirst) return 'Now'
  const d = new Date(typeof timeStr === 'number' ? timeStr * 1000 : timeStr)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })
}

export function getUVLabel(uv: number | undefined): string {
  const u = uv ?? 0
  if (u <= 2) return 'Low'
  if (u <= 5) return 'Moderate'
  if (u <= 7) return 'High'
  if (u <= 10) return 'Very High'
  return 'Extreme'
}

export function getUVColor(uv: number | undefined): string {
  const u = uv ?? 0
  if (u <= 2) return '#4ade80'
  if (u <= 5) return '#facc15'
  if (u <= 7) return '#fb923c'
  if (u <= 10) return '#f87171'
  return '#c084fc'
}
