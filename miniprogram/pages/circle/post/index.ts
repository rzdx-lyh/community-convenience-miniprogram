/**
 * 社区圈子 · 发布动态（设计稿 sheetPostNew）
 * 纯本地表单：类型 / 正文 / 配图（wx.chooseMedia 本地临时路径）/ 话题，提交后返回。
 */
const info = wx.getWindowInfo();

interface ComposeType {
  key: string;
  label: string;
  tip: string;
}

const TYPES: ComposeType[] = [
  { key: 'ask', label: '邻里求助', tip: '说清要借什么、什么时候用、在哪取' },
  { key: 'share', label: '随手分享', tip: '今天在社区看到什么' },
  { key: 'sell', label: '闲置转让', tip: '物品名称、成色、价格、在哪自提' },
  { key: 'event', label: '活动召集', tip: '活动内容、时间地点、大概几个人' },
];

const TOPICS = ['路况实况', '邻里求助', '闲置转让', '活动召集', '养宠交流'];
const MAX_IMAGES = 9;
const MIN_LEN = 4;

Page({
  data: {
    statusBarHeight: info.statusBarHeight,
    types: TYPES,
    type: 'ask',
    placeholder: TYPES[0].tip,
    content: '',
    contentLen: 0,
    images: [] as string[],
    maxImages: MAX_IMAGES,
    topics: TOPICS,
    topic: '',
    price: '',
    whenText: '',
    whereText: '',
    canPublish: false,
  },

  onLoad(options: Record<string, string | undefined>): void {
    const raw = options.topic ? decodeURIComponent(options.topic) : '';
    if (TOPICS.indexOf(raw) >= 0) this.setData({ topic: raw });
  },

  onTypeTap(e: WechatMiniprogram.TouchEvent): void {
    const key = String((e.currentTarget.dataset as { key?: string }).key ?? '');
    const hit = TYPES.find((t) => t.key === key);
    if (!hit) return;
    this.setData({ type: hit.key, placeholder: hit.tip });
  },

  onContentInput(e: WechatMiniprogram.Input): void {
    const content = String(e.detail.value ?? '');
    this.setData({
      content,
      contentLen: content.length,
      canPublish: content.trim().length >= MIN_LEN,
    });
  },

  onPriceInput(e: WechatMiniprogram.Input): void {
    this.setData({ price: String(e.detail.value ?? '') });
  },

  onWhenInput(e: WechatMiniprogram.Input): void {
    this.setData({ whenText: String(e.detail.value ?? '') });
  },

  onWhereInput(e: WechatMiniprogram.Input): void {
    this.setData({ whereText: String(e.detail.value ?? '') });
  },

  /** 按类型把一句话补成完整动态（设计稿 aiPolish） */
  onAiPolish(): void {
    const base = this.data.content.replace(/[\s。！!，,~、]+$/g, '').trim();
    if (!base) {
      wx.showToast({ title: '先写一句，我帮你补完整', icon: 'none' });
      return;
    }
    const tailMap: Record<string, string> = {
      ask: '。我在 3 号楼 2 单元，今天 18:00 后都在家，不方便的话我也可以自己上门取，先谢谢邻居们了。',
      sell: '。九成新，楼下自提，先到先得；需要的邻居评论区留言，两天没人要就送回收。',
      event: '。本周日 15:00，社区活动室 2 楼，人少也开，欢迎带娃带老人一起来，想来的说一声我统计人数。',
      share: '。今天路过看到的，分享给邻居们，出门注意安全。',
    };
    const content = base + (tailMap[this.data.type] ?? tailMap.share);
    this.setData({
      content,
      contentLen: content.length,
      canPublish: content.trim().length >= MIN_LEN,
    });
  },

  onTopicTap(e: WechatMiniprogram.TouchEvent): void {
    const topic = String((e.currentTarget.dataset as { topic?: string }).topic ?? '');
    this.setData({ topic: this.data.topic === topic ? '' : topic });
  },

  onChooseImage(): void {
    const remain = MAX_IMAGES - this.data.images.length;
    if (remain <= 0) {
      wx.showToast({ title: `最多 ${MAX_IMAGES} 张`, icon: 'none' });
      return;
    }
    wx.chooseMedia({
      count: remain,
      mediaType: ['image'],
      sizeType: ['compressed'],
      success: (res) => {
        const added = res.tempFiles.map((f) => String(f.tempFilePath));
        this.setData({ images: this.data.images.concat(added).slice(0, MAX_IMAGES) });
      },
    });
  },

  onRemoveImage(e: WechatMiniprogram.TouchEvent): void {
    const idx = Number((e.currentTarget.dataset as { idx?: number }).idx ?? -1);
    if (idx < 0) return;
    const images = this.data.images.slice();
    images.splice(idx, 1);
    this.setData({ images });
  },

  onClear(): void {
    this.setData({
      content: '',
      contentLen: 0,
      canPublish: false,
      images: [],
      topic: '',
      price: '',
      whenText: '',
      whereText: '',
    });
  },

  onPublish(): void {
    if (!this.data.canPublish) {
      wx.showToast({ title: `至少写 ${MIN_LEN} 个字`, icon: 'none' });
      return;
    }
    wx.showToast({ title: '发布成功', icon: 'success' });
    setTimeout(() => this.goBack(), 700);
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
