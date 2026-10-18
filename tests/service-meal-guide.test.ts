/** CR-026：智慧配餐 + 办事指南（纯函数层） */
import { describe, expect, it } from 'vitest';
import {
  AVOID_OPTIONS,
  DISHES,
  achievePercent,
  buildMealOrderDescription,
  filterByAvoid,
  findGoal,
  ingredientList,
  MEAL_GOALS,
  pickPlan,
  planSum,
  ratioTargets,
  swapDish,
  type MealPlan,
} from '../miniprogram/pages/service/meal/viewmodel';
import {
  GUIDE_CATS,
  GUIDE_ITEMS,
  buildGuideOrderDescription,
  filterGuide,
  findGuide,
  toGuideVM,
} from '../miniprogram/pages/service/guide/viewmodel';

describe('智慧配餐 · 目标与营养素', () => {
  it('5 类人群目标，key 唯一', () => {
    expect(MEAL_GOALS.length).toBe(5);
    expect(new Set(MEAL_GOALS.map((g) => g.key)).size).toBe(5);
  });

  it('未知 goal key 回落到控糖（存储脏数据也不白屏）', () => {
    expect(findGoal('nope').key).toBe('sugar');
  });

  it('三大营养素按 18/52/30 反推（kcal → g）', () => {
    const t = ratioTargets({ key: 'x', name: 'x', kcal: 1600, na: 1400, tag: '低GI', desc: '' });
    expect(t.p).toBe(Math.round((1600 * 0.18) / 4));
    expect(t.c).toBe(Math.round((1600 * 0.52) / 4));
    expect(t.f).toBe(Math.round((1600 * 0.3) / 9));
  });

  it('热量达成百分比封顶 999（超目标也不会溢出进度条）', () => {
    expect(achievePercent({ kcal: 99999, p: 0, c: 0, f: 0, na: 0 }, MEAL_GOALS[0])).toBe(999);
  });
});

describe('智慧配餐 · 排菜', () => {
  it('三餐齐全，且同一入参结果稳定（换页重进不会跳菜）', () => {
    const a = pickPlan('sugar', 0);
    const b = pickPlan('sugar', 0);
    expect(a.b?.key).toBe(b.b?.key);
    expect(a.l?.key).toBe(b.l?.key);
    expect(a.d?.key).toBe(b.d?.key);
  });

  it('优先命中目标标签（控压必选低钠菜）', () => {
    const plan = pickPlan('pressure', 0);
    ['b', 'l', 'd'].forEach((s) => {
      const d = plan[s as 'b' | 'l' | 'd'];
      expect(d?.tags).toContain('低钠');
    });
  });

  it('忌口过滤生效（忌豆制品时不出现豆腐菜品）', () => {
    const all = filterByAvoid(DISHES, []);
    const noBean = filterByAvoid(DISHES, ['豆制品']);
    expect(noBean.length).toBeLessThan(all.length);
    const plan = pickPlan('soft', 0, ['豆制品']);
    ['b', 'l', 'd'].forEach((s) => {
      const d = plan[s as 'b' | 'l' | 'd'];
      expect(d?.ing.join('')).not.toContain('豆腐');
    });
  });

  it('忌口把某一餐全过滤掉时兜底，绝不出现空餐', () => {
    const plan = pickPlan('sugar', 0, AVOID_OPTIONS);
    expect(plan.b).toBeTruthy();
    expect(plan.l).toBeTruthy();
    expect(plan.d).toBeTruthy();
  });

  it('换一道得到不同的菜；池里只有一道时保持不变', () => {
    const plan = pickPlan('sugar', 0);
    const next = swapDish(plan, 'l', 'sugar');
    expect(next).toBeTruthy();
    const only: MealPlan = { l: DISHES[5] };
    expect(swapDish(only, 'b', 'sugar')).toBeUndefined();
  });

  it('汇总 = 三餐之和', () => {
    const plan = pickPlan('surgery', 2);
    const sum = planSum(plan);
    expect(sum.kcal).toBe((plan.b?.kcal ?? 0) + (plan.l?.kcal ?? 0) + (plan.d?.kcal ?? 0));
  });

  it('食材清单去重', () => {
    const items = ingredientList(pickPlan('sugar', 0));
    expect(items.length).toBeGreaterThan(0);
    expect(new Set(items).size).toBe(items.length);
  });

  it('预约文案含份数/房号/时间，空备注不产生空行', () => {
    const text = buildMealOrderDescription({
      goalName: '控糖',
      people: 2,
      room: '3 号楼 502',
      time: '今天午餐',
      dishes: ['A', 'B'],
    });
    expect(text).toContain('2 人份');
    expect(text).toContain('3 号楼 502');
    expect(text).toContain('A、B');
    expect(text.split('\n').some((l) => l.trim() === '')).toBe(false);
  });
});

describe('办事指南', () => {
  it('每个事项都有材料、窗口、时限、跑几趟、退回原因（空项 = 用户白跑一趟）', () => {
    GUIDE_ITEMS.forEach((it) => {
      expect(it.materials.length).toBeGreaterThan(0);
      expect(it.window).not.toBe('');
      expect(it.limit).not.toBe('');
      expect(it.trips).not.toBe('');
      expect(it.pitfalls.length).toBeGreaterThan(0);
    });
  });

  it('key 唯一，分类都在分类表里', () => {
    expect(new Set(GUIDE_ITEMS.map((i) => i.key)).size).toBe(GUIDE_ITEMS.length);
    GUIDE_ITEMS.forEach((i) => expect(GUIDE_CATS).toContain(i.cat));
  });

  it('按分类筛选：全部返回全量，指定分类只返回该类', () => {
    expect(filterGuide('全部').length).toBe(GUIDE_ITEMS.length);
    const med = filterGuide('医疗医保');
    expect(med.length).toBeGreaterThan(0);
    med.forEach((i) => expect(i.cat).toBe('医疗医保'));
  });

  it('关键词可搜事项名与材料', () => {
    expect(filterGuide('全部', '居住证').map((i) => i.key)).toContain('residence');
    expect(filterGuide('全部', '户口本').length).toBeGreaterThan(1);
    expect(filterGuide('全部', '不存在的词').length).toBe(0);
  });

  it('视图模型只带卡片字段（减少 setData 体积）', () => {
    const vm = toGuideVM(GUIDE_ITEMS[0]);
    expect(Object.keys(vm).sort()).toEqual(['cat', 'desc', 'key', 'limit', 'name', 'trips']);
  });

  it('findGuide 命中返回事项、未命中返回 undefined', () => {
    expect(findGuide('residence')?.name).toBe('居住证办理');
    expect(findGuide('nope')).toBeUndefined();
  });

  it('代办文案含房号与电话，空备注不产生空行', () => {
    const text = buildGuideOrderDescription({
      matter: '居住证办理',
      room: '3 号楼 502',
      contact: '13800000000',
      time: '本周末',
    });
    expect(text).toContain('居住证办理');
    expect(text).toContain('13800000000');
    expect(text.split('\n').some((l) => l.trim() === '')).toBe(false);
  });
});
