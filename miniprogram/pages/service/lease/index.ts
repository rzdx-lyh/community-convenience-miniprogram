/**
 * 房屋租售（按 UI 设计稿 1.4 新建）
 *
 * 结构：彩色页头 → 全部/出租/出售 → 房源卡 → 详情弹层（联系房东）→ 发布 / 求租登记
 *
 * ⚠ 红线：只做信息展示与联系，**不撮合、不收佣金、不代收租金与押金**。
 *   发布与求租都走既有 workorder:create，核验由社区线下完成。
 */
import { createWorkOrder } from '../../../services/workorder';
import { track, trackPageView } from '../../../utils/logger';
import { toast } from '../../../utils/ui';
import {
  HOUSES,
  LEASE_FILTERS,
  buildLeasePublishDescription,
  buildLeaseWantDescription,
  filterHouses,
  findHouse,
  type HouseItem,
  type LeaseDeal,
  type LeaseFilter,
} from './viewmodel';

const info = wx.getWindowInfo();

Page({
  data: {
    statusBarHeight: info.statusBarHeight,
    filters: LEASE_FILTERS,
    deal: 'all' as LeaseFilter,
    houses: HOUSES as HouseItem[],
    totalCount: HOUSES.length,

    /** 弹层：detail = 房源详情 / post = 我要发布 / want = 求租登记 */
    sheet: '' as '' | 'detail' | 'post' | 'want',
    activeTitle: '',
    activeDesc: '',
    activeDetail: '',
    activePriceText: '',
    activeUnitText: '',
    activeDealText: '',
    activeEmoji: '',
    activeTags: [] as string[],

    /** 发布表单 */
    postDeal: 'rent' as LeaseDeal,
    postTitle: '',
    postLayout: '',
    postArea: '',
    postPrice: '',
    postContact: '',
    postNote: '',

    /** 求租表单 */
    wantContact: '',
    wantNote: '',

    submitting: false,
  },

  onLoad() {
    trackPageView('pages/service/lease/index');
  },

  onSwitchDeal(e: WechatMiniprogram.TouchEvent): void {
    const v = String((e.currentTarget.dataset as { v?: string }).v ?? 'all') as LeaseFilter;
    if (v === this.data.deal) return;
    track('btn_click', { page: 'lease', target: 'filter', deal: v });
    this.setData({ deal: v, houses: filterHouses(v) });
  },

  /* ============================ 房源详情 ============================ */

  onOpenHouse(e: WechatMiniprogram.TouchEvent): void {
    const id = String((e.currentTarget.dataset as { id?: string }).id ?? '');
    const h = findHouse(id);
    if (!h) return;
    track('btn_click', { page: 'lease', target: 'house', id });
    this.setData({
      sheet: 'detail',
      activeTitle: h.title,
      activeDesc: h.desc,
      activeDetail: h.detail,
      activePriceText: h.priceText,
      activeUnitText: h.unitText,
      activeDealText: h.dealText,
      activeEmoji: h.emoji,
      activeTags: h.tags,
    });
  },

  /** 联系房东：只给提示，不做任何撮合或资金代收 */
  onContact(): void {
    track('btn_click', { page: 'lease', target: 'contact' });
    wx.showModal({
      title: '联系看房',
      content:
        '社区只提供信息登记，不撮合交易、不收中介费、不代收租金与押金。看房与签约请双方线下自行完成，务必核验房产证与身份证。',
      confirmText: '知道了',
      showCancel: false,
    });
  },

  /* ============================ 发布 / 求租 ============================ */

  onOpenPost(): void {
    track('btn_click', { page: 'lease', target: 'post_open' });
    this.setData({
      sheet: 'post',
      postDeal: 'rent',
      postTitle: '',
      postLayout: '',
      postArea: '',
      postPrice: '',
      postContact: '',
      postNote: '',
    });
  },

  onOpenWant(): void {
    track('btn_click', { page: 'lease', target: 'want_open' });
    this.setData({ sheet: 'want', wantContact: '', wantNote: '' });
  },

  onCloseSheet(): void {
    this.setData({ sheet: '' });
  },

  onPostDeal(e: WechatMiniprogram.TouchEvent): void {
    const d = String((e.currentTarget.dataset as { d?: string }).d ?? 'rent') as LeaseDeal;
    this.setData({ postDeal: d });
  },

  onInputPostTitle(e: WechatMiniprogram.Input): void {
    this.setData({ postTitle: String(e.detail.value ?? '') });
  },

  onInputPostLayout(e: WechatMiniprogram.Input): void {
    this.setData({ postLayout: String(e.detail.value ?? '') });
  },

  onInputPostArea(e: WechatMiniprogram.Input): void {
    this.setData({ postArea: String(e.detail.value ?? '') });
  },

  onInputPostPrice(e: WechatMiniprogram.Input): void {
    this.setData({ postPrice: String(e.detail.value ?? '') });
  },

  onInputPostContact(e: WechatMiniprogram.Input): void {
    this.setData({ postContact: String(e.detail.value ?? '') });
  },

  onInputPostNote(e: WechatMiniprogram.Input): void {
    this.setData({ postNote: String(e.detail.value ?? '') });
  },

  onInputWantContact(e: WechatMiniprogram.Input): void {
    this.setData({ wantContact: String(e.detail.value ?? '') });
  },

  onInputWantNote(e: WechatMiniprogram.Input): void {
    this.setData({ wantNote: String(e.detail.value ?? '') });
  },

  async onSubmitPost(): Promise<void> {
    if (this.data.submitting) return;
    const title = String(this.data.postTitle ?? '').trim();
    const price = String(this.data.postPrice ?? '').trim();
    const contact = String(this.data.postContact ?? '').trim();
    if (!title) {
      toast('请填写房源（楼栋单元房号）');
      return;
    }
    if (!price) {
      toast('请填写挂牌价');
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
        title: `房源${this.data.postDeal === 'rent' ? '出租' : '出售'}登记`,
        category: 'other',
        description: buildLeasePublishDescription({
          deal: this.data.postDeal,
          title,
          layout: this.data.postLayout,
          area: this.data.postArea,
          price,
          contact,
          note: this.data.postNote,
        }),
      });
      this.setData({ sheet: '', submitting: false });
      wx.showToast({ title: '已提交，核验后展示', icon: 'none' });
    } catch {
      this.setData({ submitting: false });
      toast('提交失败，请稍后重试');
    }
  },

  async onSubmitWant(): Promise<void> {
    if (this.data.submitting) return;
    const contact = String(this.data.wantContact ?? '').trim();
    const note = String(this.data.wantNote ?? '').trim();
    if (!note) {
      toast('请填写求租需求');
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
        title: '求租登记',
        category: 'other',
        description: buildLeaseWantDescription({ contact, note }),
      });
      this.setData({ sheet: '', submitting: false });
      wx.showToast({ title: '已登记，有合适房源会联系你', icon: 'none' });
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
