/**
 * 智慧配餐（CR-028 重写，保留 CR-026 能力）
 *
 * 结构：配餐目标 / 人数 / 忌口 → 一周三餐 → 营养达成条 → 换一道 / 锁定
 *      → 食材清单 → 预约助餐（走 workorder:create，零新增接口）
 *
 * 数据：**纯本地常量**（viewmodel.ts），不上云、不建档。
 * ⚠ 红线：底部固定「不替代医生或营养师处方」提示，且所有数字标注为参考值。
 */
import { createWorkOrder } from '../../../services/workorder';
import { track, trackPageView } from '../../../utils/logger';
import { toast } from '../../../utils/ui';
import {
  achievePercent,
  AVOID_OPTIONS,
  buildMealOrderDescription,
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

const info = wx.getWindowInfo();

const TIME_SLOTS: string[] = ['今天午餐', '今天晚餐', '明天午餐', '明天晚餐'];
const PEOPLE = [
  { n: 1, label: '独居' },
  { n: 2, label: '两口' },
  { n: 3, label: '三口' },
  { n: 4, label: '多人' },
];

const SLOT_META: Record<Slot, { label: string; color: string; emoji: string }> = {
  b: { label: '早餐', color: '#1F5FD6', emoji: '🌅' },
  l: { label: '午餐', color: '#0E7C6B', emoji: '🍚' },
  d: { label: '晚餐', color: '#A86A05', emoji: '🍲' },
};

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
  locked: boolean;
}

interface ListItemVM {
  name: string;
  count: number;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function buildDayMeta(): string[] {
  return WEEK_DAYS.map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  });
}

