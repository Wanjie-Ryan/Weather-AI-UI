export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  const data = await $fetch(
    `${config.weatherApiBase}/v1/usage`,
    {
      headers: { Authorization: `Bearer ${config.weatherApiKey}` }
    }
  )

  return data
})
