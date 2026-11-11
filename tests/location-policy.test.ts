import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * 定位策略守卫（v1.2.7）：
 *   1) wx.getLocation 只允许出现在统一封装 utils/location.ts；
 *   2) app.json 必须声明 getLocation 隐私接口；
 *   3) 地图页不得启用 show-location 连续定位。
 */
const ROOT = process.cwd();
const MP = join(ROOT, 'miniprogram');
const SKIP = new Set(['node_modules', 'miniprogram_npm', 'dist']);

function walk(dir: string, exts: string[]): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full, exts));
    else if (exts.some((e) => name.endsWith(e))) out.push(full);
  }
  return out;
}

describe('定位接口策略（v1.2.7）', () => {
  it('wx.getLocation 只允许出现在统一 location 封装中', () => {
    const offenders: string[] = [];
    for (const file of walk(MP, ['.ts', '.js', '.wxml'])) {
      const text = readFileSync(file, 'utf8');
      if (/wx\.getLocation\s*\(/.test(text) && !file.endsWith(join('utils', 'location.ts'))) {
        offenders.push(relative(ROOT, file));
      }
    }
    expect(offenders).toEqual([]);
  });

  it('app.json 已声明 getLocation 与位置用途', () => {
    const app = JSON.parse(readFileSync(join(MP, 'app.json'), 'utf8')) as {
      requiredPrivateInfos?: string[];
      permission?: Record<string, { desc?: string }>;
    };
    expect(app.requiredPrivateInfos).toContain('getLocation');
    expect(app.permission?.['scope.userLocation']?.desc).toContain('附近服务点');
  });

  it('地图页不启用 show-location 连续定位', () => {
    const wxml = readFileSync(join(MP, 'pages/map/index.wxml'), 'utf8');
    expect(/\sshow-location(?:\s|=|>)/.test(wxml)).toBe(false);
  });
});
