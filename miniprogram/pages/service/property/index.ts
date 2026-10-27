/**
 * 物业延伸（CR-027）
 *
 * 3 个子频道：外卖代收 / 流浪动物 / 房屋租售 → 各自的登记弹层（走 workorder:create）
 *
 * ⚠ 红线：社区只做信息登记，不介入物业与业主之间的权责；
 *   房屋租售不收中介费、不做资金托管。
 */
import { createWorkOrder } from '../../../services/workorder';
import { track, trackPageView } from '../../../utils/logger';
import { toast } from '../../../utils/ui';
import { getStatusBarHeight } from '../../../utils/device';
import {
  LEASE_ITEMS,
  PROPERTY_TABS,
  STRAY_RULES,
  STRAY_SPOTS,
  TAKEOUT_RULES,
  TAKEOUT_SPOTS,
  buildLeaseOrderDescription,
  buildStrayOrderDescription,
  buildTakeoutOrderDescription,
  findLease,
  type LeaseItem,
  type PropertyTab,
} from './viewmodel';

Page({
  data: {
    statusBarHeight: getStatusBarHeight(),
    tabs: PROPERTY_TABS,
    tab: 'takeout' as PropertyTab,
    tabNote: PROPERTY_TABS[0].note,

    takeoutSpots: TAKEOUT_SPOTS,
    takeoutRules: TAKEOUT_RULES,
    strayRules: STRAY_RULES,
    straySpots: STRAY_SPOTS,
    leases: LEASE_ITEMS as LeaseItem[],

    /** 外卖代收弹层 */
    showTakeout: false,
    platform: '',
    code: '',

    /** 流浪动物弹层 */
    showStray: false,
    strayKind: '救助',
    straySpot: STRAY_SPOTS[0].name,
    straySpotNames: STRAY_SPOTS.map((s) => s.name),
    straySpotIndex: 0,

    /** 房源弹层 */
    showLease: false,
    leaseTitle: '',
    leaseDeal: 'rent' as 'rent' | 'sale',
    leaseLayout: '',
    leaseArea: '',
    leasePrice: '',

    room: '',
    contact: '',
    note: '',
    submitting: false,
  },

  onLoad(options: Record<string, string | undefined>) {
    trackPageView('pages/service/property/index');
    const t = String(options?.tab ?? '') as PropertyTab;
    if (PROPERTY_TABS.some((x) => x.key === t)) this.setData({ tab: t });
    this.render();
  },

  render(): void {
    const meta = PROPERTY_TABS.find((t) => t.key === this.data.tab) ?? PROPERTY_TABS[0];
    this.setData({ tabNote: meta.note });
  },

  /** 返回首页（TabBar 页需用 switchTab，三个子频道共用此入口） */
  onHome(): void {
    track('btn_click', { page: 'property', target: 'home' });
    wx.switchTab({ url: '/pages/index/index' });
  },

  onSwitchTab(e: WechatMiniprogram.TouchEvent): void {
    const t = String((e.currentTarget.dataset as { t?: string }).t ?? 'takeout') as PropertyTab;
    if (t === this.data.tab) return;
    track('btn_click', { page: 'property', target: 'switch_tab', tab: t });
    this.setData({ tab: t }, () => this.render());
  },

  /* ------------------------------ 外卖代收 ------------------------------ */

  onTakeout(): void {
    track('btn_click', { page: 'property', target: 'takeout_open' });
    this.setData({ showTakeout: true, platform: '', code: '', room: '', contact: '', note: '' });
  },

  onCloseTakeout(): void {
    this.setData({ showTakeout: false });
  },

  onInputPlatform(e: WechatMiniprogram.Input): void {
    this.setData({ platform: String(e.detail.value ?? '') });
  },

  onInputCode(e: WechatMiniprogram.Input): void {
    this.setData({ code: String(e.detail.value ?? '') });
  },

  async onSubmitTakeout(): Promise<void> {
    if (this.data.submitting) return;
    const room = String(this.data.room ?? '').trim();
    const contact = String(this.data.contact ?? '').trim();
    if (!this.data.platform.trim()) {
      toast('请填写外卖平台');
      return;
    }
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
        title: '外卖代收登记',
        category: 'other',
        description: buildTakeoutOrderDescription({
          platform: this.data.platform,
          code: this.data.code,
          room,
          contact,
          note: this.data.note,
        }),
      });
      this.setData({ showTakeout: false, submitting: false });
      wx.showToast({ title: '已登记，到件会通知你', icon: 'none' });
    } catch {
      this.setData({ submitting: false });
      toast('提交失败，请稍后重试');
    }
  },

  /* ------------------------------ 流浪动物 ------------------------------ */

  onStray(e: WechatMiniprogram.TouchEvent): void {
    const kind = String((e.currentTarget.dataset as { kind?: string }).kind ?? '救助');
    track('btn_click', { page: 'property', target: 'stray_open', kind });
    this.setData({
      showStray: true,
      strayKind: kind,
      straySpot: this.data.straySpotNames[this.data.straySpotIndex] ?? STRAY_SPOTS[0].name,
      contact: '',
      note: '',
    });
  },

  onCloseStray(): void {
    this.setData({ showStray: false });
  },

  onStraySpotChange(e: WechatMiniprogram.PickerChange): void {
    const idx = Number(e.detail.value ?? 0);
    this.setData({
      straySpotIndex: idx,
      straySpot: this.data.straySpotNames[idx] ?? STRAY_SPOTS[0].name,
    });
  },

  async onSubmitStray(): Promise<void> {
    if (this.data.submitting) return;
    const contact = String(this.data.contact ?? '').trim();
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
        title: `流浪动物${this.data.strayKind}登记`,
        category: 'other',
        description: buildStrayOrderDescription({
          kind: this.data.strayKind,
          spot: this.data.straySpot,
          contact,
          note: this.data.note,
        }),
      });
      this.setData({ showStray: false, submitting: false });
      wx.showToast({ title: '已登记，社区会跟进', icon: 'none' });
    } catch {
      this.setData({ submitting: false });
      toast('提交失败，请稍后重试');
    }
  },

  /* ------------------------------ 房屋租售 ------------------------------ */

  onAskLease(e: WechatMiniprogram.TouchEvent): void {
    const id = String((e.currentTarget.dataset as { id?: string }).id ?? '');
    const item = findLease(id);
    if (!item) return;
    track('btn_click', { page: 'property', target: 'lease_ask', id });
    wx.showModal({
      title: '联系看房',
      content: '社区只做信息登记，不收中介费、不做资金托管。看房与签约请双方线下自行完成，务必核验房产证与身份证。',
      confirmText: '知道了',
      showCancel: false,
    });
  },

  onPublish(): void {
    track('btn_click', { page: 'property', target: 'lease_publish_open' });
    this.setData({
      showLease: true,
      leaseTitle: '',
      leaseDeal: 'rent',
      leaseLayout: '',
      leaseArea: '',
      leasePrice: '',
      contact: '',
      note: '',
    });
  },

  onCloseLease(): void {
    this.setData({ showLease: false });
  },

  onDealChange(e: WechatMiniprogram.TouchEvent): void {
    const d = String((e.currentTarget.dataset as { d?: string }).d ?? 'rent') as 'rent' | 'sale';
    this.setData({ leaseDeal: d });
  },

  onInputLeaseTitle(e: WechatMiniprogram.Input): void {
    this.setData({ leaseTitle: String(e.detail.value ?? '') });
  },

  onInputLeaseLayout(e: WechatMiniprogram.Input): void {
    this.setData({ leaseLayout: String(e.detail.value ?? '') });
  },

  onInputLeaseArea(e: WechatMiniprogram.Input): void {
    this.setData({ leaseArea: String(e.detail.value ?? '') });
  },

  onInputLeasePrice(e: WechatMiniprogram.Input): void {
    this.setData({ leasePrice: String(e.detail.value ?? '') });
  },

  async onSubmitLease(): Promise<void> {
    if (this.data.submitting) return;
    const contact = String(this.data.contact ?? '').trim();
    if (!this.data.leaseTitle.trim()) {
      toast('请填写房源（楼栋单元房号）');
      return;
    }
    if (!this.data.leasePrice.trim()) {
      toast('请填写价格');
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
        title: `房源${this.data.leaseDeal === 'rent' ? '出租' : '出售'}登记`,
        category: 'other',
        description: buildLeaseOrderDescription({
          deal: this.data.leaseDeal,
          title: this.data.leaseTitle,
          layout: this.data.leaseLayout || '未填',
          area: this.data.leaseArea || '未填',
          price: this.data.leasePrice,
          contact,
          note: this.data.note,
        }),
      });
      this.setData({ showLease: false, submitting: false });
      wx.showToast({ title: '已提交，核验后展示', icon: 'none' });
    } catch {
      this.setData({ submitting: false });
      toast('提交失败，请稍后重试');
    }
  },

  /* ------------------------------ 公共输入 ------------------------------ */

  onInputRoom(e: WechatMiniprogram.Input): void {
    this.setData({ room: String(e.detail.value ?? '') });
  },

  onInputContact(e: WechatMiniprogram.Input): void {
    this.setData({ contact: String(e.detail.value ?? '') });
  },

  onInputNote(e: WechatMiniprogram.Input): void {
    this.setData({ note: String(e.detail.value ?? '') });
  },

  noop(): void {
    /* noop */
  },
});
