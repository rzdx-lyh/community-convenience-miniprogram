import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('关怀模式 2.0 · 地图防错位', () => {
  const app = read('miniprogram/app.wxss');
  const map = read('miniprogram/pages/map/index.wxss');
  const index = read('miniprogram/pages/index/index.wxss');
  const repair = read('miniprogram/pages/repair/create/index.wxss');

  it('通用页头和标题行在关怀模式下允许增高与换行', () => {
    expect(app).toContain('.care-mode .nav');
    expect(app).toContain('min-height: 104rpx');
    expect(app).toContain('.care-mode .sbar');
    expect(app).toContain('.care-mode .st');
    expect(app).toContain('flex-wrap: wrap');
  });

  it('地图筛选按钮等宽网格化，操作按钮改为单列', () => {
    expect(map).toContain('.care-mode .mapbar');
    expect(map).toContain('grid-template-columns: repeat(2, minmax(0, 1fr))');
    expect(map).toContain('.care-mode .map-actions');
    expect(map).toContain('flex-direction: column');
    expect(map).toContain('.care-mode .mapbar .mc:last-child');
  });

  it('关怀模式点位列表使用两列布局，距离信息独占第二行', () => {
    expect(map).toContain('.care-mode .pi {');
    expect(map).toContain('grid-template-columns: 68rpx minmax(0, 1fr)');
    expect(map).toContain('.care-mode .pi .pw');
    expect(map).toContain('grid-column: 2');
  });

  it('首页快捷入口与报修位置按钮避免横向挤压', () => {
    expect(index).toContain('.care-mode .care-entry');
    expect(index).toContain('grid-template-columns: 56rpx minmax(0, 1fr)');
    expect(repair).toContain('.care-mode .loc-actions');
    expect(repair).toContain('flex-direction: column');
  });
});
