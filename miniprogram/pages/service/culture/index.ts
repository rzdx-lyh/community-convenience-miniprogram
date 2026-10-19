/**
 * 文化服务（CR-027 / CR-028 视觉重写）
 *
 * 图书角借阅（分类筛选 + 借阅规则）/ 四点半课堂（课程 + 余位进度）→ 登记弹层。
 *
 * ⚠ 红线：本页不收款；材料费（如有）现场收取并公示。
 */
import { createWorkOrder } from '../../../services/workorder';
import { track, trackPageView } from '../../../utils/logger';
import { toast } from '../../../utils/ui';
import {
  BOOK_CATS,
  BOOKS,
  CLASSES,
  CULTURE_TABS,
  LIBRARY_RULES,
  buildCultureOrderDescription,
  filterBooks,
  findBook,
  findClass,
  seatPercent,
  type BookItem,
  type ClassItem,
  type CultureTab,
} from './viewmodel';

interface ClassVM extends ClassItem {
  percent: number;
  full: boolean;
}

const info = wx.getWindowInfo();

Page({
  data: {
    statusBarHeight: info.statusBarHeight,
    tabs: CULTURE_TABS,
    tab: 'library' as CultureTab,
    tabNote: CULTURE_TABS[0].note,

    /** 图书角 */
    cats: BOOK_CATS,
    cat: '全部',
    books: BOOKS as BookItem[],
    rules: LIBRARY_RULES,

    /** 课堂 */
    classes: [] as ClassVM[],

    /** 登记弹层 */
    showForm: false,
    kind: '借书' as '借书' | '报名',
    itemName: '',
    room: '',
    contact: '',
    note: '',
    submitting: false,
  },

  onLoad(options: Record<string, string | undefined>) {
    trackPageView('pages/service/culture/index');
    const t = String(options?.tab ?? '') as CultureTab;
    if (CULTURE_TABS.some((x) => x.key === t)) this.setData({ tab: t });
    this.setData({
      classes: CLASSES.map((c) => ({
        ...c,
        percent: seatPercent(c),
        full: c.seats <= 0,
      })),
    });
    this.render();
  },

  render(): void {
    const meta = CULTURE_TABS.find((t) => t.key === this.data.tab) ?? CULTURE_TABS[0];
    this.setData({ tabNote: meta.note });
  },

  goBack(): void {
    if (getCurrentPages().length > 1) wx.navigateBack();
    else wx.switchTab({ url: '/pages/index/index' });
  },

  onSwitchTab(e: WechatMiniprogram.TouchEvent): void {
    const t = String((e.currentTarget.dataset as { t?: string }).t ?? 'library') as CultureTab;
    if (t === this.data.tab) return;
    track('btn_click', { page: 'culture', target: 'switch_tab', tab: t });
    this.setData({ tab: t }, () => this.render());
  },

  onCatTap(e: WechatMiniprogram.TouchEvent): void {
    const cat = String((e.currentTarget.dataset as { v?: string }).v ?? '全部');
    if (cat === this.data.cat) return;
    this.setData({ cat, books: filterBooks(cat) });
  },

  onBorrow(e: WechatMiniprogram.TouchEvent): void {
    const id = String((e.currentTarget.dataset as { id?: string }).id ?? '');
    const book = findBook(id);
    if (!book) return;
    if (book.stock <= 0) {
      toast('这本已被借走了，看看别的');
      return;
    }
    track('btn_click', { page: 'culture', target: 'borrow_open', id });
    this.setData({ showForm: true, kind: '借书', itemName: book.name, room: '', contact: '', note: '' });
  },

  onJoin(e: WechatMiniprogram.TouchEvent): void {
    const id = String((e.currentTarget.dataset as { id?: string }).id ?? '');
    const cls = findClass(id);
    if (!cls) return;
    if (cls.seats <= 0) {
      toast('这班已满，可以选其他课程');
      return;
    }
    track('btn_click', { page: 'culture', target: 'join_open', id });
    this.setData({ showForm: true, kind: '报名', itemName: cls.name, room: '', contact: '', note: '' });
  },

  onCloseForm(): void {
    this.setData({ showForm: false });
  },

  onInputRoom(e: WechatMiniprogram.Input): void {
    this.setData({ room: String(e.detail.value ?? '') });
  },

  onInputContact(e: WechatMiniprogram.Input): void {
    this.setData({ contact: String(e.detail.value ?? '') });
  },

  onInputNote(e: WechatMiniprogram.Input): void {
    this.setData({ note: String(e.detail.value ?? '') });
  },

  async onSubmit(): Promise<void> {
    if (this.data.submitting) return;
    const room = String(this.data.room ?? '').trim();
    const contact = String(this.data.contact ?? '').trim();
    if (!room) {
      toast('请填写楼栋房号');
      return;
    }
    if (!contact) {
      toast('请填写联系电话');
      return;
    }
    if (!/^\d{7,15}$/.test(contact.replace(/[-\s]/g, ''))) {
      toast('请填写正确的联系电话');
      return;
    }
    this.setData({ submitting: true });
    try {
      await createWorkOrder({
        title: `${this.data.kind === '借书' ? '图书借阅' : '课堂报名'} · ${this.data.itemName}`,
        category: 'other',
        description: buildCultureOrderDescription({
          kind: this.data.kind,
          name: this.data.itemName,
          room,
          contact,
          note: this.data.note,
        }),
      });
      this.setData({ showForm: false, submitting: false });
      wx.showToast({
        title: this.data.kind === '借书' ? '已登记，请到活动室取书' : '已报名，等待确认',
        icon: 'none',
      });
    } catch {
      this.setData({ submitting: false });
      toast('提交失败，请稍后重试');
    }
  },
});
