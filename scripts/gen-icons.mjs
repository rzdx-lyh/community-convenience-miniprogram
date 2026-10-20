/**
 * 图标系统生成器（CR-025）
 *
 * 作用：把设计原型 docs/03-preview/demo.html 里的内联 SVG symbol sprite
 * 栅格化并内联成 WXSS，供小程序用「纯 CSS 类名」引用矢量图标，替换 emoji 占位。
 *
 * 为什么栅格化成 PNG 而不是直接内联 SVG：
 *   小程序 WXSS 的 background-image 只保证支持 https 与 base64 图片，
 *   SVG 的 data URI 在部分 Android 内核上不解码 → 图标全丢。PNG 是唯一稳的形态。
 *
 * 为什么走 background-image 而不是 <image src="data:...">：
 *   图源留在样式表里，不进 setData，列表页不会因为几十个图标把 wxml 和内存撑爆。
 *
 * 产物：miniprogram/styles/icons.wxss
 *   .ic           基础类（background-repeat/position/size）
 *   .ic-<name>    图标（深色 #12203A，用于浅底）
 *   .icw.ic-<name> 同一图标的白色版（用于彩色/深色底），特异性 0,2,0 覆盖 0,1,0
 *   .ic-s/.ic-m/.ic-l 尺寸档（32/40/48rpx）
 *
 * 运行（sharp 装在受管 workspace，不在本仓库依赖里）：
 *   NODE_PATH=.../node/workspace/node_modules node scripts/gen-icons.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PROTOTYPE = resolve(ROOT, 'docs/03-preview/demo.html');
const OUT = resolve(ROOT, 'miniprogram/styles/icons.wxss');

/**
 * 渲染尺寸：64px。
 * 图标在页面上的实际尺寸是 32~48rpx（16~24px 逻辑像素），3x 屏需要 48~72px 物理像素，
 * 64px 是清晰度与包体积的平衡点（96px 会让 WXSS 涨到 1.8MB，直接吃掉大半个包配额）。
 */
const SIZE = 64;
/**
 * 配色策略：深色版全员生成（浅底通用）；白色版只生成**会放在彩色/深色底上**的图标。
 * 两套全量 = 850KB WXSS，白色按需裁剪后 ≈ 590KB —— 图标是包体积大头，不能无脑全量。
 * 新增彩色底用法时，把图标名加进 WHITE_ICONS 再重跑生成器（tests/icons.test.ts 会兜底校验）。
 */
const WHITE_ICONS = new Set([
  // 办事大厅 AI 集群卡（图标底色 = 场景主色）
  'file', 'wrench', 'stetho', 'bowl', 'bulb', 'pin', 'users', 'warn',
  // 首页四张分类卡 / 快捷入口（品牌色块）
  'home', 'elder', 'tools', 'book-open', 'hospital',
  // 通用入口（AI、紧急、导航、消息）
  'robot', 'sparkles', 'phone', 'bell', 'megaphone', 'chat', 'plus', 'check', 'bolt', 'map',
  // CR-028 页面重写：彩色页头 .pgh-ic（半透明白底）里的服务图标
  'book', 'clipboard', 'syringe', 'package',
]);

/** 从原型里抽出 <symbol id="ic-xxx" ...>inner</symbol> */
function extractSymbols(html) {
  const re = /<symbol id="ic-([\w-]+)"[^>]*>([\s\S]*?)<\/symbol>/g;
  const out = [];
  let m;
  while ((m = re.exec(html)) !== null) out.push({ name: m[1], inner: m[2] });
  return out;
}

/** 组装一张独立 SVG：外层 g 统一给描边样式，内联 currentColor 替换成目标色 */
function buildSvg(inner, color, size = SIZE) {
  const body = inner.replace(/currentColor/g, color);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">`
    + `<g fill="none" stroke="${color}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">`
    + `${body}</g></svg>`;
}

/** TabBar 用：图标略粗一点，81px 缩小到 24px 视觉尺寸后仍看得清 */
const buildSvgSize = (inner, color, size) =>
  buildSvg(inner, color, size).replace('stroke-width="1.9"', 'stroke-width="2.1"');

/**
 * sharp 装在受管 workspace（不进本仓库依赖，避免污染 package.json），
 * ESM 不认 NODE_PATH，所以显式用 createRequire 从该目录解析。
 * 可通过 SHARP_MODULES 环境变量覆盖目录。
 */
const SHARP_MODULES =
  process.env.SHARP_MODULES ||
  'C:/Users/Administrator/.workbuddy/binaries/node/workspace/node_modules';
