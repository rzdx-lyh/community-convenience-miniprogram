/**
 * 社区圈子 · 动态详情（CR-028）
 *
 * 对照设计稿 docs/03-preview/demo.html 的 pgPost（第 1861-1912 行）1:1 实现。
 * 设计稿里这一页是帖子详情 + 评论 + 相关动态 + 吸底评论输入条。
 *
 * 数据：本地演示数据（与原型 POSTS 同口径）。接服务层时把 POST / COMMENTS
 *      换成 services/circle.ts 的请求即可，模板不用动。
 */

interface PostComment {
  /** 评论人显示名 */
  who: string;
  /** 头像字（取昵称首字） */
  avatar: string;
  /** 是否官方（物业/社区工作人员） */
  official?: boolean;
  /** 头像底色 */
  color: string;
  /** 评论正文 */
  text: string;
  /** 相对时间 */
  meta: string;
  /** 被回复人（@ 谁） */
  replyTo?: string;
}

interface PostDetail {
  id: string;
  who: string;
  avatar: string;
  avatarColor: string;
  unit: string;
  time: string;
  text: string;
  images: string[];
  topic: string;
  type: 'ask' | 'sell' | 'event' | 'road' | 'share';
  typeLabel: string;
  /** 类型卡补充信息（闲置价 / 活动时间地点 / 路况位置） */
  extra: string;
  pinned: boolean;
  official: boolean;
  likes: number;
  tag: string;
  /** 活动报名人数（type=event 时有意义） */
  joined: number;
  /** 采纳回答（type=ask 时有意义） */
  best: string;
}

const POST: PostDetail = {
  id: 'p1',
  who: '7 栋小李',
  avatar: '李',
  avatarColor: '#0E7C6B',
  unit: '7 号楼',
  time: '12 分钟前',
  text: '楼下 3 单元门口的充电桩今天下午突然没电了，有两辆电动车还插着。已经跟物业报修了，师傅说明天上午来。提醒大家先别去充，免得白等。',
  images: ['#EEF3FB', '#DCE8FA'],
  topic: '路况实况',
  type: 'road',
  typeLabel: '路况',
  extra: '3 号楼 3 单元门口 · 充电桩区域',
  pinned: false,
  official: false,
  likes: 18,
  tag: '便民提醒',
  joined: 0,
  best: '',
};

const COMMENTS: PostComment[] = [
  {
    who: '物业服务',
    avatar: '物',
    official: true,
    color: '#1F5FD6',
    text: '已收到，师傅明天 9:00 前到场处理，恢复后会在这条下面回复。',
    meta: '8 分钟前',
  },
  {
    who: '3 栋阿明',
    avatar: '阿',
    color: '#7C8BA1',
    text: '谢谢提醒，我刚准备下楼推车过去，幸亏看到这条。',
    meta: '6 分钟前',
    replyTo: '7 栋小李',
  },
  {
    who: '5 栋王阿姨',
    avatar: '王',
    color: '#7C8BA1',
    text: '另一侧 4 单元的桩还能用吗？老人腿脚不方便，跑远一趟很费劲。',
    meta: '3 分钟前',
  },
];

const RELATED = [
  { id: 'p3', avatar: '张', text: '东门快递柜昨天换了新码，旧的取不出来了', who: '5 栋张姐', topic: '路况实况', likes: 11 },
  { id: 'p6', avatar: '陈', text: '地库入口道闸偶尔不识别车牌，要按喇叭两次', who: '1 栋老陈', topic: '路况实况', likes: 6 },
];

Page({
  data: {
    statusBarHeight: 20,
    postId: POST.id,
    post: POST,
    comments: COMMENTS,
    related: RELATED,
    liked: false,
    saved: false,
    joinedFlag: false,
    replyTo: '',
    commentText: '',
    likeCount: POST.likes,
  },

  onLoad(options: Record<string, string | undefined>) {
    const info = wx.getWindowInfo();
    this.setData({
      statusBarHeight: info.statusBarHeight ?? 20,
      // 从列表页带过来的 id 只用于后续接接口，演示数据不区分帖子
      postId: options?.id ?? POST.id,
    });
  },

  goBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack();
      return;
    }
    wx.switchTab({ url: '/pages/circle/index' });
  },

  onLike() {
    const liked = !this.data.liked;
    this.setData({ liked, likeCount: POST.likes + (liked ? 1 : 0) });
    wx.vibrateShort({ type: 'light' });
  },

  onSave() {
    const saved = !this.data.saved;
    this.setData({ saved });
    wx.showToast({ title: saved ? '已收藏' : '已取消收藏', icon: 'none' });
  },

  onJoinEvent() {
    if (this.data.joinedFlag) {
      wx.showToast({ title: '已报名', icon: 'none' });
      return;
    }
    this.setData({ joinedFlag: true });
    wx.showToast({ title: '报名成功', icon: 'success' });
  },

  onShare() {
    wx.showToast({ title: '点右上角可转发', icon: 'none' });
  },

  onMore() {
    wx.showActionSheet({
      itemList: ['举报这条动态', '不感兴趣', '复制链接'],
      success: (res) => {
        if (res.tapIndex === 0) wx.showToast({ title: '已提交举报', icon: 'none' });
      },
      fail: () => undefined,
    });
  },

  onReplyTap(e: WechatMiniprogram.TouchEvent) {
    const who = String(e.currentTarget.dataset.who ?? '');
    this.setData({ replyTo: who });
  },

  onCancelReply() {
    this.setData({ replyTo: '' });
  },

  onCommentInput(e: { detail: { value: string } }) {
    this.setData({ commentText: e.detail.value });
  },

  onSendComment() {
    const text = String(this.data.commentText ?? '').trim();
    if (!text) {
      wx.showToast({ title: '说点什么再发', icon: 'none' });
      return;
    }
    const replyTo = String(this.data.replyTo ?? '');
    const next = (this.data.comments as PostComment[]).concat({
      who: '我',
      avatar: '我',
      color: '#1F5FD6',
      text,
      meta: '刚刚',
      replyTo: replyTo || undefined,
    });
    this.setData({ comments: next, commentText: '', replyTo: '' });
    wx.showToast({ title: '已发送', icon: 'success' });
  },

  onOpenRelated(e: WechatMiniprogram.TouchEvent) {
    const id = String(e.currentTarget.dataset.id ?? '');
    wx.navigateTo({ url: `/pages/circle/detail/index?id=${encodeURIComponent(id)}` });
  },

  noop() {
    /* 阻止冒泡 */
  },
});
