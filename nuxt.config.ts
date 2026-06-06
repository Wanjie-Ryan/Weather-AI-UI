export default defineNuxtConfig({
  devtools: { enabled: true },

  app: {
    head: {
      title: "WeatherAI — Real-time Weather Intelligence",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1, minimum-scale=1, viewport-fit=cover" },
        {
          name: "description",
          content:
            "Real-time AI-powered weather dashboard with location detection and 7-day forecasts.",
        },
        { name: "theme-color", content: "#070c1b" },
      ],
      link: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossorigin: "",
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap",
        },
        {
          rel: "stylesheet",
          href: "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css",
        },
      ],
      script: [
        {
          src: "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js",
          defer: true,
        },
      ],
    },
  },

  runtimeConfig: {
    weatherApiKey: process.env.WEATHER_API_KEY,
    weatherApiBase: process.env.WEATHER_API_BASE || "https://api.weather-ai.co",
    public: {},
  },

  css: ["~/assets/css/main.css"],

  nitro: {
    preset: "netlify",
  },

  compatibilityDate: "2024-11-01",
});
