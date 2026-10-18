/**
 * 智慧配餐 · 视图模型（CR-026）
 *
 * 为什么纯函数单独成文件：页面文件一 import 就执行 `Page({...})`，
 * 而 `Page` 只在微信运行时存在 —— 拆出来才能进 vitest（与 index/service-category 同约定）。
 *
 * 数据来源：**纯本地常量**（用户选定的方案），零新增云函数、零契约变更。
 * 配餐算法依据《中国居民膳食指南（2022）》：先按目标人群定总能量，
 * 再按 蛋白 18% / 碳水 52% / 脂肪 30% 反推三大营养素目标，最后按标签匹配菜品。
 *
 * ⚠ 红线：所有输出必须带「不替代医生/营养师处方」的提示（页面底部固定文案）。
 */

export type Slot = 'b' | 'l' | 'd';

export interface MealGoal {
  key: string;
  name: string;
  /** 每日目标能量 kcal */
  kcal: number;
  /** 每日钠上限 mg */
  na: number;
  /** 匹配菜品用的标签 */
  tag: string;
  desc: string;
}

export interface Dish {
  key: string;
  slot: Slot;
  name: string;
  kcal: number;
  p: number;
  c: number;
  f: number;
  na: number;
  tags: string[];
  ing: string[];
}

export interface MealPlan {
  b?: Dish;
  l?: Dish;
  d?: Dish;
}

export interface NutrientSum {
  kcal: number;
  p: number;
  c: number;
  f: number;
  na: number;
}

export const MEAL_GOALS: MealGoal[] = [
  { key: 'sugar', name: '控糖', kcal: 1600, na: 1400, tag: '低GI', desc: '低 GI 主食，控制精制糖' },
  { key: 'pressure', name: '控压', kcal: 1700, na: 1300, tag: '低钠', desc: '限钠，少腌制品与酱料' },
  { key: 'fat', name: '减脂', kcal: 1400, na: 1500, tag: '低脂', desc: '控总能量，提高蛋白占比' },
  { key: 'surgery', name: '术后', kcal: 1800, na: 1600, tag: '高蛋白', desc: '补足蛋白，帮助恢复' },
  { key: 'soft', name: '老年软食', kcal: 1500, na: 1400, tag: '软食', desc: '蒸煮炖为主，少骨刺易咀嚼' },
];

