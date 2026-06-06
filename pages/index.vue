<script setup lang="ts">
import {
  getWeatherIcon,
  getWeatherLabel,
  getWindDirection,
  getWeatherBackground,
  getDayLabel,
  formatHourLabel,
  getUVLabel,
  getUVColor,
} from "~/utils/weather";

// ── Types ─────────────────────────────────────────────────────────
interface CurrentWeather {
  temp_c: number;
  feels_like_c: number;
  humidity: number;
  wind_kph: number;
  wind_degree: number;
  pressure_mb: number;
  vis_km: number;
  uv: number;
  weather_code: number;
  condition_text?: string;
}

interface DayForecast {
  date: string;
  max_temp: number;
  min_temp: number;
  weather_code: number;
  condition_text?: string;
  precipitation_prob: number;
}

interface HourForecast {
  time: string | number;
  temp: number;
  weather_code: number;
  precipitation_prob: number;
}

interface WeatherState {
  current: CurrentWeather;
  ai_summary?: string;
  forecast: DayForecast[];
  hourly?: HourForecast[];
}

// ── State ──────────────────────────────────────────────────────────
const loading = ref(true);
const searching = ref(false);
const fatalError = ref<string | null>(null);
const searchQuery = ref("");
const loadingMsg = ref("Detecting your location...");
const unit = ref<"C" | "F">("C");

const weather = ref<WeatherState | null>(null);
const daily = ref<DayForecast[]>([]);
const hourly = ref<HourForecast[]>([]);
const usage = ref<any>(null);

const cityName = ref("—");
const countryName = ref("");
const currentLat = ref(0);
const currentLon = ref(0);
const isDay = ref(true);
const updatedAt = ref<Date | null>(null);

const liveTime = ref("");
const toast = ref<{ msg: string; type: "error" | "success" } | null>(null);

let clockTick: ReturnType<typeof setInterval>;
let toastTimer: ReturnType<typeof setTimeout>;

// ── Computed ───────────────────────────────────────────────────────
const current = computed<CurrentWeather>(
  () =>
    weather.value?.current ?? {
      temp_c: 0,
      feels_like_c: 0,
      humidity: 0,
      wind_kph: 0,
      wind_degree: 0,
      pressure_mb: 0,
      vis_km: 0,
      uv: 0,
      weather_code: 0,
    },
);

const mainIcon = computed(() => getWeatherIcon(current.value.weather_code));

const conditionLabel = computed(() =>
  getWeatherLabel(current.value.weather_code, current.value.condition_text),
);

const aiSummary = computed(() => weather.value?.ai_summary);

const bg = computed(() =>
  getWeatherBackground(current.value.weather_code, isDay.value),
);

const dateLabel = computed(() =>
  new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }),
);

const dailyTempMin = computed(() =>
  daily.value.length ? Math.min(...daily.value.map((d) => d.min_temp)) : -10,
);
const dailyTempMax = computed(() =>
  daily.value.length ? Math.max(...daily.value.map((d) => d.max_temp)) : 40,
);

const usagePercent = computed(() => {
  if (!usage.value) return 0;
  const used  = usage.value.period?.requestCount ?? 0;
  const limit = usage.value.limits?.requests ?? 1000;
  return Math.min(100, Math.round((used / limit) * 100));
});

const usageRemaining = computed(() => {
  if (!usage.value) return 0;
  return usage.value.remaining?.requests ?? 0;
});

// ── Helpers 
function displayTemp(val: number | undefined): number {
  const t = val ?? 0;
  return unit.value === "F" ? Math.round((t * 9) / 5 + 32) : Math.round(t);
}

function toggleUnit() {
  unit.value = unit.value === "C" ? "F" : "C";
}

function tempBarStyle(min: number, max: number): Record<string, string> {
  const range = dailyTempMax.value - dailyTempMin.value || 1;
  const left = Math.max(0, ((min - dailyTempMin.value) / range) * 100);
  const width = Math.max(6, Math.min(100 - left, ((max - min) / range) * 100));
  return { left: `${left}%`, width: `${width}%` };
}

