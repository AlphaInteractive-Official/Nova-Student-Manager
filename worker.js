/**
 * Nova Student Manager — Cloudflare Worker Entry Point
 * Routes /api/vision to Gemini Flash Vision proxy.
 * All other paths are served from the ./hosting static assets directory.
 */

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    if (url.pathname === '/api/vision' && request.method === 'POST') {
      return handleVision(request, env);
    }

    // Serve static assets (app.html, version-manifest.json, etc.)
    return env.ASSETS.fetch(request);
  }
};

async function handleVision(request, env) {
  try {
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      return jsonRes({ error: 'GEMINI_API_KEY secret not set on Cloudflare.' }, 500);
    }

    const body = await request.json();
    const parts = body.parts || [];
    if (!parts.length) return jsonRes({ error: 'No image parts provided.' }, 400);

    const gemRes = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts }] }),
    });

    if (!gemRes.ok) {
      const t = await gemRes.text();
      return jsonRes({ error: `Gemini ${gemRes.status}: ${t}` }, 502);
    }

    const data = await gemRes.json();

    let names = [];
    try {
      const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) names = JSON.parse(m[0]).names || [];
    } catch (_) { names = []; }

    return jsonRes({ names });

  } catch (err) {
    return jsonRes({ error: err.message || 'Worker error' }, 500);
  }
}

function jsonRes(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