/** 菜品库：每餐 5 道，覆盖 5 类目标标签（标签可多选，一道菜可能同时适合控糖与低脂） */
export const DISHES: Dish[] = [
  // 早餐
  { key: 'b1', slot: 'b', name: '燕麦牛奶 + 水煮蛋', kcal: 320, p: 18, c: 42, f: 9, na: 210, tags: ['低GI', '高蛋白'], ing: ['燕麦', '牛奶', '鸡蛋'] },
  { key: 'b2', slot: 'b', name: '杂粮粥 + 蒸蛋羹', kcal: 280, p: 14, c: 40, f: 7, na: 180, tags: ['低钠', '软食'], ing: ['杂粮米', '鸡蛋'] },
  { key: 'b3', slot: 'b', name: '全麦三明治 + 无糖豆浆', kcal: 360, p: 16, c: 48, f: 11, na: 320, tags: ['低脂', '低GI'], ing: ['全麦面包', '豆浆', '生菜'] },
  { key: 'b4', slot: 'b', name: '小米南瓜粥 + 鸡蛋', kcal: 300, p: 13, c: 46, f: 7, na: 160, tags: ['软食', '低钠'], ing: ['小米', '南瓜', '鸡蛋'] },
  { key: 'b5', slot: 'b', name: '蔬菜鸡蛋饼 + 牛奶', kcal: 340, p: 19, c: 34, f: 13, na: 380, tags: ['高蛋白', '低GI'], ing: ['鸡蛋', '胡萝卜', '牛奶'] },
  // 午餐
  { key: 'l1', slot: 'l', name: '杂粮饭 + 清蒸鱼 + 绿叶菜', kcal: 520, p: 34, c: 58, f: 14, na: 420, tags: ['低GI', '高蛋白'], ing: ['杂粮米', '鲈鱼', '油菜'] },
  { key: 'l2', slot: 'l', name: '糙米饭 + 鸡胸肉 + 西兰花', kcal: 480, p: 38, c: 52, f: 10, na: 380, tags: ['低脂', '高蛋白'], ing: ['糙米', '鸡胸肉', '西兰花'] },
  { key: 'l3', slot: 'l', name: '软烂米饭 + 豆腐煲 + 冬瓜', kcal: 450, p: 22, c: 56, f: 12, na: 300, tags: ['软食', '低钠'], ing: ['大米', '豆腐', '冬瓜'] },
  { key: 'l4', slot: 'l', name: '荞麦面 + 瘦肉片 + 青菜', kcal: 500, p: 28, c: 62, f: 12, na: 560, tags: ['低GI', '低脂'], ing: ['荞麦面', '瘦肉', '青菜'] },
  { key: 'l5', slot: 'l', name: '蒸南瓜 + 蒸鸡 + 菠菜', kcal: 470, p: 30, c: 50, f: 13, na: 260, tags: ['低钠', '软食', '高蛋白'], ing: ['南瓜', '鸡腿肉', '菠菜'] },
  // 晚餐
  { key: 'd1', slot: 'd', name: '冬瓜汤 + 瘦肉 + 杂粮饭', kcal: 400, p: 24, c: 44, f: 11, na: 320, tags: ['低GI'], ing: ['冬瓜', '瘦肉', '杂粮米'] },
  { key: 'd2', slot: 'd', name: '豆腐蔬菜汤 + 小米粥', kcal: 360, p: 18, c: 42, f: 10, na: 240, tags: ['软食', '低钠'], ing: ['豆腐', '青菜', '小米'] },
  { key: 'd3', slot: 'd', name: '清蒸鲈鱼 + 凉拌黄瓜 + 半碗饭', kcal: 420, p: 32, c: 38, f: 13, na: 480, tags: ['高蛋白', '低脂'], ing: ['鲈鱼', '黄瓜', '大米'] },
  { key: 'd4', slot: 'd', name: '番茄炒蛋 + 蒸山药', kcal: 380, p: 20, c: 46, f: 10, na: 350, tags: ['软食'], ing: ['番茄', '鸡蛋', '山药'] },
  { key: 'd5', slot: 'd', name: '鸡丝粥 + 焯青菜', kcal: 340, p: 22, c: 40, f: 8, na: 280, tags: ['低脂', '软食'], ing: ['鸡胸肉', '大米', '青菜'] },
];

/** 忌口项（按食材关键字过滤，纯本地，不做过敏原医学判断） */
export const AVOID_OPTIONS: string[] = ['海鲜', '豆制品', '鸡蛋', '牛奶', '辛辣'];

/**
 * 忌口 → 食材关键字。
 * ⚠ 不能直接拿忌口名去匹配食材（「豆制品」里没有「豆腐」这个子串），必须走别名表，
 *    否则忌口看着勾上了、菜单却没变 —— 用户会以为功能坏了。
 */
export const AVOID_MAP: Record<string, string[]> = {
  海鲜: ['鱼', '虾', '蟹', '贝'],
  豆制品: ['豆腐', '豆浆', '豆干', '腐竹'],
  鸡蛋: ['鸡蛋', '蛋羹'],
  牛奶: ['牛奶'],
  辛辣: ['辣', '椒'],
};

/** 按 key 取目标；找不到回落「控糖」（接口/存储脏数据时也不至于白屏） */
export function findGoal(key: string): MealGoal {
  return MEAL_GOALS.find((g) => g.key === key) ?? MEAL_GOALS[0];
}

/** 三大营养素目标：蛋白 18% / 碳水 52% / 脂肪 30%（kcal → g） */
export function ratioTargets(goal: MealGoal): { p: number; c: number; f: number } {
  return {
    p: Math.round((goal.kcal * 0.18) / 4),
    c: Math.round((goal.kcal * 0.52) / 4),
    f: Math.round((goal.kcal * 0.3) / 9),
  };
}

/** 忌口过滤：菜品任一食材命中忌口别名表即剔除 */
export function filterByAvoid(list: Dish[], avoid: string[]): Dish[] {
  const keys: string[] = [];
  (avoid ?? []).forEach((a) => {
    const name = String(a).trim();
    if (!name) return;
    keys.push(name, ...(AVOID_MAP[name] ?? []));
  });
  if (keys.length === 0) return list;
  return list.filter((d) => !d.ing.some((i) => keys.some((k) => i.indexOf(k) >= 0 || k.indexOf(i) >= 0)));
}

