/** CR-025：图标系统守卫（生成物存在性 / 引用有效性 / 包体积） */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(__dirname, '..');
const ICONS_WXSS = join(ROOT, 'miniprogram/styles/icons.wxss');
const SRC = join(ROOT, 'miniprogram');

/** 递归列出源码文件（只扫会被编译进包的四类文件） */
function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      out.push(...walk(p));
      continue;
    }
    if (['.wxml', '.wxss', '.ts', '.json'].indexOf(extname(p)) >= 0) out.push(p);
  }
  return out;
}

const iconsWxss = readFileSync(ICONS_WXSS, 'utf8');

/**
 * 解析样式表里的图标规则。
 * 选择器两种形态：`.ic-home{`（深色，全员）与 `.icw.ic-home{`（白色，按需）。
 * ⚠ 深色版没有 `.ic.` 前缀，不能按前缀匹配，要看 `icw` 分组是否存在。
 */
function generated(): { dark: Set<string>; white: Set<string> } {
  const dark = new Set<string>();
  const white = new Set<string>();
  const re = /(\.icw)?\.ic-([\w-]+)\{/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(iconsWxss)) !== null) {
    dark.add(m[2]);
    if (m[1]) white.add(m[2]);
  }
  return { dark, white };
}

describe('icons.wxss（生成物）', () => {
  it('已生成，且被 app.wxss 引入（否则所有图标都是空白块）', () => {
    expect(iconsWxss.length).toBeGreaterThan(0);
    const appWxss = readFileSync(join(SRC, 'app.wxss'), 'utf8');
    expect(appWxss).toContain('@import "./styles/icons.wxss"');
  });

  it('基础类与尺寸档齐全（.ic / .ic-s / .ic-m / .ic-l）', () => {
    ['.ic {', '.ic-s {', '.ic-m {', '.ic-l {'].forEach((sel) =>
      expect(iconsWxss).toContain(sel),
    );
  });

  it('深色图标覆盖原型全部 83 枚（原型 sprite 的图标一个都不能少）', () => {
    expect(generated().dark.size).toBe(83);
  });

  it('白色图标是深色图标的子集（只给彩色/深色底用的图标生成反白版，省包体积）', () => {
    const { dark, white } = generated();
    expect(white.size).toBeGreaterThan(0);
    expect(white.size).toBeLessThan(dark.size);
    white.forEach((n) => expect(dark.has(n)).toBe(true));
  });
});

describe('图标引用有效性', () => {
  const { dark, white } = generated();

  it('源码里写死的 ic-<name> 都能在样式表里找到（写错名字 = 静默空白，必须拦住）', () => {
    const missing: string[] = [];
    walk(SRC).forEach((file) => {
      const text = readFileSync(file, 'utf8');
      const re = /ic-([a-z][\w-]*)/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(text)) !== null) {
        const name = m[1];
        if (['s', 'm', 'l'].indexOf(name) >= 0) continue; // 尺寸档不是图标名
        if (name === 'index') continue; // usingComponents 里的 ai-bar/index
        if (!dark.has(name) && missing.indexOf(name) < 0) missing.push(name);
      }
    });
    expect(missing).toEqual([]);
  });

  it('用了 icw 的图标必须真的有白色版（否则彩色底上是透明块）', () => {
    const missing: string[] = [];
    walk(SRC).forEach((file) => {
      const text = readFileSync(file, 'utf8');
      const re = /icw\s+ic-([\w-]+)/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(text)) !== null) {
        if (!white.has(m[1]) && missing.indexOf(m[1]) < 0) missing.push(m[1]);
      }
    });
    expect(missing).toEqual([]);
  });
});

describe('包体积守卫', () => {
  it('icons.wxss 不超过 700KB（小程序主包上限 2MB，图标不能吃掉一半）', () => {
    expect(statSync(ICONS_WXSS).size).toBeLessThan(700 * 1024);
  });

  it('首页不再用 emoji 当图标（emoji 在深色头部上颜色不可控）', () => {
    const wxml = readFileSync(join(SRC, 'pages/index/index.wxml'), 'utf8');
    // 允许文案里出现 emoji，但首页图标位已全部换成 .ic-*，这里只挡残留的独立 emoji 图标
    expect(wxml).not.toContain('🔍');
    expect(wxml).not.toContain('📍');
  });
});
