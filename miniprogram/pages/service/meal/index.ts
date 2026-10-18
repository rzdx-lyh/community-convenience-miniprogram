/**
 * 智慧配餐（CR-026）
 *
 * 结构：目标选择（5 类人群）→ 今日能量卡 + 三大营养素条 → 7 天切换 → 早/午/晚三卡
 *      → 食材清单 → 预约助餐（走 workorder:create，零新增接口）
 *
 * 数据：**纯本地常量**（viewmodel.ts），不上云、不建档。
 * 理由（用户 2026-10-19 裁决）：新页一律本地配置 + 复用既有接口，赶 10-25 提交，不新增云函数。
 *
 * ⚠ 红线：底部固定「不替代医生或营养师处方」提示，且所有数字标注为参考值。
 */
import { createWorkOrder } from '../../../services/workorder';
import { track, trackPageView } from '../../../utils/logger';
import { toast } from '../../../utils/ui';
import {
  achievePercent,
  AVOID_OPTIONS,
  buildMealOrderDescription,
  DISHES,
  findGoal,
  ingredientList,
  MEAL_GOALS,
  pickPlan,
  planSum,
  ratioTargets,
  swapDish,
  WEEK_DAYS,
  type Dish,
  type MealGoal,
  type MealPlan,
  type NutrientSum,
  type Slot,
} from './viewmodel';

const TIME_SLOTS: string[] = ['今天午餐', '今天晚餐', '明天午餐', '明天晚餐'];

interface SlotVM {
  slot: Slot;
  label: string;
  color: string;
  kcal: number;
  p: number;
  c: number;
  f: number;
  na: number;
  name: string;
  emoji: string;
  tags: string[];
}

const SLOT_META: Record<Slot, { label: string; color: string; emoji: string }> = {
  b: { label: '早餐', color: '#1F5FD6', emoji: '🌅' },
  l: { label: '午餐', color: '#0E7C6B', emoji: '🍚' },
  d: { label: '晚餐', color: '#A86A05', emoji: '🍲' },
};

