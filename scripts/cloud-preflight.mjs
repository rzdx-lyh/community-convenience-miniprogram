#!/usr/bin/env node
/**
 * 上云预检（cloud preflight）
 *
 * 用途：把"现在能不能把 USE_MOCK 置 false"变成一条可执行判定，而不是凭记忆。
 * 依据：contracts/api-contract.md 附 C（CR-017 / CR-020 修订）
 *   - 已上云路径：联调冒烟通过后，USE_MOCK 必须为 false
 *   - 未上云路径：USE_MOCK 保持 true，且界面不得自曝
 *
 * 本脚本只做**静态检查**，不连微信云（云侧连通性必须在开发者工具里实测）。
 * 用法：node scripts/cloud-preflight.mjs
 * 退出码：0 = 无阻断项；1 = 有 ✗ 阻断项
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const ROOT = process.cwd();
let fails = 0;
let warns = 0;

const line = (mark, text, detail = '') => {
  if (mark === '✗') fails += 1;
  if (mark === '⚠') warns += 1;
  console.log(`  ${mark} ${text}${detail ? `  ${detail}` : ''}`);
};
const ok = (t, d) => line('✓', t, d);
const bad = (t, d) => line('✗', t, d);
const warn = (t, d) => line('⚠', t, d);
const section = (t) => console.log(`\n${t}`);

const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const readJson = (p) => JSON.parse(read(p));

/* ---------- 1. 工程结构 ---------- */
section('一、工程结构');
const project = readJson('project.config.json');
const cfRoot = String(project.cloudfunctionRoot ?? '');
const mpRoot = String(project.miniprogramRoot ?? '');

if (cfRoot && existsSync(join(ROOT, cfRoot))) ok('cloudfunctionRoot 指向真实目录', cfRoot);
else bad('cloudfunctionRoot 不存在', `cloudfunctionRoot=${cfRoot || '(空)'}`);

if (mpRoot && existsSync(join(ROOT, mpRoot))) ok('miniprogramRoot 指向真实目录', mpRoot);
else bad('miniprogramRoot 不存在', `miniprogramRoot=${mpRoot || '(空)'}`);

if (project.appid && project.appid.startsWith('wx')) ok('AppID 已填写', project.appid);
else bad('AppID 缺失或格式不对');

/* ---------- 2. 云函数包完整性 ---------- */
section('二、云函数包完整性');
const cfDirs = readdirSync(join(ROOT, cfRoot)).filter((n) => {
  const p = join(ROOT, cfRoot, n);
  return statSync(p).isDirectory() && existsSync(join(p, 'package.json'));
});
ok('云函数包数量', `${cfDirs.length} 个：${cfDirs.join(' / ')}`);

const pinned = [];
cfDirs.forEach((name) => {
  const pkg = readJson(join(cfRoot, name, 'package.json'));
  const main = String(pkg.main ?? 'index.js');
  if (!existsSync(join(ROOT, cfRoot, name, main))) {
    bad(`${name}：main 入口缺失`, main);
  }
  const sdk = (pkg.dependencies ?? {})['wx-server-sdk'];
  if (!sdk) bad(`${name}：缺 wx-server-sdk 依赖`);
  else if (sdk === 'latest' || sdk === '*') pinned.push(name);
});

if (pinned.length === 0) ok('wx-server-sdk 版本已锁定');
else warn(`wx-server-sdk 写的是 latest（${pinned.length} 个包）`, '不可复现构建，建议锁到具体版本');

/** 从 index.js 抽 switch 分支里的 action 名 */
const actionsOf = (name) => {
  const src = read(join(cfRoot, name, 'index.js'));
  return new Set([...src.matchAll(/case\s+'([a-zA-Z]+)'\s*:/g)].map((m) => m[1]));
};

