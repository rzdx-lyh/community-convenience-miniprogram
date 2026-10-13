/**
 * 我的（FE-8 收尾）
 * 本页四件事：① 用户信息 ② 社区账号展示与编辑 ③ 关怀模式开关 ④ 首启隐私政策弹窗 + 我的工单入口
 *
 * 契约与口径：
 * - 社区账号 CR-009：`user:updateProfile({ accountId })`，格式 `/^[a-z][a-z0-9_]{3,19}$/`
 *   （小写字母开头，仅小写字母/数字/下划线，长度 4~20）。
 *   **前端先正则校验再发请求**（非法输入直接给明确提示，不等后端报错）；
 *   被他人占用时由 `utils/request` 层按后端 400 msg 原样 toast，前端不另造文案。
 *   ⚠ 后端判定顺序为「先格式后唯一性」，改自己当前账号返回 200（非 400）。
 * - 关怀模式（D2）：`store.set(STORAGE_KEYS.ELDER_MODE, value)` 持久化 storage；
 *   根节点挂 `.care-mode` 类，靠 app.wxss 的 CSS 变量整体放大字号（**不是整页 scale**）。
 * - 隐私弹窗（E2）：未同意前不加载任何隐私相关数据；同意写入 storage 后不再弹。
 */
import { STORAGE_KEYS } from '../../config/env';
import { getProfile } from '../../services/auth';
import { updateProfile } from '../../services/user';
import { store } from '../../store/global';
import { ROLE_LABELS } from '../../utils/dict';
import { displayName, initialOf } from '../../utils/format';
import { track, trackPageView } from '../../utils/logger';
import { toast } from '../../utils/ui';

/* ==================== 可单测的纯函数 ==================== */

/** 社区账号格式（与契约 CR-009 / 后端强校验完全一致） */
export const ACCOUNT_ID_PATTERN = /^[a-z][a-z0-9_]{3,19}$/;

/** 格式校验 */
export function isValidAccountId(value: string): boolean {
  return ACCOUNT_ID_PATTERN.test(value);
}

/** 归一化：去空白 + 转小写（与后端入库规则一致） */
export function normalizeAccountId(value: string): string {
  return String(value ?? '').trim().toLowerCase();
}

/** 格式非法提示（与后端 400 msg 逐字一致） */
export const ACCOUNT_FORMAT_TIP = '社区账号需 4-20 位小写字母开头，可含数字和下划线';

/** 是否需要弹隐私政策：只有显式 true 才算已同意（storage 为空/其它值都要弹） */
export function shouldAgreePrivacy(agreed: unknown): boolean {
  return agreed === true ? false : true;
}

/** 关怀模式开关归一化：非布尔真值一律按关闭处理 */
export function normalizeElderMode(value: unknown): boolean {
  return value === true;
}

/* ==================== 页面 ==================== */

const PRIVACY_CONTENT =
  '我们仅收集用于社区服务的必要信息（昵称、社区账号、报修内容等），不会用于其他用途。点击「同意」后继续使用。';

Page({
  data: {
    nickName: '居民朋友',
    accountId: '',
    avatarText: '邻',
    roleLabel: '',
    elderMode: false,
    agreedPrivacy: false,
  },

  onLoad() {
    trackPageView('pages/profile/index');
    this.setData({ elderMode: normalizeElderMode(store.get<boolean>(STORAGE_KEYS.ELDER_MODE, false)) });
    // 隐私协议未同意前，不加载任何隐私相关数据（合规硬要求）
    if (shouldAgreePrivacy(store.peek<boolean>(STORAGE_KEYS.AGREED_PRIVACY, false))) {
      this.showPrivacyModal();
      return;
    }
    this.setData({ agreedPrivacy: true });
    void this.loadProfile();
  },

  onShow() {
    const elderMode = normalizeElderMode(store.get<boolean>(STORAGE_KEYS.ELDER_MODE, false));
    if (elderMode !== this.data.elderMode) this.setData({ elderMode });
    if (!this.data.agreedPrivacy) return;
    const cached = store.peek<User | null>(STORAGE_KEYS.PROFILE, null);
    if (cached) this.applyProfile(cached);
  },

  /* ---------- 隐私政策 ---------- */

  showPrivacyModal(): void {
    wx.showModal({
      title: '隐私保护提示',
      content: PRIVACY_CONTENT,
      confirmText: '同意',
      cancelText: '拒绝',
      success: (res) => {
        if (res.confirm) {
          store.set(STORAGE_KEYS.AGREED_PRIVACY, true); // 持久化，下次不再弹
          this.setData({ agreedPrivacy: true });
          void this.loadProfile();
          return;
        }
        // 拒绝：不写入同意标记、不加载隐私数据，页面停在未授权态
        toast('需同意隐私政策后才能使用「我的」页');
      },
      fail: () => toast('隐私弹窗打开失败，请重新进入本页'),
    });
  },

  onViewPrivacy(): void {
    wx.showModal({
      title: '隐私政策',
      content: PRIVACY_CONTENT,
      confirmText: '我知道了',
      showCancel: false,
    });
  },

  /* ---------- 用户信息 ---------- */

  applyProfile(profile: User): void {
    this.setData({
      nickName: displayName(profile.nickName),
      accountId: profile.accountId ?? '',
      avatarText: initialOf(profile.nickName),
      roleLabel: ROLE_LABELS[profile.role] ?? profile.role,
    });
  },

  async loadProfile(): Promise<void> {
    try {
      const profile = await getProfile();
      this.applyProfile(profile);
    } catch {
      // request 层已统一 toast；保持默认文案，不让页面空白
      this.setData({ nickName: '居民朋友', accountId: '', avatarText: '邻', roleLabel: '' });
    }
  },

  /* ---------- 关怀模式 ---------- */

  onElderModeChange(e: WechatMiniprogram.SwitchChange): void {
    const value = normalizeElderMode(e.detail.value);
    store.set(STORAGE_KEYS.ELDER_MODE, value); // 持久化，全站生效
    this.setData({ elderMode: value }); // 根节点 care-mode 类名立即切换（字号放大，非整页缩放）
    track('btn_click', { page: 'profile', target: 'elder_mode', value });
    toast(value ? '已开启关怀模式' : '已关闭关怀模式');
  },

  /* ---------- 我的工单 ---------- */

  onGoOrders(): void {
    track('btn_click', { page: 'profile', target: 'go_orders' });
    wx.switchTab({
      url: '/pages/repair/list/index', // Tab 页必须 switchTab
      fail: () => toast('页面暂时打不开，请稍后再试'),
    });
  },

  /* ---------- 社区账号 ---------- */

  onEditAccountId(): void {
    track('btn_click', { page: 'profile', target: 'edit_account_id' });
    wx.showModal({
      title: '修改社区账号',
      content: this.data.accountId,
      placeholderText: '4-20 位小写字母开头',
      editable: true,
      success: (res) => {
        if (!res.confirm) return;
        void this.submitAccountId(normalizeAccountId(res.content ?? ''));
      },
      fail: () => toast('无法打开编辑框，请稍后再试'),
    });
  },

  /** 提交：先正则校验（不等后端报错），通过后再调 updateProfile */
  async submitAccountId(raw: string): Promise<void> {
    if (!isValidAccountId(raw)) {
      toast(ACCOUNT_FORMAT_TIP);
      return;
    }
    try {
      const profile = await updateProfile({ accountId: raw });
      this.applyProfile(profile);
      toast('社区账号已更新');
    } catch {
      // 被占用等失败：request 层已按后端 msg toast（「社区账号已被使用，换一个试试」）
    }
  },
});
