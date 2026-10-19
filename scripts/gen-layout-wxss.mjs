/**
 * 布局层生成器（CR-028）
 *
 * 作用：把设计原型 docs/03-preview/demo.html 的 <style> 类体系转成小程序可用的
 * WXSS 布局层，供所有页面直接复用原型类名（.page/.nav/.pgh/.card/.g4/...）。
 *
 * 为什么要生成而不是手写：
 *   原型有 360+ 个类，手抄必然漂移。生成器保证「原型一改、重跑即同步」，
 *   与 icons.wxss 同一理念（同源同生成物）。
 *
 * 转换规则（原型是 375px 宽，小程序 750rpx = 375pt → 1px = 2rpx）：
 *   1. px → rpx（×2）；但 1px 细边框保持 1px（rpx 取整会变粗，细线观感优先）
 *   2. inset:A / inset:A B → top/right/bottom/left 展开（小程序对 inset 支持不稳）
 *   3. .page 由绝对定位改为自然流（小程序页面自身滚动，不能 position:absolute）
 *   4. .mask / .sheet / .fab2 / .fbar / .footbar 改 position:fixed（弹层与操作条要贴视口）
 *   5. 删除 demo 舞台壳（body、通配符、h1、.stage、.phone、.screen、.tabbar、.sbar、.sub、.sws、.sw、.demo）
 *      与「组件库预览页」专用类（kit 系列、iwall、iw、sprite、skel、dev、dgrid、tmap 系列）
 *   6. :active 规则保留（小程序不生效但无害，页面层用 hover-class 表达按压态）
 *
 * 产物：miniprogram/styles/layout.wxss（生成物，不要手改）
 * 运行：node scripts/gen-layout-wxss.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = resolve(ROOT, 'docs/03-preview/demo.html');
const OUT = resolve(ROOT, 'miniprogram/styles/layout.wxss');

/** 整条规则丢弃：选择器命中这些类名（精确匹配）即视为 demo 舞台/组件库预览专用 */
const DROP_CLASSES = new Set([
  // demo 舞台外壳
  'top', 'sub', 'sws', 'sw', 'stage', 'phone', 'screen', 'tabbar', 'demo',
  // 组件库预览页专用（.iwall 图标墙 / .iw 单元 / .sprite 隐藏的 svg symbol）
  'sprite', 'iwall', 'iw',
  // 地图 DOM 版（小程序用原生 map 组件，这些类无用）
  'tmap', 'tmapfb', 'tmapbox',
  // 组件库预览的区块容器
  'kitbox', 'kitrow', 'kitsec',
]);
// ⚠ 不要丢：dgrid（图片九宫格）、dev（设备卡）、care（关怀变量）、skel（骨架屏）
//   它们出现在真实业务页里，曾被误判为预览专用导致页面布局塌陷。
/** 选择器里出现这些片段直接丢弃（demo 外壳与 PC 断点） */
const DROP_SELECTOR_PATTERNS = [/^body\b/, /^\*/, /^html\b/, /^h1\b/, /@media/];
/** 需要改定位的类 */
const FIXED_CLASSES = new Set(['mask', 'sheet', 'fab2', 'fbar', 'footbar']);

/** px → rpx（×2，1px 细边框保持 1px） */
function px2rpx(css) {
  return css.replace(/(-?\d*\.?\d+)px/g, (m, n) => {
    const v = parseFloat(n);
    if (v === 0) return '0';
    if (v === 1 || v === -1) return `${v}px`; // 细线保持物理像素
    const r = Math.round(v * 2 * 100) / 100;
    return `${r}rpx`;
  });
}

/**
 * ⚠ 选择器重命名：原型的 `.ic` 是「图标底座」（40x40 圆角 + flex 居中），
 * 而 icons.wxss 的 `.ic` 是「图标本体」（background-image + 尺寸档 .ic-s/.ic-m/.ic-l）。
 * 同名同权重、layout 后 import 会覆盖尺寸档 → 所有图标变成 80rpx 且带圆角底座。
 * 这里把原型的底座类统一改名为 `.ib`（icon base），避开冲突。
 */
function renameIc(sel) {
  return sel.replace(/\.ic(?![a-zA-Z0-9_-])/g, '.ib');
}