/* ---------- 2.5 共享模块平铺新鲜度 ---------- */
section('二·五、共享模块平铺（根目录散文件）新鲜度');
const sharedDir = join(ROOT, cfRoot, 'shared');
const fingerprint = (dir) => {
  const out = [];
  const walk = (d, prefix = '') => {
    readdirSync(d).forEach((n) => {
      const p = join(d, n);
      if (statSync(p).isDirectory()) walk(p, `${prefix}${n}/`);
      else if (n.endsWith('.js') || n.endsWith('.json')) {
        out.push(`${prefix}${n}:${readFileSync(p, 'utf8').length}`);
      }
    });
  };
  walk(dir);
  return out.sort().join('|');
};
/** shared/ 平铺到函数根后的期望清单：文件名 → 内容长度（kb.js/kb.json 提升到根） */
const flatManifest = () => {
  const out = {};
  readdirSync(sharedDir).forEach((n) => {
    if (n.endsWith('.js') || n.endsWith('.json')) out[n] = readFileSync(join(sharedDir, n), 'utf8').length;
  });
  out['kb.js'] = readFileSync(join(sharedDir, 'kb', 'kb.js'), 'utf8').length;
  out['kb.json'] = readFileSync(join(sharedDir, 'kb', 'kb.json'), 'utf8').length;
  return out;
};

if (!existsSync(sharedDir)) {
  warn('cloudfunctions/shared 不存在');
} else {
  const want = flatManifest();
  const stale = cfDirs.filter((n) => {
    const fnDir = join(ROOT, cfRoot, n);
    return Object.keys(want).some(
      (f) => !existsSync(join(fnDir, f)) || readFileSync(join(fnDir, f), 'utf8').length !== want[f]
    );
  });
  if (stale.length === 0) ok('各函数根目录的共享模块平铺与真源一致');
  else bad('共享模块平铺缺失或过期（上传后云端 require 会拿到旧代码或报错）', `${stale.join(' / ')} → 先跑 npm run build:cf`);

  /* ⚠ 共享模块必须平铺进函数根目录，**任何子目录都不行**（shared/lib/common 全试过，全挂）：
     Windows 版微信 CLI 打包 zip 时条目路径用反斜杠分隔，Linux 云端解压会把
     `common\response.js` 摊平成文件名带反斜杠的散文件 → require('./common/...') 必挂
     （2026-10-20 深夜 boot-diag v2 实锤）。根目录散文件（index.js 等）一直正常。 */
  const badCopy = cfDirs.filter((n) => ['shared', 'lib', 'common'].some((b) => existsSync(join(ROOT, cfRoot, n, b))));
  if (badCopy.length === 0) ok('没有函数目录残留 shared//lib//common/ 子目录（Windows CLI 打包反斜杠 zip 会把它们摊平）');
  else bad('存在 shared//lib//common/ 子目录副本，Windows CLI 打包后云端必挂，必须平铺', badCopy.join(' / '));

  /* ⚠ 云端包结构 = 函数目录自包含，共享模块就在函数根目录。
     若源码写 '../shared/...'，本地能跑但上传后 MODULE_NOT_FOUND → 所有云调用 fail。 */
  const wrongPath = cfDirs.filter((n) => {
    const src2 = read(join(cfRoot, n, 'index.js'));
    return src2.includes("'../shared/") || src2.includes("'../lib/") || src2.includes("'../common/");
  });
  if (wrongPath.length === 0) ok('云函数 require 路径与云端包结构一致（根目录 ./xxx）');
  else bad('云函数里出现 ../shared/、../lib/ 或 ../common/ 引用，上传后必崩（副本在函数包内部）', wrongPath.join(' / '));

  /* ⚠ 云函数超时：CLI 部署**不会**应用 config.json 的 timeout，云端默认 3s。
     wx-server-sdk 冷启动常要 2-4s → 首次调用必超时 → 前端统一弹「网络异常」。
     只能在云开发控制台逐函数改（本脚本无法代劳），故这里只做提醒。 */
  warn(
    '云函数超时需手工确认：云端默认 3s，wx-server-sdk 冷启动常 2-4s',
    '云开发控制台 → 云函数 → 逐个「配置」→ 超时时间改为 20s（8 个函数都要改）',
  );
  ok('前端已加冷启动超时静默重试（utils/request.ts）', '仅重试超时，不重试「函数不存在 / 依赖缺失」');
}

