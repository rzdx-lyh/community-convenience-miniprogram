/**
 * 首启资料设置页（2026-10-22 · v1.2.1 调整）
 *
 * 进入小程序第一件事：设置头像、昵称，并选择自己在社区内的位置点；
 * 完成后写入本地标志 → 首页。云端 updateProfile 失败时仍保留本地资料，不阻断服务。
 *
 * v1.2.1：微信 `wx.getLocation` 接口申请被驳回，本页改为**手动选择社区位置点**
 * （见 `config/community.ts`），不再读取手机定位，因此也不需要位置授权弹窗。
 */
import { STORAGE_KEYS } from '../../../config/env';
import { COMMUNITY_SPOTS, resolveSpot, spotPickerLabels, spotToLocation } from '../../../config/community';
import { getProfile, login } from '../../../services/auth';
import { updateProfile } from '../../../services/user';
import { store } from '../../../store/global';
import {
  avatarText,
  isUsableLocation,
  isValidNickName,
  normalizeNickName,
  NICKNAME_MAX,
  type UserLocation,
} from '../../../utils/onboarding';
import { toast } from '../../../utils/ui';

const info = wx.getWindowInfo();

interface ChooseAvatarEvent {
  detail: { avatarUrl: string };
}

Page({
  data: {
    statusBarHeight: info.statusBarHeight,
    nickName: '',
    avatarUrl: '',
    avatarTemp: '',
    avatarText: '邻',
    nickMax: NICKNAME_MAX,
    agreed: false,
    busy: false,
    /** 社区位置点文案（如「3 号楼 · 社区中心 · 默认位置」） */
    locText: '',
    locDesc: '',
  },

  onLoad() {
    // 已设置过就不再拦截；例如从其他入口重新打开
    if (store.get<boolean>(STORAGE_KEYS.SETUP_DONE, false)) {
      this.goHome();
      return;
    }

    const agreed = store.get<boolean>(STORAGE_KEYS.AGREED_PRIVACY, false);
    const local = store.get<{ nickName?: string; avatarUrl?: string } | null>(
      STORAGE_KEYS.SETUP_PROFILE,
      null,
    );
    const cached = store.get<{ nickName?: string; avatarUrl?: string } | null>(
      STORAGE_KEYS.PROFILE,
      null,
    );
    const nickName = normalizeNickName(local?.nickName || cached?.nickName || '');
    const avatarUrl = String(local?.avatarUrl || cached?.avatarUrl || '');

    const cachedLoc = store.get<UserLocation | null>(STORAGE_KEYS.USER_LOCATION, null);
    const spot = resolveSpot(isUsableLocation(cachedLoc) ? cachedLoc : null);
    this.setData({
      agreed,
      nickName,
      avatarUrl,
      avatarText: avatarText(nickName),
      locText: `${spot.name} · ${spot.desc}`,
      locDesc: `${COMMUNITY_SPOTS.length} 个可选位置 · 点击更换`,
    });
  },

  /* ---------------------------- 头像 / 昵称 ---------------------------- */

  onChooseAvatar(e: ChooseAvatarEvent): void {
    const avatarUrl = String(e.detail.avatarUrl || '');
    if (!avatarUrl) return;
    this.setData({ avatarUrl, avatarTemp: avatarUrl });
  },

  onNickInput(e: WechatMiniprogram.Input): void {
    const value = String(e.detail.value || '');
    this.setData({ nickName: value, avatarText: avatarText(value) });
  },

  onNickBlur(e: WechatMiniprogram.Input): void {
    const value = normalizeNickName(e.detail.value);
    this.setData({ nickName: value, avatarText: avatarText(value) });
  },

  /* -------------------- 社区位置（手选，不读取手机定位） -------------------- */

  onPickSpot(): void {
    wx.showActionSheet({
      itemList: spotPickerLabels(),
      success: (res) => {
        const spot = COMMUNITY_SPOTS[res.tapIndex];
        if (!spot) return;
        store.set(STORAGE_KEYS.USER_LOCATION, spotToLocation(spot));
        this.setData({
          locText: `${spot.name} · ${spot.desc}`,
          locDesc: `${COMMUNITY_SPOTS.length} 个可选位置 · 点击更换`,
        });
      },
    });
  },

  /* ---------------------------- 协议 ---------------------------- */

  onToggleAgree(): void {
    const agreed = !this.data.agreed;
    this.setData({ agreed });
    store.set(STORAGE_KEYS.AGREED_PRIVACY, agreed);
  },

  onOpenDoc(e: WechatMiniprogram.TouchEvent): void {
    const kind = String((e.currentTarget.dataset as { kind?: string }).kind ?? 'user');
    wx.showModal({
      title: kind === 'privacy' ? '隐私政策' : '用户协议',
      content:
        kind === 'privacy'
          ? '仅收集办事必需信息：头像、昵称、楼栋房号、联系方式。社区位置由你在本页手动选择（楼栋/出入口），仅用于就近排序附近服务点；不读取手机定位、不保存轨迹、不向第三方共享。'
          : '本小程序只提供社区服务的信息发布与预约登记，不收款、不担保交易、不提供医疗诊断；实际服务由社区与入驻师傅线下履约。',
      showCancel: false,
      confirmText: '我知道了',
    });
  },

  /* ---------------------------- 提交 ---------------------------- */

  async onSubmit(): Promise<void> {
    if (this.data.busy) return;
    const nickName = normalizeNickName(this.data.nickName);
    if (!isValidNickName(nickName)) {
      toast(`昵称需为 1–${NICKNAME_MAX} 个字符`);
      return;
    }
    if (!this.data.agreed) {
      toast('请先勾选并同意《用户协议》和《隐私政策》');
      return;
    }

    this.setData({ busy: true });
    try {
      const avatar = await this.uploadAvatarIfNeeded();
      const patch: { nickName: string; avatarUrl?: string } = { nickName };
      if (/^(cloud:\/\/|https?:\/\/)/.test(avatar)) patch.avatarUrl = avatar;

      let saved = false;
      try {
        let profile = await getProfile();
        if (!profile || !profile.accountId) profile = await login();
        await updateProfile(patch);
        saved = true;
      } catch {
        // 云端不可用时不阻断：本地先保存，个人中心仍可继续修改
        saved = false;
      }

      store.set(STORAGE_KEYS.SETUP_PROFILE, { nickName, avatarUrl: avatar });
      store.set(STORAGE_KEYS.SETUP_DONE, true);
      toast(saved ? '设置完成' : '资料已保存到本地');
      this.goHome();
    } finally {
      this.setData({ busy: false });
    }
  },

  /** 选的是临时文件就上传云存储；失败则保留本地预览路径 */
  async uploadAvatarIfNeeded(): Promise<string> {
    const temp = this.data.avatarTemp;
    if (!temp) return this.data.avatarUrl;
    if (/^(cloud:\/\/|https?:\/\/)/.test(temp)) return temp;
    try {
      const ext = (temp.match(/\.(\w+)$/) || [])[1] || 'jpg';
      const cloudPath = `avatars/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const up = await wx.cloud.uploadFile({ cloudPath, filePath: temp });
      return up.fileID;
    } catch {
      // 云存储不可用时落本地持久文件，至少本次/下次启动还能显示头像
      try {
        return wx.getFileSystemManager().saveFileSync(temp);
      } catch {
        return this.data.avatarUrl;
      }
    }
  },

  onSkip(): void {
    store.set(STORAGE_KEYS.SETUP_DONE, true);
    this.goHome();
  },

  goHome(): void {
    wx.switchTab({ url: '/pages/index/index' });
  },
});

