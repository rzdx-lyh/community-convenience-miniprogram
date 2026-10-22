/**
 * 页面完整性校验（CR-028）
 *
 * 用途：按 UI 设计稿重写页面后，一条命令列出所有「结构性」问题，
 *      作为交接清单（谁接手修都先跑这个）。
 *
 * 检查项：
 *   1. app.json 注册的每个页面，四件套是否齐全（.ts/.wxml/.wxss/.json）
 *   2. wxml 是否误用 HTML 标签（div/span/p/h1/br）—— <br> 会导致编译失败
 *   3. page json 是否有 navigationStyle:custom（或 app.json window 全局开启）
 *   4. wxml 引用的 .ic-xxx 图标是否在 styles/icons.wxss 里存在（不存在 = 空白图标）
 *   5. 是否存在未被 app.json 注册的页面目录（孤儿页）
 *   6. 页面对 config/services 之外不存在模块的引用（粗查相对路径）
 *
 * 运行：node scripts/check-pages.mjs [--strict]
 *   --strict  有 WARN 也以非零码退出（CI 用）
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MP = resolve(ROOT, 'miniprogram');
const STRICT = process.argv.includes('--strict');

const errors = [];
const warns = [];

const appJson = JSON.parse(readFileSync(resolve(MP, 'app.json'), 'utf8'));
const pages = appJson.pages ?? [];
const globalCustom = appJson.window?.navigationStyle === 'custom';

/* 图标清单 */
const iconCss = readFileSync(resolve(MP, 'styles/icons.wxss'), 'utf8');
const iconNames = new Set(
  [...iconCss.matchAll(/\.ic-([a-z0-9-]+)\s*\{/g)].map((m) => m[1])
);

/* 1 + 2 + 3 + 4 */
for (const p of pages) {
  const base = resolve(MP, p);
  const files = { ts: `${base}.ts`, wxml: `${base}.wxml`, wxss: `${base}.wxss`, json: `${base}.json` };
  for (const [ext, f] of Object.entries(files)) {
    if (!existsSync(f)) errors.push(`缺文件  ${p}.${ext}`);
  }

  if (existsSync(files.wxml)) {
    const raw = readFileSync(files.wxml, 'utf8');
    // 先剥离 <!-- --> 注释：注释里提到 <br> 属于说明文字，不参与编译
    const wxml = raw.replace(/<!--[\s\S]*?-->/g, '');
    const bad = [];
    for (const tag of ['div', 'span', 'p', 'h1', 'h2', 'br', 'ul', 'li']) {
      if (new RegExp(`<${tag}[\\s>]`, 'i').test(wxml)) bad.push(`<${tag}>`);
    }
    if (bad.length) errors.push(`非法标签 ${p}.wxml → ${bad.join(' ')}（小程序不支持 HTML 标签，<br> 还会直接编译失败）`);

    // 图标存在性
    const used = new Set([...wxml.matchAll(/\bic-([a-z0-9-]+)\b/g)].map((m) => m[1]));
    const missing = [...used].filter((n) => !iconNames.has(n));
    if (missing.length) warns.push(`图标缺失 ${p}.wxml → ${missing.map((n) => `ic-${n}`).join(', ')}`);

    // 事件里带括号调用（无参数传入，等于没绑对）
    const badTap = [...wxml.matchAll(/bind(?:tap|change|input|confirm)="([^"]*\([^"]*)"/g)].map((m) => m[1]);
    if (badTap.length) warns.push(`事件写法 ${p}.wxml → ${badTap.join(', ')}（小程序不执行 fn(x)，改用 data-* + dataset）`);
  }

  if (existsSync(files.json)) {
    try {
      const j = JSON.parse(readFileSync(files.json, 'utf8'));
      if (!globalCustom && j.navigationStyle !== 'custom') {
        warns.push(`缺自定义导航 ${p}.json（设计稿用自定义 .sbar/.nav，需要 navigationStyle:custom）`);
      }
    } catch (e) {
      errors.push(`JSON 解析失败 ${p}.json → ${e.message}`);
    }
  }
}

/* 5. 孤儿页 */
const allPageDirs = [];
for (const dir of readdirSync(resolve(MP, 'pages'))) {
  const full = resolve(MP, 'pages', dir);
  if (!statSync(full).isDirectory()) continue;
  const inner = readdirSync(full);
  if (inner.includes('index.wxml')) allPageDirs.push(`pages/${dir}/index`);
  for (const sub of inner) {
    const subFull = resolve(full, sub);
    if (statSync(subFull).isDirectory() && readdirSync(subFull).includes('index.wxml')) {
      allPageDirs.push(`pages/${dir}/${sub}/index`);
    }
  }
}
const registered = new Set(pages);
for (const d of allPageDirs) {
  if (!registered.has(d)) warns.push(`未注册页面 pages/${d.replace('pages/', '')}（有文件但不在 app.json.pages 里，不会被编译）`);
}

/* 5.5 图标被 background 简写清空
   `.th-blue .ic { background: #EAF1FE }` 这类写法会把 icons.wxss 里的
   background-image 一并 reset → 图标只剩一块纯色底（2026-10-20 首页 8 宫格、
   AI 助手欢迎卡均踩过）。必须写 background-color。 */
const icOverwrite = [];
function scanWxss(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules') scanWxss(full);
      continue;
    }
    if (!entry.name.endsWith('.wxss')) continue;
    const text = readFileSync(full, 'utf8');
    for (const m of text.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const sel = m[1].trim().replace(/\s+/g, ' ');
      const body = m[2];
      if (!/\.ic(?![a-z0-9-])/.test(sel)) continue;
      if (/background(?!-)\s*:/.test(body)) icOverwrite.push(`${relative(MP, full)} → ${sel.slice(0, 56)}`);
    }
  }
}
scanWxss(MP);
for (const e of icOverwrite) {
  errors.push(`图标被 background 简写清空 ${e}（简写会重置 background-image，图标变纯色块 → 改用 background-color）`);
}

