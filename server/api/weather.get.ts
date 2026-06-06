export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)

  if (!query.lat || !query.lon) {
    throw createError({ statusCode: 400, message: 'lat and lon are required' })
  }

  const params = new URLSearchParams({
    lat: String(query.lat),
    lon: String(query.lon),
    days: String(query.days ?? 7),
    ai: 'true',
    units: 'metric',
  })

  const data = await $fetch(
    `${config.weatherApiBase}/v1/weather?${params}`,
    {
      headers: { Authorization: `Bearer ${config.weatherApiKey}` }
    }
  )

  return data
})
