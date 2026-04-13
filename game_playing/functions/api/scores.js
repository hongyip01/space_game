export async function onRequestPost(context) {
  // 1. Get the environment variables stored securely in Cloudflare
  const SUPABASE_URL = context.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = context.env.SUPABASE_ANON_KEY;

  // 2. Parse the request from your game
  const requestData = await context.request.json();
  
  // (Optional) Add server-side validation here to prevent cheating!
  // if (requestData.fragments > 4) return new Response("Invalid fragments", { status: 400 });

  // 3. Forward the request to Supabase securely from the server
  const response = await fetch(`${SUPABASE_URL}/rest/v1/space_game`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({
      id: requestData.id,
      fragments: requestData.fragments,
      hp: requestData.hp,
      play_time: requestData.play_time,
      created_at: new Date().toISOString()
    })
  });

  const result = await response.json();

  // 4. Send the result back to your frontend
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' }
  });
}