/**
 * 我的（按设计稿 pgProfile v1.4 重建）
 * 资料卡 + 数据统计 + 家庭与地址 + 我的服务 + 设置中心 + 帮助
 */
import { STORAGE_KEYS } from '../../config/env';
import { toast } from '../../utils/ui';

const info = wx.getWindowInfo();

/* ==================== 可单测的纯函数（保留给既有单测） ==================== */

/** 社区账号格式（与契约 CR-009 一致） */
export const ACCOUNT_ID_PATTERN = /^[a-z][a-z0-9_]{3,19}$/;

export function isValidAccountId(value: string): boolean {
  return ACCOUNT_ID_PATTERN.test(value);
}

export function normalizeAccountId(value: string): string {
  return String(value ?? '').trim().toLowerCase();
}

export const ACCOUNT_FORMAT_TIP = '社区账号需 4-20 位小写字母开头，可含数字和下划线';

export function shouldAgreePrivacy(agreed: unknown): boolean {
  return agreed !== true;
}

export function normalizeElderMode(value: unknown): boolean {
  return value === true;
}

Page({
  data: {
    statusBarHeight: info.statusBarHeight,

    prof: {
      name: '3 栋阿明',
      sign: '爱帮邻居搭把手，有事喊我一声',
      addr: '3 号楼 2 单元 502',
      av: '明',
    },

    stats: [
      { n: 2, t: '我发的', url: '/pages/circle/mine/index' },
      { n: 3, t: '我回复的', url: '/pages/circle/mine/index' },
      { n: 1, t: '我收藏的', url: '/pages/circle/mine/index' },
      { n: 3, t: '我的预约', url: '/pages/service/book/index' },
    ],

    members: [
      { k: 'm1', n: '母亲', av: '妈', cls: 'a2' },
      { k: 'm2', n: '小满', av: '满', cls: 'a3' },
    ],

    addrs: [
      { k: 'a1', t: '3 号楼 2 单元 502', def: true },
      { k: 'a2', t: '1 号楼 1 单元 201', def: false },
    ],

    services: [
      { k: 'book', t: '我的预约', d: '家政 / 助餐 / 助浴 / 改造登记', v: '3 条', icon: 'clipboard', tone: 'blue', url: '/pages/service/book/index' },
      { k: 'bill', t: '户号绑定', d: '水 / 电 / 燃气 · 代缴登记', v: '2 / 3', icon: 'bulb', tone: 'gold', url: '/pages/service/bill/index' },
      { k: 'record', t: '健康档案', d: '建档 · 测量记录 · 签约医生', v: '', icon: 'clipboard', tone: 'teal', url: '/pages/service/record/index' },
      { k: 'tool', t: '借用中的设备', d: '共享雨伞 · 剩余 22:15', v: '1 件', icon: 'umbrella', tone: 'teal', url: '/pages/service/tool/index' },
    ],

    notice: { wo: true, out: true, act: false } as Record<string, boolean>,
    font: 'std',
    care: false,
  },

  onLoad() {
    const care = normalizeElderMode(wx.getStorageSync(STORAGE_KEYS.ELDER_MODE));
    this.setData({ care });
  },

  /* ---------------------------- 交互 ---------------------------- */

  onStat(e: WechatMiniprogram.TouchEvent): void {
    const url = String(e.currentTarget.dataset.url ?? '');
    if (url) wx.navigateTo({ url });
  },

  onGo(e: WechatMiniprogram.TouchEvent): void {
    const url = String(e.currentTarget.dataset.url ?? '');
    if (url) wx.navigateTo({ url });
  },

  /** 关怀模式：只落本地存储，由主控在 app 层决定字号 */
  onCare(): void {
    const care = !this.data.care;
    this.setData({ care });
    wx.setStorageSync(STORAGE_KEYS.ELDER_MODE, care);
    toast(care ? '关怀模式已开启' : '关怀模式已关闭');
  },

  onNoticeSwitch(e: WechatMiniprogram.TouchEvent): void {
    const k = String(e.currentTarget.dataset.k ?? '');
    const notice = { ...this.data.notice, [k]: !this.data.notice[k] };
    this.setData({ notice });
  },

  onFont(e: WechatMiniprogram.TouchEvent): void {
    this.setData({ font: String(e.currentTarget.dataset.v ?? 'std') });
  },

  onAddr(e: WechatMiniprogram.TouchEvent): void {
    const k = String(e.currentTarget.dataset.k ?? '');
    const addrs = this.data.addrs.map((a) => ({ ...a, def: a.k === k }));
    this.setData({ addrs });
    toast('已设为默认地址');
  },

  onMemberAdd(): void {
    toast('添加家庭成员正在开发中');
  },

  onMemberTap(): void {
    toast('成员管理正在开发中');
  },

  onHelp(): void {
    toast('帮助与反馈正在开发中');
  },

  onAbout(): void {
    toast('邻里小助手 1.4');
  },

  onMine(): void {
    wx.navigateTo({ url: '/pages/circle/mine/index' });
  },
});
