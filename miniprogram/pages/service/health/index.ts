/**
 * 健康服务（CR-027 / CR-028 视觉重写）
 *
 * 4 个子频道 Tab → 事项列表 → 预约登记弹层（走 workorder:create）
 *
 * ⚠ 红线：只给办事口径，不做诊断；指标问题一律引导到门诊，
 *   页面固定展示「健康提示，不替代医生诊断」。
 */
import { createWorkOrder } from '../../../services/workorder';
import { track, trackPageView } from '../../../utils/logger';
import { toast } from '../../../utils/ui';
import {
  ANNUAL_INFO,
  HEALTH_TABS,
  REPORT_STEPS,
  buildHealthOrderDescription,
  findHealthItem,
  itemsOf,
  type HealthItem,
  type HealthTab,
} from './viewmodel';

const info = wx.getWindowInfo();
const SLOTS: string[] = ['工作日上午', '工作日下午', '周末上午'];

Page({
  data: {
    statusBarHeight: info.statusBarHeight,
    tabs: HEALTH_TABS,
    tab: 'vaccine' as HealthTab,
    tabName: '疫苗预约',
    tabNote: HEALTH_TABS[0].note,
    items: [] as HealthItem[],
    steps: REPORT_STEPS,
    annual: ANNUAL_INFO,
    isAnnual: false,

    /** 预约弹层 */
    showBook: false,
    itemName: '',
    slots: SLOTS,
    slot: '',
    room: '',
    contact: '',
    note: '',
    submitting: false,
  },

  onLoad(options: Record<string, string | undefined>) {
    trackPageView('pages/service/health/index');
    const t = String(options?.tab ?? '') as HealthTab;
    if (HEALTH_TABS.some((x) => x.key === t)) this.setData({ tab: t });
    this.render();
  },

  render(): void {
    const meta = HEALTH_TABS.find((t) => t.key === this.data.tab) ?? HEALTH_TABS[0];
    const annual = this.data.tab === 'annual';
    this.setData({
      tabName: meta.name,
      tabNote: meta.note,
      isAnnual: annual,
      items: annual ? [] : itemsOf(this.data.tab),
    });
  },

  goBack(): void {
    if (getCurrentPages().length > 1) wx.navigateBack();
    else wx.switchTab({ url: '/pages/index/index' });
  },

  onSwitchTab(e: WechatMiniprogram.TouchEvent): void {
    const t = String((e.currentTarget.dataset as { t?: string }).t ?? 'vaccine') as HealthTab;
    if (t === this.data.tab) return;
    track('btn_click', { page: 'health', target: 'switch_tab', tab: t });
    this.setData({ tab: t }, () => this.render());
  },

  onBook(e: WechatMiniprogram.TouchEvent): void {
    const id = String((e.currentTarget.dataset as { id?: string }).id ?? '');
    const item = id ? findHealthItem(this.data.tab, id) : undefined;
    const name =
      this.data.tab === 'annual'
        ? '65 岁以上年度免费体检'
        : item?.name ?? this.data.tabName;
    track('btn_click', { page: 'health', target: 'book_open', id });
    this.setData({
      showBook: true,
      itemName: name,
      slot: '',
      room: '',
      contact: '',
      note: '',
    });
  },

  onPickSlot(e: WechatMiniprogram.TouchEvent): void {
    this.setData({ slot: String((e.currentTarget.dataset as { v?: string }).v ?? '') });
  },

  onCloseBook(): void {
    this.setData({ showBook: false });
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
        title: `${this.data.tabName} · ${this.data.itemName}`,
        category: 'other',
        description: buildHealthOrderDescription({
          tabName: this.data.tabName,
          name: this.data.itemName,
          room,
          contact,
          slot: this.data.slot,
          note: this.data.note,
        }),
      });
      this.setData({ showBook: false, submitting: false });
      wx.showToast({ title: '已提交，工作人员会电话确认', icon: 'none' });
    } catch {
      this.setData({ submitting: false });
      toast('提交失败，请稍后重试');
    }
  },
});
