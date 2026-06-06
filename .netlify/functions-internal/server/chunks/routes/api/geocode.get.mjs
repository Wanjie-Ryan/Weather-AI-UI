import { d as defineEventHandler, g as getQuery, c as createError } from '../../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';

const geocode_get = defineEventHandler(async (event) => {
  const query = getQuery(event);
  if (!query.q) {
    throw createError({ statusCode: 400, message: "q parameter is required" });
  }
  const data = await $fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(String(query.q))}&format=json&limit=5&addressdetails=1`,
    {
      headers: { "User-Agent": "WeatherAI-Dashboard/1.0 (interview project)" }
    }
  );
  return data;
});

export { geocode_get as default };
//# sourceMappingURL=geocode.get.mjs.map
