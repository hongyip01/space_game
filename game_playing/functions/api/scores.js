export default {
  async fetch(request, env) {
    // 只處理 POST 請求
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      // 1. 從環境變數取得 Supabase 配置
      const SUPABASE_URL = env.SUPABASE_URL;
      const SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY;
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
          'Authorization': `Bearer ${SUPABASE_KEY}`
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
      console.log('Supabase 響應:', result);

      // 4. 返回結果到前端
      return new Response(JSON.stringify({
        success: response.ok,
        data: result,
        leaderboard: []
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Worker 錯誤:', error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};