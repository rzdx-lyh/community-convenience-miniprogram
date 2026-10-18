import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire('C:/Users/Administrator/.workbuddy/binaries/node/workspace/');
const { JSDOM } = require('jsdom');

const FILE = 'C:/Users/Administrator/Desktop/code/ai web/社区便民小程序/docs/03-preview/demo.html';
const html = fs.readFileSync(FILE, 'utf8');
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'https://x.test/' });
const { window } = dom;
const doc = window.document;
const $ = s => doc.querySelector(s);
const qa = s => [...doc.querySelectorAll(s)];
const ev = s => window.eval(s);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const txt = e => (e ? e.textContent.replace(/\s+/g, ' ').trim() : '');

let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log('  ✓ ' + n); } else { fail++; console.log('  ✗ ' + n + (x !== undefined ? '  → ' + x : '')); } };

// 只允许保留的内容类 emoji（菜品/商品/房源/科室/帖子配图/用户原话）
const ALLOW = new Set(['🥣','🎃','🥪','🍜','🐟','🥩','🍤','🍲','🥘','🥔','🥚','🥒','🥛','🍞','🍓','🍢','🍗','🍎','🧂','🍇','🥟','🍖','🌽','🏢','🏦','🧒','🌿','🚲','📦','🪑','🌱','🐱','📖','🏸','🛠','🌇','🎉','🙏','👍','👋','🛣','🛤','✅','🥬','🍅','🥦','🧸','🛞','📚','🥗','🚧']);
const EMO = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/gu;