/**
 * 生成某日三餐（纯函数，同一入参必得同一结果 —— 换页/重进不会跳菜）。
 * 选菜规则：优先命中目标标签的菜品；不足则用全部菜品兜底；
 * 轮换按 `day + 槽位序号` 取模，保证 7 天不重样。
 */
export function pickPlan(goalKey: string, day: number, avoid: string[] = []): MealPlan {
  const goal = findGoal(goalKey);
  const plan: MealPlan = {};
  (['b', 'l', 'd'] as Slot[]).forEach((slot, slotIndex) => {
    const all = DISHES.filter((d) => d.slot === slot);
    const preferred = filterByAvoid(
      all.filter((d) => d.tags.indexOf(goal.tag) >= 0),
      avoid,
    );
    const pool = preferred.length > 0 ? preferred : filterByAvoid(all, avoid);
    const safe = pool.length > 0 ? pool : all; // 全被忌口过滤掉时兜底（不能出现空餐）
    plan[slot] = safe[(Math.max(0, day) + slotIndex) % safe.length];
  });
  return plan;
}

/** 换一道：在当前池里取下一道（与 pickPlan 同一轮换规则，+1 即可） */
export function swapDish(plan: MealPlan, slot: Slot, goalKey: string, avoid: string[] = []): Dish | undefined {
  const goal = findGoal(goalKey);
  const all = DISHES.filter((d) => d.slot === slot);
  const pool0 = filterByAvoid(all.filter((d) => d.tags.indexOf(goal.tag) >= 0), avoid);
  const pool = pool0.length > 0 ? pool0 : filterByAvoid(all, avoid);
  const safe = pool.length > 0 ? pool : all;
  const current = plan[slot];
  // 该餐本来就没菜（或池里只有一道）时直接返回原值，绝不凭空造一道
  if (!current || safe.length <= 1) return current;
  const currentIndex = safe.findIndex((d) => d.key === current.key);
  return safe[(currentIndex + 1) % safe.length];
}

/** 汇总一日营养 */
export function planSum(plan: MealPlan): NutrientSum {
  const slots: Slot[] = ['b', 'l', 'd'];
  return slots.reduce<NutrientSum>(
    (acc, s) => {
      const d = plan[s];
      if (!d) return acc;
      return {
        kcal: acc.kcal + d.kcal,
        p: acc.p + d.p,
        c: acc.c + d.c,
        f: acc.f + d.f,
        na: acc.na + d.na,
      };
    },
    { kcal: 0, p: 0, c: 0, f: 0, na: 0 },
  );
}

/** 热量达成百分比（封顶 999，避免超目标时进度条溢出） */
export function achievePercent(sum: NutrientSum, goal: MealGoal): number {
  if (!goal.kcal) return 0;
  return Math.min(999, Math.round((sum.kcal / goal.kcal) * 100));
}

/** 汇总今日食材清单（去重，供「食材清单」弹层） */
export function ingredientList(plan: MealPlan): string[] {
  const items: string[] = [];
  (['b', 'l', 'd'] as Slot[]).forEach((s) => {
    const d = plan[s];
    if (d) items.push(...d.ing);
  });
  const seen: Record<string, boolean> = {};
  return items.filter((i) => (seen[i] ? false : (seen[i] = true)));
}

/** 星期文案（day 0=今天） */
export const WEEK_DAYS: string[] = ['今天', '明天', '周二', '周三', '周四', '周五', '周六'];

/** 预约助餐提交文案（走 workorder:create，与预约类服务同一结构） */
export function buildMealOrderDescription(input: {
  goalName: string;
  people: number;
  room: string;
  time: string;
  dishes: string[];
  note?: string;
}): string {
  return [
    `服务：预约助餐（${input.goalName}方案）`,
    `份数：${input.people} 人份`,
    `菜品：${input.dishes.join('、')}`,
    `房号：${String(input.room ?? '').trim()}`,
    `期望时间：${input.time}`,
    input.note && input.note.trim() ? `备注：${input.note.trim()}` : '',
  ]
    .filter((line) => line !== '')
    .join('\n');
}
