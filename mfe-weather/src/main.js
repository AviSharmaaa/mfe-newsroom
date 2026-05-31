import './weather.css'

// WMO weather interpretation codes -> emoji + human label.
const WEATHER_CODES = {
  0: ['☀️', 'Clear sky'],
  1: ['🌤️', 'Mainly clear'],
  2: ['⛅', 'Partly cloudy'],
  3: ['☁️', 'Overcast'],
  45: ['🌫️', 'Fog'],
  48: ['🌫️', 'Rime fog'],
  51: ['🌦️', 'Light drizzle'],
  53: ['🌦️', 'Drizzle'],
  55: ['🌧️', 'Dense drizzle'],
  61: ['🌦️', 'Light rain'],
  63: ['🌧️', 'Rain'],
  65: ['🌧️', 'Heavy rain'],
  71: ['🌨️', 'Light snow'],
  73: ['🌨️', 'Snow'],
  75: ['❄️', 'Heavy snow'],
  80: ['🌦️', 'Rain showers'],
  81: ['🌧️', 'Showers'],
  82: ['⛈️', 'Violent showers'],
  95: ['⛈️', 'Thunderstorm'],
  96: ['⛈️', 'Thunderstorm + hail'],
  99: ['⛈️', 'Severe thunderstorm'],
}

function describe(code) {
  return WEATHER_CODES[code] || ['🌡️', 'Code ' + code]
}

// The exported entry point. The Shell calls mount('weather-container').
export function mount(containerId) {
  const container = document.getElementById(containerId)
  if (!container) return

  container.innerHTML = `<div class="weather-card"><p class="weather-label">Loading weather…</p></div>`

  fetch(
    'https://api.open-meteo.com/v1/forecast?latitude=28.61&longitude=77.20&current_weather=true',
  )
    .then((r) => r.json())
    .then((data) => {
      const { temperature, windspeed, weathercode } = data.current_weather
      const [icon, label] = describe(weathercode)
      container.innerHTML = `
        <div class="weather-card">
          <div class="weather-icon">${icon}</div>
          <p class="weather-label">New Delhi</p>
          <p class="weather-temp">${temperature}<span class="weather-unit">°C</span></p>
          <p class="weather-desc">${label}</p>
          <div class="weather-meta">
            <span class="weather-wind">💨 ${windspeed} km/h</span>
            <span class="weather-code">WMO ${weathercode}</span>
          </div>
          <p class="weather-tag">Vanilla JS · Custom CSS</p>
        </div>
      `
    })
    .catch(() => {
      container.innerHTML = `<div class="weather-card weather-error"><div class="weather-icon">⚠️</div><p class="weather-label">Weather unavailable</p></div>`
    })
}
