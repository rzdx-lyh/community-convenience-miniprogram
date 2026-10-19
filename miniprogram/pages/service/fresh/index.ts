/**
 * 生鲜零售（按 UI 设计稿 1.4 重写）
 *
 * 结构：提示条 → 4 个子频道 tab → 商品双列卡（加购 / 数量）→ 底部购物车 → 预订弹层
 *
 * ⚠ 红线：本页只做预订登记，**不收款、不代付**；
 *   结算在驿站自提时现场完成，页面按钮文案统一为「提交预订」。
 */
import { createWorkOrder } from '../../../services/workorder';
import { track, trackPageView } from '../../../utils/logger';
import { toast } from '../../../utils/ui';
import {
  FRESH_TABS,
  discountText,
  findFreshItem,
  groupPercent,
  itemsOf,
  type FreshItem,
  type FreshTab,
} from './viewmodel';

const info = wx.getWindowInfo();

/** 商品配图（原型用 emoji 占位，小程序不便打包图片，沿用占位） */
const EMOJI: Record<string, string> = {
  fd1: '🥬', fd2: '🍅', fd3: '🥒', fd4: '🥔', fd5: '🥚', fd6: '🍖',
  fc1: '🍌', fc2: '🥛', fc3: '🍞', fc4: '🍓',
  fg1: '🍎', fg2: '🍊', fg3: '🍚', fg4: '🥚',
  fp1: '🧈', fp2: '🥟', fp3: '🍜', fp4: '🍗',
};

interface ItemVM extends FreshItem {
  emoji: string;
  discount: string;
  percent: number;
  count: number;
  isGroup: boolean;
  soldOutText: string;
}

interface CartLine {
  key: string;
  name: string;
  spec: string;
  price: number;
  count: number;
  lineTotal: string;
}