function relativeTime(d: Date): string {
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

function showToast(msg: string, type: "error" | "success" = "error") {
  clearTimeout(toastTimer);
  toast.value = { msg, type };
  toastTimer = setTimeout(() => {
    toast.value = null;
  }, 4000);
}

function tickClock() {
  liveTime.value = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  isDay.value = new Date().getHours() >= 6 && new Date().getHours() < 20;
}

// ── Data normalizers 
function normalizeCurrentWeather(raw: any): CurrentWeather {
  const c = raw?.current ?? raw;
  return {
    temp_c: c.temp_c ?? c.temperature ?? c.temp ?? 0,
    feels_like_c:
      c.feelslike_c ??
      c.feels_like ??
      c.apparent_temperature ??
      c.feelslike ??
      0,
    humidity: c.humidity ?? c.relative_humidity_2m ?? 0,
    wind_kph: c.wind_kph ?? c.windspeed ?? c.wind_speed ?? 0,
    wind_degree: c.wind_degree ?? c.winddirection ?? c.wind_direction ?? 0,
    pressure_mb: c.pressure_mb ?? c.pressure ?? c.surface_pressure ?? 1013,
    vis_km: c.vis_km ?? c.visibility ?? 10,
    uv: c.uv ?? c.uv_index ?? 0,
    weather_code:
      c.condition?.code ?? c.weathercode ?? c.weather_code ?? c.code ?? 0,
    condition_text: c.condition?.text ?? c.condition ?? c.description,
  };
}

function normalizeForecast(raw: any): DayForecast[] {
  const list = raw?.forecast?.forecastday ?? raw?.forecast ?? raw?.daily ?? [];

  // Open-Meteo array style
  if (raw?.daily?.time) {
    const d = raw.daily;
    return (d.time as string[]).map((t: string, i: number) => ({
      date: t,
      max_temp: d.temperature_2m_max?.[i] ?? 0,
      min_temp: d.temperature_2m_min?.[i] ?? 0,
      weather_code: d.weathercode?.[i] ?? 0,
      precipitation_prob: d.precipitation_probability_max?.[i] ?? 0,
    }));
  }

  return list.slice(0, 7).map((d: any) => ({
    date: d.date ?? d.dt ?? "",
    max_temp:
      d.day?.maxtemp_c ?? d.max_temp ?? d.temp_max ?? d.temperatureMax ?? 0,
    min_temp:
      d.day?.mintemp_c ?? d.min_temp ?? d.temp_min ?? d.temperatureMin ?? 0,
    weather_code:
      d.day?.condition?.code ?? d.weather_code ?? d.weathercode ?? 0,
    condition_text: d.day?.condition?.text ?? d.condition_text,
    precipitation_prob:
      d.day?.daily_chance_of_rain ??
      d.precipitation_probability_max ??
      d.precipitation_prob ??
      0,
  }));
}

function normalizeHourly(raw: any): HourForecast[] {
  // Open-Meteo array style (separate hourly call)
  if (raw?.hourly?.time) {
    const h = raw.hourly;
    return (h.time as string[]).map((t: string, i: number) => ({
      time: t,
      temp: h.temperature_2m?.[i] ?? 0,
      weather_code: h.weathercode?.[i] ?? 0,
      precipitation_prob: h.precipitation_probability?.[i] ?? 0,
    }));
  }

 
  if (raw?.forecast?.forecastday?.[0]?.hour) {
    return raw.forecast.forecastday.flatMap((fd: any) =>
      fd.hour.map((h: any) => ({
        time: h.time,
        temp: h.temp_c ?? 0,
        weather_code: h.condition?.code ?? 0,
        precipitation_prob: h.chance_of_rain ?? 0,
      })),
    );
  }

  // flat array style
  if (Array.isArray(raw?.hourly)) {
    return raw.hourly.map((h: any) => ({
      time: h.time ?? h.dt ?? "",
      temp: h.temp_c ?? h.temp ?? h.temperature ?? 0,
      weather_code: h.condition?.code ?? h.weathercode ?? h.weather_code ?? 0,
      precipitation_prob: h.chance_of_rain ?? h.precipitation_probability ?? 0,
    }));
  }

  return [];
}

function filterFutureHours(items: HourForecast[]): HourForecast[] {
  const now = Date.now();
  const future = items.filter((h) => {
    const t =
      typeof h.time === "number" ? h.time * 1000 : new Date(h.time).getTime();
    return t >= now - 3600_000;
  });
  return future.length ? future : items;
}

// ── API calls 
async function autoDetect() {
  loading.value = true;
  fatalError.value = null;
  loadingMsg.value = "Detecting your location...";

  try {
    const res = await $fetch<any>("/api/weather-geo");

    const raw = res.data ?? res;
    const geo = res.geo ?? {};

    cityName.value = geo.city ?? raw?.location?.name ?? "Your Location";
    countryName.value = geo.country ?? raw?.location?.country ?? "";
    currentLat.value = raw?.location?.lat ?? 0;
    currentLon.value = raw?.location?.lon ?? 0;

    applyWeatherData(raw);

    // Fetch hourly separately if not embedded
    if (!hourly.value.length)
      await fetchHourly(currentLat.value, currentLon.value);

    updatedAt.value = new Date();
  } catch (e: any) {
    fatalError.value =
      e?.data?.message ??
      e?.message ??
      "Could not detect location. Please search for a city.";
  } finally {
    loading.value = false;
  }
}

async function handleSearch() {
  const q = searchQuery.value.trim();
  if (!q) return;

  searching.value = true;
  fatalError.value = null;

  try {
    const geo = await $fetch<any[]>(`/api/geocode?q=${encodeURIComponent(q)}`);

    if (!geo?.length) {
      showToast("Location not found. Try a different search term.");
      return;
    }

    const { lat, lon, display_name, address } = geo[0];
    currentLat.value = parseFloat(lat);
    currentLon.value = parseFloat(lon);

    cityName.value =
      address?.city ??
      address?.town ??
      address?.village ??
      address?.county ??
      q;
    countryName.value = address?.country ?? "";

    loadingMsg.value = `Loading weather for ${cityName.value}...`;
    loading.value = true;

    const raw = await $fetch<any>(`/api/weather?lat=${lat}&lon=${lon}`);
    applyWeatherData(raw);
    await fetchHourly(parseFloat(lat), parseFloat(lon));

    updatedAt.value = new Date();
    searchQuery.value = "";
    showToast(`Showing weather for ${cityName.value}`, "success");
  } catch (e: any) {
    showToast(
      e?.data?.message ?? e?.message ?? "Search failed. Please try again.",
    );
  } finally {
    loading.value = false;
    searching.value = false;
  }
}

async function fetchHourly(lat: number, lon: number) {
  try {
    const raw = await $fetch<any>(`/api/hourly?lat=${lat}&lon=${lon}`);
    const items = normalizeHourly(raw);
    hourly.value = filterFutureHours(items).slice(0, 24);
  } catch {
    // non-fatal — hourly is supplementary
  }
}

async function fetchUsage() {
  try {
    usage.value = await $fetch<any>("/api/usage");
  } catch {
    // non-fatals
  }
}

function applyWeatherData(raw: any) {
  weather.value = {
    current: normalizeCurrentWeather(raw),
    ai_summary: raw?.ai_summary ?? raw?.summary ?? raw?.ai?.summary,
    forecast: normalizeForecast(raw),
  };

  daily.value = weather.value.forecast;
  hourly.value = filterFutureHours(normalizeHourly(raw)).slice(0, 24);

  isDay.value = new Date().getHours() >= 6 && new Date().getHours() < 20;
}

// ── Lifecycle 
onMounted(async () => {
  tickClock();
  clockTick = setInterval(tickClock, 1000);

  await Promise.all([autoDetect(), fetchUsage()]);
});

onUnmounted(() => {
  clearInterval(clockTick);
  clearTimeout(toastTimer);
});
</script>



<template>
  <div class="weather-app">
    <!-- Dynamic gradient background -->
    <div
      class="weather-bg"
      :style="{
        background: `linear-gradient(160deg, ${bg.from} 0%, ${bg.via} 55%, ${bg.to} 100%)`,
      }"
    ></div>

    <div class="app-content">
      <!-- ── Navigation ── -->
      <nav class="top-nav">
        <div class="nav-brand">
          <div class="nav-brand-icon">⛅</div>
          <span class="nav-brand-name">Weather<em>AI</em></span>
        </div>

        <form class="search-form" @submit.prevent="handleSearch">
          <div class="search-wrap">
            <span class="s-icon">🔍</span>
            <input
              v-model="searchQuery"
              class="search-input"
              type="text"
              placeholder="Search any city or location..."
              autocomplete="off"
              :disabled="loading || searching"
            />
          </div>
          <button
            class="btn-search"
            type="submit"
            :disabled="loading || searching || !searchQuery.trim()"
          >
            {{ searching ? "..." : "Search" }}
          </button>
          <button
            class="btn-locate"
            type="button"
            :disabled="loading"
            @click="autoDetect"
          >
            📍 Locate Me
          </button>
        </form>
      </nav>

      <!-- ── Loading ── -->
      <div v-if="loading" class="loading-screen">
        <div class="spinner"></div>
        <p class="loading-label">{{ loadingMsg }}</p>
      </div>

      <!-- ── Error (no data yet) ── -->
      <div v-else-if="fatalError" class="error-wrap">
        <div class="error-card">
          <span class="error-emoji">⚠️</span>
          <h2 class="error-title">Something went wrong</h2>
          <p class="error-msg">{{ fatalError }}</p>
          <button class="btn-retry" @click="autoDetect">Try Again</button>
        </div>
      </div>

      <!-- ── Dashboard ── -->
      <template v-else-if="weather">
        <!-- Hero -->
        <section class="hero">
          <div class="hero-left">
            <div class="location-block">
              <h1 class="location-name">{{ cityName }}</h1>
              <p class="location-sub" v-if="countryName">{{ countryName }}</p>
            </div>

            <div class="clock-block">
              <p class="clock-date">{{ dateLabel }}</p>
              <p class="clock-time">{{ liveTime }}</p>
            </div>

            <div class="ai-card" v-if="aiSummary">
              <div class="ai-badge">✦ AI Summary</div>
              <p class="ai-text">{{ aiSummary }}</p>
            </div>
          </div>

          <div class="hero-temp-card gc">
            <span class="weather-emoji">{{ mainIcon }}</span>
            <div class="temp-display">
              <span class="temp-value">{{ displayTemp(current.temp_c) }}</span>
              <button class="unit-btn" type="button" @click="toggleUnit">
                °{{ unit }}
              </button>
            </div>
            <p class="condition-text">{{ conditionLabel }}</p>
            <p class="updated-text" v-if="updatedAt">
              Updated {{ relativeTime(updatedAt) }}
            </p>
          </div>
        </section>

        <!-- Current Conditions -->
        <section class="stats-section">
          <p class="section-label">Current Conditions</p>
          <div class="stats-grid">
            <div class="stat-card gc">
              <span class="stat-icon">🌡️</span>
              <p class="stat-label">Feels Like</p>
              <p class="stat-value">{{ displayTemp(current.feels_like_c) }}°</p>
              <p class="stat-sub">
                {{ unit === "C" ? "Celsius" : "Fahrenheit" }}
              </p>
            </div>

            <div class="stat-card gc">
              <span class="stat-icon">💧</span>
              <p class="stat-label">Humidity</p>
              <p class="stat-value">{{ current.humidity ?? "—" }}%</p>
              <p class="stat-sub">Relative</p>
            </div>

            <div class="stat-card gc">
              <span class="stat-icon">💨</span>
              <p class="stat-label">Wind</p>
              <p class="stat-value">{{ current.wind_kph ?? "—" }}</p>
              <p class="stat-sub">
                {{ getWindDirection(current.wind_degree) }} · km/h
              </p>
            </div>

            <div class="stat-card gc">
              <span class="stat-icon">🔆</span>
              <p class="stat-label">UV Index</p>
              <p class="stat-value" :style="{ color: getUVColor(current.uv) }">
                {{ current.uv ?? "—" }}
              </p>
              <p class="stat-sub">{{ getUVLabel(current.uv) }}</p>
            </div>

            <div class="stat-card gc">
              <span class="stat-icon">👁️</span>
              <p class="stat-label">Visibility</p>
              <p class="stat-value">{{ current.vis_km ?? "—" }}</p>
              <p class="stat-sub">kilometres</p>
            </div>

            <div class="stat-card gc">
              <span class="stat-icon">🌀</span>
              <p class="stat-label">Pressure</p>
              <p class="stat-value">{{ current.pressure_mb ?? "—" }}</p>
              <p class="stat-sub">hPa</p>
            </div>
          </div>
        </section>

        <!-- Hourly Forecast -->
        <section class="hourly-section" v-if="hourly.length">
          <p class="section-label">Hourly Forecast</p>
          <div class="hourly-scroll">
            <div class="hourly-strip">
              <div
                v-for="(h, i) in hourly.slice(0, 24)"
                :key="i"
                class="hour-card gc"
                :class="{ now: i === 0 }"
              >
                <p class="hour-time">{{ formatHourLabel(h.time, i === 0) }}</p>
                <span class="hour-emoji">{{
                  getWeatherIcon(h.weather_code)
                }}</span>
                <p class="hour-temp">{{ displayTemp(h.temp) }}°</p>
                <p class="hour-rain" v-if="(h.precipitation_prob ?? 0) > 0">
                  💧 {{ h.precipitation_prob }}%
                </p>
              </div>
            </div>
          </div>
        </section>

        <!-- 7-Day Forecast -->
        <section class="daily-section" v-if="daily.length">
          <p class="section-label">7-Day Forecast</p>
          <div class="daily-list">
            <div
              v-for="(day, i) in daily.slice(0, 7)"
              :key="i"
              class="day-row gc"
              :class="{ today: i === 0 }"
            >
              <p class="day-name">{{ getDayLabel(day.date, i) }}</p>
              <span class="day-emoji">{{
                getWeatherIcon(day.weather_code)
              }}</span>
              <p class="day-condition">
                {{ getWeatherLabel(day.weather_code, day.condition_text) }}
              </p>
              <p class="day-rain" v-if="(day.precipitation_prob ?? 0) > 0">
                💧 {{ day.precipitation_prob }}%
              </p>
              <p class="day-rain" v-else></p>
              <div class="temp-range">
                <span class="t-min">{{ displayTemp(day.min_temp) }}°</span>
                <div class="t-bar-track">
                  <div
                    class="t-bar-fill"
                    :style="tempBarStyle(day.min_temp, day.max_temp)"
                  ></div>
                </div>
                <span class="t-max">{{ displayTemp(day.max_temp) }}°</span>
              </div>
            </div>
          </div>
        </section>

        <!-- API Usage -->
        <section class="usage-section" v-if="usage">
          <div class="usage-card gc">
            <div class="usage-header">
              <p class="section-label" style="margin-bottom: 0">API Usage</p>
              <span class="plan-badge">{{ usage.plan ?? "Free" }} Plan</span>
            </div>
            <div class="usage-track">
              <div
                class="usage-fill"
                :style="{ width: usagePercent + '%' }"
              ></div>
            </div>
            <div class="usage-meta">
              <span class="usage-stat"
                ><strong>{{ usage.period?.requestCount ?? 0 }}</strong>
                requests used</span
              >
              <span class="usage-stat"
                ><strong>{{ usagePercent }}%</strong> of monthly quota</span
              >
              <span class="usage-stat"
                ><strong>{{ usageRemaining }}</strong> remaining</span
              >
            </div>
          </div>
        </section>
      </template>
    </div>

    <!-- Toast notification -->
    <div class="toast-wrap" v-if="toast">
      <div class="toast" :class="toast.type">
        <span>{{ toast.type === "error" ? "⚠️" : "✓" }}</span>
        <span>{{ toast.msg }}</span>
      </div>
    </div>
  </div>
</template>

