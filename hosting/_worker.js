/**
 * Nova Student Manager — Cloudflare Pages Edge Worker
 * Handles API routes; all other paths served as static assets.
 *
 * Route: POST /api/vision
 *   Proxies an image-based Gemini Flash Vision request to extract
 *   participant names from Google Meet / Zoom screenshots.
 *   The Gemini API key is stored as a Cloudflare Pages secret (GEMINI_API_KEY).
 */

const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // API route: POST /api/vision
    if (url.pathname === '/api/vision' && request.method === 'POST') {
      return handleVision(request, env);
    }

    // All other paths: serve static assets (handled by Pages automatically)
    return env.ASSETS.fetch(request);
  }
};

async function handleVision(request, env) {
  try {
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      return jsonResponse({ error: 'GEMINI_API_KEY secret not configured on Cloudflare.' }, 500);
    }

    const body = await request.json();
    const parts = body.parts || [];

    if (!parts.length) {
      return jsonResponse({ error: 'No parts provided.' }, 400);
    }

    const geminiPayload = {
      contents: [{ role: 'user', parts }]
    };

    const geminiRes = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiPayload),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return jsonResponse({ error: `Gemini API error ${geminiRes.status}: ${errText}` }, 502);
    }

    const geminiData = await geminiRes.json();

    // Extract names from Gemini response
    let names = [];
    try {
      const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        names = parsed.names || [];
      }
    } catch (_) {
      names = [];
    }

    return jsonResponse({ names, raw: geminiData });

  } catch (err) {
    return jsonResponse({ error: err.message || 'Internal error' }, 500);
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
  });
}
