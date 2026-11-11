import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { COMMUNITY_SPOTS } from '../miniprogram/config/community';

type RepairModule = typeof import('../miniprogram/pages/repair/create/index');
let repair: RepairModule;

beforeAll(async () => {
  const g = globalThis as unknown as Record<string, unknown>;
  g.Page = () => ({});
  g.wx = {
    getWindowInfo: () => ({ statusBarHeight: 20, windowWidth: 375 }),
    getMenuButtonBoundingClientRect: () => ({ left: 280, bottom: 80 }),
    getStorageSync: () => '',
  };
  repair = await import('../miniprogram/pages/repair/create/index');
});

describe('阶段 2 · 报修手选位置', () => {
  it('社区位置点全部生成有效的原生 map marker', () => {
    const markers = repair.buildSpotMarkers(COMMUNITY_SPOTS);
    expect(markers).toHaveLength(COMMUNITY_SPOTS.length);
    expect(new Set(markers.map((m) => m.id)).size).toBe(markers.length);
    for (const marker of markers) {
      expect(marker.iconPath).toBe('/pages/map/pin-svc.png');
      expect(Number.isFinite(marker.latitude)).toBe(true);
      expect(Number.isFinite(marker.longitude)).toBe(true);
    }
  });

  it('报修页包含当前楼栋、地图选点和点位列表，不调用系统定位', () => {
    const wxml = readFileSync(join(process.cwd(), 'miniprogram/pages/repair/create/index.wxml'), 'utf8');
    const ts = readFileSync(join(process.cwd(), 'miniprogram/pages/repair/create/index.ts'), 'utf8');
    expect(wxml).toContain('使用当前楼栋');
    expect(wxml).toContain('在地图上选点');
    expect(wxml).toContain('bindmarkertap="onSpotMarkerTap"');
    expect(ts).toContain('...(location ? { location } : {})');
    expect(ts).toContain('location: { name: spot.name');
    expect(ts).not.toMatch(/wx\.getLocation\s*\(/);
  });

  it('工单服务端只接收归一化的一个业务点位', () => {
    const source = readFileSync(join(process.cwd(), 'cloudfunctions/workorder/index.js'), 'utf8');
    expect(source).toContain('function normalizeLocation');
    expect(source).toContain('...(location ? { location } : {})');
    expect(source).toContain('Number.isFinite(latitude)');
  });
});
