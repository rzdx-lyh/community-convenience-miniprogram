/**
 * 本地联调服务（前端未接真云环境时使用）：node scripts/mock-server.mjs
 * 监听 127.0.0.1:3000，复刻 wx.cloud.callFunction 的调用形态：
 *
 *   curl -X POST http://127.0.0.1:3000/callFunction \
 *        -H 'Content-Type: application/json' \
 *        -d '{"name":"notice","data":{"action":"urgentLatest","limit":5},"openid":"mock-resident-1"}'
 *
 * 说明：
 * - name 支持两种写法：'notice'（data.action 决定动作）与 'notice:urgentLatest'（自动拆出动作）
 * - openid 由请求体注入（仅本地联调用；真环境一律取 wxContext.OPENID，前端传 openid 会被忽略）
 * - 数据来自 scripts/seed-data.json，重跑 node scripts/seed.mjs 可刷新
 */
import http from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CF = (name) => path.join(ROOT, 'cloudfunctions', name, 'index.js');

if (!existsSync(path.join(ROOT, 'scripts', 'seed-data.json'))) {
  console.error('缺少 scripts/seed-data.json，请先执行 node scripts/seed.mjs');
  process.exit(2);
}

const RESOURCES = ['auth', 'user', 'workorder', 'notice', 'circle', 'service', 'phonebook', 'qa'];
const mains = {};
RESOURCES.forEach((r) => { mains[r] = require(CF(r)).main; });

const PORT = Number(process.env.MOCK_PORT || 3000);

function send(res, code, body) {
  const buf = Buffer.from(JSON.stringify(body));
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': buf.length,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST,GET,OPTIONS',
  });
  res.end(buf);
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  if (req.method === 'GET' && req.url === '/health') {
    return send(res, 200, { ok: true, mode: 'mock', resources: RESOURCES });
  }
  if (req.method !== 'POST') return send(res, 404, { error: 'not found' });

  let raw = '';
  req.on('data', (c) => { raw += c; });
  req.on('end', async () => {
    try {
      const body = JSON.parse(raw || '{}');
      let { name } = body;
      const data = Object.assign({}, body.data || {});
      // 支持 name = '资源:动作' 的写法
      if (name && name.includes(':') && !data.action) {
        const [res1, act] = name.split(':');
        name = res1;
        data.action = act;
      }
      if (!mains[name]) return send(res, 400, { code: 400, msg: `未知云函数 ${name}`, data: null });

      globalThis.__MOCK_OPENID__ = body.openid || 'mock-resident-1';
      const started = Date.now();
      const result = await mains[name](data, {});
      console.log(`[mock] ${name}:${data.action || '-'} openid=${body.openid || 'mock-resident-1'} code=${result.code} ${Date.now() - started}ms`);
      return send(res, 200, result);
    } catch (e) {
      console.error('[mock] 处理失败：', e);
      return send(res, 500, { code: 500, msg: '服务内部错误', data: null });
    }
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`本地联调服务已启动：http://127.0.0.1:${PORT}/callFunction（mock 模式，数据来自 seed-data.json）`);
});
