/** v1.2.0 / CR-019：办事大厅视图模型（入口卡 / 检索行 / 服务检索） */
import { describe, expect, it } from 'vitest';
import { LOCAL_SERVICE_CATEGORIES } from '../miniprogram/config/service-grid';
import {
  buildHallRows,
  searchHallRows,
  toHallCatVM,
  HALL_MATCH_LIMIT,
  SEARCH_ALIASES,
} from '../miniprogram/pages/repair/list/viewmodel';

const rows = buildHallRows(LOCAL_SERVICE_CATEGORIES);
const namesOf = (keyword: string): string[] => searchHallRows(rows, keyword).map((r) => r.name);

describe('buildHallRows · 四类服务扁平化', () => {
  it('38 个子项全部进入检索行，且带分类归属', () => {
    expect(rows).toHaveLength(38);
    expect(rows[0]).toMatchObject({ name: '保洁', categoryTitle: '生活基础服务' });
    // 分类归属不能串：四个分类各自的首项应落在对应标题下
    expect(rows.filter((r) => r.categoryTitle === '生活基础服务')).toHaveLength(13);
    expect(rows.filter((r) => r.categoryTitle === '健康养老服务')).toHaveLength(13);
    expect(rows.filter((r) => r.categoryTitle === '便民配套服务')).toHaveLength(6);
    expect(rows.filter((r) => r.categoryTitle === '文化便民服务')).toHaveLength(6);
  });

  it('key 全局唯一（用于 setData 的 wx:key 与点击回查）', () => {
    const keys = rows.map((r) => r.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('入参为空 / undefined 时不抛错', () => {
    expect(buildHallRows([])).toEqual([]);
    expect(buildHallRows(undefined as unknown as ServiceCategory[])).toEqual([]);
  });
});

describe('searchHallRows · 本地服务检索', () => {
  it('完全同名优先命中', () => {
    expect(namesOf('保洁')[0]).toBe('保洁');
  });

  it('口语词经别名命中目标服务（搜索 = 药品 / 漏水 / 体检）', () => {
    expect(namesOf('药品')).toContain('社区门诊挂号');
    // 漏水属于管道问题，应命中维修类而不是缴费类（v1.2.0 起修正了这条语义）
    expect(namesOf('漏水')).toContain('管道疏通');
    expect(namesOf('体检')).toContain('健康报告');
  });

  it('分类名也能命中该类全部子项', () => {
    const names = namesOf('健康养老');
    expect(names).toContain('助餐');
    expect(names).toContain('上门陪护');
  });

  it('空关键词 / 无命中 → 空数组（调用方渲染「没找到 + 问 AI」）', () => {
    expect(searchHallRows(rows, '')).toEqual([]);
    expect(searchHallRows(rows, '   ')).toEqual([]);
    expect(searchHallRows(rows, '完全不存在的服务')).toEqual([]);
  });

  it('结果条数受 limit 约束，默认 6', () => {
    // 四个分类名都含「服务」→ 全命中，可见 limit 真的在裁剪
    expect(searchHallRows(rows, '服务', 99)).toHaveLength(38);
    expect(searchHallRows(rows, '服务')).toHaveLength(HALL_MATCH_LIMIT);
  });

  it('别名表只映射到真实存在的服务名（防配错目标导致永远搜不到）', () => {
    const names = rows.map((r) => r.name);
    Object.keys(SEARCH_ALIASES).forEach((alias) => {
      SEARCH_ALIASES[alias].forEach((target) => {
        expect(names).toContain(target);
      });
    });
  });
});

describe('toHallCatVM', () => {
  it('取分类标题/副标题与图标字形', () => {
    expect(toHallCatVM(LOCAL_SERVICE_CATEGORIES[0])).toEqual({
      key: 'life',
      title: '生活基础服务',
      sub: '家政服务｜缴费代办｜生鲜零售',
      iconText: '🏥',
    });
  });

  it('未知 key 回退默认图标，不抛错', () => {
    const vm = toHallCatVM({
      ...LOCAL_SERVICE_CATEGORIES[0],
      key: 'unknown',
    } as unknown as ServiceCategory);
    expect(vm.iconText).toBe('🏠');
  });
});
