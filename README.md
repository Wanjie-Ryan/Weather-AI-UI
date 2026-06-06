# WeatherAI Dashboard

Real-time AI-powered weather dashboard built with **Nuxt 3 + TypeScript**.

Auto-detects your location via IP, shows AI-generated summaries, hourly forecasts, 7-day outlook, and live API usage — all in a clean glassmorphism UI.

---

## Features

- Auto IP-based location detection
- Manual city search with OpenStreetMap geocoding
- AI-generated weather summaries (Gemini, via Weather-AI API)
- Current conditions: feels like, humidity, wind, UV index, visibility, pressure
- 24-hour hourly forecast strip
- 7-day daily forecast with temperature range bars
- Live clock & dynamic gradient background based on weather condition
- °C / °F toggle
- API usage meter
- Fully responsive

## Setup

1. Clone the repo
2. Create a `.env` file and add your Weather-AI API key:

```
WEATHER_API_KEY=wai_your_key_here
WEATHER_API_BASE=https://api.weather-ai.co
```

3. Install and run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Production build

```bash
npm run build
npm run preview
```

## Deploy

Works out of the box on **Render**, **Railway**, **Vercel**, or **Netlify**. Set the two environment variables in your platform's dashboard.

## Stack

- [Nuxt 3](https://nuxt.com) — SSR + server routes (API key stays server-side)
- TypeScript
- Bootstrap 5 (CDN)
- Custom CSS with glassmorphism design
- [Weather-AI API](https://weather-ai.co/docs)
- [Nominatim](https://nominatim.org) for geocoding (free, no key needed)
