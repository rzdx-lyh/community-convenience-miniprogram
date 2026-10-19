/**
 * 社区圈子 · 我的圈子
 * 三个 tab：我发的 / 我回复的 / 我收藏的；列表为本地演示数据，卡片点击进对应话题。
 */
const info = wx.getWindowInfo();

interface MineTab {
  key: string;
  label: string;
}

interface MinePost {
  id: string;
  topic: string;
  who: string;
  unit: string;
  time: string;
  color: string;
  av: string;
  text: string;
  imgs: string[];
  tag: string;
  likes: number;
  comments: number;
}

const TABS: MineTab[] = [
  { key: 'post', label: '我发的' },
  { key: 'reply', label: '我回复的' },
  { key: 'save', label: '我收藏的' },
];

const MY_POSTS: MinePost[] = [
  {
    id: 'p7', topic: '闲置转让', who: '3 栋阿明', unit: '3 号楼 1 单元', time: '6 小时前', color: '#4B45B8', av: '明',
    text: '孩子长高了骑不了，儿童自行车 16 寸，刹车和轮胎都好，送打气筒。楼下自提。',
    imgs: ['🚲', '🛞'], tag: '#闲置转让', likes: 9, comments: 0,
  },
  {
    id: 'p9', topic: '养宠交流', who: '3 栋阿明', unit: '3 号楼 2 单元', time: '3 小时前', color: '#0E7C6B', av: '明',
    text: '东侧围墙那块空地光照好，物业说可以申请做共享小菜园，我打算去问一下流程，有想一起弄的邻居吗？',
    imgs: ['🌱'], tag: '#邻里共建', likes: 23, comments: 1,
  },
];

const REPLY_POSTS: MinePost[] = [];

const SAVE_POSTS: MinePost[] = [
  {
    id: 'p1', topic: '路况实况', who: '物业服务', unit: '官方账号', time: '5 小时前', color: '#1F5FD6', av: '物',
    text: '2 号门今天开始道路检修，预计两天。早高峰建议走东门，电动车请绕行南门坡道，注意减速。',
    imgs: ['🚧', '🛣'], tag: '#道路施工', likes: 42, comments: 2,
  },
  {
    id: 'p6', topic: '路况实况', who: '2 栋赵哥', unit: '2 号楼 3 单元', time: '1 天前', color: '#0E7C6B', av: '赵',
    text: '西门口那条路昨晚已经修好了，现在走路不用绕，给物业点个赞，从反馈到修好只用了三天。',
    imgs: ['✅', '🛤', '🌇'], tag: '#路况反馈', likes: 55, comments: 1,
  },
];

const EMPTY_TEXT: Record<string, string> = {
  post: '还没发过动态，去圈子里说两句',
  reply: '还没回复过别人，看到求助搭把手',
  save: '还没有收藏，遇到有用的先存起来',
};

function pick(key: string): MinePost[] {
  if (key === 'reply') return REPLY_POSTS;
  if (key === 'save') return SAVE_POSTS;
  return MY_POSTS;
}

Page({
  data: {
    statusBarHeight: info.statusBarHeight,
    tabs: TABS,
    active: 'post',
    list: MY_POSTS as MinePost[],
    emptyText: EMPTY_TEXT.post,
  },

  onTabTap(e: WechatMiniprogram.TouchEvent): void {
    const key = String((e.currentTarget.dataset as { key?: string }).key ?? '');
    if (!key || key === this.data.active) return;
    this.setData({ active: key, list: pick(key), emptyText: EMPTY_TEXT[key] ?? '' });
  },

  onPostTap(e: WechatMiniprogram.TouchEvent): void {
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
