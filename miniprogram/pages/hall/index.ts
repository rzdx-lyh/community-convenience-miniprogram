/**
 * 办事大厅（按设计稿 pgHall v1.4 新建）
 * 搜索 + AI 助手集群 + 4 分类 tab + 板块宫格；搜索时展示命中列表
 */
import { HUB_SCENES } from '../../config/ai-scenes';
import { LOCAL_SERVICE_CATEGORIES } from '../../config/service-grid';
import { navigateByTarget } from '../../utils/navigator';

const info = wx.getWindowInfo();

const ICONS: Record<string, string> = {
  house_clean: 'broom',
  house_repair: 'wrench',
  house_drain: 'pipe',
  house_nanny: 'nurse',
  house_lock: 'key',
  house_ac: 'snow',
  bill_utility: 'bulb',
  bill_express: 'package',
  bill_gov: 'file',
  fresh_veg: 'leaf',
  fresh_clear: 'tagpct',
  fresh_group: 'cart',
  fresh_pickup: 'basket',
  health_reg: 'hospital',
  health_clinic: 'stetho',
  health_vaccine: 'syringe',
  health_record: 'clipboard',
  health_meal: 'bowl',
  health_bp: 'droplet',
  health_report: 'file',
  elderly_chronic: 'pill',
  elderly_meal: 'bowl',
  elderly_bath: 'bathtub',
  elderly_escort: 'handshake',
  elderly_reno: 'tools',
  elderly_doctor: 'doctor',
  tools_umbrella: 'umbrella',
  tools_toolkit: 'toolbox',
  tools_power: 'battery',
  ext_takeout: 'scooter',
  ext_stray: 'paw',
  ext_lease: 'building',
  culture_weekly: 'stetho',
  culture_hr: 'activity',
  culture_neighbor: 'megaphone',
  culture_lib: 'book',
  culture_class: 'pencil',
  culture_phone: 'phone',
};

/** 分类 → 原型配色主题（life=蓝 / elder=青 / support=金 / culture=靛） */
const THEME: Record<string, string> = { life: 'blue', elder: 'teal', support: 'gold', culture: 'indigo' };

/** AI 场景配色（对应 wxss 的 tone-*） */
const TONES: Record<string, string> = {
  guide: 'blue',
  repair: 'red',
  health: 'teal',
  meal: 'green',
  bill: 'gold',
  place: 'indigo',
  circle: 'cyan',
  sos: 'red',
};

interface CellVM {
  key: string;
  name: string;
  desc: string;
  icon: string;
  badge?: string;
}

interface GroupVM {
  key: string;
  name: string;
  note: string;
  count: number;
  items: CellVM[];
}

let flatItems: ServiceItem[] = [];

function toCell(it: ServiceItem): CellVM {
  return {
    key: it.key,
    name: it.name,
    desc: it.desc ?? '',
    icon: ICONS[it.key] ?? 'grid',
    badge: it.badge,
  };
}

Page({
  data: {
    statusBarHeight: info.statusBarHeight,
    kw: '',
    tabs: [] as Array<{ key: string; name: string }>,
    active: 'life',
    theme: 'blue',
    groups: [] as GroupVM[],
    hits: [] as CellVM[],
    scenes: [] as Array<{ key: string; name: string; desc: string; icon: string; tone: string; q: string }>,
  },

  onLoad() {
    const tabs = LOCAL_SERVICE_CATEGORIES.map((c) => ({
      key: c.key,
      name: c.title.replace(/服务$/, ''),
    }));

    const flat: ServiceItem[] = [];
    LOCAL_SERVICE_CATEGORIES.forEach((c) => {
      (c.groups ?? []).forEach((g) => g.items.forEach((it) => flat.push(it)));
    });
    flatItems = flat;

    const scenes = HUB_SCENES.map((s) => ({
      key: s.key,
      name: s.name,
      desc: s.desc,
      icon: s.icon,
      tone: TONES[s.key] ?? 'blue',
      q: s.questions[0] ?? '',
    }));

    this.setData({ tabs, scenes, active: tabs[0]?.key ?? 'life' });
    this.loadGroups(tabs[0]?.key ?? 'life');
  },

  onShow() {
    // tab 页不能带 query：首页通过本地缓存传关键词 / 目标分类
    const kw = wx.getStorageSync('pendingHallKw');
    if (kw) {
      wx.removeStorageSync('pendingHallKw');
      this.setData({ kw: String(kw) });
      this.applySearch(String(kw));
    }
    const cat = wx.getStorageSync('pendingHallCat');
    if (cat) {
      wx.removeStorageSync('pendingHallCat');
      const key = String(cat);
      this.setData({ active: key, kw: '' });
      this.loadGroups(key);
    }
  },

  /** 按分类铺板块 */
  loadGroups(key: string): void {
    const cat = LOCAL_SERVICE_CATEGORIES.find((c) => c.key === key) ?? LOCAL_SERVICE_CATEGORIES[0];
    const groups: GroupVM[] = (cat.groups ?? []).map((g) => ({
      key: g.key,
      name: g.name,
      note: g.note ?? '',
      count: g.items.length,
      items: g.items.map(toCell),
    }));
    this.setData({ groups, theme: THEME[cat.key] ?? 'blue', hits: [] });
  },

  /** 搜索命中（服务名 / 板块名 / 分类名） */
  applySearch(kw: string): void {
    const q = kw.trim();
    if (!q) {
      this.setData({ hits: [] });
      return;
    }
    const hits: CellVM[] = [];
    LOCAL_SERVICE_CATEGORIES.forEach((c) => {
      (c.groups ?? []).forEach((g) => {
        g.items.forEach((it) => {
          if (it.name.includes(q) || q.includes(it.name) || g.name.includes(q) || c.title.includes(q)) {
            hits.push(toCell(it));
          }
        });
      });
    });
    this.setData({ hits: hits.slice(0, 12) });
  },

  /* ---------------------------- 交互 ---------------------------- */

  onKwInput(e: WechatMiniprogram.Input): void {
    const kw = e.detail.value;
    this.setData({ kw });
    this.applySearch(kw);
  },

  onSearch(): void {
    this.applySearch(this.data.kw);
  },

  onCatTap(e: WechatMiniprogram.TouchEvent): void {
    const key = String(e.currentTarget.dataset.k ?? '');
    this.setData({ active: key, kw: '' });
    this.loadGroups(key);
  },

  onItemTap(e: WechatMiniprogram.TouchEvent): void {
    const key = String(e.currentTarget.dataset.key ?? '');
    const item = flatItems.find((it) => it.key === key);
    if (!item) return;
    navigateByTarget(item);
  },

  onSceneTap(e: WechatMiniprogram.TouchEvent): void {
    const key = String(e.currentTarget.dataset.key ?? '');
    const q = String(e.currentTarget.dataset.q ?? '');
    wx.navigateTo({
      url: `/pages/assistant/index?scene=${key}&presetQuestion=${encodeURIComponent(q)}`,
    });
  },
});