/* 6. 跳转目标存在性：wxml/ts 里写的 /pages/xxx 是否都在 app.json 注册 */
const registeredPaths = new Set(pages.map((p) => `/${p}`));
const navErrors = new Set();
function scanNav(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) { scanNav(full); continue; }
    if (!/\.(ts|wxml)$/.test(entry.name)) continue;
    const text = readFileSync(full, 'utf8');
    for (const m of text.matchAll(/['"`](\/pages\/[a-zA-Z0-9_/-]+?)(?:\?|['"`])/g)) {
      const path = m[1];
      if (!registeredPaths.has(path)) navErrors.add(`${relative(MP, full)} → ${path}`);
    }
  }
}
scanNav(resolve(MP, 'pages'));
for (const e of navErrors) errors.push(`跳转死链 ${e}（目标页未在 app.json.pages 注册，点击无反应）`);

/* 6.5 导航方式：navigateTo 不能打开 Tab 页，switchTab 只能打开 Tab 页 */
const tabPaths = new Set((appJson.tabBar?.list ?? []).map((it) => `/${it.pagePath}`));
const modeErrors = new Set();
function scanNavMode(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) { scanNavMode(full); continue; }
    if (!entry.name.endsWith('.ts')) continue;
    const text = readFileSync(full, 'utf8');
    for (const m of text.matchAll(/wx\.(navigateTo|switchTab)\s*\(\s*\{\s*url\s*:\s*['"`](\/pages\/[^?'"`]+)['"`]/g)) {
      const [, method, path] = m;
      if (method === 'navigateTo' && tabPaths.has(path)) {
        modeErrors.add(`${relative(MP, full)} → navigateTo 不能打开 Tab 页 ${path}`);
      }
      if (method === 'switchTab' && !tabPaths.has(path)) {
        modeErrors.add(`${relative(MP, full)} → switchTab 只能打开 Tab 页 ${path}`);
      }
    }
  }
}
scanNavMode(resolve(MP, 'pages'));
for (const e of modeErrors) errors.push(`导航方式错误 ${e}`);

/* 输出 */
console.log('='.repeat(64));
console.log(`页面校验 · 注册 ${pages.length} 页 · 磁盘 ${allPageDirs.length} 页`);
console.log('='.repeat(64));

if (errors.length) {
  console.log(`\n[ERROR] ${errors.length} 项（会导致编译失败/页面不可用）`);
  errors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
} else {
  console.log('\n[ERROR] 无');
}

if (warns.length) {
  console.log(`\n[WARN] ${warns.length} 项（能跑但有问题）`);
  warns.forEach((w, i) => console.log(`  ${i + 1}. ${w}`));
} else {
  console.log('\n[WARN] 无');
}

const fail = errors.length > 0 || (STRICT && warns.length > 0);
console.log(`\n结论：${fail ? '未通过' : '通过'}`);
process.exit(fail ? 1 : 0);
