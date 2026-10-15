/**
 * 便民电话簿（FE-7）
 * 契约：phonebook:list（不分页、按 sort 升序；category 为空 = 全部）
 *
 * FE-13 增量（保留导出，勿删）：URL 入参 `?category=` 预选分类 Tab
 *
 * 合规要点：
 * - 一键拨号必须由用户点击触发，禁止自动拨号（utils/ui.makePhoneCall 已封装）
 * - 公共服务号码**不做脱敏**：maskPhone 只用于居民个人手机号，这里原样展示，
 *   110 / 119 / 120 等短号也必须完整可见
 */
import { STORAGE_KEYS } from '../../config/env';
import { listPhonebook } from '../../services/phonebook';
import { store } from '../../store/global';
import { PHONE_CATEGORY_LABELS, labelOf } from '../../utils/dict';
import { track, trackPageView } from '../../utils/logger';
import { makePhoneCall } from '../../utils/ui';

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
 * - 组顺序固定按 PHONE_TABS 的分类顺序（与 sort 无关，保证每次进入顺序一致）
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

Page({
  data: {
    tabs: PHONE_TABS,
    /** 预选分类：'' 表示全部 */
    activeCategory: '' as PhoneItem['category'] | '',
    keyword: '',
    /** 服务端原始数据，搜索在本地做 */
    raw: [] as PhoneItem[],
    sections: [] as PhoneSection[],
    loading: true,
    elderMode: false,
  },

  onLoad(options: Record<string, string | undefined>) {
    trackPageView('pages/phonebook/index');
    this.setData({ elderMode: store.get<boolean>(STORAGE_KEYS.ELDER_MODE, false) });
    const activeCategory = normalizePhoneCategory(options.category);
    if (activeCategory) this.setData({ activeCategory });
    void this.load();
  },

  onShow() {
    const elderMode = store.get<boolean>(STORAGE_KEYS.ELDER_MODE, false);
    if (elderMode !== this.data.elderMode) this.setData({ elderMode });
  },

  onPullDownRefresh() {
    void this.load().finally(() => wx.stopPullDownRefresh());
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

  /** 本地即时过滤，不回服务端 */
  applyFilter(): void {
    this.setData({ sections: buildPhoneSections(filterPhoneItems(this.data.raw, this.data.keyword)) });
  },

  async load(): Promise<void> {
    this.setData({ loading: true });
    try {
      const res = await listPhonebook(
        this.data.activeCategory ? { category: this.data.activeCategory } : {},
      );
      const raw = res.list ?? [];
      this.setData({
        raw,
        sections: buildPhoneSections(filterPhoneItems(raw, this.data.keyword)),
      });
    } catch {
      // request 层已统一 toast
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
