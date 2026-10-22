import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LOCAL_SERVICE_CATEGORIES } from '../miniprogram/config/service-grid';
import {
  ACTIVITY_CONFIGS,
  buildActivityOrderDescription,
  normalizeActivityType,
} from '../miniprogram/pages/service/activity/viewmodel';

const ROOT = process.cwd();
const appJson = JSON.parse(readFileSync(join(ROOT, 'miniprogram/app.json'), 'utf8')) as {
  pages: string[];
};

describe('文化便民活动页 · 三套配置', () => {
  it('义诊 / 邻里活动 / 手机课都有标题、时间地点和至少 6 个小功能', () => {
    (['clinic', 'neighbor', 'phone'] as const).forEach((type) => {
      const cfg = ACTIVITY_CONFIGS[type];
      expect(cfg.title).not.toBe('');
      expect(cfg.date).not.toBe('');
      expect(cfg.place).not.toBe('');
      expect(cfg.features.length).toBeGreaterThanOrEqual(6);
      expect(cfg.options.length).toBeGreaterThan(0);
      expect(cfg.notes.length).toBeGreaterThan(0);
    });
  });

  it('非法 type 回退义诊', () => {
    expect(normalizeActivityType('clinic')).toBe('clinic');
    expect(normalizeActivityType('phone')).toBe('phone');
    expect(normalizeActivityType('bad')).toBe('clinic');
    expect(normalizeActivityType(undefined)).toBe('clinic');
  });

  it('报名描述包含活动、项目、房号、时间和地点', () => {
    const text = buildActivityOrderDescription(ACTIVITY_CONFIGS.clinic, {
      option: '测血糖',
      room: ' 3-2-502 ',
      contact: '13800000000',
      note: '需要志愿者',
    });
    expect(text).toContain('活动：每周义诊');
    expect(text).toContain('项目：测血糖');
    expect(text).toContain('房号：3-2-502');
    expect(text).toContain('联系方式：13800000000');
    expect(text).toContain('时间：每周六 9:00-11:30');
    expect(text).toContain('地点：社区广场');
  });
});

describe('文化便民入口 → 活动功能页', () => {
  it('每周义诊 / 邻里活动 / 长者手机课都指向已注册的活动页', () => {
    const culture = LOCAL_SERVICE_CATEGORIES.find((c) => c.key === 'culture');
    const items = culture?.items ?? [];
    const map = new Map(items.map((i) => [i.key, i]));
    (['culture_weekly', 'culture_neighbor', 'culture_phone'] as const).forEach((key) => {
      const item = map.get(key);
      expect(item?.targetType).toBe('page');
      expect(item?.targetPath).toBe('/pages/service/activity/index');
      expect(appJson.pages).toContain('pages/service/activity/index');
    });
  });
});
