import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const MP = join(ROOT, 'miniprogram');
const SKIP = new Set(['node_modules', 'miniprogram_npm', 'dist']);
const DEPRECATED_PALETTE = [
  '#1F5FD6', '#3B7DEE', '#153F9B', '#2E6BE0', '#3C7BEA',
  '#EAF1FE', '#F3F5F9', '#A86A05', '#FDF3E1', '#0E7C6B',
  '#E6F5F2', '#4B45B8', '#EDECFB', '#C9302C', '#FDECEB',
  '#12203A', '#4A5A73', '#8593A8', '#E6EBF2', '#2E74E8',
  '#1B54C0', '#4A5D78', '#EEF3FB', '#16407F',
];

function walk(dir: string, exts: string[]): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full, exts));
    else if (exts.some((ext) => name.endsWith(ext))) out.push(full);
  }
  return out;
}

describe('暖纸社区主题一致性', () => {
  it('全局 Token 使用暖纸社区主色板', () => {
    const appWxss = readFileSync(join(MP, 'app.wxss'), 'utf8');
    expect(appWxss).toContain('--brand: #173A5E');
    expect(appWxss).toContain('--accent-warm: #C46A2E');
    expect(appWxss).toContain('--bg: #F6F1E7');
    expect(appWxss).toContain('--card: #FFFCF5');
  });

  it('原生窗口与 TabBar 使用同一主题', () => {
    const app = JSON.parse(readFileSync(join(MP, 'app.json'), 'utf8')) as {
      window: { navigationBarBackgroundColor: string; backgroundColor: string };
      tabBar: { color: string; selectedColor: string; backgroundColor: string };
    };
    expect(app.window.navigationBarBackgroundColor).toBe('#F6F1E7');
    expect(app.window.backgroundColor).toBe('#F6F1E7');
    expect(app.tabBar.selectedColor).toBe('#C46A2E');
    expect(app.tabBar.backgroundColor).toBe('#FFFCF5');
    expect(app.tabBar.color).toBe('#8A949D');
  });

  it('页面代码不再引用旧政务蓝主题色', () => {
    const offenders: string[] = [];
    for (const file of walk(MP, ['.ts', '.wxml', '.wxss', '.json'])) {
      const text = readFileSync(file, 'utf8').toUpperCase();
      for (const color of DEPRECATED_PALETTE) {
        if (text.includes(color)) offenders.push(`${relative(ROOT, file)} → ${color}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('页面窗口背景不再使用彩色顶边', () => {
    const offenders: string[] = [];
    for (const file of walk(join(MP, 'pages'), ['.json'])) {
      const json = JSON.parse(readFileSync(file, 'utf8')) as { backgroundColor?: string };
      if (json.backgroundColor && json.backgroundColor !== '#F6F1E7') {
        offenders.push(`${relative(ROOT, file)} → ${json.backgroundColor}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('不使用小程序部分基础库渲染不稳定的径向背景', () => {
    const offenders = walk(MP, ['.wxss']).filter((file) =>
      readFileSync(file, 'utf8').includes('radial-gradient'),
    );
    expect(offenders.map((file) => relative(ROOT, file))).toEqual([]);
  });
});