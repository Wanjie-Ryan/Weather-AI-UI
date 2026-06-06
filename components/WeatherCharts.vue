<script setup lang="ts">
import { getDayShort, formatHourLabel } from "~/utils/weather";

interface HourForecast {
  time: string | number;
  temp: number;
  weather_code: number;
  precipitation_prob: number;
}

interface DayForecast {
  date: string;
  max_temp: number;
  min_temp: number;
  weather_code: number;
  condition_text?: string;
  precipitation_prob: number;
}

const props = defineProps<{
  hourly: HourForecast[];
  daily: DayForecast[];
  unit: "C" | "F";
}>();

const chartRef1 = ref<HTMLCanvasElement | null>(null);
const chartRef2 = ref<HTMLCanvasElement | null>(null);
let chartInst1: any = null;
let chartInst2: any = null;

function displayTemp(val: number | undefined): number {
  const t = val ?? 0;
  return props.unit === "F" ? Math.round((t * 9) / 5 + 32) : Math.round(t);
}

async function drawCharts() {
  if (!import.meta.client) return;
  const { Chart } = await import("chart.js/auto");

  // Chart 1 — 24h Temperature + Precipitation
  if (chartRef1.value && props.hourly.length) {
    chartInst1?.destroy();
    chartInst1 = null;

    const MIN_W1 = 560;
    const avail1 = chartRef1.value.parentElement?.clientWidth ?? 0;
    const w1 = Math.max(MIN_W1, avail1);
    chartRef1.value.width = w1;
    chartRef1.value.height = 210;

    const labels = props.hourly
      .slice(0, 24)
      .map((h, i) => formatHourLabel(h.time, i === 0));
    const temps = props.hourly.slice(0, 24).map((h) => displayTemp(h.temp));
    const rain = props.hourly
      .slice(0, 24)
      .map((h) => h.precipitation_prob ?? 0);

    let tempGrad: CanvasGradient | undefined;

    chartInst1 = new Chart(chartRef1.value, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Rain %",
            data: rain,
            type: "bar",
            backgroundColor: "rgba(129,140,248,0.22)",
            borderColor: "rgba(129,140,248,0.45)",
            borderWidth: 1,
            borderRadius: 4,
            yAxisID: "yRain",
            order: 2,
          },
          {
            label: `Temp °${props.unit}`,
            data: temps,
            type: "line",
            borderColor: "#38bdf8",
            borderWidth: 2.5,
            backgroundColor: (scriptCtx: any) => {
              const { chartArea, ctx: c } = scriptCtx.chart;
              if (!chartArea) return "transparent";
              if (!tempGrad) {
                const g = c.createLinearGradient(
                  0,
                  chartArea.top,
                  0,
                  chartArea.bottom,
                );
                g.addColorStop(0, "rgba(56,189,248,0.38)");
                g.addColorStop(0.65, "rgba(56,189,248,0.07)");
                g.addColorStop(1, "rgba(56,189,248,0)");
                tempGrad = g;
              }
              return tempGrad;
            },
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: "#38bdf8",
            pointHoverBorderColor: "rgba(255,255,255,0.9)",
            pointHoverBorderWidth: 2,
            yAxisID: "yTemp",
            order: 1,
          },
        ],
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: "index" },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(7,12,27,0.92)",
            borderColor: "rgba(255,255,255,0.1)",
            borderWidth: 1,
            titleColor: "#94a3b8",
            bodyColor: "#f1f5f9",
            padding: { x: 14, y: 12 },
            callbacks: {
              label: (item: any) => {
                if (item.dataset.label === "Rain %")
                  return `  💧 ${item.raw}%`;
                return `  🌡 ${item.raw}°${props.unit}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { color: "rgba(255,255,255,0.04)" },
            border: { display: false },
            ticks: {
              color: "rgba(255,255,255,0.38)",
              font: { size: 10, family: "Inter, system-ui, sans-serif" },
              maxRotation: 0,
              maxTicksLimit: 12,
            },
          },
          yTemp: {
            position: "left",
            grid: { color: "rgba(255,255,255,0.05)" },
            border: { display: false },
            ticks: {
              color: "rgba(56,189,248,0.75)",
              font: { size: 10, family: "Inter, system-ui, sans-serif" },
              callback: (v: any) => `${v}°`,
            },
          },
          yRain: {
            position: "right",
            min: 0,
            max: 100,
            grid: { display: false },
            border: { display: false },
            ticks: {
              color: "rgba(129,140,248,0.65)",
              font: { size: 10, family: "Inter, system-ui, sans-serif" },
              callback: (v: any) => `${v}%`,
              maxTicksLimit: 5,
            },
          },
        },
      },
    } as any);
  }

  // Chart 2 — 7-Day Temperature Range
  if (chartRef2.value && props.daily.length) {
    chartInst2?.destroy();
    chartInst2 = null;

    const MIN_W2 = 320;
    const avail2 = chartRef2.value.parentElement?.clientWidth ?? 0;
    const w2 = Math.max(MIN_W2, avail2);
    chartRef2.value.width = w2;
    chartRef2.value.height = 210;

    const labels = props.daily.slice(0, 7).map((d, i) => {
      if (i === 0) return "Today";
      if (i === 1) return "Tmrw";
      return getDayShort(d.date);
    });
    const rangeData = props.daily
      .slice(0, 7)
      .map((d) => [displayTemp(d.min_temp), displayTemp(d.max_temp)]);
    const rainLine = props.daily
      .slice(0, 7)
      .map((d) => d.precipitation_prob ?? 0);

    let rangeGrad: CanvasGradient | undefined;

    chartInst2 = new Chart(chartRef2.value, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Temp Range",
            data: rangeData,
            backgroundColor: (scriptCtx: any) => {
              const { chartArea, ctx: c } = scriptCtx.chart;
              if (!chartArea) return "rgba(96,165,250,0.55)";
              if (!rangeGrad) {
                const g = c.createLinearGradient(
                  0,
                  chartArea.top,
                  0,
                  chartArea.bottom,
                );
                g.addColorStop(0, "rgba(251,146,60,0.75)");
                g.addColorStop(1, "rgba(96,165,250,0.75)");
                rangeGrad = g;
              }
              return rangeGrad;
            },
            borderColor: "rgba(255,255,255,0.1)",
            borderWidth: 1,
            borderRadius: 6,
            borderSkipped: false,
            order: 2,
          },
          {
            label: "Rain %",
            data: rainLine,
            type: "line",
            yAxisID: "yRain",
            borderColor: "rgba(129,140,248,0.85)",
            backgroundColor: "rgba(129,140,248,0.1)",
            fill: false,
            tension: 0.35,
            borderWidth: 2,
            pointRadius: 4,
            pointBackgroundColor: "#818cf8",
            pointBorderColor: "rgba(7,12,27,0.8)",
            pointBorderWidth: 2,
            order: 1,
          },
        ],
      },
      options: {
        responsive: false,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(7,12,27,0.92)",
            borderColor: "rgba(255,255,255,0.1)",
            borderWidth: 1,
            titleColor: "#94a3b8",
            bodyColor: "#f1f5f9",
            padding: { x: 14, y: 12 },
            callbacks: {
              label: (item: any) => {
                if (item.dataset.label === "Rain %")
                  return `  💧 ${item.raw}%`;
                const [lo, hi] = item.raw as [number, number];
                return `  🌡 ${lo}° – ${hi}°${props.unit}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: {
              color: "rgba(255,255,255,0.5)",
              font: {
                size: 11,
                family: "Inter, system-ui, sans-serif",
                weight: 600,
              },
            },
          },
          y: {
            grid: { color: "rgba(255,255,255,0.05)" },
            border: { display: false },
            ticks: {
              color: "rgba(255,255,255,0.4)",
              font: { size: 10, family: "Inter, system-ui, sans-serif" },
              callback: (v: any) => `${v}°`,
            },
          },
          yRain: {
            position: "right",
            min: 0,
            max: 100,
            grid: { display: false },
            border: { display: false },
            ticks: {
              color: "rgba(129,140,248,0.65)",
              font: { size: 10, family: "Inter, system-ui, sans-serif" },
              callback: (v: any) => `${v}%`,
              maxTicksLimit: 5,
            },
          },
        },
      },
    } as any);
  }
}

