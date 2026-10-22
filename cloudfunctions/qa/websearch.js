'use strict';

/**
 * 实时网页检索（零额外 npm 依赖）
 *
 * 流程：Bing RSS 搜索 -> 取前几条结果 -> 并行抓取前 N 个网页 -> 提取标题/摘要/正文。
 * 约束：
 * - 只允许 http/https，拒绝 localhost / 私网地址，避免 SSRF；
 * - 搜索、单页抓取都有硬超时；整体耗时必须明显小于云函数 20s 超时；
 * - 任一来源失败都不影响其他来源，最终由 qa 层决定是否降级。
 */
const https = require('https');
const http = require('http');
const { URL } = require('url');
const { TextDecoder } = require('util');

const DEFAULT_SEARCH_TIMEOUT_MS = 5000;
const DEFAULT_PAGE_TIMEOUT_MS = 2000;
const DEFAULT_MAX_PAGES = 3;
const MAX_RESULTS = 6;
const MAX_PAGE_BYTES = 600 * 1024;
const MAX_EXCERPT_CHARS = 1400;
const CACHE_TTL_MS = 10 * 60 * 1000;
const searchCache = new Map();

function numEnv(name, fallback, min, max) {
  const n = Number(process.env[name]);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

function decodeEntities(input) {
  return String(input || '')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'");
}

function cleanText(input, max = 500) {
  const text = decodeEntities(String(input || '').replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function isSafeHttpUrl(raw) {
  try {
    const u = new URL(String(raw));
    if (!['http:', 'https:'].includes(u.protocol)) return false;
    const host = u.hostname.toLowerCase();
    if (!host || host === 'localhost' || host.endsWith('.local')) return false;
    if (/^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host)) return false;
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return false;
    if (host === '0.0.0.0' || host === '::1' || host === '[::1]') return false;
    return true;
  } catch {
    return false;
  }
}

function decodeBody(buffer, headers) {
  const contentType = String(headers['content-type'] || '');
  let charset = (contentType.match(/charset\s*=\s*["']?([^;"'\s]+)/i) || [])[1] || '';
  if (!charset) {
    const head = buffer.subarray(0, 4096).toString('latin1');
    charset = (head.match(/<meta[^>]+charset\s*=\s*["']?([^"'\s/>]+)/i) || [])[1] || 'utf-8';
  }
  const normalized = charset.toLowerCase().replace(/^gb2312$/, 'gbk');
  try {
    return new TextDecoder(normalized).decode(buffer);
  } catch {
    return buffer.toString('utf8');
  }
}

function requestText(rawUrl, { timeoutMs, maxBytes = MAX_PAGE_BYTES, redirects = 3 } = {}) {
  return new Promise((resolve) => {
    if (!isSafeHttpUrl(rawUrl) || redirects < 0) {
      resolve({ ok: false, reason: 'unsafe_url', url: rawUrl, body: '', status: 0 });
      return;
    }
    const target = new URL(rawUrl);
    const mod = target.protocol === 'https:' ? https : http;
    let settled = false;
    let req;
    let deadlineTimer = null;
    const done = (value) => {
      if (settled) return;
      settled = true;
      if (deadlineTimer) clearTimeout(deadlineTimer);
      resolve(value);
    };
    try {
      req = mod.get(
        target,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.7',
          },
        },
        (res) => {
          const status = Number(res.statusCode || 0);
          if (status >= 300 && status < 400 && res.headers.location) {
            res.resume();
            requestText(new URL(res.headers.location, target).toString(), {
              timeoutMs,
              maxBytes,
              redirects: redirects - 1,
            }).then(done);
            return;
          }
          const chunks = [];
          let size = 0;
          let truncated = false;
          res.on('data', (chunk) => {
            if (size >= maxBytes) {
              truncated = true;
              return;
            }
            const remain = maxBytes - size;
            chunks.push(chunk.length > remain ? chunk.subarray(0, remain) : chunk);
            size += Math.min(chunk.length, remain);
          });
          res.on('end', () => {
            const buffer = Buffer.concat(chunks);
            done({
              ok: status >= 200 && status < 300,
              reason: status >= 200 && status < 300 ? 'ok' : `http_${status}`,
              url: target.toString(),
              status,
              contentType: String(res.headers['content-type'] || ''),
              body: decodeBody(buffer, res.headers),
              truncated,
            });
          });
          res.on('error', (e) => done({ ok: false, reason: 'read_error', url: target.toString(), body: '', status, error: e.message }));
        },
      );
    } catch (e) {
      done({ ok: false, reason: 'request_error', url: rawUrl, body: '', status: 0, error: e.message });
      return;
    }
    deadlineTimer = setTimeout(() => {
      req.destroy(new Error('WEB_TIMEOUT'));
      done({ ok: false, reason: 'timeout', url: target.toString(), body: '', status: 0 });
    }, timeoutMs);
    if (deadlineTimer.unref) deadlineTimer.unref();
    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error('WEB_TIMEOUT'));
      done({ ok: false, reason: 'timeout', url: target.toString(), body: '', status: 0 });
    });
    req.on('error', (e) => {
      if (e && e.message === 'WEB_TIMEOUT') return;
      done({ ok: false, reason: 'network', url: target.toString(), body: '', status: 0, error: e && e.message });
    });
  });
}

function parseBingRss(xml) {
  const items = [];
  for (const match of String(xml || '').matchAll(/<item>([\s\S]*?)<\/item>/gi)) {
    const block = match[1];
    const title = cleanText((block.match(/<title>([\s\S]*?)<\/title>/i) || [])[1], 180);
    const url = decodeEntities((block.match(/<link>([\s\S]*?)<\/link>/i) || [])[1] || '').trim();
    const snippet = cleanText((block.match(/<description>([\s\S]*?)<\/description>/i) || [])[1], 360);
    if (title && isSafeHttpUrl(url)) items.push({ title, url, snippet });
    if (items.length >= MAX_RESULTS) break;
  }
  return items;
}

function parseBingHtml(html) {
  const items = [];
  for (const block of String(html || '').matchAll(/<li class="b_algo"[\s\S]*?<\/li>/gi)) {
    const raw = block[0];
    const linkMatch = raw.match(/<h2[^>]*>\s*<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
    if (!linkMatch) continue;
    const url = decodeEntities(linkMatch[1]);
    const title = cleanText(linkMatch[2], 180);
    const snippet = cleanText((raw.match(/<p[^>]*>([\s\S]*?)<\/p>/i) || [])[1], 360);
    if (title && isSafeHttpUrl(url)) items.push({ title, url, snippet });
    if (items.length >= MAX_RESULTS) break;
  }
  return items;
}

function parseSoHtml(html) {
  const items = [];
  const blocks = String(html || '').matchAll(/<li[^>]+class="[^"]*\bres-list\b[^"]*"[^>]*>([\s\S]*?)<\/li>/gi);
  for (const block of blocks) {
    const raw = block[1];
    const titleMatch = raw.match(/<h3[^>]*class="[^"]*\bres-title\b[^"]*"[^>]*>[\s\S]*?<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
    if (!titleMatch) continue;
    const mdUrl = decodeEntities((raw.match(/\bdata-mdurl="([^"]+)"/i) || [])[1] || '').trim();
    const href = decodeEntities(titleMatch[1] || '').trim();
    const url = mdUrl || href;
    const title = cleanText(titleMatch[2], 180);
    const descMatch =
      raw.match(/<p[^>]*class="[^"]*\bres-desc\b[^"]*"[^>]*>([\s\S]*?)<\/p>/i) ||
      raw.match(/<div[^>]*class="[^"]*\bres-desc\b[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    const snippet = cleanText(descMatch ? descMatch[1] : '', 360);
    if (title && isSafeHttpUrl(url)) items.push({ title, url, snippet });
    if (items.length >= MAX_RESULTS) break;
  }
  return items;
}

function normalizeSearchUrl(href, base) {
  const raw = decodeEntities(String(href || '')).trim();
  if (!raw) return '';
  if (raw.startsWith('//')) return 'https:' + raw;
  if (raw.startsWith('/')) return base + raw;
  return raw;
}

function parseSogouHtml(html) {
  const items = [];
  const blocks = String(html || '').matchAll(/<div class="vrwrap"[^>]*>([\s\S]*?)(?=<div class="vrwrap"|$)/gi);
  for (const block of blocks) {
    const raw = block[1];
    const titleMatch = raw.match(/<h3[^>]*class="[^"]*\bvr-title\b[^"]*"[^>]*>[\s\S]*?<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
    if (!titleMatch) continue;
    const url = normalizeSearchUrl(titleMatch[1], 'https://www.sogou.com');
    const title = cleanText(titleMatch[2], 180);
    const descMatch =
      raw.match(/<div[^>]*class="[^"]*(?:\bstr-text\b|\btext-layout\b|\bspace-txt\b)[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
      raw.match(/<p[^>]*class="[^"]*(?:\bstr-text\b|\btext-layout\b)[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
    const snippet = cleanText(descMatch ? descMatch[1] : raw, 360);
    if (title && isSafeHttpUrl(url)) items.push({ title, url, snippet });
    if (items.length >= MAX_RESULTS) break;
  }
  return items;
}

async function searchSogou(query, timeoutMs) {
  const url = 'https://www.sogou.com/web?query=' + encodeURIComponent(String(query || '').slice(0, 160));
  const res = await requestText(url, { timeoutMs, maxBytes: 900 * 1024 });
  if (!res.ok) return { results: [], reason: res.reason };
  const results = dedupeResults(parseSogouHtml(res.body)).slice(0, MAX_RESULTS);
  return { results, reason: results.length ? 'ok' : 'empty' };
}

async function searchSo(query, timeoutMs) {
  const url = 'https://www.so.com/s?q=' + encodeURIComponent(String(query || '').slice(0, 160));
  const res = await requestText(url, { timeoutMs, maxBytes: 900 * 1024 });
  if (!res.ok) return { results: [], reason: res.reason };
  const results = dedupeResults(parseSoHtml(res.body)).slice(0, MAX_RESULTS);
  return { results, reason: results.length ? 'ok' : 'empty' };
}

function dedupeResults(results) {
  const out = [];
  const seenUrl = new Set();
  const seenDomain = new Map();
  for (const item of results || []) {
    let host = '';
    try {
      host = new URL(item.url).hostname.replace(/^www\./, '').toLowerCase();
    } catch {
      continue;
    }
    if (['so.com', 'ai.so.com', 'bing.com', 'cn.bing.com'].includes(host)) continue;
    const key = item.url.replace(/#.*$/, '');
    if (seenUrl.has(key)) continue;
    const domainCount = seenDomain.get(host) || 0;
    if (domainCount >= 2) continue;
    seenUrl.add(key);
    seenDomain.set(host, domainCount + 1);
    out.push({ ...item, domain: host });
  }
  return out;
}

async function searchBing(query, timeoutMs) {
  const url =
    'https://cn.bing.com/search?q=' +
    encodeURIComponent(String(query || '').slice(0, 160)) +
    '&format=rss&setlang=zh-hans&cc=cn';
  const res = await requestText(url, { timeoutMs, maxBytes: 300 * 1024 });
  if (!res.ok) return { results: [], reason: res.reason };
  let results = parseBingRss(res.body);
  if (results.length === 0 && /<html[\s>]/i.test(res.body)) results = parseBingHtml(res.body);
  return { results: dedupeResults(results).slice(0, MAX_RESULTS), reason: results.length ? 'ok' : 'empty' };
}

function extractPage(html, fallbackTitle, fallbackSnippet) {
  const raw = String(html || '');
  const title = cleanText((raw.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || fallbackTitle, 180);
  const description = cleanText(
    (raw.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) || [])[1] ||
      (raw.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i) || [])[1] ||
      (raw.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i) || [])[1] ||
      '',
    420,
  );
  const withoutNoise = raw
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<header[\s\S]*?<\/header>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<form[\s\S]*?<\/form>/gi, ' ');
  const blocks = [];
  const seen = new Set();
  for (const m of withoutNoise.matchAll(/<(?:h1|h2|h3|p|li)[^>]*>([\s\S]*?)<\/(?:h1|h2|h3|p|li)>/gi)) {
    const text = cleanText(m[1], 600);
    if (text.length < 12 || /^(首页|登录|注册|关于我们|联系我们|更多|上一页|下一页)$/.test(text)) continue;
    if (seen.has(text)) continue;
    seen.add(text);
    blocks.push(text);
    if (blocks.join(' ').length >= MAX_EXCERPT_CHARS) break;
  }
  let content = [description, ...blocks].filter(Boolean).join(' ').trim();
  if (content.length < 120) {
    const fullText = cleanText(withoutNoise, MAX_EXCERPT_CHARS);
    content = [description, fullText].filter(Boolean).join(' ').trim();
  }
  if (content.length > MAX_EXCERPT_CHARS) content = `${content.slice(0, MAX_EXCERPT_CHARS)}...`;
  return { title: title || fallbackTitle, content: content || fallbackSnippet };
}

async function enrichResult(item, timeoutMs) {
  const res = await requestText(item.url, { timeoutMs, maxBytes: MAX_PAGE_BYTES });
  if (!res.ok || !/html|xml|text/i.test(res.contentType || 'text/html')) return item;
  const page = extractPage(res.body, item.title, item.snippet);
  return {
    ...item,
    title: page.title || item.title,
    content: page.content || item.snippet,
  };
}

/**
 * @returns {Promise<{enabled:boolean, ok:boolean, reason:string, query:string, results:Array, costMs:number}>}
 */
async function searchWeb(question) {
  const startedAt = Date.now();
  if (process.env.WEB_SEARCH_ENABLED === '0') {
    return { enabled: false, ok: false, reason: 'disabled', query: '', results: [], costMs: 0 };
  }
  const query = String(question || '').trim().slice(0, 160);
  if (!query) return { enabled: true, ok: false, reason: 'empty_query', query, results: [], costMs: 0 };
  const cached = searchCache.get(query);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return { ...cached.value, cached: true, costMs: 0 };
  }

  const searchTimeout = numEnv('WEB_SEARCH_TIMEOUT_MS', DEFAULT_SEARCH_TIMEOUT_MS, 2000, 6000);
  const pageTimeout = numEnv('WEB_FETCH_TIMEOUT_MS', DEFAULT_PAGE_TIMEOUT_MS, 1500, 5000);
  const maxPages = numEnv('WEB_SEARCH_MAX_PAGES', DEFAULT_MAX_PAGES, 0, 4);
  const provider = String(process.env.WEB_SEARCH_PROVIDER || 'so').toLowerCase();
  let search;
  if (provider === 'bing') search = await searchBing(query, Math.min(1500, searchTimeout));
  else if (provider === 'sogou') search = await searchSogou(query, searchTimeout);
  else search = await searchSo(query, searchTimeout);
  if (!search.results.length && provider === 'sogou' && search.reason !== 'timeout') search = await searchSo(query, Math.min(1500, searchTimeout));
  if (!search.results.length && provider === 'so' && search.reason !== 'timeout') search = await searchBing(query, Math.min(1000, searchTimeout));
  if (!search.results.length) {
    return { enabled: true, ok: false, reason: search.reason, query, results: [], costMs: Date.now() - startedAt };
  }
  const enriched = maxPages > 0
    ? await Promise.all(search.results.slice(0, maxPages).map((item) => enrichResult(item, pageTimeout)))
    : search.results;
  const results = enriched.map((item) => ({
    title: item.title,
    url: item.url,
    domain: item.domain,
    snippet: item.snippet,
    content: item.content || item.snippet,
  }));
  const value = { enabled: true, ok: true, reason: 'ok', query, results, costMs: Date.now() - startedAt };
  searchCache.set(query, { at: Date.now(), value });
  if (searchCache.size > 100) searchCache.delete(searchCache.keys().next().value);
  console.log(`[websearch] ok query=${JSON.stringify(query)} results=${results.length} cost_ms=${value.costMs}`);
  return value;
}

function toSourceLabels(results) {
  return (results || []).map((r, i) => `[${i + 1}] ${r.title}（${r.domain}）${r.url}`);
}

module.exports = {
  searchWeb,
  toSourceLabels,
  // 导出纯函数，便于本地单测/排查
  _internal: { cleanText, decodeEntities, isSafeHttpUrl, parseBingRss, parseSoHtml, parseSogouHtml, extractPage, dedupeResults },
};