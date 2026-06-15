/**
 * Calendar Sync Worker
 * 部署到: round-haze-1bd0.sdon90909.workers.dev
 * 
 * 功能:
 *   POST /        — AI 代理，转发到 DeepSeek
 *   GET  /data    — 获取存储的日程数据
 *   POST /data    — 保存日程数据
 */

// 内存存储（Worker 保活期间持久，冷启动后丢失）
// 结合 GitHub __ED 做种子恢复，实际使用中几乎不会丢数据
let store = null;

// ─── CORS 头 ───
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

// ─── AI 代理：转发到 DeepSeek ───
async function handleAiProxy(request, env) {
  const body = await request.json();
  const prompt = body.text || '';
  if (!prompt) {
    return new Response(JSON.stringify({ error: 'missing text' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() }
    });
  }

  const deepseekResp = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.DEEPSEEK_API_KEY || ''}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: '你是一个日程解析助手。从用户输入中提取日期(YYYY-MM-DD)、时间(HH:MM)、标题、分类(工作/个人/学习/重要)、备注。以JSON数组返回，每个元素含date/time/title/category/note字段。未指定日期的任务date留空。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 1000,
    }),
  });

  const result = await deepseekResp.json();
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders() }
  });
}

// ─── 数据 API ───
async function handleDataGet() {
  return new Response(JSON.stringify(store || { version: 0, tasks: [], categories: [] }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders() }
  });
}

async function handleDataSave(request) {
  try {
    const body = await request.json();
    store = body;  // 完整替换存储
    return new Response(JSON.stringify({ ok: true, version: store.version || 0 }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders() }
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() }
    });
  }
}

// ─── 主入口 ───
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method.toUpperCase();

    // CORS 预检
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    // 数据 API
    if (url.pathname === '/data') {
      if (method === 'GET')  return handleDataGet();
      if (method === 'POST') return handleDataSave(request);
      return new Response('Method not allowed', { status: 405, headers: corsHeaders() });
    }

    // AI 代理（默认 POST）
    if (method === 'POST') {
      return handleAiProxy(request, env);
    }

    // 根路径
    return new Response('Calendar Worker OK. Endpoints: POST / (AI), GET|POST /data', {
      headers: { 'Content-Type': 'text/plain', ...corsHeaders() }
    });
  },
};