Page({
  data: {
    statusBarHeight: info.statusBarHeight,
    tabs: FRESH_TABS,
    tab: 'daily' as FreshTab,
    tabName: '当日鲜菜',
    tabNote: FRESH_TABS[0].note,
    items: [] as ItemVM[],

    /** 购物车（key = tab#id，跨 tab 保留） */
    cart: {} as Record<string, number>,
    cartCount: 0,
    cartTotalText: '0.00',

    /** 预订弹层 */
    showOrder: false,
    cartLines: [] as CartLine[],
    room: '',
    contact: '',
    note: '',
    submitting: false,
  },

  onLoad(options: Record<string, string | undefined>) {
    trackPageView('pages/service/fresh/index');
    const t = String(options?.tab ?? '') as FreshTab;
    if (FRESH_TABS.some((x) => x.key === t)) this.setData({ tab: t });
    this.render();
  },

  /** 按当前 tab + 购物车重算列表与合计 */
  render(): void {
    const meta = FRESH_TABS.find((t) => t.key === this.data.tab) ?? FRESH_TABS[0];
    const tab = meta.key;
    const cart = this.data.cart;
    const items: ItemVM[] = itemsOf(tab).map((i) => ({
      ...i,
      emoji: EMOJI[i.id] ?? '🥗',
      discount: discountText(i),
      percent: groupPercent(i),
      count: cart[`${tab}#${i.id}`] ?? 0,
      isGroup: tab === 'group',
      soldOutText: i.stock > 0 ? '' : '已售完',
    }));
    const sum = this.sumCart(cart);
    this.setData({
      tabName: meta.name,
      tabNote: meta.note,
      items,
      cartCount: sum.count,
      cartTotalText: sum.totalText,
    });
  },

  /** 汇总购物车（纯本地计算，不涉及金额收付） */
  sumCart(cart: Record<string, number>): { count: number; total: number; totalText: string; lines: CartLine[] } {
    let count = 0;
    let total = 0;
    const lines: CartLine[] = [];
    Object.keys(cart).forEach((key) => {
      const n = cart[key] ?? 0;
      if (n <= 0) return;
      const [tab, id] = key.split('#');
      const item = findFreshItem(tab as FreshTab, id);
      if (!item) return;
      count += n;
      total += item.price * n;
      lines.push({
        key,
        name: item.name,
        spec: item.spec,
        price: item.price,
        count: n,
        lineTotal: (item.price * n).toFixed(2),
      });
    });
    return { count, total, totalText: total.toFixed(2), lines };
  },

  onSwitchTab(e: WechatMiniprogram.TouchEvent): void {
    const t = String((e.currentTarget.dataset as { t?: string }).t ?? 'daily') as FreshTab;
    if (t === this.data.tab) return;
    track('btn_click', { page: 'fresh', target: 'switch_tab', tab: t });
    this.setData({ tab: t }, () => this.render());
  },

  /* ============================ 加购 ============================ */

  onPlus(e: WechatMiniprogram.TouchEvent): void {
    const ds = e.currentTarget.dataset as { t?: string; i?: string };
    const tab = String(ds.t ?? this.data.tab);
    const id = String(ds.i ?? '');
    if (!id) return;
    const item = findFreshItem(tab as FreshTab, id);
    if (!item) return;
    if (item.stock <= 0) {
      toast('这件已经没有了，看看别的');
      return;
    }
    const key = `${tab}#${id}`;
    const cur = this.data.cart[key] ?? 0;
    if (cur >= 20) {
      toast('单次最多 20 份');
      return;
    }
    const cart = { ...this.data.cart, [key]: cur + 1 };
    this.setData({ cart }, () => this.render());
  },

  onMinus(e: WechatMiniprogram.TouchEvent): void {
    const ds = e.currentTarget.dataset as { t?: string; i?: string };
    const key = `${String(ds.t ?? this.data.tab)}#${String(ds.i ?? '')}`;
    const cur = this.data.cart[key] ?? 0;
    if (cur <= 1) {
      const cart = { ...this.data.cart };
      delete cart[key];
      this.setData({ cart }, () => this.render());
      return;
    }
    const cart = { ...this.data.cart, [key]: cur - 1 };
    this.setData({ cart }, () => this.render());
  },

  /* ============================ 预订 ============================ */

  onOpenOrder(): void {
    if (this.data.cartCount <= 0) {
      toast('先选几样菜吧');
      return;
    }
    const sum = this.sumCart(this.data.cart);
    track('btn_click', { page: 'fresh', target: 'order_open', count: sum.count });
    this.setData({
      showOrder: true,
      cartLines: sum.lines,
      room: '',
      contact: '',
      note: '',
    });
  },

  onCloseOrder(): void {
    this.setData({ showOrder: false });
  },

  onInputRoom(e: WechatMiniprogram.Input): void {
    this.setData({ room: String(e.detail.value ?? '') });
  },

  onInputContact(e: WechatMiniprogram.Input): void {
    this.setData({ contact: String(e.detail.value ?? '') });
  },

  onInputNote(e: WechatMiniprogram.Input): void {
    this.setData({ note: String(e.detail.value ?? '') });
  },

  async onSubmit(): Promise<void> {
    if (this.data.submitting) return;
    const room = String(this.data.room ?? '').trim();
    const contact = String(this.data.contact ?? '').trim();
    if (!room) {
      toast('请填写楼栋房号');
      return;
    }
    if (!contact) {
      toast('请填写联系电话');
      return;
    }
    if (!/^\d{7,15}$/.test(contact.replace(/[-\s]/g, ''))) {
      toast('请填写正确的联系电话');
      return;
    }
    this.setData({ submitting: true });
    const lines = [
      `服务：生鲜预订（${this.data.tabName}）`,
      ...this.data.cartLines.map((l) => `${l.name}（${l.spec}）× ${l.count} · 参考 ¥${l.lineTotal}`),
      `参考合计：¥${this.data.cartTotalText}`,
      `楼栋房号：${room}`,
      `联系电话：${contact}`,
    ];
    if (this.data.note.trim()) lines.push(`备注：${this.data.note.trim()}`);
    lines.push('说明：本页不收款，到驿站自提时现场结算；参考价随行就市，以当日标价为准。');
    try {
      await createWorkOrder({
        title: `生鲜预订 · ${this.data.cartCount} 件`,
        category: 'other',
        description: lines.join('\n'),
      });
      this.setData({
        showOrder: false,
        submitting: false,
        cart: {},
        cartCount: 0,
        cartTotalText: '0.00',
        cartLines: [],
      });
      this.render();
      wx.showToast({ title: '已预订，到驿站自提时结算', icon: 'none' });
    } catch {
      this.setData({ submitting: false });
      toast('提交失败，请稍后重试');
    }
  },

  goBack(): void {
    if (getCurrentPages().length > 1) {
      wx.navigateBack();
    } else {
      wx.switchTab({ url: '/pages/index/index' });
    }
  },

  noop(): void {
    /* noop */
  },
});
