import { d as defineEventHandler, u as useRuntimeConfig } from '../../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';

const usage_get = defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const data = await $fetch(
    `${config.weatherApiBase}/v1/usage`,
    {
      headers: { Authorization: `Bearer ${config.weatherApiKey}` }
    }
  );
  return data;
});

export { usage_get as default };
//# sourceMappingURL=usage.get.mjs.map
