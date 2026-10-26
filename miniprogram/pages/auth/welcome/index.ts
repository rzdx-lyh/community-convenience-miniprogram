/**
 * 引导页（CR-028）
 *
 * 首次进入的品牌介绍：能力点 → 开始使用 → 登录页。
 * 不做真实鉴权，所有入口都允许跳过先逛。
 */
const info = wx.getWindowInfo();

export {};

Page({
  data: {
    statusBarHeight: info.statusBarHeight,
    feats: [
      { i: 'wrench', c: 'blue', n: '报修与紧急求助', d: '水电门窗、公共设施，110/119/120 一键直达' },
      { i: 'calendar', c: 'teal', n: '预约与办事指南', d: '门诊取号、疫苗登记、政务材料一次带齐' },
      { i: 'bowl', c: 'gold', n: '助餐与生活服务', d: '社区食堂订餐、保洁、开锁、快递代取' },
      { i: 'users', c: 'indigo', n: '邻里圈子', d: '公告、闲置、互助，只和本社区的人聊' },
    ],
  },

  onStart(): void {
    wx.navigateTo({
      url: '/pages/auth/login/index',
      fail: () => {
        wx.switchTab({ url: '/pages/index/index' });
      },
    });
  },

  onSkip(): void {
    wx.switchTab({ url: '/pages/index/index' });
  },

  onOpenDoc(e: WechatMiniprogram.TouchEvent): void {
    const kind = String((e.currentTarget.dataset as { kind?: string }).kind ?? 'user');
    wx.showModal({
      title: kind === 'privacy' ? '隐私政策' : '用户协议',
      content:
        kind === 'privacy'
          ? '仅收集办事必需信息：昵称、楼栋房号、联系方式。社区位置由你在设置页手动选择，仅用于就近排序附近服务点；不读取手机定位、不保存轨迹、不向第三方共享。'
          : '本小程序只提供社区服务的信息发布与预约登记，不收款、不担保交易、不提供医疗诊断；实际服务由社区与入驻师傅线下履约。',
      showCancel: false,
      confirmText: '我知道了',
    });
  },
});