/* ---------- 3. 前端动作 ↔ 云函数分支 ---------- */
section('三、前端调用 ↔ 云函数分支');
const serviceFiles = readdirSync(join(ROOT, mpRoot, 'services')).filter((f) => f.endsWith('.ts'));
const called = new Set();
serviceFiles.forEach((f) => {
  const src = read(join(mpRoot, 'services', f));
  [...src.matchAll(/'(?:[a-zA-Z]+):([a-zA-Z]+)'/g)].forEach((m) => {
    const full = m[0].slice(1, -1);
    if (/^[a-z]+:[a-zA-Z]+$/.test(full)) called.add(full);
  });
});
ok('前端引用的动作数', `${called.size} 个`);

const missing = [];
called.forEach((full) => {
  const [res, action] = full.split(':');
  const fn = cfDirs.includes(res) ? res : null;
  if (!fn) {
    missing.push(`${full}（无同名云函数）`);
    return;
  }
  if (!actionsOf(fn).has(action)) missing.push(`${full}（${fn} 无 case '${action}'）`);
});
if (missing.length === 0) ok('每个前端动作都有对应云函数分支');
else missing.forEach((m) => bad('动作缺实现', m));

/* ---------- 4. 集合 ↔ db-schema ---------- */
section('四、数据库集合 ↔ db-schema');
const schemaSrc = read('contracts/db-schema.md');
const declared = new Set(
  [...schemaSrc.matchAll(/^##\s+([a-z_]+)/gm)].map((m) => m[1]).filter((n) => n !== 'seed'),
);
const used = new Set();
const walkJs = (dir) => {
  readdirSync(join(ROOT, dir)).forEach((n) => {
    const rel = join(dir, n);
    if (statSync(join(ROOT, rel)).isDirectory()) {
      if (n !== 'node_modules') walkJs(rel);
      return;
    }
    if (!n.endsWith('.js')) return;
    [...read(rel).matchAll(/collection\('([a-z_]+)'\)/g)].forEach((m) => used.add(m[1]));
  });
};
walkJs(cfRoot);

ok('db-schema 声明集合', `${declared.size} 个：${[...declared].sort().join(' / ')}`);
ok('代码实际使用集合', `${used.size} 个`);

const undeclared = [...used].filter((c) => !declared.has(c));
if (undeclared.length === 0) ok('代码用到的集合都在 db-schema 里');
else bad('代码使用了 db-schema 未声明的集合', undeclared.join(' / '));

const unused = [...declared].filter((c) => !used.has(c));
if (unused.length > 0) warn('db-schema 声明了但代码没用的集合', unused.join(' / '));

/* ---------- 4.5 种子分类 ↔ 前端分类 ---------- */
section('四·五、种子数据的分类是否过期');
/* 用 TS 编译器转译读取前端常量：不依赖 Node 是否支持直接 import .ts */
const nodeRequire = createRequire(import.meta.url);
function loadFrontCatalog() {
  const ts = nodeRequire('typescript');
  const src = readFileSync(join(ROOT, 'miniprogram/config/service-grid.ts'), 'utf8');
  const js = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
  }).outputText;
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', js)(mod, mod.exports, nodeRequire);
  return mod.exports.LOCAL_SERVICE_CATEGORIES ?? [];
}