/** 原型大量用 HTML 标签选择器（.st b / .p-act div），WXML 没有 b/p/div → 补类名等价选择器 */
const TAG_TO_CLASS = { b: 'b', p: 'p', em: 'em', i: 'i', div: 'd', span: 'sp', strong: 'b', small: 'sm' };

/**
 * 给选择器补「标签名 → 类名」的等价版本：
 *   `.st b`        → `.st b, .st .b`
 *   `.gh b::before`→ `.gh b::before, .gh .b::before`
 *   `.p-act div`   → `.p-act div, .p-act .d`
 * 页面里写 <text class="b"> 就能命中，不必每页手抄一遍桥接样式。
 */
function bridgeTags(sel) {
  const extra = [];
  for (const [tag, cls] of Object.entries(TAG_TO_CLASS)) {
    const re = new RegExp(`(^|[\\s>+~])${tag}(?=$|[\\s.:>+~])`);
    if (re.test(sel)) extra.push(sel.replace(re, `$1.${cls}`));
  }
  return extra.length ? [sel, ...extra] : [sel];
}

/** inset 展开 */
function expandInset(css) {
  return css.replace(/inset:\s*([^;}]+)/g, (m, val) => {
    const p = val.trim().split(/\s+/);
    if (p.length === 1) return `top:${p[0]};right:${p[0]};bottom:${p[0]};left:${p[0]}`;
    if (p.length === 2) return `top:${p[0]};right:${p[1]};bottom:${p[0]};left:${p[1]}`;
    if (p.length === 3) return `top:${p[0]};right:${p[1]};bottom:${p[2]};left:${p[1]}`;
    return `top:${p[0]};right:${p[1]};bottom:${p[2]};left:${p[3]}`;
  });
}

/** 选择器是否要丢 */
function shouldDrop(sel) {
  const s = sel.trim();
  for (const re of DROP_SELECTOR_PATTERNS) if (re.test(s)) return true;
  // 提取选择器里的类名（.foo 后面不能紧跟字母数字连字符）
  const classes = [...s.matchAll(/\.([a-zA-Z_][a-zA-Z0-9_-]*)/g)].map((m) => m[1]);
  // 只要命中任一「专用类」且不是复合状态类，就丢
  for (const c of classes) if (DROP_CLASSES.has(c)) return true;
  return false;
}

/** 逐条规则处理 body 内的声明 */
function fixDecls(sel, decl) {
  let d = decl;
  // .page：绝对定位 → 自然流
  if (/^\.page\b/.test(sel.trim())) {
    d = d.replace(/position:\s*absolute;?/g, '');
    d = d.replace(/overflow-y:\s*auto;?/g, '');
    d = d.replace(/overflow-x:\s*hidden;?/g, '');
    d = d.replace(/padding-bottom:\s*[^;}]+;?/g, ''); // 原生 tabBar 不覆盖内容，无需留白
    // inset 展开后残留的四向偏移无意义（已无 position），清掉
    d = d.replace(/(?:top|right|bottom|left):\s*0;?/g, '');
    d = 'min-height:100vh;box-sizing:border-box;' + d;
  }
  // 弹层/操作条 → fixed（只认选择器最后一段，即真正被命中的那个元素）
  // ⚠ 不能用「包含」判断：`.fbar .sum` / `.fbar .btn2` 是 fbar 的子元素，不该被 fixed
  if (sel.split(',').some((one) => {
    const last = one.trim().split(/\s+/).pop() ?? '';
    const classes = [...last.matchAll(/\.([a-zA-Z_][a-zA-Z0-9_-]*)/g)].map((m) => m[1]);
    return classes.some((c) => FIXED_CLASSES.has(c));
  })) {
    d = d.replace(/position:\s*(absolute|sticky);?/g, 'position:fixed;');
    if (!/position:\s*fixed/.test(d)) d = 'position:fixed;' + d;
    // ⚠ 原型用 display:none 做「默认隐藏 + JS 切换」，小程序改用 wx:if 控制，
    //   若保留 display:none，wx:if 为真时依然不可见 —— 弹层永远不显示。
    d = d.replace(/display:\s*none;?/g, '');
  }
  return d;
}

/* ========== 解析 ========== */
const html = readFileSync(SRC, 'utf8');
const styleStart = html.indexOf('<style>');
const styleEnd = html.indexOf('</style>');
if (styleStart < 0 || styleEnd < 0) throw new Error('demo.html 里找不到 <style>');
const cssRaw = html.slice(styleStart + 7, styleEnd);

