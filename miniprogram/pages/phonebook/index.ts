/**
 * 便民电话簿（FE-7 / CR-028 视觉重写）
 * 契约：phonebook:list（不分页、按 sort 升序；category 为空 = 全部）
 *
 * 合规要点：
 * - 一键拨号必须由用户点击触发，禁止自动拨号（makePhoneCall 已封装）
 * - 公共服务号码不做脱敏：110 / 119 / 120 等短号必须完整可见、禁止改号
 * - 接口失败或返回空时使用本地兜底，保证紧急号码任何情况下都拨得出去
 */
import { listPhonebook } from '../../services/phonebook';
import { PHONE_CATEGORY_LABELS, labelOf } from '../../utils/dict';
import { track, trackPageView } from '../../utils/logger';
import { makePhoneCall } from '../../utils/ui';

const info = wx.getWindowInfo();

const VALID_CATEGORIES: PhoneItem['category'][] = [
  'property',
  'government',
  'medical',
  'life',
  'emergency',
];

/** 归一化分类入参：非法/缺失一律返回空串（= 全部） */
export function normalizePhoneCategory(input?: string): PhoneItem['category'] | '' {
  const value = String(input ?? '').trim().toLowerCase();
  return (VALID_CATEGORIES as string[]).indexOf(value) >= 0 ? (value as PhoneItem['category']) : '';
}

export interface PhoneTab {
  label: string;
  value: PhoneItem['category'] | '';
}

export const PHONE_TABS: PhoneTab[] = [
  { label: '全部', value: '' },
  { label: '物业', value: 'property' },
  { label: '政务', value: 'government' },
  { label: '医疗', value: 'medical' },
  { label: '生活', value: 'life' },
  { label: '急救', value: 'emergency' },
];

/** 分组展示单元 */
export interface PhoneSection {
  key: string;
  label: string;
  items: PhoneItem[];
}

/** 本地兜底号码：与 config/emergency.ts、后端种子同源（110/119/120 严禁改动） */
const FALLBACK_PHONES: PhoneItem[] = [
  { _id: 'fb-1', name: '物业服务中心', phone: '020-88888888', category: 'property', sort: 1, remark: '24 小时值班 · 报修 / 门禁 / 停车' },
  { _id: 'fb-2', name: '物业维修班', phone: '020-88886600', category: 'property', sort: 2, remark: '水电、门窗、下水道 · 8:00-20:00' },
  { _id: 'fb-3', name: '社区居委会', phone: '020-88886666', category: 'government', sort: 3, remark: '政务咨询 · 工作日 9:00-17:00' },
  { _id: 'fb-4', name: '社区卫生服务站', phone: '020-88885555', category: 'medical', sort: 4, remark: '全科门诊 · 8:30-17:30' },
  { _id: 'fb-5', name: '自来水供水热线', phone: '020-88884444', category: 'life', sort: 5, remark: '停水 / 漏水报修' },
  { _id: 'fb-6', name: '供电服务热线', phone: '020-88883333', category: 'life', sort: 6, remark: '停电 / 电路故障' },
  { _id: 'fb-7', name: '燃气服务热线', phone: '020-88882222', category: 'life', sort: 7, remark: '燃气泄漏请先开窗、勿开关电器' },
  { _id: 'fb-8', name: '开锁服务', phone: '020-88881111', category: 'life', sort: 8, remark: '公安局备案 · 24 小时' },
  { _id: 'fb-9', name: '报警求助', phone: '110', category: 'emergency', sort: 9, remark: '治安 / 人身安全' },
  { _id: 'fb-10', name: '火警', phone: '119', category: 'emergency', sort: 10, remark: '火灾 / 抢险救援' },
  { _id: 'fb-11', name: '急救中心', phone: '120', category: 'emergency', sort: 11, remark: '医疗急救' },
];

/** 关键词过滤（纯函数）：空关键词放行；匹配 name / phone / remark */
export function filterPhoneItems(items: PhoneItem[], keyword: string): PhoneItem[] {
  const kw = String(keyword ?? '').trim().toLowerCase();
  if (!kw) return items;
  return items.filter((item) => {
    const haystack = `${item.name ?? ''} ${item.phone ?? ''} ${item.remark ?? ''}`.toLowerCase();
    return haystack.indexOf(kw) >= 0;
  });
}

