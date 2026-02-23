// Netlify function to proxy font requests with CORS and caching
const fetch = require('node-fetch');

exports.handler = async (event) => {
  const path = event.path.replace('/.netlify/functions/cors-proxy/', '');
  const targetUrl = `https://fonts.googleapis.com/${path}`; // Could be configurable

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Modz4.0-CORS-Proxy/1.0',
        'Accept': event.headers['accept'] || '*/*'
      }
    });

    const body = await response.text();
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'public, max-age=86400',
      'Content-Type': response.headers.get('content-type') || 'application/octet-stream'
    };

    return {
      statusCode: response.status,
      headers,
      body
    };
  } catch (error) {
    console.error('Proxy error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Proxy failed' })
    };
  }
};
