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

    // Accept POST to / or /api/scores or /scores
    const validPaths = ['/', '/api/scores', '/scores'];
    if (!validPaths.includes(url.pathname)) {
      return new Response('Not Found', { status: 404, headers: CORS_HEADERS });
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', {
        status: 405,
        headers: { ...CORS_HEADERS, Allow: 'POST, OPTIONS' },
      });
    }

    const SUPABASE_URL = env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return new Response(
        JSON.stringify({ error: 'Server misconfiguration: missing Supabase secrets.' }),
        { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    let requestData;
    try {
      requestData = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body.' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const response = await fetch(`${SUPABASE_URL}/rest/v1/space_game`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        id: requestData.id,
        fragments: requestData.fragments,
        hp: requestData.hp,
        play_time: requestData.play_time,
        created_at: new Date().toISOString(),
      }),
    });

    const result = await response.json();

    return new Response(JSON.stringify(result), {
      status: response.status,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  },
};
