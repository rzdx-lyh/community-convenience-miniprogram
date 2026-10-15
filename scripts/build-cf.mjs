/**
 * 部署打包：node scripts/build-cf.mjs [--clean]
 *
 * 微信云开发上传云函数时每个函数目录必须自包含，因此把 cloudfunctions/shared/ 复制进各资源目录，
 * 本地开发时资源目录内用 require('../shared/...') 直接引用，无需先跑本脚本。
 *   --clean：打包前先删除各资源目录下已存在的 shared/（避免残留旧文件）
 *
 * 注意：不要提交打包产物（各资源目录下的 shared/ 副本），.gitignore 已忽略。
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
  const target = path.join(CF_ROOT, r, 'shared');
  if (clean && existsSync(target)) rmSync(target, { recursive: true, force: true });
  copyDir(SHARED, target);
  console.log(`已打包 shared/ → cloudfunctions/${r}/shared/`);
});
console.log(`完成：${resources.length} 个云函数（${resources.join(', ')}）。上传后可用 --clean 清理本地副本。`);
