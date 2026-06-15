/**
 * Calendar Sync Worker
 * 部署到: round-haze-1bd0.sdon90909.workers.dev
 *
 * 功能:
 *   POST /        — AI 代理，智能解析自然语言日程
 *   GET  /data    — 获取存储的日程数据
 *   POST /data    — 保存日程数据
 */

let store = null;

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

// ─── AI 代理 ───
async function handleAiProxy(request, env) {
  const body = await request.json();
  const prompt = body.text || '';
  if (!prompt) {
    return new Response(JSON.stringify({ error: 'missing text' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() }
    });
  }

  const today = new Date().toISOString().slice(0, 10);

  const systemPrompt = `你是一个智能日程助手。用户会用凌乱的自然语言描述他们的日程、任务、想法。你需要：

## 核心规则
1. 从凌乱的输入中提取所有可识别的任务
2. 每个任务必须有：title（标题）、date（日期 YYYY-MM-DD）、time（时间 HH:MM）、category（分类）、note（备注）
3. **重要：没有明确日期或时间的任务，date 和 time 都留空字符串 ""，它们会自动进入"待办列表"**
4. 即使用户说"有空做"、"改天"、"下次"、"回头"等模糊表达，也创建任务但 date 留空

## 分类判断
- 工作/上班/开会/汇报/出差/文档/客户 → "工作"
- 学习/上课/考试/复习/作业/论文/阅读 → "学习"  
- 个人/聚餐/运动/健身/旅游/购物/医院/聚会 → "个人"
- 重要/紧急/截止/DDL/必须 → "重要"

## 日期时间解析
- "明天" → 当前日期+1天
- "后天" → 当前日期+2天
- "下周三" → 下周对应的周三
- "下周" → 下周一（如果没有更具体信息）
- "月底" → 当月最后一天
- "早上/上午" → 09:00
- "中午" → 12:00
- "下午" → 14:00
- "傍晚" → 18:00
- "晚上" → 20:00
- 没有时间但有日期 → time 留空
- 完全没有日期信息 → date 留空，time 留空 → 进入待办列表

## 输出格式
严格返回JSON数组，不要加markdown代码块标记：
[{"date":"2026-06-20","time":"14:00","title":"团队周会","category":"工作","note":"带报告"},
 {"date":"","time":"","title":"买生日礼物","category":"个人","note":"给妈妈"},
 {"date":"2026-06-21","time":"","title":"复习期末考试","category":"学习","note":""}]

## 示例
输入："明天下午3点开会讨论Q3计划，还有下周要交报告，对了改天记得买猫粮"
输出：[{"date":"<明天日期>","time":"15:00","title":"开会讨论Q3计划","category":"工作","note":""},{"date":"<下周一日期>","time":"","title":"交报告","category":"工作","note":""},{"date":"","time":"","title":"买猫粮","category":"个人","note":""}]

输入："帮我想想下周安排：周一早会、周三下午见客户、还要抽空健身"
输出：[{"date":"<下周一日期>","time":"09:00","title":"早会","category":"工作","note":""},{"date":"<下周三日期>","time":"14:00","title":"见客户","category":"工作","note":""},{"date":"","time":"","title":"健身","category":"个人","note":"抽空"}]

当前日期：${today}`;

  const deepseekResp = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.DEEPSEEK_API_KEY || ''}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 2000,
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
    store = body;
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

    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    if (url.pathname === '/data') {
      if (method === 'GET')  return handleDataGet();
      if (method === 'POST') return handleDataSave(request);
      return new Response('Method not allowed', { status: 405, headers: corsHeaders() });
    }

    if (method === 'POST') {
      return handleAiProxy(request, env);
    }

    return new Response('Calendar Worker OK. POST / (AI) | GET/POST /data', {
      headers: { 'Content-Type': 'text/plain', ...corsHeaders() }
    });
  },
};