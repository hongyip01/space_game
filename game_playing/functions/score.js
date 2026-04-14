// /functions/score.js
export async function onRequestPost(context) {
    const { env, request } = context;
    
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };

    try {
        const stats = await request.json();
        
        // 根據您的需求，將數據映射到 Supabase 欄位
        const payload = {
            id: stats.id,
            fragments: stats.fragments,
            hp: stats.hp,
            play_time: stats.play_time
        };

        // 轉發給 Supabase，請確保後台已設定 SUPABASE_URL 和 SUPABASE_KEY
        const res = await fetch(`${env.SUPABASE_URL}/rest/v1/space_game`, {
            method: 'POST',
            headers: {
                'apikey': env.SUPABASE_KEY,
                'Authorization': `Bearer ${env.SUPABASE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify(payload)
        });

        return new Response(JSON.stringify({ success: res.ok }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500
        });
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        }
    });
}