/**
 * 按分类分组（纯函数）
 * - 仅保留有数据的分组，避免渲染出空组头
 * - 组顺序固定按 PHONE_TABS 的分类顺序
 * - 未知分类兜底归到「其他」，绝不丢数据
 */
export function buildPhoneSections(items: PhoneItem[]): PhoneSection[] {
  const known = PHONE_TABS.filter((t) => t.value !== '').map((t) => t.value as PhoneItem['category']);
  const buckets = new Map<string, PhoneItem[]>();
  items.forEach((item) => {
    const key = known.indexOf(item.category) >= 0 ? item.category : 'other';
    const bucket = buckets.get(key);
    if (bucket) bucket.push(item);
    else buckets.set(key, [item]);
  });
  const sections: PhoneSection[] = [];
  known.forEach((key) => {
    const bucket = buckets.get(key);
    if (bucket && bucket.length > 0) {
      sections.push({ key, label: labelOf(PHONE_CATEGORY_LABELS, key, key), items: bucket });
    }
  });
  const others = buckets.get('other');
  if (others && others.length > 0) sections.push({ key: 'other', label: '其他', items: others });
  return sections;
}

function fallbackList(category: PhoneItem['category'] | ''): PhoneItem[] {
  if (!category) return FALLBACK_PHONES.slice();
  return FALLBACK_PHONES.filter((i) => i.category === category);
}

Page({
  data: {
    statusBarHeight: info.statusBarHeight,
    tabs: PHONE_TABS,
    activeCategory: '' as PhoneItem['category'] | '',
    keyword: '',
    raw: [] as PhoneItem[],
    sections: [] as PhoneSection[],
    loading: true,
    emergency: [
      { name: '报警', phone: '110' },
      { name: '火警', phone: '119' },
      { name: '急救', phone: '120' },
    ],
  },

  onLoad(options: Record<string, string | undefined>) {
    trackPageView('pages/phonebook/index');
    const activeCategory = normalizePhoneCategory(options.category);
    if (activeCategory) this.setData({ activeCategory });
    void this.load();
  },

  onPullDownRefresh() {
    void this.load().finally(() => wx.stopPullDownRefresh());
  },

  goBack(): void {
    if (getCurrentPages().length > 1) wx.navigateBack();
    else wx.switchTab({ url: '/pages/index/index' });
  },

  onTabTap(e: WechatMiniprogram.TouchEvent): void {
    const value = String((e.currentTarget.dataset as { value?: string }).value ?? '');
    if (value === this.data.activeCategory) return;
    track('btn_click', { page: 'phonebook', target: value });
    this.setData({ activeCategory: value as PhoneItem['category'] | '' });
    void this.load();
  },

  onSearchInput(e: WechatMiniprogram.Input): void {
    this.setData({ keyword: String(e.detail.value ?? '') });
    this.applyFilter();
  },

  onClearKeyword(): void {
    this.setData({ keyword: '' });
    this.applyFilter();
  },

  applyRaw(raw: PhoneItem[]): void {
    this.setData({
      raw,
      sections: buildPhoneSections(filterPhoneItems(raw, this.data.keyword)),
    });
  },

  /** 本地即时过滤，不回服务端 */
  applyFilter(): void {
    this.setData({ sections: buildPhoneSections(filterPhoneItems(this.data.raw, this.data.keyword)) });
  },

  async load(): Promise<void> {
    this.setData({ loading: true });
    const category = this.data.activeCategory;
    try {
      const res = await listPhonebook(category ? { category } : {});
      const raw = res.list ?? [];
      this.applyRaw(raw.length > 0 ? raw : fallbackList(category));
    } catch {
      this.applyRaw(fallbackList(category));
    } finally {
      this.setData({ loading: false });
    }
  },

  onCall(e: WechatMiniprogram.TouchEvent): void {
    const phone = String((e.currentTarget.dataset as { phone?: string }).phone ?? '');
    if (!phone) return;
    track('btn_click', { page: 'phonebook', target: 'call' });
    makePhoneCall(phone);
  },
});
