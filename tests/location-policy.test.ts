import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * 定位接口策略守卫（v1.2.1）
 *
 * 背景：`wx.getLocation` 接口申请被微信驳回（2026-10-24，场景不符开放范围），
 * 项目改为手动选择社区位置点。这三条断言防止以后有人「顺手」把定位接口加回来：
 *   1) 源码不得出现 `wx.getLocation(...)` 调用；
 *   2) app.json 不得声明 requiredPrivateInfos / scope.userLocation；
 *   3) 地图页不得用 show-location（它会读取系统定位）。
 */
const ROOT = process.cwd();
const MP = join(ROOT, 'miniprogram');
const SKIP = new Set(['node_modules', 'miniprogram_npm', 'dist']);

function walk(dir: string, exts: string[]): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full, exts));
    } else if (exts.some((e) => name.endsWith(e))) {
      out.push(full);
    }
  }
  return out;
}

describe('定位接口策略（v1.2.1）', () => {
  it('源码不再调用 wx.getLocation', () => {
    const offenders: string[] = [];
    for (const file of walk(MP, ['.ts', '.js', '.wxml'])) {
      const text = readFileSync(file, 'utf8');
      if (/wx\.getLocation\s*\(/.test(text)) offenders.push(relative(ROOT, file));
    }
    expect(offenders).toEqual([]);
  });

  it('app.json 不再声明定位隐私接口与授权 scope', () => {
    const app = JSON.parse(readFileSync(join(MP, 'app.json'), 'utf8')) as Record<string, unknown>;
    expect(app.requiredPrivateInfos).toBeUndefined();
    expect(app.permission).toBeUndefined();
  });

  it('地图页不显示系统定位点（无 show-location）', () => {
    const wxml = readFileSync(join(MP, 'pages/map/index.wxml'), 'utf8');
    expect(/\sshow-location(?:\s|=|>)/.test(wxml)).toBe(false);
  });
});
