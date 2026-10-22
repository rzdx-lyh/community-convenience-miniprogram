/**
 * 部署打包：node scripts/build-cf.mjs [--clean]
 *
 * 微信云开发上传云函数时**每个函数目录必须自包含**（云端包里只有该函数目录下的文件），
 * 因此把 cloudfunctions/shared/ 复制进各资源目录，源码里一律 require('./shared/...')。
 *
 * ⚠ 血泪教训（2026-10-19）：源码曾经写 require('../shared/...')，本地指向 cloudfunctions/shared/ 没问题，
 *   但上传后 shared/ 在函数包**内部**，'../shared' 指到包外面 → 云端 MODULE_NOT_FOUND → 所有云调用 fail，
 *   前端统一表现为「网络异常，请检查网络后重试」。**云端与本地的包结构不同，路径必须以云端为准。**
 *
 *   --clean：打包前先删除各资源目录下已存在的 shared/（避免残留旧文件）
 *
 * 注意：不要提交打包产物（各资源目录下的 shared/ 副本），.gitignore 已忽略。
 * 部署前**必须**先跑本脚本，否则函数里没有 shared/ 会直接崩。
 */
import { copyFileSync, mkdirSync, rmSync, existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CF_ROOT = path.join(ROOT, 'cloudfunctions');
const SHARED = path.join(CF_ROOT, 'shared');

const resources = readdirSync(CF_ROOT).filter((d) => {
  if (d === 'shared') return false;
  return statSync(path.join(CF_ROOT, d)).isDirectory() && existsSync(path.join(CF_ROOT, d, 'index.js'));
});

// 不用 fs.cpSync：本机 Node v22 在 Windows 下调用 cpSync 会直接段错误（exit 139），改为手写递归复制
function copyDir(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else copyFileSync(from, to);
  }
}

const clean = process.argv.includes('--clean');
resources.forEach((r) => {
  const fnDir = path.join(CF_ROOT, r);
  // ⚠ 共享模块必须**平铺进函数根目录**，绝不能放进任何子目录（shared/lib/common 都试过，全挂）：
  //   Windows 上的微信 CLI 打包 zip 时把条目路径写成反斜杠分隔（违反 ZIP 规范），
  //   Linux 云端解压时把 `common\response.js` 摊平成**文件名里带反斜杠的散文件**——
  //   云端根本没有 common/ 目录，require('./common/response') 必然 MODULE_NOT_FOUND
  //   （2026-10-20 深夜 boot-diag v2 实锤：root 清单全是 `common\xxx.js` 带反斜杠条目）。
  //   函数根目录的散文件（index.js 等）一直能正常加载，所以平铺是唯一可靠结构。
  for (const legacy of ['shared', 'lib', 'common']) {
    const legacyDir = path.join(fnDir, legacy);
    if (existsSync(legacyDir)) rmSync(legacyDir, { recursive: true, force: true });
  }
  // 顶层 .js 直接平铺；kb.js / kb.json 从 shared/kb/ 拉到根目录（qa 以 require('./kb') 引用）
  for (const entry of readdirSync(SHARED, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (entry.name === 'kb') continue; // kb 单独处理
      throw new Error(`shared/ 下出现未知子目录 ${entry.name}，请确认平铺策略是否覆盖它`);
    }
    copyFileSync(path.join(SHARED, entry.name), path.join(fnDir, entry.name));
  }
  copyFileSync(path.join(SHARED, 'kb', 'kb.js'), path.join(fnDir, 'kb.js'));
  copyFileSync(path.join(SHARED, 'kb', 'kb.json'), path.join(fnDir, 'kb.json'));
  console.log(`已平铺 shared/ → cloudfunctions/${r}/（根目录散文件）`);
});
console.log(`完成：${resources.length} 个云函数（${resources.join(', ')}）。上传后可用 --clean 清理本地副本。`);
