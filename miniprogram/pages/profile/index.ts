/**
 * 我的（按设计稿 pgProfile v1.4 重建）
 * 资料卡 + 数据统计 + 家庭与地址 + 我的服务 + 设置中心 + 帮助
 */
import { STORAGE_KEYS } from '../../config/env';
import { getProfile } from '../../services/auth';
import { updateProfile } from '../../services/user';
import { store } from '../../store/global';
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
    capsuleGap: 8,

    prof: {
      name: '社区用户',
      sign: '正在同步社区账号',
      addr: '未设置楼栋',
      av: '邻',
      avatarUrl: '',
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
      { k: 'workorder', t: '我的报修', d: '提交记录 · 处理进度 · 完工反馈', v: '', icon: 'clipboard', tone: 'blue', url: '/pages/repair/list/index' },
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
    let capsuleGap = 8;
    try {
      const menu = wx.getMenuButtonBoundingClientRect();
      // 胶囊底部到状态栏底部的距离 + 8px 呼吸位；避免头像/昵称被右上角胶囊压住。
      capsuleGap = Math.max(8, Math.ceil(menu.bottom - info.statusBarHeight + 8));
    } catch {
      capsuleGap = 8;
    }
    this.setData({ care, capsuleGap });
  },

  onShow() {
    void this.loadProfile();
  },

  /** 用真实登录档案替换原型里的演示姓名/楼栋；失败时保留可用的匿名占位。 */
  async loadProfile(): Promise<void> {
    try {
      const p = await getProfile();
      const name = String(p.nickName || '').trim() || '社区用户';
      const building = String(p.building || '').trim();
      this.setData({
        prof: {
          name,
          sign: `社区账号 · ${p.accountId}`,
          addr: building || '未设置楼栋',
          av: name.slice(0, 1),
          avatarUrl: String(p.avatarUrl || ''),
        },
      });
    } catch {
      // 云端不可用（401/断网）时，仍展示首启设置保存的本地头像/昵称
      const local = store.get<{ nickName?: string; avatarUrl?: string } | null>(
        STORAGE_KEYS.SETUP_PROFILE,
        null,
      );
      const name = String(local?.nickName || '').trim();
      if (name) {
        this.setData({
          prof: {
            ...this.data.prof,
            name,
            sign: '社区账号 · 本地资料',
            av: name.slice(0, 1),
            avatarUrl: String(local?.avatarUrl || ''),
          },
        });
      }
    }
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
    wx.showModal({
      title: '添加家庭成员',
      content: '家庭成员需由社区登记后开通。可先在社区电话簿联系物业服务中心办理。',
      confirmText: '查看电话簿',
      success: (res) => {
        if (res.confirm) wx.navigateTo({ url: '/pages/phonebook/index' });
      },
    });
  },

  onMemberTap(): void {
    wx.showModal({
      title: '家庭成员',
      content: '成员资料以社区登记信息为准；如需修改请联系物业服务中心。',
      showCancel: false,
      confirmText: '知道了',
    });
  },

  onHelp(): void {
    wx.navigateTo({
      url: '/pages/phonebook/index',
      fail: () => toast('电话簿暂时打不开，请稍后再试'),
    });
  },

  onAbout(): void {
    wx.showModal({
      title: '邻里小助手',
      content: '社区便民服务小程序 · 提供报修、通知、电话簿、办事指引与 AI 问答。',
      showCancel: false,
      confirmText: '知道了',
    });
  },

  onMine(): void {
    wx.navigateTo({ url: '/pages/circle/mine/index' });
  },

  /** 换头像：选图 → 传云存储 → 更新资料（2026-10-22） */
  onEditAvatar(): void {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sizeType: ['compressed'],
      success: async (res) => {
        const file = res.tempFiles && res.tempFiles[0];
        if (!file || !file.tempFilePath) return;
        try {
          wx.showLoading({ title: '上传中…', mask: true });
          const ext = (file.tempFilePath.match(/\.(\w+)$/) || [])[1] || 'jpg';
          const cloudPath = `avatars/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
          const up = await wx.cloud.uploadFile({ cloudPath, filePath: file.tempFilePath });
          await updateProfile({ avatarUrl: up.fileID });
          this.setData({ 'prof.avatarUrl': up.fileID });
          wx.hideLoading();
          toast('头像已更新');
        } catch {
          wx.hideLoading();
          toast('头像更新失败，请重试');
        }
      },
    });
  },

  /** 改昵称：showModal editable 输入框（基础库 2.17.1+） */
  onEditName(): void {
    wx.showModal({
      title: '修改昵称',
      editable: true,
      placeholderText: '请输入新昵称（20 字内）',
      success: async (res) => {
        if (!res.confirm) return;
        const nickName = String(res.content || '').trim();
        if (!nickName) return toast('昵称不能为空');
        if (nickName.length > 20) return toast('昵称不超过 20 字');
        try {
          await updateProfile({ nickName });
          this.setData({ 'prof.name': nickName, 'prof.av': nickName.slice(0, 1) });
          toast('昵称已更新');
        } catch {
          toast('昵称更新失败，请重试');
        }
      },
    });
  },
});