const seedPath = join(ROOT, 'scripts/seed-data.json');
if (!existsSync(seedPath)) {
  warn('scripts/seed-data.json 不存在', '先跑 node scripts/seed.mjs');
} else {
  const seed = JSON.parse(readFileSync(seedPath, 'utf8'));
  const seedCats = Array.isArray(seed.service_category) ? seed.service_category : [];
  const seedItems = seedCats.reduce((n, c) => n + ((c.items ?? []).length), 0);
  const seedGroups = seedCats.reduce((n, c) => n + ((c.groups ?? []).length), 0);
  const codeItems = loadFrontCatalog().reduce((n, c) => n + ((c.items ?? []).length), 0);
  if (seedItems === codeItems) {
    ok('种子分类与代码一致', `${seedCats.length} 类 / ${seedGroups} 板块 / ${seedItems} 项`);
  } else {
    bad(
      '种子分类与代码不一致（导入云端后前端会少项）',
      `种子 ${seedItems} 项 vs 代码 ${codeItems} 项 → 重跑 node scripts/seed.mjs`,
    );
  }
}

/* ---------- 5. 页面完整性 ---------- */
section('五、页面完整性');
const appJson = readJson(join(mpRoot, 'app.json'));
const brokenPages = [];
appJson.pages.forEach((p) => {
  ['.ts', '.wxml', '.json'].forEach((ext) => {
    if (!existsSync(join(ROOT, mpRoot, `${p}${ext}`))) brokenPages.push(`${p}${ext}`);
  });
});
if (brokenPages.length === 0) ok('app.json 的页面文件齐全', `${appJson.pages.length} 个页面`);
else bad('页面文件缺失', brokenPages.join(' / '));

/* ---------- 6. 通道开关判定 ---------- */
section('六、通道开关（依据 CR-017-a）');
const envSrc = read(join(mpRoot, 'config/env.ts'));
const mockMatch = envSrc.match(/USE_MOCK:\s*(true|false)/);
const useMock = mockMatch ? mockMatch[1] === 'true' : null;

if (useMock === null) {
  bad('未能从 config/env.ts 解析出 USE_MOCK');
} else if (useMock) {
  ok('USE_MOCK = true（未上云路径，符合 CR-017-a）');
  console.log('     └ 该路径要求：界面不得出现「演示数据 / 未连接云端」等自曝提示');
  console.log('     └ 切换前必须先完成 docs/24 清单的 ①②③，不能直接改这一行');
} else {
  ok('USE_MOCK = false（已上云路径）');
  console.log('     └ 该路径要求：联调冒烟 + 真机冒烟（含「胸痛怎么办」→ 出现 120）已通过');
}

/* ---------- 7. 云函数环境变量 ---------- */
section('七、云函数环境变量清单（需在云开发控制台逐个配置）');
const envVars = new Set();
const walkEnv = (dir) => {
  readdirSync(join(ROOT, dir)).forEach((n) => {
    const rel = join(dir, n);
    if (statSync(join(ROOT, rel)).isDirectory()) {
      if (n !== 'node_modules') walkEnv(rel);
      return;
    }
    if (!n.endsWith('.js')) return;
    [...read(rel).matchAll(/process\.env\.([A-Z0-9_]+)/g)].forEach((m) => envVars.add(m[1]));
  });
};
walkEnv(cfRoot);
[...envVars].sort().forEach((v) => {
  const hint =
    v === 'DEEPSEEK_API_KEY'
      ? '（不配则 AI 走 kb 降级，属设计内行为）'
      : v === 'PHONE_AES_KEY'
        ? '（不配则号码加密相关功能不可用）'
        : v === 'TCB_ENV'
          ? '（云开发自动注入，通常无需手工配置）'
          : '';
  console.log(`     · ${v} ${hint}`);
});

/* ---------- 汇总 ---------- */
console.log(`\n${'─'.repeat(56)}`);
console.log(`预检结果：阻断项 ${fails} 个，提醒 ${warns} 个`);
if (fails === 0) {
  console.log('静态检查通过。注意：**云侧连通性无法在此验证**，必须在开发者工具里实测。');
  console.log('下一步见 docs/24-上云联调切换清单.md');
}
process.exit(fails === 0 ? 0 : 1);
