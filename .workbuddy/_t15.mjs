import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire('C:/Users/Administrator/.workbuddy/binaries/node/workspace/');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync('C:/Users/Administrator/Desktop/code/ai web/社区便民小程序/docs/03-preview/demo.html', 'utf8');
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'https://x.test/' });
const { window } = dom; const doc = window.document;
const $ = s => doc.querySelector(s), qa = s => [...doc.querySelectorAll(s)];
const ev = s => window.eval(s);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const txt = e => (e ? e.textContent.replace(/\s+/g, ' ').trim() : '');
const click = e => { if (!e) throw new Error('no element'); e.click(); };
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log('  ✓ ' + n); } else { fail++; console.log('  ✗ ' + n + (x !== undefined ? '  → ' + x : '')); } };

async function run() {
  await sleep(110);
  ev(`state.auth='done';state.page='home';render();`); await sleep(30);

  console.log('\n[1] 圈子浮动按钮的定位上下文（本次 Bug 根因）');
  ev(`state.page='circle';render();`); await sleep(40);
  const fab = $('.fab2');
  ok('圈子页有发布浮动按钮', !!fab);
  const scrollParent = fab && fab.closest('.page');
  ok('★ 不在可滚动的 .page 里（否则会跟着列表滚走）', scrollParent === null, scrollParent ? '仍嵌套在 .page 内' : 'ok');
  const wrap = fab && fab.parentElement;
  ok('挂在独立浮层 #fabwrap 上', wrap && wrap.id === 'fabwrap', wrap ? wrap.id : 'none');
  ok('#fabwrap 是 .phone 的直接子节点', wrap && wrap.parentElement && wrap.parentElement.id === 'phone',
    wrap && wrap.parentElement ? wrap.parentElement.id : 'none');
  ok('#fabwrap 本身不占位（空 div 无定位）',
    ev(`getComputedStyle(document.getElementById('fabwrap')).position`) === 'static',
    ev(`getComputedStyle(document.getElementById('fabwrap')).position`));
  ok('浮动按钮 position:absolute', ev(`getComputedStyle(document.querySelector('.fab2')).position`) === 'absolute');
  ok('距底 66px（底栏 50 + 间隙 16）', ev(`getComputedStyle(document.querySelector('.fab2')).bottom`) === '66px',
    ev(`getComputedStyle(document.querySelector('.fab2')).bottom`));
  ok('层级在 tabbar(30) 之上', +ev(`getComputedStyle(document.querySelector('.fab2')).zIndex`) === 31,
    ev(`getComputedStyle(document.querySelector('.fab2')).zIndex`));
  ok('层级在遮罩(40) 之下，开弹层时会被盖住',
    +ev(`getComputedStyle(document.querySelector('.fab2')).zIndex`) < 40);

  console.log('\n[2] 图标与可点性');
  ok('用矢量加号而不是文字＋', !!fab.querySelector('svg use'), fab.innerHTML.slice(0, 60));
  ok('加号引用的是 ic-plus', (fab.querySelector('use') || {}).getAttribute('href') === '#ic-plus',
    (fab.querySelector('use') || {}).getAttribute('href'));
  ok('加号有实际尺寸', ev(`getComputedStyle(document.querySelector('.fab2 .ii')).fontSize`) === '20px',
    ev(`getComputedStyle(document.querySelector('.fab2 .ii')).fontSize`));
  click(fab); await sleep(60);
  ok('点加号打开发布弹层', /发布动态/.test(txt($('#sheet'))), txt($('#sheet')).slice(0, 18));
  ok('发布弹层里 4 种类型都在', qa('#sheet [data-act="dtype"]').length === 4, qa('#sheet [data-act="dtype"]').length);
  ok('弹层打开时遮罩在浮动按钮之上（可正常遮挡）',
    +ev(`getComputedStyle(document.querySelector('.mask')).zIndex`) > +ev(`getComputedStyle(document.querySelector('.fab2')).zIndex`));
  click($('#mask')); await sleep(30);

  console.log('\n[3] 只在圈子页出现');
  for (const p of ['home', 'hall', 'profile', 'meal', 'map', 'kit']) {
    ev(`state.page='${p}';render();`); await sleep(12);
    ok(`${p} 页没有发布浮钮`, !$('.fab2'), $('.fab2') ? 'still there' : '');
  }
  ev(`state.page='circle';render();`); await sleep(20);
  ok('回圈子又出现', !!$('.fab2'));

  console.log('\n[4] 登录门禁时也不漏出');
  ev(`state.auth='login';render();`); await sleep(20);
  ok('登录页没有发布浮钮', !$('.fab2'));
  ev(`state.auth='welcome';render();`); await sleep(20);
  ok('完善资料页没有发布浮钮', !$('.fab2'));
  ev(`state.auth='done';state.page='circle';render();`); await sleep(20);
  ok('重新放行后回到圈子有浮钮', !!$('.fab2'));

  console.log('\n[5] 地图页定位按钮同类检查');
  ev(`state.page='map';render();`); await sleep(140);
  const mfab = $('.mfab');
  ok('地图页有重新定位按钮', !!mfab);
  ok('定位按钮用矢量图标（不再是 ◎ 字符）', mfab && !!mfab.querySelector('svg use'),
    mfab ? mfab.innerHTML.slice(0, 40) : 'none');
  const mparent = mfab && mfab.closest('.mapcard');
  ok('定位按钮锚在 .mapcard（有 position:relative）上',
    mparent && ev(`getComputedStyle(document.querySelector('.mapcard')).position`) === 'relative',
    mparent ? ev(`getComputedStyle(document.querySelector('.mapcard')).position`) : 'no .mapcard');
  ok('定位按钮没有被错误地锚到可滚动的 .page 上', mfab && !mfab.closest('.page').classList.contains('mapcard'));
  ok('墙内界面不再残留 ◎ 字符（说明文案里提到不算）', txt($('#screen')).indexOf('◎') < 0 && txt($('#tabbar')).indexOf('◎') < 0);

  console.log('\n[6] 回归');
  ev(`state.page='circle';render();`); await sleep(30);
  ok('圈子 9 帖仍在', qa('.post2').length >= 9, qa('.post2').length);
  ok('帖子卡片位置未受影响（无重叠残留）', !$('.page .fab2'));
  ev(`state.page='profile';render();`); await sleep(20);
  ok('我的页正常', /阿明/.test(txt($('.pnm'))));

  console.log(`\n===== ${pass} passed, ${fail} failed =====`);
  process.exit(fail ? 1 : 0);
}
run().catch(e => { console.error('FATAL', e.message); process.exit(2); });
