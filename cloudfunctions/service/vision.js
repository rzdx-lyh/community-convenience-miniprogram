'use strict';

/**
 * 报修图片理解：OpenAI 兼容的多模态接口封装。
 * 只在云函数中调用，Key 不进入小程序。
 * 未配置 VISION_API_KEY 时返回 degraded，不阻断人工填写。
 */
const https = require('https');

const DEFAULT_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MODEL = 'gpt-4o-mini';
const MAX_TIMEOUT_MS = 12000;

function timeoutMs() {
  const raw = Number(process.env.VISION_TIMEOUT_MS);
  return Number.isFinite(raw) && raw > 0 ? Math.min(Math.floor(raw), MAX_TIMEOUT_MS) : 10000;
}

function buildVisionMessages(imageUrl) {
  return [
    {
      role: 'system',
      content: '你是社区物业报修图片助手。只输出 JSON，不要输出 Markdown：{"category":"water|electric|door|public|other","title":"20字内标题","description":"60字内客观描述","urgency":"high|medium|low","safetyTip":"一句安全提示","confidence":0到1}。不要诊断疾病，不要编造图片中没有的信息。',
    },
    {
      role: 'user',
      content: [
        { type: 'text', text: '请分析这张社区报修照片，判断报修类别、问题描述、紧急程度和安全提示。' },
        { type: 'image_url', image_url: { url: imageUrl } },
      ],
    },
  ];
}

function parseVisionResult(content) {
  const text = String(content || '').replace(/```json|```/gi, '').trim();
  try {
    const obj = JSON.parse(text);
    const categories = ['water', 'electric', 'door', 'public', 'other'];
    const urgency = ['high', 'medium', 'low'];
    return {
      category: categories.includes(obj.category) ? obj.category : 'other',
      title: String(obj.title || '报修图片识别').slice(0, 30),
      description: String(obj.description || '').slice(0, 120),
      urgency: urgency.includes(obj.urgency) ? obj.urgency : 'medium',
      safetyTip: String(obj.safetyTip || '请先确保现场安全，再进行报修。').slice(0, 80),
      confidence: Math.max(0, Math.min(1, Number(obj.confidence) || 0.5)),
    };
  } catch {
    return null;
  }
}

async function analyzeRepairImage(imageUrl) {
  const key = process.env.VISION_API_KEY;
  if (!key) return { degraded: true, reason: 'no_key', analysis: null };
  if (!imageUrl) return { degraded: true, reason: 'no_image', analysis: null };

  const endpoint = process.env.VISION_API_URL || DEFAULT_ENDPOINT;
  const model = process.env.VISION_MODEL || DEFAULT_MODEL;
  const body = JSON.stringify({
    model,
    messages: buildVisionMessages(imageUrl),
    temperature: 0.1,
    max_tokens: 350,
    response_format: { type: 'json_object' },
  });
  const result = await new Promise((resolve) => {
    let settled = false;
    const done = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    const url = new URL(endpoint);
    const req = https.request({
      host: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + key,
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        try { done({ http: res.statusCode, json: JSON.parse(raw) }); }
        catch { done({ http: res.statusCode, json: null }); }
      });
    });
    req.setTimeout(timeoutMs(), () => {
      req.destroy(new Error('VISION_TIMEOUT'));
      done({ http: 0, timeout: true });
    });
    req.on('error', () => done({ http: 0, network: true }));
    req.write(body);
    req.end();
  });

  if (result.timeout) return { degraded: true, reason: 'timeout', analysis: null };
  if (result.network || !result.http) return { degraded: true, reason: 'network', analysis: null };
  if (result.http !== 200) return { degraded: true, reason: 'http_' + result.http, analysis: null };
  const choice = result.json && result.json.choices && result.json.choices[0];
  const content = choice && choice.message && choice.message.content;
  const analysis = parseVisionResult(content);
  return analysis ? { degraded: false, reason: 'ok', analysis } : { degraded: true, reason: 'bad_json', analysis: null };
}

module.exports = { analyzeRepairImage, parseVisionResult, buildVisionMessages };
