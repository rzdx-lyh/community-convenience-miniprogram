'use strict';

/**
 * DeepSeek deepseek-chat 客户端
 * - Key 只从环境变量 DEEPSEEK_API_KEY 读，代码零明文；无 Key 立即降级，不发请求
 * - 超时默认 8s（可用 AI_TIMEOUT_MS 覆盖）、失败不重试、日志含耗时 cost_ms 与 http 状态
 * - 本函数永不抛错：任何异常都返回 { degraded: true, content: '', reason }
 *
 * ⚠ 超时必须小于云函数的超时时间（本项目要求云函数设 20s）：
 *   云函数默认 3s，而一次大模型请求常要 3-8s —— 函数会在模型返回前被掐断，
 *   表现为「配了 Key 但 AI 还是降级」。改 Key 之前先改云函数超时，
 *   见 docs/26-云函数超时必须改20秒.md。
 *
 * CR-027：新增 reason 字段，把「没配 Key / 超时 / 网络 / HTTP 错误 / 解析失败」区分开。
 *   以前统一返回 degraded:true，遇到降级只能靠猜；现在日志和出参都能直接定位。
 */
const https = require('https');

const DEFAULT_TIMEOUT_MS = 8000;
const MODEL = 'deepseek-chat';

/** 超时上限保护：即便配了很大的 AI_TIMEOUT_MS，也不让它超过 15s（留余地给函数自身开销） */
const MAX_TIMEOUT_MS = 15000;

function timeoutMs() {
  const raw = Number(process.env.AI_TIMEOUT_MS);
  if (!Number.isFinite(raw) || raw <= 0) return DEFAULT_TIMEOUT_MS;
  return Math.min(Math.floor(raw), MAX_TIMEOUT_MS);
}

/**
 * @returns {Promise<{degraded:boolean, content:string, reason:string}>}
 *  reason: ok | no_key | timeout | network | http_<code> | bad_json | empty
 */
async function chat(messages, { temperature = 0.3, maxTokens = 800 } = {}) {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) {
    // 这是最常见的一种降级：不是模型坏了，是没配 Key
    console.warn('[ai] degraded: no_key —— 未配置 DEEPSEEK_API_KEY，直接降级');
    return { degraded: true, content: '', reason: 'no_key' };
  }

  const startedAt = Date.now();
  const timeout = timeoutMs();
  const payload = JSON.stringify({
    model: MODEL,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream: false,
  });

  const result = await new Promise((resolve) => {
    let settled = false;
    const done = (r) => {
      if (settled) return;
      settled = true;
      resolve(r);
    };
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
          try { done({ http: res.statusCode, json: JSON.parse(buf) }); }
          catch (e) { done({ http: res.statusCode, json: null }); }
        });
      },
    );
    req.setTimeout(timeout, () => {
      console.warn(`[ai] request timeout after ${timeout}ms`);
      req.destroy(new Error('AI_TIMEOUT'));
      done({ http: 0, json: null, timedOut: true });
    });
    req.on('error', (e) => {
      // destroy(Error) 也会走这里，timedOut 标记用来区分「超时」和「网络错误」
      if (!e || e.message !== 'AI_TIMEOUT') console.warn('[ai] 请求异常：', e && e.message);
      done({ http: 0, json: null, networkError: e && e.message !== 'AI_TIMEOUT' });
    });
    req.write(payload);
    req.end();
  });

  const costMs = Date.now() - startedAt;

  if (result.timedOut) {
    console.warn(`[ai] degraded: timeout cost_ms=${costMs} timeout=${timeout}ms（检查云函数超时是否 > ${timeout}ms）`);
    return { degraded: true, content: '', reason: 'timeout' };
  }
  if (!result.http) {
    console.warn(`[ai] degraded: network cost_ms=${costMs}`);
    return { degraded: true, content: '', reason: 'network' };
  }
  if (result.http !== 200) {
    // 401 = Key 无效/过期；402 = 余额不足；429 = 限流 —— 都是运营侧问题，日志要能一眼看出
    console.warn(`[ai] degraded: http_${result.http} cost_ms=${costMs}`);
    return { degraded: true, content: '', reason: `http_${result.http}` };
  }
  const choice = result.json && result.json.choices && result.json.choices[0];
  if (!choice || !choice.message || !choice.message.content) {
    console.warn(`[ai] degraded: bad_json/empty cost_ms=${costMs}`);
    return { degraded: true, content: '', reason: 'empty' };
  }
  console.log(`[ai] ok cost_ms=${costMs} http=200`);
  return { degraded: false, content: choice.message.content, reason: 'ok' };
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
