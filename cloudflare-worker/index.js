/**
 * Cloudflare Worker — HamQSL CORS Proxy
 *
 * Fetches https://www.hamqsl.com/solarxml.php and adds CORS headers
 * so the dashboard can fetch it from any origin without a third-party proxy.
 * Cache-Control: no-store ensures always-fresh data.
 */

export default {
  async fetch(request) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Max-Age': '86400',
        },
      })
    }

    const response = await fetch('https://www.hamqsl.com/solarxml.php', {
      headers: { 'Cache-Control': 'no-cache' },
      cf: { cacheEverything: false },
    })

    const text = await response.text()

    return new Response(text, {
      status: response.status,
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store',
      },
    })
  },
}