Page({
  data: {
    goals: MEAL_GOALS as MealGoal[],
    goalKey: 'sugar',
    goalName: '控糖',
    goalDesc: '',
    goalKcal: 1600,
    goalNa: 1400,

    days: WEEK_DAYS,
    day: 0,

    people: 1,
    avoids: AVOID_OPTIONS,
    avoid: [] as string[],

    /** 今日三餐 */
    slots: [] as SlotVM[],
    sum: { kcal: 0, p: 0, c: 0, f: 0, na: 0 } as NutrientSum,
    targets: { p: 0, c: 0, f: 0 },
    /** 进度条宽度一律转成百分比字符串，wxml 里不做算术 */
    barP: '0%',
    barC: '0%',
    barF: '0%',
    percent: 0,

    showList: false,
    listItems: [] as string[],

    showOrder: false,
    times: TIME_SLOTS,
    orderRoom: '',
    orderTime: '',
    orderNote: '',
    submitting: false,
  },

  /** 模块级：当前方案（不进 setData，避免大对象反复序列化） */
  plan: {} as MealPlan,

  onLoad(options: Record<string, string | undefined>) {
    trackPageView('pages/service/meal/index');
    const goal = String(options.goal ?? '').trim();
    if (goal) this.data.goalKey = goal;
    this.rebuild();
  },

  /* ============================ 核心：重算方案 ============================ */

  rebuild(): void {
    const goal = findGoal(this.data.goalKey);
    const plan = pickPlan(this.data.goalKey, this.data.day, this.data.avoid);
    this.plan = plan;
    const sum = planSum(plan);
    const targets = ratioTargets(goal);
    const pct = (v: number, t: number): string => `${Math.min(100, t ? Math.round((v / t) * 100) : 0)}%`;

    const slots: SlotVM[] = (['b', 'l', 'd'] as Slot[]).map((s) => {
      const d: Dish | undefined = plan[s];
      const meta = SLOT_META[s];
      return {
        slot: s,
        label: meta.label,
        color: meta.color,
        emoji: meta.emoji,
        kcal: d?.kcal ?? 0,
        p: d?.p ?? 0,
        c: d?.c ?? 0,
        f: d?.f ?? 0,
        na: d?.na ?? 0,
        name: d?.name ?? '今日暂无安排',
        tags: d?.tags ?? [],
      };
    });

    this.setData({
      goalName: goal.name,
      goalDesc: goal.desc,
      goalKcal: goal.kcal,
      goalNa: goal.na,
      slots,
      sum,
      targets,
      barP: pct(sum.p, targets.p),
      barC: pct(sum.c, targets.c),
      barF: pct(sum.f, targets.f),
      percent: achievePercent(sum, goal),
    });
  },

  /* ============================ 交互 ============================ */

  onPickGoal(e: WechatMiniprogram.TouchEvent): void {
    const key = String((e.currentTarget.dataset as { k?: string }).k ?? '');
    if (!key || key === this.data.goalKey) return;
    track('btn_click', { page: 'meal', target: 'goal', kind: key });
    this.setData({ goalKey: key });
    this.rebuild();
  },

  onPickDay(e: WechatMiniprogram.TouchEvent): void {
    const day = Number((e.currentTarget.dataset as { v?: string }).v ?? 0);
    if (day === this.data.day) return;
    this.setData({ day });
    this.rebuild();
  },

  onToggleAvoid(e: WechatMiniprogram.TouchEvent): void {
    const v = String((e.currentTarget.dataset as { v?: string }).v ?? '');
    if (!v) return;
    const avoid = this.data.avoid.indexOf(v) >= 0
      ? this.data.avoid.filter((x) => x !== v)
      : this.data.avoid.concat([v]);
    this.setData({ avoid });
    this.rebuild();
  },

  onPeopleTap(e: WechatMiniprogram.TouchEvent): void {
    const delta = Number((e.currentTarget.dataset as { d?: string }).d ?? 0);
    const people = Math.min(6, Math.max(1, this.data.people + delta));
    if (people === this.data.people) return;
    this.setData({ people });
  },

  /** 换一道：只在同槽位池内轮换，纯本地重算 */
  onSwap(e: WechatMiniprogram.TouchEvent): void {
    const slot = String((e.currentTarget.dataset as { s?: string }).s ?? '') as Slot;
    if (slot !== 'b' && slot !== 'l' && slot !== 'd') return;
    const next = swapDish(this.plan, slot, this.data.goalKey, this.data.avoid);
    if (!next) return;
    this.plan = { ...this.plan, [slot]: next };
    track('btn_click', { page: 'meal', target: 'swap', kind: slot });
    this.applyPlan();
  },

  applyPlan(): void {
    const goal = findGoal(this.data.goalKey);
    const sum = planSum(this.plan);
    const targets = ratioTargets(goal);
    const pct = (v: number, t: number): string => `${Math.min(100, t ? Math.round((v / t) * 100) : 0)}%`;
    const slots: SlotVM[] = (['b', 'l', 'd'] as Slot[]).map((s) => {
      const d: Dish | undefined = this.plan[s];
      const meta = SLOT_META[s];
      return {
        slot: s,
        label: meta.label,
        color: meta.color,
        emoji: meta.emoji,
        kcal: d?.kcal ?? 0,
        p: d?.p ?? 0,
        c: d?.c ?? 0,
        f: d?.f ?? 0,
        na: d?.na ?? 0,
        name: d?.name ?? '今日暂无安排',
        tags: d?.tags ?? [],
      };
    });
    this.setData({
      slots,
      sum,
      barP: pct(sum.p, targets.p),
      barC: pct(sum.c, targets.c),
      barF: pct(sum.f, targets.f),
      percent: achievePercent(sum, goal),
    });
  },

  /* ============================ 食材清单 ============================ */

  onOpenList(): void {
    this.setData({ showList: true, listItems: ingredientList(this.plan) });
  },

  onCloseList(): void {
    this.setData({ showList: false });
  },

  /** 一键加进生鲜预订：带清单跳通知列表的「生鲜」标签（复用既有页，不新建） */
  onBuyIngredients(): void {
    const items = ingredientList(this.plan);
    this.setData({ showList: false });
    track('btn_click', { page: 'meal', target: 'buy', count: items.length });
    wx.navigateTo({
      url: `/pages/notice/list/index?type=activity&tag=${encodeURIComponent('生鲜')}`,
      fail: () => toast('页面暂时打不开，请稍后再试'),
    });
  },

  /* ============================ 预约助餐 ============================ */

  onOrder(): void {
    track('btn_click', { page: 'meal', target: 'order_open' });
    this.setData({ showOrder: true, orderTime: TIME_SLOTS[0] });
  },

  onCloseOrder(): void {
    this.setData({ showOrder: false });
  },

  onInputRoom(e: WechatMiniprogram.Input): void {
    this.setData({ orderRoom: String(e.detail.value ?? '') });
  },

  onInputNote(e: WechatMiniprogram.Input): void {
    this.setData({ orderNote: String(e.detail.value ?? '') });
  },

  onPickTime(e: WechatMiniprogram.TouchEvent): void {
    const v = String((e.currentTarget.dataset as { v?: string }).v ?? '');
    if (v) this.setData({ orderTime: v });
  },

  async onSubmitOrder(): Promise<void> {
    if (this.data.submitting) return;
    const room = String(this.data.orderRoom ?? '').trim();
    if (!room) {
      toast('请填写楼栋房号');
      return;
    }
    this.setData({ submitting: true });
    const dishes = (['b', 'l', 'd'] as Slot[])
      .map((s) => this.plan[s]?.name ?? '')
      .filter((n) => n !== '');
    try {
      await createWorkOrder({
        title: `预约助餐 · ${this.data.goalName}方案`,
        category: 'other',
        description: buildMealOrderDescription({
          goalName: this.data.goalName,
          people: this.data.people,
          room,
          time: this.data.orderTime,
          dishes,
          note: this.data.orderNote,
        }),
      });
      this.setData({ showOrder: false, submitting: false, orderRoom: '', orderNote: '' });
      wx.showToast({ title: '已提交，工作人员会电话确认', icon: 'none' });
    } catch {
      this.setData({ submitting: false });
      toast('提交失败，请稍后重试');
    }
  },

  /** 阻止弹层内部点击冒泡到遮罩 */
  noop(): void {
    /* noop */
  },

  onShareAppMessage(): { title: string; path: string } {
    return { title: `智慧配餐 · ${this.data.goalName}方案`, path: '/pages/service/meal/index' };
  },
});

/** DISHES 只用于类型导出校验，避免 tree-shaking 误删（页面里实际由 viewmodel 使用） */
export const __DISHES_COUNT__ = DISHES.length;
