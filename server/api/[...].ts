export default defineEventHandler(async (event) => {
  const target = 'https://dramabox.sansekai.my.id/api'
  const originalUrl = event.node.req.url || ''
  const path = originalUrl.replace(/^\/api/, '')
  const url = `${target}${path}`
  
  try {
    const response = await $fetch.raw(url, {
      method: event.node.req.method as any,
      headers: {
        ...Object.fromEntries(
          Object.entries(event.node.req.headers).filter(([key]) => 
            !['host', 'connection', 'content-length'].includes(key.toLowerCase())
          )
        ),
      },
    })
    
    // Set response headers
    for (const [key, value] of Object.entries(response.headers)) {
      if (key.toLowerCase() !== 'content-encoding') {
        event.node.res.setHeader(key, value as string)
      }
    }
    
    event.node.res.setHeader('Access-Control-Allow-Origin', '*')
    event.node.res.statusCode = response.status
    
    return response._data
  } catch (error: any) {
    event.node.res.statusCode = error.statusCode || 500
    return { error: 'Proxy error', message: error.message }
  }
})

