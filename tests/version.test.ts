/**
 * v1.0.1 · 版本号单一真源守卫
 *
 * 约束：**代码侧只允许出现一个版本号 v1.0.1**。
 * 版本号分散在 4 类位置（源码注释 / package.json / 云函数包 / README），
 * 靠自觉同步一定会漂——这里把它变成一条能自动跑的断言。
 *
 * 改版本时的正确顺序：`miniprogram/config/env.ts` 的 APP_VERSION → package.json →
 * cloudfunctions/*\/package.json → README。四处改完这条测试才会绿。
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { APP_VERSION } from '../miniprogram/config/env';

const ROOT = process.cwd();
const EXPECTED = 'v1.0.1';
const EXPECTED_SEMVER = '1.0.1';
const SKIP_DIRS = new Set(['node_modules', 'miniprogram_npm', 'dist', 'coverage']);

function readJsonVersion(rel: string): string {
  const raw = readFileSync(join(ROOT, rel), 'utf8');
  return (JSON.parse(raw) as { version: string }).version;
}

/** 递归收集源码相对路径（.js 是 TS 编译产物，本来就该忽略） */
function sources(dir: string, exts: readonly string[]): string[] {
  const out: string[] = [];
  for (const name of readdirSync(join(ROOT, dir))) {
    if (SKIP_DIRS.has(name)) continue;
    const rel = join(dir, name);
    if (statSync(join(ROOT, rel)).isDirectory()) {
      out.push(...sources(rel, exts));
    } else if (exts.some((e) => name.endsWith(e))) {
      out.push(rel);
    }
  }
  return out;
}

describe('版本号单一真源（v1.0.1）', () => {
  it('env.ts 的 APP_VERSION 是 v1.0.1', () => {
    expect(APP_VERSION).toBe(EXPECTED);
  });

  it('package.json 的 version 与 APP_VERSION 同源', () => {
    expect(readJsonVersion('package.json')).toBe(EXPECTED_SEMVER);
    expect(EXPECTED_SEMVER).toBe(EXPECTED.replace(/^v/, ''));
  });

  it('package-lock.json 根版本与 package.json 一致（否则 npm ci 会报错）', () => {
    const lock = JSON.parse(readFileSync(join(ROOT, 'package-lock.json'), 'utf8')) as {
      version: string;
      packages: Record<string, { version?: string }>;
    };
    expect(lock.version).toBe(EXPECTED_SEMVER);
    expect(lock.packages['']?.version).toBe(EXPECTED_SEMVER);
  });

  it('全部云函数包的 version 都是 1.0.1', () => {
    // shared/ 是共享代码目录，本身不是云函数包（且已 gitignore）
    const fns = readdirSync(join(ROOT, 'cloudfunctions')).filter(
      (n) =>
        statSync(join(ROOT, 'cloudfunctions', n)).isDirectory() &&
        existsSync(join(ROOT, 'cloudfunctions', n, 'package.json')),
    );
    expect(fns.length).toBeGreaterThanOrEqual(8);
    const versions = fns.map((n) => ({
      fn: n,
      version: readJsonVersion(join('cloudfunctions', n, 'package.json')),
    }));
    expect(versions.filter((v) => v.version !== EXPECTED_SEMVER)).toEqual([]);
  });

  it('源码注释里不再出现别的版本号', () => {
    const files = [
      ...sources('miniprogram', ['.ts', '.wxml', '.wxss', '.json']),
      ...sources('tests', ['.ts']),
    ].filter((p) => basename(p) !== 'version.test.ts');

    const offenders: string[] = [];
    const pattern = /v\d+\.\d+\.\d+/g;
    for (const rel of files) {
      const hits = readFileSync(join(ROOT, rel), 'utf8').match(pattern) ?? [];
      for (const h of new Set(hits)) {
        if (h !== EXPECTED) offenders.push(`${rel} → ${h}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('README 声明了当前代码版本', () => {
    const readme = readFileSync(join(ROOT, 'README.md'), 'utf8');
    expect(readme).toContain(EXPECTED);
  });
});