/** 按顶层规则切分：返回 [{sel, body}] 或 {atRule, inner} */
function parseRules(css) {
  const rules = [];
  let i = 0;
  while (i < css.length) {
    // 跳过空白与注释
    while (i < css.length && /\s/.test(css[i])) i++;
    if (css.startsWith('/*', i)) {
      const e = css.indexOf('*/', i + 2);
      i = e < 0 ? css.length : e + 2;
      continue;
    }
    if (i >= css.length) break;
    // 读选择器（到 { 为止）
    let braceIdx = css.indexOf('{', i);
    if (braceIdx < 0) break;
    const sel = css.slice(i, braceIdx).trim();
    // 找匹配的 }
    let depth = 1;
    let j = braceIdx + 1;
    while (j < css.length && depth > 0) {
      if (css[j] === '{') depth++;
      else if (css[j] === '}') depth--;
      j++;
    }
    const body = css.slice(braceIdx + 1, j - 1);
    if (sel.startsWith('@')) rules.push({ atRule: sel, inner: body });
    else rules.push({ sel, body });
    i = j;
  }
  return rules;
}

const rules = parseRules(cssRaw);
const out = [];
const dropped = [];

for (const r of rules) {
  if (r.atRule) {
    if (/@media/.test(r.atRule)) { dropped.push(r.atRule); continue; }
    // @keyframes 原样保留（内部声明不做 px→rpx 会失真，但 transform 无 px；保险起见只转 px）
    out.push(`${r.atRule}{${px2rpx(r.inner)}}`);
    continue;
  }
  // 原型 :root 变量表 → 小程序 page（wxss 没有 :root，变量要挂在 page 上才能被后代继承）
  if (r.sel.trim() === ':root') {
    let decl = r.body.trim().replace(/\s*\n\s*/g, ' ');
    decl = expandInset(decl);
    decl = px2rpx(decl);
    // 补彩色页头默认渐变（原型每个 .pgh 由内联 style 传 --h1/--h2，这里给兜底）
    decl = '--h1:#3B7DEE;--h2:#153F9B;' + decl;
    out.push(`page{${decl}}`);
    continue;
  }
  // 逗号分组的每个选择器单独判断，全丢才丢
  const sels = r.sel
    .split(',')
    .map((s) => renameIc(s.trim()))
    .filter(Boolean);
  const keep = sels.filter((s) => !shouldDrop(s));
  if (keep.length === 0) { dropped.push(r.sel); continue; }
  if (keep.length !== sels.length) dropped.push(r.sel + '（部分）');
  let decl = r.body.trim().replace(/\s*\n\s*/g, ' ');
  decl = expandInset(decl);
  decl = px2rpx(decl);
  // 标签名桥接：同时输出原型选择器与类名等价版
  const bridged = keep.flatMap((s) => bridgeTags(s));
  decl = fixDecls(bridged.join(','), decl);
  out.push(`${bridged.join(',')}{${decl}}`);
}

const header = `/* ============================================================
 * layout.wxss · 布局类体系（CR-028 · 由 scripts/gen-layout-wxss.mjs 生成）
 * 来源：docs/03-preview/demo.html（设计稿 ${((html.match(/<meta name="version" content="([^"]+)"/) || [])[1] || '?').replace(/^v/, '')}）
 * ⚠ 本文件是**生成物**，不要手改；改样式请改原型后重跑生成器。
 *   本文件末尾有一段「小程序适配层」是生成器内联的手写补充，不是从原型抄的。
 * ⚠ 注意：这里写 "设计稿 1.4.0" 而不是带 v 前缀的版本号 —— tests/version.test.ts 会把
 *   vX.Y.Z 形态当成产品版本号，要求全仓只有 APP_VERSION 一个真源。
 *
 * 用法：页面直接套用原型类名
 *   <view class="page">          页面容器（自然流）
 *   <view class="nav">           二级页顶栏（.bk 返回 / .rt 右侧操作）
 *   <view class="pgh">           彩色页头（--h1/--h2 传渐变色）
 *   <view class="card"> / .blk / .grp   卡片
 *   <view class="g4"> + .gi      四列宫格
 *   <view class="btn"> / .btn2   主按钮
 * 配色 token 见 app.wxss（--blue/--red/--gold/--teal/--indigo/--t1..--t3）。
 * ============================================================ */

`;

