/**
 * FE-11 验收项 4：6 种 targetType 分发全覆盖（契约 §service:list 路由表）
 * resolveTarget 是纯函数，不需要小程序运行时即可测试。
 */
import { describe, expect, it } from 'vitest';
import { LOCAL_SERVICE_CATEGORIES } from '../miniprogram/config/service-grid';
import { resolveTarget } from '../miniprogram/utils/navigator';

/** 契约里 targetType 必填，但兜底用例需要构造缺字段的对象，故在此断言一次 */
function item(override: Partial<ServiceItem>): ServiceItem {
  return { key: 'k', name: 'n', sort: 1, ...override } as ServiceItem;
}

describe('resolveTarget · 6 种 targetType', () => {
  it('page → 非 Tab 页用 navigateTo', () => {
    const action = resolveTarget(
      item({ targetType: 'page', targetPath: '/pages/repair/create/index', targetParams: { category: 'water' } }),
    );
    expect(action).toEqual({
      kind: 'page',
      path: '/pages/repair/create/index',
      query: { category: 'water' },
      useSwitchTab: false,
    });
  });

  it('page → Tab 页用 switchTab（circle 是 TabBar 第 3 项）', () => {
    const action = resolveTarget(item({ targetType: 'page', targetPath: '/pages/circle/index' }));
    expect(action.kind).toBe('page');
    if (action.kind === 'page') {
      expect(action.useSwitchTab).toBe(true);
    }
  });

  it('notice → 带 type/tag 跳通知列表', () => {
    const action = resolveTarget(
      item({ targetType: 'notice', targetParams: { type: 'activity', tag: '义诊' } }),
    );
    expect(action).toEqual({ kind: 'notice', query: { type: 'activity', tag: '义诊' } });
  });

  it('circle → 写待消费筛选态', () => {
    const action = resolveTarget(item({ targetType: 'circle', targetParams: { type: 'road' } }));
    expect(action).toEqual({ kind: 'circle', filter: { type: 'road' } });
  });

  it('assistant → 预设提问（只填充不发送）', () => {
    const action = resolveTarget(
      item({ targetType: 'assistant', targetParams: { presetQuestion: '孩子的疫苗档案怎么查询？' } }),
    );
    expect(action).toEqual({ kind: 'assistant', presetQuestion: '孩子的疫苗档案怎么查询？' });
  });

  it('phone → 取电话号码', () => {
    const action = resolveTarget(item({ targetType: 'phone', targetParams: { phone: '020-88880000' } }));
    expect(action).toEqual({ kind: 'phone', phone: '020-88880000' });
  });

  it('toast → 取 tip，缺省回退「暂未开通」', () => {
    expect(resolveTarget(item({ targetType: 'toast', tip: '建设中' }))).toEqual({ kind: 'toast', tip: '建设中' });
    expect(resolveTarget(item({ targetType: 'toast' }))).toEqual({ kind: 'toast', tip: '暂未开通' });
  });
});

describe('resolveTarget · 兜底（不抛错，静默 none）', () => {
  it('空入参 / 缺 targetType / page 缺 targetPath / 未知类型 → none', () => {
    expect(resolveTarget(undefined)).toEqual({ kind: 'none' });
    expect(resolveTarget(null)).toEqual({ kind: 'none' });
    expect(resolveTarget({ key: 'k', name: 'n', sort: 1 } as ServiceItem)).toEqual({ kind: 'none' });
    expect(resolveTarget(item({ targetType: 'page' }))).toEqual({ kind: 'none' });
    expect(resolveTarget(item({ targetType: 'wat' as unknown as ServiceItem['targetType'] }))).toEqual({
      kind: 'none',
    });
  });
});

describe('本地兜底宫格（config/service-grid.ts）', () => {
  it('4 类齐全且按 sort 升序', () => {
    expect(LOCAL_SERVICE_CATEGORIES).toHaveLength(4);
    expect(LOCAL_SERVICE_CATEGORIES.map((c) => c.sort)).toEqual([1, 2, 3, 4]);
    expect(LOCAL_SERVICE_CATEGORIES.map((c) => c.key)).toEqual(['life', 'elder', 'support', 'culture']);
  });

  it('全部子项可分发：0 个 none、0 个 toast 死胡同', () => {
    const items = LOCAL_SERVICE_CATEGORIES.flatMap((c) => c.items);
    expect(items.length).toBeGreaterThanOrEqual(8);
    const kinds = items.map((i) => resolveTarget(i).kind);
    expect(kinds.filter((k) => k === 'none')).toHaveLength(0);
    expect(kinds.filter((k) => k === 'toast')).toHaveLength(0);
  });
});
