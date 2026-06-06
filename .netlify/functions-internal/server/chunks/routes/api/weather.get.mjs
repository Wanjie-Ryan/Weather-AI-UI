import { d as defineEventHandler, g as getQuery, c as createError, u as useRuntimeConfig } from '../../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';

const weather_get = defineEventHandler(async (event) => {
  var _a;
  const config = useRuntimeConfig();
  const query = getQuery(event);
  if (!query.lat || !query.lon) {
    throw createError({ statusCode: 400, message: "lat and lon are required" });
  }
  const params = new URLSearchParams({
    lat: String(query.lat),
    lon: String(query.lon),
    days: String((_a = query.days) != null ? _a : 7),
    ai: "true",
    units: "metric"
  });
  const data = await $fetch(
    `${config.weatherApiBase}/v1/weather?${params}`,
    {
      headers: { Authorization: `Bearer ${config.weatherApiKey}` }
    }
  );
  return data;
});

export { weather_get as default };
//# sourceMappingURL=weather.get.mjs.map
