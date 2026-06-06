import { defineComponent, ref, computed, watch, nextTick, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderStyle, ssrRenderAttr, ssrIncludeBooleanAttr, ssrInterpolate, ssrRenderList, ssrRenderClass } from 'vue/server-renderer';

function getWeatherIcon(code) {
  const c = Number(code != null ? code : 0);
  if (c === 0) return "\u2600\uFE0F";
  if (c === 1) return "\u{1F324}\uFE0F";
  if (c === 2) return "\u26C5";
  if (c === 3) return "\u2601\uFE0F";
  if (c >= 45 && c <= 48) return "\u{1F32B}\uFE0F";
  if (c >= 51 && c <= 57) return "\u{1F326}\uFE0F";
  if (c >= 61 && c <= 65) return "\u{1F327}\uFE0F";
  if (c === 66 || c === 67) return "\u{1F328}\uFE0F";
  if (c >= 71 && c <= 77) return "\u2744\uFE0F";
  if (c >= 80 && c <= 82) return "\u{1F326}\uFE0F";
  if (c === 85 || c === 86) return "\u{1F328}\uFE0F";
  if (c >= 95 && c <= 99) return "\u26C8\uFE0F";
  if (c === 1e3) return "\u2600\uFE0F";
  if (c === 1003) return "\u26C5";
  if (c === 1006 || c === 1009) return "\u2601\uFE0F";
  if (c >= 1030 && c <= 1035) return "\u{1F32B}\uFE0F";
  if (c >= 1063 && c <= 1069) return "\u{1F326}\uFE0F";
  if (c >= 1072 && c <= 1087) return "\u{1F328}\uFE0F";
  if (c >= 1114 && c <= 1135) return "\u2744\uFE0F";
  if (c >= 1150 && c <= 1201) return "\u{1F327}\uFE0F";
  if (c >= 1204 && c <= 1237) return "\u{1F328}\uFE0F";
  if (c >= 1240 && c <= 1264) return "\u{1F326}\uFE0F";
  if (c >= 1273 && c <= 1282) return "\u26C8\uFE0F";
  return "\u{1F321}\uFE0F";
}
function getWeatherLabel(code, conditionText) {
  if (conditionText) return conditionText;
  const c = Number(code != null ? code : 0);
  if (c === 0) return "Clear Sky";
  if (c === 1) return "Mainly Clear";
  if (c === 2) return "Partly Cloudy";
  if (c === 3) return "Overcast";
  if (c >= 45 && c <= 48) return "Foggy";
  if (c >= 51 && c <= 53) return "Light Drizzle";
  if (c >= 55 && c <= 57) return "Heavy Drizzle";
  if (c >= 61 && c <= 63) return "Light Rain";
  if (c >= 65 && c <= 67) return "Heavy Rain";
  if (c >= 71 && c <= 73) return "Light Snow";
  if (c >= 75 && c <= 77) return "Heavy Snow";
  if (c >= 80 && c <= 82) return "Rain Showers";
  if (c >= 85 && c <= 86) return "Snow Showers";
  if (c >= 95 && c <= 99) return "Thunderstorm";
  if (c === 1e3) return "Clear Sky";
  if (c === 1003) return "Partly Cloudy";
  if (c === 1006) return "Cloudy";
  if (c === 1009) return "Overcast";
  return "Unknown";
}
function getWindDirection(degrees) {
  if (degrees === void 0 || degrees === null) return "\u2014";
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return dirs[Math.round(degrees % 360 / 22.5) % 16];
}
function getWeatherBackground(code, isDay) {
  const c = Number(code != null ? code : 0);
  if (!isDay) return { from: "#020409", via: "#070d1e", to: "#04080f" };
  if (c === 0) return { from: "#0a1f3d", via: "#113357", to: "#0a1f3d" };
  if (c <= 2) return { from: "#0f2744", via: "#1a3d6b", to: "#0f2744" };
  if (c === 3) return { from: "#181e30", via: "#232c45", to: "#181e30" };
  if (c >= 45 && c <= 48) return { from: "#1a1a2a", via: "#252535", to: "#1a1a2a" };
  if (c >= 51 && c <= 67) return { from: "#0c1824", via: "#132234", to: "#0c1824" };
  if (c >= 71 && c <= 77) return { from: "#0f1630", via: "#152040", to: "#0f1630" };
  if (c >= 95) return { from: "#080810", via: "#0f0f1e", to: "#080810" };
  if (c === 1e3) return { from: "#0a1f3d", via: "#113357", to: "#0a1f3d" };
  if (c === 1003) return { from: "#0f2744", via: "#1a3d6b", to: "#0f2744" };
  return { from: "#0c1824", via: "#132234", to: "#0c1824" };
}
function getDayLabel(dateStr, index) {
  if (index === 0) return "Today";
  if (index === 1) return "Tomorrow";
  const date = new Date(typeof dateStr === "number" ? dateStr * 1e3 : dateStr);
  return date.toLocaleDateString("en-US", { weekday: "long" });
}
function formatHourLabel(timeStr, isFirst) {
  if (isFirst) return "Now";
  const d = new Date(typeof timeStr === "number" ? timeStr * 1e3 : timeStr);
  return d.toLocaleTimeString("en-US", { hour: "numeric", hour12: true });
}
function getUVLabel(uv) {
  const u = uv != null ? uv : 0;
  if (u <= 2) return "Low";
  if (u <= 5) return "Moderate";
  if (u <= 7) return "High";
  if (u <= 10) return "Very High";
  return "Extreme";
}
function getUVColor(uv) {
  const u = uv != null ? uv : 0;
  if (u <= 2) return "#4ade80";
  if (u <= 5) return "#facc15";
  if (u <= 7) return "#fb923c";
  if (u <= 10) return "#f87171";
  return "#c084fc";
}
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const loading = ref(true);
    const searching = ref(false);
    const fatalError = ref(null);
    const searchQuery = ref("");
    const loadingMsg = ref("Detecting your location...");
    const unit = ref("C");
    const weather = ref(null);
    const daily = ref([]);
    const hourly = ref([]);
    const usage = ref(null);
    const cityName = ref("\u2014");
    const countryName = ref("");
    ref(0);
    ref(0);
    const isDay = ref(true);
    const updatedAt = ref(null);
    const liveTime = ref("");
    const toast = ref(null);
    ref(null);
    ref(null);
    const current = computed(
      () => {
        var _a, _b;
        return (_b = (_a = weather.value) == null ? void 0 : _a.current) != null ? _b : {
          temp_c: 0,
          feels_like_c: 0,
          humidity: 0,
          wind_kph: 0,
          wind_degree: 0,
          pressure_mb: 0,
          vis_km: 0,
          uv: 0,
          weather_code: 0
        };
      }
    );
    const mainIcon = computed(() => getWeatherIcon(current.value.weather_code));
    const conditionLabel = computed(
      () => getWeatherLabel(current.value.weather_code, current.value.condition_text)
    );
    const aiSummary = computed(() => {
      var _a;
      return (_a = weather.value) == null ? void 0 : _a.ai_summary;
    });
    const bg = computed(
      () => getWeatherBackground(current.value.weather_code, isDay.value)
    );
    const dateLabel = computed(
      () => (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      })
    );
    const dailyTempMin = computed(
      () => daily.value.length ? Math.min(...daily.value.map((d) => d.min_temp)) : -10
    );
    const dailyTempMax = computed(
      () => daily.value.length ? Math.max(...daily.value.map((d) => d.max_temp)) : 40
    );
    const usagePercent = computed(() => {
      var _a, _b, _c, _d;
      if (!usage.value) return 0;
      const used = (_b = (_a = usage.value.period) == null ? void 0 : _a.requestCount) != null ? _b : 0;
      const limit = (_d = (_c = usage.value.limits) == null ? void 0 : _c.requests) != null ? _d : 1e3;
      return Math.min(100, Math.round(used / limit * 100));
    });
    const usageRemaining = computed(() => {
      var _a, _b;
      if (!usage.value) return 0;
      return (_b = (_a = usage.value.remaining) == null ? void 0 : _a.requests) != null ? _b : 0;
    });
    function displayTemp(val) {
      const t = val != null ? val : 0;
      return unit.value === "F" ? Math.round(t * 9 / 5 + 32) : Math.round(t);
    }
    function tempBarStyle(min, max) {
      const range = dailyTempMax.value - dailyTempMin.value || 1;
      const left = Math.max(0, (min - dailyTempMin.value) / range * 100);
      const width = Math.max(6, Math.min(100 - left, (max - min) / range * 100));
      return { left: `${left}%`, width: `${width}%` };
    }
    function relativeTime(d) {
      const mins = Math.floor((Date.now() - d.getTime()) / 6e4);
      if (mins < 1) return "just now";
      if (mins < 60) return `${mins}m ago`;
      return `${Math.floor(mins / 60)}h ago`;
    }
    async function drawCharts() {
      return;
    }
    watch([hourly, daily], async () => {
      await nextTick();
      drawCharts();
    });
    watch(unit, async () => {
      await nextTick();
      drawCharts();
    });
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b, _c, _d, _e, _f, _g, _h;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "weather-app" }, _attrs))}><div class="weather-bg" style="${ssrRenderStyle({
        background: `linear-gradient(160deg, ${unref(bg).from} 0%, ${unref(bg).via} 55%, ${unref(bg).to} 100%)`
      })}"></div><div class="app-content"><nav class="top-nav"><div class="nav-brand"><div class="nav-brand-icon">\u26C5</div><span class="nav-brand-name">Weather<em>AI</em></span></div><form class="search-form"><div class="search-wrap"><span class="s-icon">\u{1F50D}</span><input${ssrRenderAttr("value", unref(searchQuery))} class="search-input" type="text" placeholder="Search any city or location..." autocomplete="off"${ssrIncludeBooleanAttr(unref(loading) || unref(searching)) ? " disabled" : ""}></div><button class="btn-search" type="submit"${ssrIncludeBooleanAttr(unref(loading) || unref(searching) || !unref(searchQuery).trim()) ? " disabled" : ""}>${ssrInterpolate(unref(searching) ? "..." : "Search")}</button><button class="btn-locate" type="button"${ssrIncludeBooleanAttr(unref(loading)) ? " disabled" : ""}> \u{1F4CD} Locate Me </button></form></nav>`);
      if (unref(loading)) {
        _push(`<div class="loading-screen"><div class="spinner"></div><p class="loading-label">${ssrInterpolate(unref(loadingMsg))}</p></div>`);
      } else if (unref(fatalError)) {
        _push(`<div class="error-wrap"><div class="error-card"><span class="error-emoji">\u26A0\uFE0F</span><h2 class="error-title">Something went wrong</h2><p class="error-msg">${ssrInterpolate(unref(fatalError))}</p><button class="btn-retry">Try Again</button></div></div>`);
      } else if (unref(weather)) {
        _push(`<!--[--><section class="hero"><div class="hero-left"><div class="location-block"><h1 class="location-name">${ssrInterpolate(unref(cityName))}</h1>`);
        if (unref(countryName)) {
          _push(`<p class="location-sub">${ssrInterpolate(unref(countryName))}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="clock-block"><p class="clock-date">${ssrInterpolate(unref(dateLabel))}</p><p class="clock-time">${ssrInterpolate(unref(liveTime))}</p></div>`);
        if (unref(aiSummary)) {
          _push(`<div class="ai-card"><div class="ai-badge">\u2726 AI Summary</div><p class="ai-text">${ssrInterpolate(unref(aiSummary))}</p></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="hero-temp-card gc"><span class="weather-emoji">${ssrInterpolate(unref(mainIcon))}</span><div class="temp-display"><span class="temp-value">${ssrInterpolate(displayTemp(unref(current).temp_c))}</span><button class="unit-btn" type="button"> \xB0${ssrInterpolate(unref(unit))}</button></div><p class="condition-text">${ssrInterpolate(unref(conditionLabel))}</p>`);
        if (unref(updatedAt)) {
          _push(`<p class="updated-text"> Updated ${ssrInterpolate(relativeTime(unref(updatedAt)))}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></section><section class="stats-section"><p class="section-label">Current Conditions</p><div class="stats-grid"><div class="stat-card gc"><span class="stat-icon">\u{1F321}\uFE0F</span><p class="stat-label">Feels Like</p><p class="stat-value">${ssrInterpolate(displayTemp(unref(current).feels_like_c))}\xB0</p><p class="stat-sub">${ssrInterpolate(unref(unit) === "C" ? "Celsius" : "Fahrenheit")}</p></div><div class="stat-card gc"><span class="stat-icon">\u{1F4A7}</span><p class="stat-label">Humidity</p><p class="stat-value">${ssrInterpolate((_a = unref(current).humidity) != null ? _a : "\u2014")}%</p><p class="stat-sub">Relative</p></div><div class="stat-card gc"><span class="stat-icon">\u{1F4A8}</span><p class="stat-label">Wind</p><p class="stat-value">${ssrInterpolate((_b = unref(current).wind_kph) != null ? _b : "\u2014")}</p><p class="stat-sub">${ssrInterpolate(unref(getWindDirection)(unref(current).wind_degree))} \xB7 km/h </p></div><div class="stat-card gc"><span class="stat-icon">\u{1F506}</span><p class="stat-label">UV Index</p><p class="stat-value" style="${ssrRenderStyle({ color: unref(getUVColor)(unref(current).uv) })}">${ssrInterpolate((_c = unref(current).uv) != null ? _c : "\u2014")}</p><p class="stat-sub">${ssrInterpolate(unref(getUVLabel)(unref(current).uv))}</p></div><div class="stat-card gc"><span class="stat-icon">\u{1F441}\uFE0F</span><p class="stat-label">Visibility</p><p class="stat-value">${ssrInterpolate((_d = unref(current).vis_km) != null ? _d : "\u2014")}</p><p class="stat-sub">kilometres</p></div><div class="stat-card gc"><span class="stat-icon">\u{1F300}</span><p class="stat-label">Pressure</p><p class="stat-value">${ssrInterpolate((_e = unref(current).pressure_mb) != null ? _e : "\u2014")}</p><p class="stat-sub">hPa</p></div></div></section>`);
        if (unref(hourly).length) {
          _push(`<section class="hourly-section"><p class="section-label">Hourly Forecast</p><div class="hourly-scroll"><div class="hourly-strip"><!--[-->`);
          ssrRenderList(unref(hourly).slice(0, 24), (h, i) => {
            var _a2;
            _push(`<div class="${ssrRenderClass([{ now: i === 0 }, "hour-card gc"])}"><p class="hour-time">${ssrInterpolate(unref(formatHourLabel)(h.time, i === 0))}</p><span class="hour-emoji">${ssrInterpolate(unref(getWeatherIcon)(h.weather_code))}</span><p class="hour-temp">${ssrInterpolate(displayTemp(h.temp))}\xB0</p>`);
            if (((_a2 = h.precipitation_prob) != null ? _a2 : 0) > 0) {
              _push(`<p class="hour-rain"> \u{1F4A7} ${ssrInterpolate(h.precipitation_prob)}% </p>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div>`);
          });
          _push(`<!--]--></div></div></section>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(hourly).length || unref(daily).length) {
          _push(`<section class="charts-section"><p class="section-label">Weather Trends</p><div class="charts-grid">`);
          if (unref(hourly).length) {
            _push(`<div class="chart-card gc"><div class="chart-header"><span class="chart-title">24-Hour Forecast</span><div class="chart-legend"><span class="legend-item"><span class="legend-dot" style="${ssrRenderStyle({ "background": "#38bdf8" })}"></span>Temperature </span><span class="legend-item"><span class="legend-dot" style="${ssrRenderStyle({ "background": "#818cf8" })}"></span>Rain % </span></div></div><div class="chart-canvas-wrap"><canvas></canvas></div></div>`);
          } else {
            _push(`<!---->`);
          }
          if (unref(daily).length) {
            _push(`<div class="chart-card gc"><div class="chart-header"><span class="chart-title">Weekly Outlook</span><div class="chart-legend"><span class="legend-item"><span class="legend-bar"></span>Temp Range </span><span class="legend-item"><span class="legend-dot" style="${ssrRenderStyle({ "background": "#818cf8" })}"></span>Rain % </span></div></div><div class="chart-canvas-wrap"><canvas></canvas></div></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></section>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(daily).length) {
          _push(`<section class="daily-section"><p class="section-label">7-Day Forecast</p><div class="daily-list"><!--[-->`);
          ssrRenderList(unref(daily).slice(0, 7), (day, i) => {
            var _a2;
            _push(`<div class="${ssrRenderClass([{ today: i === 0 }, "day-row gc"])}"><p class="day-name">${ssrInterpolate(unref(getDayLabel)(day.date, i))}</p><span class="day-emoji">${ssrInterpolate(unref(getWeatherIcon)(day.weather_code))}</span><p class="day-condition">${ssrInterpolate(unref(getWeatherLabel)(day.weather_code, day.condition_text))}</p>`);
            if (((_a2 = day.precipitation_prob) != null ? _a2 : 0) > 0) {
              _push(`<p class="day-rain"> \u{1F4A7} ${ssrInterpolate(day.precipitation_prob)}% </p>`);
            } else {
              _push(`<p class="day-rain"></p>`);
            }
            _push(`<div class="temp-range"><span class="t-min">${ssrInterpolate(displayTemp(day.min_temp))}\xB0</span><div class="t-bar-track"><div class="t-bar-fill" style="${ssrRenderStyle(tempBarStyle(day.min_temp, day.max_temp))}"></div></div><span class="t-max">${ssrInterpolate(displayTemp(day.max_temp))}\xB0</span></div></div>`);
          });
          _push(`<!--]--></div></section>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(usage)) {
          _push(`<section class="usage-section"><div class="usage-card gc"><div class="usage-header"><p class="section-label" style="${ssrRenderStyle({ "margin-bottom": "0" })}">API Usage</p><span class="plan-badge">${ssrInterpolate((_f = unref(usage).plan) != null ? _f : "Free")} Plan</span></div><div class="usage-track"><div class="usage-fill" style="${ssrRenderStyle({ width: unref(usagePercent) + "%" })}"></div></div><div class="usage-meta"><span class="usage-stat"><strong>${ssrInterpolate((_h = (_g = unref(usage).period) == null ? void 0 : _g.requestCount) != null ? _h : 0)}</strong> requests used</span><span class="usage-stat"><strong>${ssrInterpolate(unref(usagePercent))}%</strong> of monthly quota</span><span class="usage-stat"><strong>${ssrInterpolate(unref(usageRemaining))}</strong> remaining</span></div></div></section>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<!--]-->`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      if (unref(toast)) {
        _push(`<div class="toast-wrap"><div class="${ssrRenderClass([unref(toast).type, "toast"])}"><span>${ssrInterpolate(unref(toast).type === "error" ? "\u26A0\uFE0F" : "\u2713")}</span><span>${ssrInterpolate(unref(toast).msg)}</span></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-BJFMKcP-.mjs.map
