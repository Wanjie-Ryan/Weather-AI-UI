export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  if (!config.weatherApiKey || config.weatherApiKey === 'wai_your_api_key_here') {
    throw createError({ statusCode: 401, message: 'API key not configured. Add your WEATHER_API_KEY to .env' })
  }

  const response = await $fetch.raw(
    `${config.weatherApiBase}/v1/weather-geo?ip=auto&ai=true&days=7`,
    {
      headers: { Authorization: `Bearer ${config.weatherApiKey}` }
    }
  )

  return {
    data: response._data,
    geo: {
      city: response.headers.get('City') ?? response.headers.get('X-City') ?? null,
      region: response.headers.get('Region') ?? response.headers.get('X-Region') ?? null,
      country: response.headers.get('Country') ?? response.headers.get('X-Country') ?? null,
    }
  }
})
