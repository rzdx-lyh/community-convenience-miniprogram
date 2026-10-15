'use strict';

/**
 * DeepSeek deepseek-chat 客户端
 * - Key 只从环境变量 DEEPSEEK_API_KEY 读，代码零明文；无 Key 立即降级，不发请求
 * - 超时 8s、失败不重试、日志含耗时 cost_ms 与 http 状态
 * - 本函数永不抛错：任何异常都返回 { degraded: true, content: '' }
 */
const https = require('https');

const TIMEOUT_MS = 8000;
const MODEL = 'deepseek-chat';

async function chat(messages, { temperature = 0.3, maxTokens = 800 } = {}) {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) {
    console.log('[ai] 无 DEEPSEEK_API_KEY，直接降级');
    return { degraded: true, content: '' };
  }
  const startedAt = Date.now();
  const payload = JSON.stringify({
    model: MODEL,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream: false,
  });

  const result = await new Promise((resolve) => {
    const req = https.request(
      {
        host: 'api.deepseek.com',
        path: '/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let buf = '';
        res.on('data', (c) => { buf += c; });
        res.on('end', () => {
          try { resolve({ http: res.statusCode, json: JSON.parse(buf) }); }
          catch (e) { resolve({ http: res.statusCode, json: null }); }
        });
      },
    );
    req.setTimeout(TIMEOUT_MS, () => req.destroy(new Error('AI_TIMEOUT')));
    req.on('error', (e) => {
      console.warn('[ai] 请求异常：', e && e.message);
      resolve({ http: 0, json: null });
    });
    req.write(payload);
    req.end();
  });

  const choice = result.json && result.json.choices && result.json.choices[0];
  const degraded = !(result.http === 200 && choice && choice.message);
  console.log(`[ai] cost_ms=${Date.now() - startedAt} http=${result.http} degraded=${degraded}`);
  return degraded ? { degraded: true, content: '' } : { degraded: false, content: choice.message.content };
}

/** RAG 问答 Prompt：知识库上下文 + 反幻觉纪律 */
function buildRagPrompt(hits, question) {
  const context = (hits || []).map((h, i) => `[${i + 1}] ${h.title}\n${h.content}`).join('\n\n');
  return [
    {
      role: 'system',
      content:
        '你是社区便民小程序 AI 助手。回答必须基于知识库资料，不编造办事流程、电话、政策名称与金额；' +
        '知识库无法回答时明确说明，并引导用户拨打便民电话或提交报修工单；回答 200 字内，语气亲切。',
    },
    {
      role: 'user',
      content: `知识库资料：\n${context || '（无匹配资料）'}\n\n用户问题：${question}`,
    },
  ];
}

/** 工单 AI 摘要 Prompt：失败用原文截断兜底，不阻断创建 */
function buildSummaryPrompt(title, description) {
  return [
    {
      role: 'system',
      content: '你是物业报修工单助手。用一句话（不超过 40 字）概括报修问题并给出处理优先级建议（高/中/低）。',
    },
    { role: 'user', content: `标题：${title}\n描述：${description}` },
  ];
}

module.exports = { chat, buildRagPrompt, buildSummaryPrompt };
