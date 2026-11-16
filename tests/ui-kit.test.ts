import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const app = readFileSync(join(ROOT, 'miniprogram/app.wxss'), 'utf8');
const kit = readFileSync(join(ROOT, 'miniprogram/styles/ui-kit.wxss'), 'utf8');

describe('暖纸社区 UI Kit', () => {
  it('全局样式已导入 UI Kit', () => {
    expect(app).toContain('@import "./styles/ui-kit.wxss";');
  });

  it('UI Kit 覆盖导航、页头、卡片、按钮、筛选和表单', () => {
    for (const selector of ['.page .nav', '.page .pgh', '.page .card', '.page .btn', '.page .chip', '.page .inp', '.page .sheet']) {
      expect(kit).toContain(selector);
    }
  });

  it('包含统一进入动效', () => {
    expect(kit).toContain('@keyframes ui-enter');
    expect(kit).toContain('animation: ui-enter');
  });

  it('关怀模式使用正确根类选择器', () => {
    expect(kit).toContain('.page.care-mode .nav');
    expect(kit).toContain('.page.care-mode .btn');
    expect(kit).not.toContain('.care-mode .page .nav');
  });

  it('不引入旧政务蓝主题', () => {
    expect(kit).not.toMatch(/#(1F5FD6|3B7DEE|153F9B|EAF1FE|F3F5F9)/i);
  });
});