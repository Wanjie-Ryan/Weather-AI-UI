import { d as defineEventHandler, c as createError, u as useRuntimeConfig } from '../../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';

const weatherGeo_get = defineEventHandler(async (event) => {
  var _a, _b, _c, _d, _e, _f;
  const config = useRuntimeConfig();
  if (!config.weatherApiKey || config.weatherApiKey === "wai_your_api_key_here") {
    throw createError({ statusCode: 401, message: "API key not configured. Add your WEATHER_API_KEY to .env" });
  }
  const response = await $fetch.raw(
    `${config.weatherApiBase}/v1/weather-geo?ip=auto&ai=true&days=7`,
    {
      headers: { Authorization: `Bearer ${config.weatherApiKey}` }
    }
  );
  return {
    data: response._data,
    geo: {
      city: (_b = (_a = response.headers.get("City")) != null ? _a : response.headers.get("X-City")) != null ? _b : null,
      region: (_d = (_c = response.headers.get("Region")) != null ? _c : response.headers.get("X-Region")) != null ? _d : null,
      country: (_f = (_e = response.headers.get("Country")) != null ? _e : response.headers.get("X-Country")) != null ? _f : null
    }
  };
});

export { weatherGeo_get as default };
//# sourceMappingURL=weather-geo.get.mjs.map
