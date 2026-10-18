/**
 * 服务分类页（FE-14 · 契约 CR-022）
 *
 * 背景：首页 2×2 宫格原来点开是 `wx.showActionSheet`，8 个子项尚可，扩到 38 项后
 * 一屏塞不下、也没有说明文字。改为整页分类浏览：4 类 Tab + 8 板块分组 + 每项一行说明。
 *
 * 路由约定（见 config/service-grid.ts 头注释）：
 * - 带 `targetParams.book` 的服务 → 本页内弹出预约表单，不走 navigateByTarget；
 *   若不拦这一下，navigateTo 会跳到本页自身，形成无限叠层。
 * - 其余项一律交给 navigateByTarget，与首页宫格共用同一套分发逻辑。
 *
 * 提交走 `workorder:create`（契约既有动作，零新增接口）：
 * title=「<服务名>预约」，category='other'，description 为结构化文本。
 */
import { listServices } from '../../../services/service';
import { createWorkOrder } from '../../../services/workorder';
import { navigateByTarget } from '../../../utils/navigator';
import { track, trackPageView } from '../../../utils/logger';
import { toast } from '../../../utils/ui';
import {
  buildBookingDescription,
  countItems,
  findRawItem,
  pickCategory,
  TIME_SLOTS,
  toGroupsVM,
  toItemVM,
  type GroupVM,
} from './viewmodel';

/** 模块级：数据缓存（跨 setData 保留原始 ServiceItem 供导航使用） */
let categories: ServiceCategory[] = [];

Page({
  data: {
    cats: [] as { key: string; title: string }[],
    active: '',
    title: '',
    sub: '',
    count: 0,
    groups: [] as GroupVM[],
    times: TIME_SLOTS,
    sheet: {
      show: false,
      svc: '',
      opts: [] as string[],
      opt: '',
      room: '',
      time: '',
      note: '',
    },
    submitting: false,
  },

  onLoad(options: Record<string, string | undefined>) {
    trackPageView('pages/service/category/index');
    this.load(String(options.cat ?? '').trim(), options);
  },

  load(wantedKey: string, options: Record<string, string | undefined>) {
    listServices()
      .then((list) => {
        categories = list;
        this.setData({ cats: categories.map((c) => ({ key: c.key, title: c.title })) });
        this.applyCategory(pickCategory(categories, wantedKey));
        // 深链：?book=保洁&opts=a|b —— 直接打开预约弹层（不经过列表点击）
        const book = String(options.book ?? '').trim();
        if (book) {
          this.openBooking({
            name: book,
            opts: String(options.opts ?? '')
              .split('|')
              .filter((s) => s !== ''),
          });
        }
      })
      .catch(() => {
        toast('服务列表加载失败，请稍后再试');
      });
  },

  applyCategory(category?: ServiceCategory) {
    if (!category) return;
    this.setData({
      active: category.key,
      title: category.title,
      sub: category.subtitle ?? '',
      count: countItems(category),
      groups: toGroupsVM(category),
    });
  },

  onTapCat(e: WechatMiniprogram.TouchEvent): void {
    const key = String((e.currentTarget.dataset as { key?: string }).key ?? '');
    if (key === this.data.active) return;
    const category = pickCategory(categories, key);
    if (!category) return;
    track('btn_click', { target: 'service_cat', kind: key });
    this.applyCategory(category);
    wx.pageScrollTo({ scrollTop: 0, duration: 160 });
  },

  /** 服务项点击：预约类走页内弹层，其余交给统一分发 */
  onTapItem(e: WechatMiniprogram.TouchEvent): void {
    const key = String((e.currentTarget.dataset as { key?: string }).key ?? '');
    const category = pickCategory(categories, this.data.active);
    const raw = findRawItem(category, key);
    if (!raw) {
      toast('该服务暂未开通');
      return;
    }
    const vm = toItemVM(raw);
    if (vm.book) {
      this.openBooking({ name: vm.name, opts: vm.opts });
      return;
    }
    navigateByTarget(raw);
  },

  openBooking(payload: { name: string; opts: string[] }) {
    this.setData({
      sheet: {
        show: true,
        svc: payload.name,
        opts: payload.opts,
        opt: payload.opts[0] ?? '',
        room: '',
        time: '',
        note: '',
      },
    });
  },

  onCloseSheet(): void {
    this.setData({ 'sheet.show': false });
  },

  /** 阻止弹层内部点击冒泡到遮罩 */
  noop(): void {
    /* 空实现：仅用于 catchtap 阻断冒泡 */
  },

  onPickOpt(e: WechatMiniprogram.TouchEvent): void {
    this.setData({ 'sheet.opt': String((e.currentTarget.dataset as { v?: string }).v ?? '') });
  },

  onPickTime(e: WechatMiniprogram.TouchEvent): void {
    this.setData({ 'sheet.time': String((e.currentTarget.dataset as { v?: string }).v ?? '') });
  },

  onInputRoom(e: WechatMiniprogram.Input): void {
    this.setData({ 'sheet.room': e.detail.value });
  },

  onInputNote(e: WechatMiniprogram.Input): void {
    this.setData({ 'sheet.note': e.detail.value });
  },

  onSubmit(): void {
    const { svc, opt, room, time, note } = this.data.sheet;
    if (this.data.submitting) return;
    if (!room.trim()) {
      toast('请填写楼栋房号');
      return;
    }
    if (!time) {
      toast('请选择期望时间');
      return;
    }
    this.setData({ submitting: true });
    createWorkOrder({
      title: `${svc}预约`,
      description: buildBookingDescription({ svc, opt, room, time, note }),
      category: 'other',
    })
      .then((res) => {
        this.setData({ submitting: false, 'sheet.show': false });
        track('service_book', { svc, time });
        wx.showModal({
          title: '已提交',
          content: `${svc}预约已登记，工作人员会电话确认。\n单号：${res.id.slice(-6)}`,
          showCancel: false,
          confirmText: '知道了',
          success: () => {
            wx.navigateBack({ fail: () => wx.switchTab({ url: '/pages/index/index' }) });
          },
        });
      })
      .catch(() => {
        this.setData({ submitting: false });
        toast('提交失败，请稍后再试');
      });
  },
});
