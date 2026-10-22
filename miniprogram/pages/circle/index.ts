/**
 * 社区圈子（按设计稿 pgCircle v1.4 重建）
 * 顶部 feed tab + AI 今日摘要 + 话题广场 + 帖子流 + 右下发帖 FAB
 */
const info = wx.getWindowInfo();

interface PostVM {
  id: string;
  pin?: boolean;
  who: string;
  unit: string;
  time: string;
  topic: string;
  official?: boolean;
  color: string;
  av: string;
  text: string;
  imgs: string[];
  imgClass: string;
  tag: string;
  likes: number;
  liked?: boolean;
  comments: number;
  xline: string;
}

const POSTS: PostVM[] = [
  {
    id: 'p1',
    pin: true,
    who: '物业服务',
    unit: '官方账号',
    time: '5 小时前',
    topic: '路况实况',
    official: true,
    color: '#1F5FD6',
    av: '物',
    text: '2 号门今天开始道路检修，预计两天。早高峰建议走东门，电动车请绕行南门坡道，注意减速。',
    imgs: ['🚧', '🛣'],
    imgClass: 'g2',
    tag: '#道路施工',
    likes: 42,
    comments: 2,
    xline: '2 号门 · 主路 · 施工中 · 预计 2 天',
  },
  {
    id: 'p3',
    who: '1 栋陈叔',
    unit: '1 号楼 1 单元',
    time: '1 天前',
    topic: '邻里求助',
    color: '#A86A05',
    av: '陈',
    text: '家里换灯泡差个高一点的梯子，谁家有能借一下？下午就还，谢谢邻居们。',
    imgs: [],
    imgClass: 'g1',
    tag: '#邻里互助',
    likes: 12,
    comments: 2,
    xline: '',
  },
  {
    id: 'p7',
    who: '3 栋阿明',
    unit: '3 号楼 1 单元',
    time: '6 小时前',
    topic: '闲置转让',
    color: '#4B45B8',
    av: '明',
    text: '孩子长高了骑不了，儿童自行车 16 寸，刹车和轮胎都好，送打气筒。楼下自提。',
    imgs: ['🚲', '🛞'],
    imgClass: 'g2',
    tag: '#闲置转让',
    likes: 9,
    comments: 0,
    xline: '￥80 · 原价 ￥299 · 九成新 · 楼下自提',
  },
  {
    id: 'p5',
    who: '社区活动室',
    unit: '官方账号',
    time: '3 天前',
    topic: '活动召集',
    official: true,
    color: '#1F5FD6',
    av: '活',
    text: '本周六上午 9 点，社区羽毛球队在 2 号楼下空地集合，欢迎新邻居加入，球拍可借用。',
    imgs: ['🏸'],
    imgClass: 'g1',
    tag: '#活动召集',
    likes: 27,
    comments: 1,
    xline: '本周六 09:00 · 2 号楼下空地 · 12 / 20 人',
  },
  {
    id: 'p2',
    who: '7 栋小李',
    unit: '7 号楼 2 单元',
    time: '5 天前',
    topic: '养宠交流',
    color: '#0E7C6B',
    av: '李',
    text: '谁家丢了一只橘猫？在中心凉亭附近转了两天，戴着蓝色项圈，很亲人。主人看到请联系门卫室，我先喂着。',
    imgs: ['🐱'],
    imgClass: 'g1',
    tag: '#寻宠启事',
    likes: 68,
    comments: 3,
    xline: '已解决 · 猫已找到主人',
  },
  {
    id: 'p9',
    who: '3 栋阿明',
    unit: '3 号楼 2 单元',
    time: '3 小时前',
    topic: '养宠交流',
    color: '#0E7C6B',
    av: '明',
    text: '东侧围墙那块空地光照好，物业说可以申请做共享小菜园，我打算去问一下流程，有想一起弄的邻居吗？',
    imgs: ['🌱'],
    imgClass: 'g1',
    tag: '#邻里共建',
    likes: 23,
    comments: 1,
    xline: '',
  },
];

const TOPICS = [
  { name: '路况实况', m: 186, icon: 'cone' },
  { name: '邻里求助', m: 342, icon: 'handshake' },
  { name: '闲置转让', m: 208, icon: 'gift' },
  { name: '活动召集', m: 154, icon: 'megaphone' },
  { name: '养宠交流', m: 97, icon: 'paw' },
];

Page({
  data: {
    statusBarHeight: info.statusBarHeight,
    feed: 'rec' as 'rec' | 'follow' | 'near',
    followN: 2,
    nearN: 4,
    topics: TOPICS,
    list: [] as PostVM[],
  },

  onLoad() {
    this.setData({ list: POSTS.slice() });
  },

  /* ---------------------------- 交互 ---------------------------- */

  onFeedTab(e: WechatMiniprogram.TouchEvent): void {
    const v = String(e.currentTarget.dataset.v ?? 'rec') as 'rec' | 'follow' | 'near';
    const base = POSTS.filter((p) => {
      if (v === 'follow') return !!p.official;
      if (v === 'near') return p.unit.indexOf('2 号') === 0 || p.unit.indexOf('3 号') === 0;
      return true;
    });
    const sorted = base.slice().sort((a, b) => (b.pin ? 1 : 0) - (a.pin ? 1 : 0));
    this.setData({ feed: v, list: sorted });
  },

  onPostTap(e: WechatMiniprogram.TouchEvent): void {
    const id = String(e.currentTarget.dataset.id ?? '');
    if (!id) return;
    wx.navigateTo({ url: `/pages/circle/detail/index?id=${encodeURIComponent(id)}` });
  },

  /** 点赞只是本地演示态，不写云端 */
  onLike(e: WechatMiniprogram.TouchEvent): void {
    const id = String(e.currentTarget.dataset.id ?? '');
    const list = this.data.list.map((p) =>
      p.id === id ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) } : p,
    );
    this.setData({ list });
  },

  onTopicTap(e: WechatMiniprogram.TouchEvent): void {
    const name = String(e.currentTarget.dataset.v ?? '');
    wx.navigateTo({ url: `/pages/circle/topic/index?topic=${encodeURIComponent(name)}` });
  },

  onDigest(): void {
    wx.navigateTo({ url: '/pages/circle/digest/index' });
  },

  onMine(): void {
    wx.navigateTo({ url: '/pages/circle/mine/index' });
  },

  onPostNew(): void {
    wx.navigateTo({ url: '/pages/circle/post/index' });
  },
});
