/**
 * 社区圈子 · AI 今日摘要
 * 摘要内容为本地演示数据（生成式结果），刷新仅更新时间戳，不接模型接口。
 */
const info = wx.getWindowInfo();

interface DigestItem {
  t: string;
  b: string;
  s: string;
  ty: string;
}

interface DigestTopic {
  name: string;
  icon: string;
  members: number;
}

const ITEMS: DigestItem[] = [
  {
    t: '2 号门施工，早高峰改走东门',
    b: '物业 5 小时前发布，预计 10 月 20 日恢复；电动车改走南门坡道。',
    s: '来自 1 条官方公告 + 2 条邻居补充',
    ty: '路况',
  },
  {
    t: '西门口路面已修好',
    b: '2 栋赵哥昨晚实拍，从反馈到修好用了三天。',
    s: '来自 1 条带图动态',
    ty: '路况',
  },
  {
    t: '两场活动都还能报名',
    b: '周六 09:00 羽毛球（12/20），周日 15:00 读书会（6/15），都在社区活动室一带。',
    s: '来自 2 条活动动态',
    ty: '活动',
  },
];

const TOPICS: DigestTopic[] = [
  { name: '路况实况', icon: '🚧', members: 186 },
  { name: '邻里求助', icon: '🤝', members: 342 },
  { name: '闲置转让', icon: '📦', members: 274 },
  { name: '活动召集', icon: '🏸', members: 158 },
  { name: '养宠交流', icon: '🐾', members: 126 },
];

function nowText(): string {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

Page({
  data: {
    statusBarHeight: info.statusBarHeight,
    items: ITEMS,
    topics: TOPICS,
    totalPosts: 32,
    generatedAt: nowText(),
  },

  onRefresh(): void {
    this.setData({ generatedAt: nowText() });
    wx.showToast({ title: '已重新生成摘要', icon: 'none' });
  },

  onTopicTap(e: WechatMiniprogram.TouchEvent): void {
    const topic = String((e.currentTarget.dataset as { topic?: string }).topic ?? '');
    if (!topic) return;
    wx.navigateTo({ url: `/pages/circle/topic/index?topic=${encodeURIComponent(topic)}` });
  },

  goBack(): void {
    if (getCurrentPages().length > 1) {
      wx.navigateBack();
      return;
    }
    wx.switchTab({ url: '/pages/circle/index' });
  },
});

export {};
