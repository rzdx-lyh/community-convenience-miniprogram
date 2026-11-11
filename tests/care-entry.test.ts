import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { STORAGE_KEYS } from '../miniprogram/config/env';
import { isCareModeEnabled, setCareMode } from '../miniprogram/utils/care';

afterEach(() => vi.unstubAllGlobals());

describe('阶段 1 · 首页关怀模式快捷入口', () => {
  it('首页与我的共用 setCareMode，并持久化到同一个 storage key', () => {
    const values = new Map<string, unknown>();
    vi.stubGlobal('wx', {
      getStorageSync: (key: string) => values.get(key),
      setStorageSync: (key: string, value: unknown) => values.set(key, value),
    });
    expect(setCareMode(true)).toBe(true);
    expect(values.get(STORAGE_KEYS.ELDER_MODE)).toBe(true);
    expect(isCareModeEnabled()).toBe(true);
    expect(setCareMode(false)).toBe(false);
    expect(values.get(STORAGE_KEYS.ELDER_MODE)).toBe(false);
    expect(isCareModeEnabled()).toBe(false);
  });

  it('首页入口包含图标、文字和当前状态，并与 careMode 根类绑定', () => {
    const wxml = readFileSync(join(process.cwd(), 'miniprogram/pages/index/index.wxml'), 'utf8');
    expect(wxml).toContain('bindtap="onToggleCare"');
    expect(wxml).toContain('关怀模式');
    expect(wxml).toContain("careMode ? '已开启' : '未开启'");
    expect(wxml).toContain('{{careMode ? \'care-mode\' : \'\'}}');
  });

  it('关怀模式下快捷入口高度不小于 88rpx，避免放大后溢出', () => {
    const wxss = readFileSync(join(process.cwd(), 'miniprogram/pages/index/index.wxss'), 'utf8');
    expect(wxss).toContain('.care-mode .care-entry');
    expect(wxss).toContain('min-height: 112rpx');
    expect(wxss).toContain('.care-mode .care-entry__d');
  });

  it('我的页面版本号来自 APP_VERSION，不再硬编码设计稿版本', () => {
    const ts = readFileSync(join(process.cwd(), 'miniprogram/pages/profile/index.ts'), 'utf8');
    const wxml = readFileSync(join(process.cwd(), 'miniprogram/pages/profile/index.wxml'), 'utf8');
    expect(ts).toContain('version: APP_VERSION');
    expect(wxml).toContain('{{version}}');
    expect(wxml).not.toContain('1.4 · 社区便民');
  });
});
