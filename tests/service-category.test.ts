/**
 * v1.0.1 / CR-022：服务分类页（FE-14）与 38 项服务数据
 *
 * 这组断言的重点不是"函数算得对"，而是**数据不出死链**：
 * 38 个服务项里任何一个 targetPath 指向未注册页面，用户点下去就是"没反应"，
 * 而这种问题在真机上很难发现。所以直接拿 app.json 做交叉校验。
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LOCAL_SERVICE_CATEGORIES } from '../miniprogram/config/service-grid';
import {
  buildBookingDescription,
  countItems,
  findRawItem,
  initialOfName,
  pickCategory,
  TIME_SLOTS,
  toGroupsVM,
} from '../miniprogram/pages/service/category/viewmodel';

const ROOT = process.cwd();
const appJson = JSON.parse(readFileSync(join(ROOT, 'miniprogram/app.json'), 'utf8')) as {
  pages: string[];
};

/** app.json 里注册的页面（统一成 /pages/xxx 形式便于比对） */
const registered = appJson.pages.map((p) => `/${p}`);

const flat = LOCAL_SERVICE_CATEGORIES.flatMap((c) => c.items ?? []);
const groups = LOCAL_SERVICE_CATEGORIES.flatMap((c) => c.groups ?? []);

describe('服务数据 · 规模与结构', () => {
  it('4 个分类，key 与 sort 都不重复', () => {
    expect(LOCAL_SERVICE_CATEGORIES).toHaveLength(4);
    expect(LOCAL_SERVICE_CATEGORIES.map((c) => c.key).sort()).toEqual([
      'culture',
      'elder',
      'life',
      'support',
    ]);
    const sorts = LOCAL_SERVICE_CATEGORIES.map((c) => c.sort);
    expect(new Set(sorts).size).toBe(sorts.length);
  });

  it('8 个板块，每个板块至少 3 项', () => {
    expect(groups).toHaveLength(8);
    groups.forEach((g) => {
      expect(g.items.length, `板块「${g.name}」子项过少`).toBeGreaterThanOrEqual(3);
      expect(g.name.trim()).not.toBe('');
    });
  });

  it('38 个服务项，key 全局唯一', () => {
    expect(flat).toHaveLength(38);
    const keys = flat.map((i) => i.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('items 与 groups 严格同源（展平函数没有漏项）', () => {
    const fromGroups = groups.flatMap((g) => g.items.map((i) => i.key)).sort();
    const fromItems = flat.map((i) => i.key).sort();
    expect(fromItems).toEqual(fromGroups);
  });

  it('每一项都有名称与一行说明', () => {
    flat.forEach((item) => {
      expect(item.name.trim(), `key=${item.key} 缺名称`).not.toBe('');
      expect(item.desc ?? '', `「${item.name}」缺说明`).not.toBe('');
    });
  });
});

describe('服务数据 · 路由不出死链', () => {
  it('targetType 只用契约允许的 6 种', () => {
    const allowed = ['page', 'notice', 'circle', 'assistant', 'phone', 'toast'];
    flat.forEach((item) => {
      expect(allowed, `「${item.name}」targetType 非法`).toContain(item.targetType);
    });
  });

  it('所有 targetPath 都已在 app.json 注册', () => {
    const missing: string[] = [];
    flat.forEach((item) => {
      if (item.targetType !== 'page') return;
      const path = item.targetPath ?? '';
      if (registered.indexOf(path) < 0) missing.push(`${item.name} → ${path}`);
    });
    expect(missing).toEqual([]);
  });

  it('assistant 类必须带预置问句，notice 类必须带 type', () => {
    flat.forEach((item) => {
      const params = item.targetParams ?? {};
      if (item.targetType === 'assistant') {
        expect(String(params.presetQuestion ?? '').length, `「${item.name}」缺预置问句`).toBeGreaterThan(5);
      }
      if (item.targetType === 'notice') {
        expect(String(params.type ?? ''), `「${item.name}」缺 notice type`).toBe('activity');
      }
    });
  });

  it('没有任何一项落到 toast 死胡同（点了只弹"暂未开通"）', () => {
    expect(flat.filter((i) => i.targetType === 'toast')).toEqual([]);
  });

  it('预约类服务带 book 参数，且指向本分类页（页内弹层）', () => {
    const books = flat.filter((i) => String((i.targetParams ?? {}).book ?? '') !== '');
    expect(books.length).toBeGreaterThanOrEqual(10);
    books.forEach((item) => {
      expect(item.targetPath).toBe('/pages/service/category/index');
      expect(registered).toContain('/pages/service/category/index');
      // opts 用 | 分隔，供弹层渲染选项 chips
      const opts = String((item.targetParams ?? {}).opts ?? '');
      if (opts) expect(opts.split('|').every((s) => s.trim() !== '')).toBe(true);
    });
  });
});

describe('toGroupsVM · 板块视图模型', () => {
  it('有 groups 时原样映射，条数与名称一致', () => {
    const life = LOCAL_SERVICE_CATEGORIES[0];
    const vm = toGroupsVM(life);
    expect(vm).toHaveLength(life.groups!.length);
    expect(vm[0].name).toBe(life.groups![0].name);
    expect(vm[0].items).toHaveLength(life.groups![0].items.length);
  });

  it('预约类项被标记 book=true，并解析出选项', () => {
    const clean = toGroupsVM(LOCAL_SERVICE_CATEGORIES[0])[0].items[0];
    expect(clean.name).toBe('保洁');
    expect(clean.book).toBe(true);
    expect(clean.opts.length).toBeGreaterThan(1);
  });

  it('非预约类项 book=false，不会误开弹层', () => {
    const utility = toGroupsVM(LOCAL_SERVICE_CATEGORIES[0])
      .flatMap((g) => g.items)
      .find((i) => i.name === '水电燃气代缴');
    expect(utility).toBeDefined();
    expect(utility!.book).toBe(false);
  });

  it('旧数据没有 groups 时合成单板块，不返回空列表', () => {
    const legacy: ServiceCategory = {
      _id: 'x',
      key: 'life',
      title: '旧分类',
      subtitle: '',
      icon: '',
      iconTheme: 'green',
      sort: 1,
      status: 'online',
      items: [
        { key: 'a', name: '甲', targetType: 'toast', sort: 1 },
        { key: 'b', name: '乙', targetType: 'toast', sort: 2 },
      ],
    };
    const vm = toGroupsVM(legacy);
    expect(vm).toHaveLength(1);
    expect(vm[0].items.map((i) => i.name)).toEqual(['甲', '乙']);
  });

  it('入参为空时不抛错', () => {
    expect(toGroupsVM(undefined)).toEqual([]);
    expect(toGroupsVM(null)).toEqual([]);
  });
});

describe('纯函数 · 选择与计数', () => {
  it('pickCategory 按 key 命中，未知 key 回退第一个', () => {
    expect(pickCategory(LOCAL_SERVICE_CATEGORIES, 'elder')!.key).toBe('elder');
    expect(pickCategory(LOCAL_SERVICE_CATEGORIES, 'nope')!.key).toBe('life');
    expect(pickCategory([], 'life')).toBeUndefined();
  });

  it('countItems 等于该分类实际服务数，四类合计 38', () => {
    expect(countItems(LOCAL_SERVICE_CATEGORIES[0])).toBe(13);
    const total = LOCAL_SERVICE_CATEGORIES.reduce((sum, c) => sum + countItems(c), 0);
    expect(total).toBe(38);
    expect(countItems(undefined)).toBe(0);
  });

  it('initialOfName 取首字，空值降级为「服」而不是空白', () => {
    expect(initialOfName('保洁')).toBe('保');
    expect(initialOfName('  家电维修 ')).toBe('家');
    expect(initialOfName('')).toBe('服');
    expect(initialOfName(undefined as unknown as string)).toBe('服');
  });

  it('时间档位固定 4 个，且不含空串', () => {
    expect(TIME_SLOTS).toHaveLength(4);
    expect(TIME_SLOTS.every((s) => s.trim() !== '')).toBe(true);
  });
});

describe('buildBookingDescription · 提交文案', () => {
  it('完整字段按固定顺序拼装，便于客服阅读', () => {
    expect(
      buildBookingDescription({ svc: '保洁', opt: '深度保洁', room: ' 3-2-502 ', time: '明天上午', note: '家里有老人' }),
    ).toBe('服务：保洁\n选项：深度保洁\n房号：3-2-502\n期望时间：明天上午\n备注：家里有老人');
  });

  it('无选项/无备注时不留空行', () => {
    expect(buildBookingDescription({ svc: '助浴', room: '1-1-101', time: '今天下午' })).toBe(
      '服务：助浴\n房号：1-1-101\n期望时间：今天下午',
    );
    expect(buildBookingDescription({ svc: '助浴', room: '1-1-101', time: '今天下午', note: '   ' })).not.toContain('备注');
  });
});

describe('findRawItem · 回查原始项', () => {
  it('命中返回完整 ServiceItem（导航需要 targetType）', () => {
    const life = LOCAL_SERVICE_CATEGORIES[0];
    const hit = findRawItem(life, 'house_clean');
    expect(hit?.name).toBe('保洁');
    expect(hit?.targetType).toBe('page');
  });

  it('未命中或分类为空时返回 undefined，不抛错', () => {
    expect(findRawItem(LOCAL_SERVICE_CATEGORIES[0], 'nope')).toBeUndefined();
    expect(findRawItem(undefined, 'house_clean')).toBeUndefined();
  });
});
