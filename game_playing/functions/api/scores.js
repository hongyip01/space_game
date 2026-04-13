export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Only handle /api/scores; return 404 for all other paths
    if (url.pathname !== '/api/scores') {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Only allow POST
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    try {
      // 1. 從環境變數取得 Supabase 配置
      const SUPABASE_URL = env.SUPABASE_URL;
      const SUPABASE_KEY = env.SUPABASE_KEY;

      // 2. 解析遊戲發送的數據
      const requestData = await request.json();

      console.log('收到分數:', requestData);

      // 3. 轉發到 Supabase（從伺服器端，更安全）
      const response = await fetch(`${SUPABASE_URL}/rest/v1/space_game`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
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
      console.log('Supabase 響應:', result);

      // 4. 返回結果到前端
      return new Response(JSON.stringify({
        success: response.ok,
        data: result,
        leaderboard: [],
      }), {
        status: response.ok ? 200 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Worker 錯誤:', error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message,
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};