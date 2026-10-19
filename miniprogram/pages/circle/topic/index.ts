/**
 * 社区圈子 · 话题页
 * 入参：?topic=路况实况；话题元信息与帖子流均为本地演示数据，结构对齐设计稿 pgTopic。
 */
const info = wx.getWindowInfo();

interface TopicMeta {
  name: string;
  icon: string;
  members: number;
  desc: string;
}

interface TopicPost {
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
  official?: boolean;
  pin?: boolean;
}

const META: Record<string, TopicMeta> = {
  路况实况: {
    name: '路况实况',
    icon: '🚧',
    members: 186,
    desc: '小区路面、门岗、施工与临时管制，实拍实报。看到就发一条，比群里刷屏有用。',
  },
  邻里求助: {
    name: '邻里求助',
    icon: '🤝',
    members: 342,
    desc: '借个梯子、搭把手、找个东西。邻居之间能帮就帮，帮完记得回来说一声。',
  },
  闲置转让: {
    name: '闲置转让',
    icon: '📦',
    members: 274,
    desc: '孩子长大用不上的、搬家带不走的，先问邻居再扔。本社区只做信息沟通，不收款、不担保。',
  },
  活动召集: {
    name: '活动召集',
    icon: '🏸',
    members: 158,
    desc: '打球、读书、遛弯、义诊，凑够人就成团。发起活动请在正文写清时间地点。',
  },
  养宠交流: {
    name: '养宠交流',
    icon: '🐾',
    members: 126,
    desc: '寻宠、喂养、疫苗、遛狗路线。遛狗请牵绳、随手清理，做个体面邻居。',
  },
};

const POSTS: TopicPost[] = [
  {
    id: 'p1', topic: '路况实况', who: '物业服务', unit: '官方账号', time: '5 小时前', color: '#1F5FD6', av: '物',
    text: '2 号门今天开始道路检修，预计两天。早高峰建议走东门，电动车请绕行南门坡道，注意减速。',
    imgs: ['🚧', '🛣'], tag: '#道路施工', likes: 42, comments: 2, official: true, pin: true,
  },
  {
    id: 'p6', topic: '路况实况', who: '2 栋赵哥', unit: '2 号楼 3 单元', time: '1 天前', color: '#0E7C6B', av: '赵',
    text: '西门口那条路昨晚已经修好了，现在走路不用绕，给物业点个赞，从反馈到修好只用了三天。',
    imgs: ['✅', '🛤', '🌇'], tag: '#路况反馈', likes: 55, comments: 1,
  },
  {
    id: 'p3', topic: '邻里求助', who: '1 栋陈叔', unit: '1 号楼 1 单元', time: '1 天前', color: '#A86A05', av: '陈',
    text: '家里换灯泡差个高一点的梯子，谁家有能借一下？下午就还，谢谢邻居们。',
    imgs: [], tag: '#邻里互助', likes: 12, comments: 2,
  },
  {
    id: 'p7', topic: '闲置转让', who: '3 栋阿明', unit: '3 号楼 1 单元', time: '6 小时前', color: '#4B45B8', av: '明',
    text: '孩子长高了骑不了，儿童自行车 16 寸，刹车和轮胎都好，送打气筒。楼下自提。',
    imgs: ['🚲', '🛞'], tag: '#闲置转让', likes: 9, comments: 0,
  },
  {
    id: 'p8', topic: '活动召集', who: '5 栋刘老师', unit: '5 号楼 2 单元', time: '1 天前', color: '#0E7C6B', av: '刘',
    text: '想在社区活动室办个周末读书会，第一次先聊聊各自的读书习惯，带一本最近在看的书就行，人不多也能聊。',
    imgs: ['📖'], tag: '#活动召集', likes: 18, comments: 1,
  },
  {
    id: 'p9', topic: '养宠交流', who: '3 栋阿明', unit: '3 号楼 2 单元', time: '3 小时前', color: '#0E7C6B', av: '明',
    text: '东侧围墙那块空地光照好，物业说可以申请做共享小菜园，我打算去问一下流程，有想一起弄的邻居吗？',
    imgs: ['🌱'], tag: '#邻里共建', likes: 23, comments: 1,
  },
];

function filterPosts(topic: string): TopicPost[] {
  return POSTS.filter((p) => p.topic === topic);
}

Page({
  data: {
    statusBarHeight: info.statusBarHeight,
    topic: '路况实况',
    meta: META['路况实况'] as TopicMeta,
    posts: [] as TopicPost[],
    followed: false,
  },

  onLoad(options: Record<string, string | undefined>): void {
    const raw = options.topic ? decodeURIComponent(options.topic) : '';
    const topic = META[raw] ? raw : '路况实况';
    this.setData({ topic, meta: META[topic], posts: filterPosts(topic) });
  },

  onFollowTap(): void {
    const followed = !this.data.followed;
    this.setData({ followed });
    wx.showToast({ title: followed ? '已关注话题' : '已取消关注', icon: 'none' });
  },

  onJoinTap(): void {
    wx.navigateTo({ url: `/pages/circle/post/index?topic=${encodeURIComponent(this.data.topic)}` });
  },

  onDigestTap(): void {
    wx.navigateTo({ url: '/pages/circle/digest/index' });
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