Page({
  data: {
    statusBarHeight: info.statusBarHeight,

    /** false = 先做目标设置；true = 看方案 */
    ready: false,
    goals: MEAL_GOALS as MealGoal[],
    goalKey: 'sugar',
    goalName: '控糖',
    goalDesc: '低 GI 主食，控制精制糖',
    goalKcal: 1600,
    goalNa: 1400,

    peopleList: PEOPLE,
    people: 1,
    avoidList: AVOID_OPTIONS.map((name) => ({ name, on: false })),
    avoid: [] as string[],

    days: WEEK_DAYS,
    dayMeta: buildDayMeta(),
    day: 0,
    dayText: WEEK_DAYS[0],

    slots: [] as SlotVM[],
    sum: { kcal: 0, p: 0, c: 0, f: 0, na: 0 } as NutrientSum,
    targets: { p: 0, c: 0, f: 0 },
    percent: 0,
    kcalBar: '0%',
    barP: '0%',
    barC: '0%',
    barF: '0%',

    showList: false,
    listItems: [] as ListItemVM[],
    showHelp: false,

    showOrder: false,
    times: TIME_SLOTS,
    orderRoom: '',
    orderTime: TIME_SLOTS[0],
    orderNote: '',
    submitting: false,
  },

  /** 当前方案不进 setData，避免大对象反复序列化 */
  plan: {} as MealPlan,
  locked: {} as Record<string, boolean>,

  onLoad(options: Record<string, string | undefined>): void {
    trackPageView('pages/service/meal/index');
    const goal = String(options?.goal ?? '').trim();
    if (goal) {
      this.setData({ goalKey: goal });
      this.applyGoalText();
      this.setData({ ready: true });
      this.rebuild();
    }
  },

  /** 目标文案（设置页与页头共用） */
  applyGoalText(): void {
    const g = findGoal(this.data.goalKey);
    this.setData({ goalName: g.name, goalDesc: g.desc, goalKcal: g.kcal, goalNa: g.na });
  },

  goBack(): void {
    if (getCurrentPages().length > 1) {
      wx.navigateBack();
      return;
    }
    wx.switchTab({ url: '/pages/index/index' });
  },

  /* ============================ 设置页 ============================ */

  onHelp(): void {
    this.setData({ showHelp: true });
  },

  onCloseHelp(): void {
    this.setData({ showHelp: false });
  },

  onPickGoal(e: WechatMiniprogram.TouchEvent): void {
    const key = String((e.currentTarget.dataset as { v?: string }).v ?? '');
    if (!key || key === this.data.goalKey) return;
    this.setData({ goalKey: key });
    this.applyGoalText();
    if (this.data.ready) this.rebuild();
  },

  onPickPeople(e: WechatMiniprogram.TouchEvent): void {
    const n = Number((e.currentTarget.dataset as { v?: string }).v ?? 1);
    if (!n || n === this.data.people) return;
    this.setData({ people: n });
    if (this.data.ready) this.update();
  },

  onToggleAvoid(e: WechatMiniprogram.TouchEvent): void {
    const v = String((e.currentTarget.dataset as { v?: string }).v ?? '');
    if (!v) return;
    const avoid = this.data.avoid.indexOf(v) >= 0
      ? this.data.avoid.filter((x) => x !== v)
      : this.data.avoid.concat([v]);
    this.setData({
      avoid,
      avoidList: this.data.avoidList.map((o) => ({ ...o, on: avoid.indexOf(o.name) >= 0 })),
    });
    if (this.data.ready) this.rebuild();
  },

  onStart(): void {
    track('btn_click', { page: 'meal', target: 'start', kind: this.data.goalKey });
    this.setData({ ready: true });
    this.locked = {};
    this.rebuild();
  },

  /** 改目标：回到设置页，保留当前选择 */
  onResetGoal(): void {
    this.setData({ ready: false });
  },

  /* ============================ 方案 ============================ */

  rebuild(): void {
    this.plan = pickPlan(this.data.goalKey, this.data.day, this.data.avoid);
    this.update();
  },

  update(): void {
    const goal = findGoal(this.data.goalKey);
    const sum = planSum(this.plan);
    const targets = ratioTargets(goal);
    const pct = (v: number, t: number): string => `${Math.min(100, t ? Math.round((v / t) * 100) : 0)}%`;
    const percent = achievePercent(sum, goal);

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
        locked: !!this.locked[s],
      };
    });

    this.setData({
      goalName: goal.name,
      goalDesc: goal.desc,
      goalKcal: goal.kcal,
      goalNa: goal.na,
      dayText: WEEK_DAYS[this.data.day] ?? WEEK_DAYS[0],
      slots,
      sum,
      targets,
      percent,
      kcalBar: pct(sum.kcal, goal.kcal),
      barP: pct(sum.p, targets.p),
      barC: pct(sum.c, targets.c),
      barF: pct(sum.f, targets.f),
    });
  },

  onPickDay(e: WechatMiniprogram.TouchEvent): void {
    const day = Number((e.currentTarget.dataset as { v?: string }).v ?? 0);
    if (!Number.isFinite(day) || day === this.data.day) return;
    this.setData({ day });
    this.rebuild();
  },

  /** 换一道：只在同槽位池内轮换，纯本地重算 */
  onSwap(e: WechatMiniprogram.TouchEvent): void {
    const slot = String((e.currentTarget.dataset as { s?: string }).s ?? '') as Slot;
    if (slot !== 'b' && slot !== 'l' && slot !== 'd') return;
    if (this.locked[slot]) {
      toast('这一餐已锁定，先解锁再换');
      return;
    }
    const next = swapDish(this.plan, slot, this.data.goalKey, this.data.avoid);
    if (!next) {
      toast('没有更多可选菜品');
      return;
    }
    this.plan = { ...this.plan, [slot]: next };
    track('btn_click', { page: 'meal', target: 'swap', kind: slot });
    this.update();
  },

  onToggleLock(e: WechatMiniprogram.TouchEvent): void {
    const slot = String((e.currentTarget.dataset as { s?: string }).s ?? '');
    if (!slot) return;
    this.locked[slot] = !this.locked[slot];
    this.update();
  },

  /* ============================ 食材清单 ============================ */

  onOpenList(): void {
    const items = ingredientList(this.plan);
    this.setData({
      showList: true,
      listItems: items.map((name) => ({ name, count: this.data.people })),
    });
  },

  onCloseList(): void {
    this.setData({ showList: false });
  },

  /** 一键加进生鲜预订：复用既有生鲜页，不新建接口 */
  onBuyIngredients(): void {
    this.setData({ showList: false });
    track('btn_click', { page: 'meal', target: 'buy', count: this.data.listItems.length });
    wx.navigateTo({
      url: '/pages/service/fresh/index',
      fail: () => toast('生鲜页暂时打不开，请稍后再试'),
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

  noop(): void {
    /* 阻止弹层点击冒泡 */
  },

  onShareAppMessage(): { title: string; path: string } {
    return { title: `智慧配餐 · ${this.data.goalName}方案`, path: '/pages/service/meal/index' };
  },
});
