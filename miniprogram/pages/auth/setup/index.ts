/**
 * 首启资料设置页（2026-10-22）
 *
 * 进入小程序第一件事：设置头像、昵称，并请求当前位置；
 * 完成后写入本地标志 → 首页。云端 updateProfile 失败时仍保留本地资料，不阻断服务。
 */
import { STORAGE_KEYS } from '../../../config/env';
import { getProfile, login } from '../../../services/auth';
import { updateProfile } from '../../../services/user';
import { store } from '../../../store/global';
import { distanceMeters, formatDistance } from '../../../utils/geo';
import {
  avatarText,
  formatCoords,
  isFreshLocation,
  isValidNickName,
  normalizeNickName,
  NICKNAME_MAX,
  type UserLocation,
} from '../../../utils/onboarding';
import { toast } from '../../../utils/ui';

const info = wx.getWindowInfo();
const COMMUNITY_CENTER = { latitude: 23.12894, longitude: 113.26411 };

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
    locState: 'idle' as 'idle' | 'locating' | 'ok' | 'denied',
    locText: '点击获取当前位置',
    locationText: '',
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
    const locReady = isFreshLocation(cachedLoc);
    this.setData({
      agreed,
      nickName,
      avatarUrl,
      avatarText: avatarText(nickName),
      locState: locReady ? 'ok' : 'idle',
      locText: locReady ? '已定位 · 点击刷新' : '点击获取当前位置',
      locationText: locReady && cachedLoc ? formatCoords(cachedLoc.latitude, cachedLoc.longitude) : '',
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

  /* ---------------------------- 位置授权 ---------------------------- */

  onRequestLocation(): void {
    if (!this.data.agreed) {
      toast('请先勾选并同意《用户协议》和《隐私政策》');
      return;
    }
    if (this.data.locState === 'locating') return;
    this.setData({ locState: 'locating', locText: '定位中…' });

    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        const loc: UserLocation = {
          latitude: res.latitude,
          longitude: res.longitude,
          ts: Date.now(),
        };
        store.set(STORAGE_KEYS.USER_LOCATION, loc);
        const meters = distanceMeters(loc, COMMUNITY_CENTER);
        this.setData({
          locState: 'ok',
          locText: `已定位 · 距社区中心 ${formatDistance(meters)}`,
          locationText: formatCoords(loc.latitude, loc.longitude),
        });
      },
      fail: () => {
        this.setData({ locState: 'denied', locText: '未授权 · 点此重新授权' });
        wx.showModal({
          title: '需要位置权限',
          content: '用于显示你附近的物业、卫生站、快递柜等服务点；不保存移动轨迹。',
          confirmText: '去设置',
          cancelText: '暂不开启',
          success: (r) => {
            if (!r.confirm) return;
            wx.openSetting({
              success: (setting) => {
                if (setting.authSetting['scope.userLocation']) this.onRequestLocation();
              },
            });
          },
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
          ? '仅收集办事必需信息：头像、昵称、楼栋房号、联系方式。位置只用于展示附近服务点，不保存移动轨迹，不向第三方共享。'
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

