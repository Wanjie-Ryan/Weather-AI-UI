export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  if (!query.q) {
    throw createError({ statusCode: 400, message: 'q parameter is required' })
  }

  const data = await $fetch<any[]>(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(String(query.q))}&format=json&limit=5&addressdetails=1`,
    {
      headers: { 'User-Agent': 'WeatherAI-Dashboard/1.0 (interview project)' }
    }
  )

  return data
})