/* ========== 小程序适配层（手写补充，跟生成规则一起输出） ========== */
const ADAPTER = `
/* ============================================================
 * 小程序适配层（生成器内联，非原型内容）
 * ============================================================ */

/* 状态栏占位：原型固定 24px，真机刘海高度不同。
   页面在最外层 .sbar / .nav / .pgh 上用内联 style="padding-top:{{statusBarHeight}}px"
   覆盖；这里只给一个安全兜底，避免完全没有适配时被状态栏压住。 */
.sbar {
  min-height: 48rpx;
  padding-top: env(safe-area-inset-top);
  box-sizing: content-box;
}
.pgh .sbar,
.hd .sbar {
  padding-top: env(safe-area-inset-top);
  box-sizing: content-box;
}

/* fixed 底部操作条会盖住内容：页面根节点加 .page--fbar 自动留白 */
.page--fbar {
  padding-bottom: 200rpx;
}

/* 原生 tabBar 页面：底部无需再给固定条留白 */
.page--tab {
  padding-bottom: 0;
}

/* 弹层默认不占位（显隐交给 wx:if），避免空节点参与布局 */
.mask--wx {
  z-index: 900;
}
.sheet--wx {
  z-index: 950;
  border-radius: 32rpx 32rpx 0 0;
}

/* 小程序 button 原生样式重置：原型里 .btn/.btn2 是全宽块按钮 */
button.btn,
button.btn2,
button.btn3 {
  margin: 0;
  padding: 0;
  line-height: normal;
  font-weight: inherit;
  border-radius: inherit;
}
button.btn::after,
button.btn2::after,
button.btn3::after {
  border: 0;
}

/* input / textarea 在小程序里默认有内边距与高度差异，统一按原型尺寸 */
input.inp,
textarea.ta {
  box-sizing: border-box;
}

/* 单行/多行截断工具（原型用 CSS 实现，小程序同样适用，此处仅补 -webkit 前缀） */
.ellipsis {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.ellipsis-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 滚动条隐藏（原型各横向滚动容器用） */
::-webkit-scrollbar {
  width: 0;
  height: 0;
  display: none;
}

/* 内联 CSS 变量兜底：原型有 .xc / .mring 依赖内联 style 传 --xk/--mc/--p，
   小程序对「style 里写自定义属性」支持不稳定，这里给默认值，页面改用修饰类传色。 */
.xc {
  --xbg: #FFF9ED;
  --xbd: #F1E2C2;
  --xk: #A86A05;
}
.xc.x-sell { --xbg: #F5F3FF; --xbd: #E3DDFB; --xk: #4B45B8; }
.xc.x-event { --xbg: #ECF9F6; --xbd: #CFEBE4; --xk: #0E7C6B; }
.xc.x-road { --xbg: #F1F5FD; --xbd: #DAE5F8; --xk: #1F5FD6; }
.mring { --mc: #1FA97A; --p: 0; }

/* 彩色页头主题（原型每个 .pgh 用内联 style="--h1:..;--h2:.." 传色，
   小程序不认内联变量 → 收敛成 5 套主题类，页面写 class="pgh pgh--teal" 即可）。
   取色与原型一致：蓝=家政/通用，金=缴费，青=健康/设备，靛=圈子/工具，红=紧急。 */
.pgh--blue { --h1: #2E6BE0; --h2: #153F9B; }
.pgh--gold { --h1: #F2A93B; --h2: #A85A08; }
.pgh--teal { --h1: #0E8F9E; --h2: #0A5A66; }
.pgh--indigo { --h1: #6C63D8; --h2: #4B45B8; }
.pgh--red { --h1: #D9534F; --h2: #A32E22; }
.pgh--green { --h1: #12A08A; --h2: #0B6E5F; }
`;

writeFileSync(OUT, header + out.join('\n') + '\n' + ADAPTER, 'utf8');
console.log(`✅ 已生成 ${OUT}`);
console.log(`   规则 ${out.length} 条 / 丢弃 ${dropped.length} 条`);
console.log(`   字节 ${readFileSync(OUT).length}`);