let sharp;
try {
  sharp = createRequire(resolve(SHARP_MODULES, 'noop.js'))('sharp');
} catch (err) {
  console.error(`× 找不到 sharp，请先安装：cd ${SHARP_MODULES}/.. && npm i sharp`);
  console.error(`  (${String(err && err.message)})`);
  process.exit(1);
}

const html = readFileSync(PROTOTYPE, 'utf8');
const symbols = extractSymbols(html);
if (symbols.length === 0) {
  console.error('× 没抽到任何 symbol，检查原型 sprite 结构是否变了');
  process.exit(1);
}

/**
 * TabBar 图标：小程序 tabBar 的 iconPath 只认**本地图片文件**，用不了 WXSS 类，
 * 所以同一批矢量图标还要额外导出成 PNG 文件（4 个 Tab × 选中/未选中两态）。
 * 尺寸 81×81：官方建议，非 81 会被缩放导致图标糊。
 */
const TABBAR = resolve(ROOT, 'miniprogram/assets/tabbar');
const TABBAR_ICONS = [
  { tab: 'home', icon: 'home' },
  { tab: 'hall', icon: 'grid' },
  { tab: 'circle', icon: 'users' },
  { tab: 'profile', icon: 'user' },
];
const TABBAR_SIZE = 81;

const rules = [];
let bytes = 0;
let whiteCount = 0;
let tabBytes = 0;

async function render(name, inner, color) {
  const svg = Buffer.from(buildSvg(inner, color));
  // 单色 + 透明 → 转灰度+alpha（2 通道），比 RGBA 省 ~30%
  const png = await sharp(svg, { density: 384 })
    .toColourspace('b-w')
    .png({ compressionLevel: 9 })
    .toBuffer();
  bytes += png.length;
  return png.toString('base64');
}

for (const { name, inner } of symbols) {
  rules.push(`.ic-${name}{background-image:url("data:image/png;base64,${await render(name, inner, '#12203A')}")}`);
  if (WHITE_ICONS.has(name)) {
    whiteCount += 1;
    rules.push(`.icw.ic-${name}{background-image:url("data:image/png;base64,${await render(name, inner, '#FFFFFF')}")}`);
  }
}

/* ---- TabBar 图标文件（同一批 symbol，导出为 PNG 文件供 app.json 引用） ---- */
mkdirSync(TABBAR, { recursive: true });
for (const { tab, icon } of TABBAR_ICONS) {
  const symbol = symbols.find((s) => s.name === icon);
  if (!symbol) {
    console.error(`× 原型里没有 ic-${icon}，TabBar 图标生成中止`);
    process.exit(1);
  }
  for (const [state, color] of [['', '#8593A8'], ['-on', '#1F5FD6']]) {
    const svg = Buffer.from(buildSvgSize(symbol.inner, color, TABBAR_SIZE));
    const png = await sharp(svg, { density: 384 })
      .toColourspace('b-w')
      .png({ compressionLevel: 9 })
      .toBuffer();
    tabBytes += png.length;
    writeFileSync(resolve(TABBAR, `${tab}${state}.png`), png);
  }
}

const wxss = `/* ============================================================
 * icons.wxss · 矢量图标系统（CR-025 · 由 scripts/gen-icons.mjs 生成）
 * 来源：docs/03-preview/demo.html 的内联 SVG symbol sprite（${symbols.length} 枚）
 * ⚠ 本文件是**生成物**，不要手改；改图标请改原型后重跑生成器。
 *
 * 用法：<view class="ic ic-m ic-home" />     （深色，浅底）
 *       <view class="ic ic-m icw ic-home" /> （白色，彩色/深底）
 * ============================================================ */

.ic {
  display: inline-block;
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
  flex: none;
}

/* 尺寸档 */
.ic-s { width: 32rpx; height: 32rpx; }
.ic-m { width: 40rpx; height: 40rpx; }
.ic-l { width: 48rpx; height: 48rpx; }

${rules.join('\n')}
`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, wxss, 'utf8');

console.log(`√ 生成 ${symbols.length} 枚深色图标 + ${whiteCount} 枚白色图标 = ${rules.length} 条规则`);
console.log(`  PNG 合计 ${(bytes / 1024).toFixed(1)} KB → WXSS ${(wxss.length / 1024).toFixed(1)} KB`);
console.log(`  输出：${OUT}`);
console.log(`√ TabBar 图标 ${TABBAR_ICONS.length} 个 × 2 态 = ${TABBAR_ICONS.length * 2} 张，`
  + `合计 ${(tabBytes / 1024).toFixed(1)} KB`);
console.log(`  输出：${TABBAR}`);