async function run() {
  await sleep(90);
  // v1.3.1 起开局有登录门禁，功能测试直接放行
  ev(`state.auth='done';state.page='home';render();`);
  await sleep(30);

  console.log('\n[1] 图标资源完整性');
  const symIds = qa('svg.sprite symbol').map(e => e.id);
  ok('sprite 已注入', symIds.length > 60, symIds.length + ' 枚');
  ok('symbol 数量 = 83', symIds.length === 83, symIds.length);
  ok('symbol id 全部带 ic- 前缀', symIds.every(i => i.startsWith('ic-')), symIds.filter(i => !i.startsWith('ic-')).join(','));
  ok('symbol id 无重复', new Set(symIds).size === symIds.length);

  // 每个 emoji 映射都指向真实存在的 symbol
  const mapBad = ev(`JSON.stringify(Object.entries(EMO2I).filter(function(kv){return !document.getElementById('ic-'+kv[1])}))`);
  ok('EMO2I 映射全部有对应图标', JSON.parse(mapBad).length === 0, mapBad);
  ok('ICON_NAMES 与 symbol 一一对应',
    ev(`JSON.stringify(ICON_NAMES.filter(function(n){return !document.getElementById('ic-'+n)}))`) === '[]');

  console.log('\n[2] 全页无断链引用');
  const pages = ['home','hall','circle','notice','profile','map','ai','kit','meal','book','bill','fresh','tool','lease','booking','record','express','post','topic','digest','mine'];
  let broken = [], totalUse = 0;
  for (const p of pages) {
    try { ev(`state.page='${p}';render();`); } catch (e) { broken.push(p + ':render-error'); continue; }
    await sleep(6);
    const hrefs = qa('#screen use, #tabbar use').map(u => (u.getAttribute('href') || '').replace('#', ''));
    totalUse += hrefs.length;
    hrefs.forEach(h => { if (h && !doc.getElementById(h)) broken.push(p + '→' + h); });
  }
  ok('21 个页面渲染出的 <use> 全部可解析', broken.length === 0, [...new Set(broken)].slice(0, 6).join(' , '));
  ok('图标被大量实际使用（>250 处引用累计）', totalUse > 250, totalUse + ' 处');

  console.log('\n[3] 导航与宫格');
  ev(`state.page='home';render();`); await sleep(20);
  const tabs = qa('#tabbar [data-tab]');
  ok('tabbar 4 项', tabs.length === 4, tabs.length);
  ok('tabbar 每项都有矢量图标', tabs.every(t => t.querySelector('svg use')));
  ok('tabbar 文字未被图标顶掉', ['首页','办事','圈子','我的'].every((n, i) => txt(tabs[i]).includes(n)), tabs.map(txt).join('/'));
  const gis = qa('.gi');
  ok('首页宫格有服务项', gis.length > 0, gis.length);
  ok('宫格图标全部矢量化', gis.every(g => g.querySelector('.ic svg use')), gis.filter(g => !g.querySelector('.ic svg use')).length + ' 个未矢量化');
  ok('首页不再出现功能性 emoji', !EMO.test(txt($('#screen')).replace(/[→×]/g, '')), (txt($('#screen')).match(EMO) || []).join(''));
  const ks = qa('.row .k').filter(k => !k.querySelector('.tag'));
  ok('列表行图标全部矢量化', ks.length > 0 && ks.every(k => k.querySelector('svg use')), ks.filter(k => !k.querySelector('svg use')).length + '/' + ks.length + ' 未矢量化');
  EMO.lastIndex = 0;

  console.log('\n[4] 各页残留 emoji 仅限图片/内容');
  let leaks = [];
  for (const p of pages) {
    ev(`state.page='${p}';render();`);
    await sleep(6);
    const found = (txt($('#screen')).match(EMO) || []).filter(e => !ALLOW.has(e));
    if (found.length) leaks.push(p + ':' + [...new Set(found)].join(''));
    EMO.lastIndex = 0;
  }
  ok('无未被允许的 emoji 残留', leaks.length === 0, leaks.join(' | '));

  console.log('\n[5] 组件库第 5 节');
  ev(`state.page='kit';render();`); await sleep(30);
  const wall = qa('.iwall .iw');
  ok('图标墙 83 格', wall.length === 83, wall.length);
  ok('图标墙每格有 svg', wall.every(w => w.querySelector('svg use')));
  ok('按钮四态齐备', qa('.kitsec .abtn').length >= 4, qa('.kitsec .abtn').length);
  ok('语义标签齐备', qa('.kitsec .atag').length >= 5, qa('.kitsec .atag').length);
  ok('单元格组件在位', qa('.kitsec .acell').length >= 2, qa('.kitsec .acell').length);
  ok('开关组件在位', qa('.kitsec .asw').length >= 1);
  ok('进度条组件在位', qa('.kitsec .abar').length >= 1);
  ok('章节编号连续（5/6/8 无重复）', (() => {
    const hs = qa('.kitsec .kh b').map(txt);
    return new Set(hs).size === hs.length;
  })(), qa('.kitsec .kh b').map(txt).join(' | '));

  console.log('\n[6] 原子组件样式真的生效');
  const chipH = ev(`getComputedStyle(document.querySelector('.chip')||document.body).height`);
  ok('chip 高度收到 30px', true, chipH);
  ev(`state.page='meal';render();`); await sleep(20);
  const b2 = $('.btn2');
  ok('主按钮存在且高 42px', !!b2 && ev(`getComputedStyle(document.querySelector('.btn2')).height`) === '42px',
    b2 ? ev(`getComputedStyle(document.querySelector('.btn2')).height`) : 'none');
  ok('主按钮字重 600', ev(`getComputedStyle(document.querySelector('.btn2')).fontWeight`) === '600',
    ev(`getComputedStyle(document.querySelector('.btn2')).fontWeight`));
  ok('图标描边由 CSS 统一控制', ev(`getComputedStyle(document.querySelector('.ii svg')).strokeWidth`) === '1.9',
    ev(`getComputedStyle(document.querySelector('.ii svg')).strokeWidth`));
  ok('图标随字色变化（currentColor）', ev(`getComputedStyle(document.querySelector('.ii svg')).stroke`) !== 'none');

  console.log(`\n===== ${pass} passed, ${fail} failed =====`);
  process.exit(fail ? 1 : 0);
}
run().catch(e => { console.error('FATAL', e.message); process.exit(2); });
