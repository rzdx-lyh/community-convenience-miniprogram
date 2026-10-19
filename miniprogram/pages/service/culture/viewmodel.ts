/**
 * 文化服务 · 视图模型（CR-027）
 *
 * 2 个子频道：图书角借阅 / 四点半课堂。
 * 数据本地配置；借阅登记与报名都走既有 `workorder:create`，不新增云函数、不改契约。
 *
 * ⚠ 红线：本页**不收款**。课堂若有材料费，一律现场收取并公示，页面不出现在线支付。
 */

export type CultureTab = 'library' | 'class';

export const CULTURE_TABS: Array<{ key: CultureTab; name: string; note: string }> = [
  { key: 'library', name: '图书角借阅', note: '社区活动室 · 免费借阅 · 每人 3 本' },
  { key: 'class', name: '四点半课堂', note: '放学后托管 · 工作日 16:30-18:00' },
];

export interface BookItem {
  id: string;
  name: string;
  cat: string;
  author: string;
  /** 在架数量 */
  stock: number;
  total: number;
  meta: string;
}

export const BOOK_CATS: string[] = ['全部', '儿童绘本', '文学小说', '生活科普', '养生保健', '少儿读物'];

export const BOOKS: BookItem[] = [
  { id: 'b1', name: '猜猜我有多爱你', cat: '儿童绘本', author: '山姆·麦克布雷尼', stock: 3, total: 4, meta: '适合 3-6 岁亲子共读' },
  { id: 'b2', name: '我爸爸', cat: '儿童绘本', author: '安东尼·布朗', stock: 2, total: 3, meta: '适合 3-6 岁' },
  { id: 'b3', name: '活着', cat: '文学小说', author: '余华', stock: 2, total: 2, meta: '成人文学' },
  { id: 'b4', name: '平凡的世界', cat: '文学小说', author: '路遥', stock: 1, total: 3, meta: '全三册，可整套借' },
  { id: 'b5', name: '家庭医生手册', cat: '生活科普', author: '社区医院编', stock: 4, total: 5, meta: '常见病家庭护理参考' },
  { id: 'b6', name: '厨房里的营养学', cat: '生活科普', author: '营养学会', stock: 2, total: 3, meta: '配餐参考，非医嘱' },
  { id: 'b7', name: '中老年养生常识', cat: '养生保健', author: '社区卫生服务中心', stock: 3, total: 6, meta: '健康科普，不替代诊疗' },
  { id: 'b8', name: '半小时漫画中国史', cat: '少儿读物', author: '陈磊', stock: 2, total: 4, meta: '适合 8 岁以上' },
];

/** 借阅规则 */
export const LIBRARY_RULES: Array<{ label: string; value: string }> = [
  { label: '借阅数量', value: '每人同时最多 3 本' },
  { label: '借阅期限', value: '30 天，可续借 1 次（再 30 天）' },
  { label: '逾期处理', value: '逾期暂停借阅，归还后恢复；无罚款' },
  { label: '开放时间', value: '9:00-18:00，周一闭馆' },
  { label: '损坏丢失', value: '轻微破损请告知管理员；丢失按原价赔或补同版书' },
];

export interface ClassItem {
  id: string;
  name: string;
  time: string;
  target: string;
  seats: number;
  total: number;
  teacher: string;
  desc: string;
}

export const CLASSES: ClassItem[] = [
  {
    id: 'k1',
    name: '作业辅导',
    time: '周一至周五 16:30-18:00',
    target: '小学 1-6 年级',
    seats: 8,
    total: 20,
    teacher: '社区志愿者教师 2 名',
    desc: '写作业为主，老师巡回答疑；不讲授新课',
  },
  {
    id: 'k2',
    name: '硬笔书法',
    time: '周二、周四 17:00-18:00',
    target: '小学 1-6 年级',
    seats: 12,
    total: 15,
    teacher: '社区书画社退休教师',
    desc: '从基本笔画练起；自备铅笔与米字格本',
  },
  {
    id: 'k3',
    name: '趣味手工',
    time: '周三 17:00-18:00',
    target: '6-10 岁',
    seats: 5,
    total: 12,
    teacher: '社区志愿者',
    desc: '折纸 / 黏土 / 废旧物改造；材料由社区提供',
  },
  {
    id: 'k4',
    name: '少儿阅读会',
    time: '周五 17:00-18:00',
    target: '7-12 岁',
    seats: 10,
    total: 15,
    teacher: '图书角管理员',
    desc: '共读一本绘本 + 分享；可借书回家',
  },
];

export function filterBooks(cat: string): BookItem[] {
  if (!cat || cat === '全部') return BOOKS;
  return BOOKS.filter((b) => b.cat === cat);
}

export function findBook(id: string): BookItem | undefined {
  return BOOKS.find((b) => b.id === id);
}

export function findClass(id: string): ClassItem | undefined {
  return CLASSES.find((c) => c.id === id);
}

export function seatPercent(item: ClassItem): number {
  if (!item.total) return 0;
  return Math.round(((item.total - item.seats) / item.total) * 100);
}

/** 借阅 / 报名工单描述（走 workorder:create） */
export function buildCultureOrderDescription(input: {
  kind: '借书' | '报名';
  name: string;
  room: string;
  contact: string;
  note?: string;
}): string {
  return [
    `服务：${input.kind === '借书' ? '图书角借阅登记' : '四点半课堂报名'}`,
    `${input.kind === '借书' ? '书目' : '课程'}：${input.name}`,
    `楼栋房号：${String(input.room ?? '').trim()}`,
    `联系电话：${String(input.contact ?? '').trim()}`,
    input.note && input.note.trim() ? `备注：${input.note.trim()}` : '',
    '说明：本页不收款；图书角免费借阅，课堂材料费（如有）现场收取并公示。',
  ]
    .filter((line) => line !== '')
    .join('\n');
}
