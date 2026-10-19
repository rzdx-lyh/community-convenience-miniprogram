/**
 * 生鲜零售（CR-027）
 *
 * 4 个子频道 Tab → 商品列表 → 预订登记弹层（走 workorder:create）
 *
 * ⚠ 红线：本页**不收款、不代扣**，只做预订登记，结算在驿站自提时现场完成。
 */
import { createWorkOrder } from '../../../services/workorder';
import { track, trackPageView } from '../../../utils/logger';
import { toast } from '../../../utils/ui';
import {
  FRESH_TABS,
  buildFreshOrderDescription,
  discountText,
  findFreshItem,
  groupPercent,
  itemsOf,
  type FreshItem,
  type FreshTab,
} from './viewmodel';

interface ItemVM extends FreshItem {
  discount: string;
  percent: number;
  canBuy: boolean;
}

Page({
  data: {
    tabs: FRESH_TABS,
    tab: 'daily' as FreshTab,
    tabName: '当日鲜菜',
    tabNote: FRESH_TABS[0].note,
    items: [] as ItemVM[],

    /** 下单弹层 */
    showOrder: false,
    itemName: '',
    itemSpec: '',
    itemPrice: 0,
    count: 1,
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

  render(): void {
    const meta = FRESH_TABS.find((t) => t.key === this.data.tab) ?? FRESH_TABS[0];
    this.setData({
      tabName: meta.name,
      tabNote: meta.note,
      items: itemsOf(this.data.tab).map((i) => ({
        ...i,
        discount: discountText(i),
        percent: groupPercent(i),
        canBuy: i.stock > 0,
      })),
    });
  },

  onSwitchTab(e: WechatMiniprogram.TouchEvent): void {
    const t = String((e.currentTarget.dataset as { t?: string }).t ?? 'daily') as FreshTab;
    if (t === this.data.tab) return;
    track('btn_click', { page: 'fresh', target: 'switch_tab', tab: t });
    this.setData({ tab: t }, () => this.render());
  },

  onOrder(e: WechatMiniprogram.TouchEvent): void {
    const id = String((e.currentTarget.dataset as { id?: string }).id ?? '');
    const item = findFreshItem(this.data.tab, id);
    if (!item) return;
    if (item.stock <= 0) {
      toast('这件已经没有了，看看别的');
      return;
    }
    track('btn_click', { page: 'fresh', target: 'order_open', id });
    this.setData({
      showOrder: true,
      itemName: item.name,
      itemSpec: item.spec,
      itemPrice: item.price,
      count: 1,
      room: '',
      contact: '',
      note: '',
    });
  },

  onCloseOrder(): void {
    this.setData({ showOrder: false });
  },

  onMinus(): void {
    if (this.data.count <= 1) return;
    this.setData({ count: this.data.count - 1 });
  },

  onPlus(): void {
    if (this.data.count >= 20) {
      toast('单次最多 20 份');
      return;
    }
    this.setData({ count: this.data.count + 1 });
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
    try {
      await createWorkOrder({
        title: `生鲜预订 · ${this.data.itemName}`,
        category: 'other',
        description: buildFreshOrderDescription({
          tabName: this.data.tabName,
          name: this.data.itemName,
          spec: this.data.itemSpec,
          price: this.data.itemPrice,
          count: this.data.count,
          room,
          contact,
          note: this.data.note,
        }),
      });
      this.setData({ showOrder: false, submitting: false });
      wx.showToast({ title: '已登记，到驿站自提时结算', icon: 'none' });
    } catch {
      this.setData({ submitting: false });
      toast('提交失败，请稍后重试');
    }
  },

  noop(): void {
    /* noop */
  },
});