watch([() => props.hourly, () => props.daily], async () => {
  await nextTick();
  drawCharts();
});

watch(
  () => props.unit,
  async () => {
    await nextTick();
    drawCharts();
  },
);

onMounted(async () => {
  await nextTick();
  drawCharts();
});

onUnmounted(() => {
  chartInst1?.destroy();
  chartInst2?.destroy();
});
</script>

<template>
  <section class="charts-section" v-if="hourly.length || daily.length">
    <p class="section-label">Weather Trends</p>
    <div class="charts-grid">
      <!-- 24h Temperature + Precipitation -->
      <div class="chart-card gc" v-if="hourly.length">
        <div class="chart-header">
          <span class="chart-title">24-Hour Forecast</span>
          <div class="chart-legend">
            <span class="legend-item">
              <span class="legend-dot" style="background: #38bdf8"></span>Temperature
            </span>
            <span class="legend-item">
              <span class="legend-dot" style="background: #818cf8"></span>Rain %
            </span>
          </div>
        </div>
        <div class="chart-scroll">
          <div class="chart-canvas-wrap chart-canvas--hourly">
            <canvas ref="chartRef1"></canvas>
          </div>
        </div>
      </div>

      <!-- 7-Day Temperature Range -->
      <div class="chart-card gc" v-if="daily.length">
        <div class="chart-header">
          <span class="chart-title">Weekly Outlook</span>
          <div class="chart-legend">
            <span class="legend-item">
              <span class="legend-bar"></span>Temp Range
            </span>
            <span class="legend-item">
              <span class="legend-dot" style="background: #818cf8"></span>Rain %
            </span>
          </div>
        </div>
        <div class="chart-scroll">
          <div class="chart-canvas-wrap chart-canvas--weekly">
            <canvas ref="chartRef2"></canvas>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
