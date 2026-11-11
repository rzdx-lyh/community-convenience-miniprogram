/**
 * 社区点位单一真源
 *
 * 约束：
 * - 坐标为 GCJ-02，与原生 map / wx.openLocation 一致；
 * - 全部点位来自本地配置，无网络、无第三方 Key、无系统定位也能展示；
 * - 首页、地图页、报修选点共用本文件，避免多份距离与分类口径漂移。
 */
import { distanceMeters, formatDistance, walkMinutes, type LatLng } from '../utils/geo';

export type PlaceCategory = 'svc' | 'tool' | 'life' | 'emergency';
export type PlaceFilter = 'all' | PlaceCategory;
export type PlaceStatus = 'open' | 'busy' | 'paused';

export interface CommunityPlace {
  id: string;
  /** 原生 map 要求的数字 marker id */
  mid: number;
  name: string;
  desc: string;
  cat: PlaceCategory;
  icon: string;
  color: string;
  bg: string;
  latitude: number;
  longitude: number;
  open: string;
  status: PlaceStatus;
}

export interface NearbyPlace extends CommunityPlace {
  /** 距当前手选位置的距离文案 */
  walk: string;
  /** 步行分钟数 */
  walkMin: number;
  /** 原始距离（米），用于排序和测试 */
  meters: number;
  statusLabel: string;
  statusTone: 'ok' | 'busy' | 'off';
}

export interface PlaceCategoryTab {
  k: PlaceFilter;
  n: string;
}

export const PLACE_CATEGORIES: PlaceCategoryTab[] = [
  { k: 'all', n: '全部' },
  { k: 'svc', n: '办事服务' },
  { k: 'tool', n: '便民设备' },
  { k: 'life', n: '生活配套' },
  { k: 'emergency', n: '应急设施' },
];

const STATUS_META: Record<PlaceStatus, { label: string; tone: NearbyPlace['statusTone'] }> = {
  open: { label: '可用', tone: 'ok' },
  busy: { label: '较忙', tone: 'busy' },
  paused: { label: '暂停', tone: 'off' },
};

function place(input: Omit<CommunityPlace, 'bg'>): CommunityPlace {
  return { ...input, bg: `${input.color}1F` };
}

export const COMMUNITY_PLACES: CommunityPlace[] = [
  place({
    id: 'p1', mid: 1, name: '社区物业服务中心', desc: '1 号楼 1 层 · 报修/缴费/门禁',
    cat: 'svc', icon: 'building', color: '#1F5FD6', latitude: 23.12916, longitude: 113.26386,
    open: '8:30-18:00', status: 'open',
  }),
  place({
    id: 'p2', mid: 2, name: '社区卫生服务站', desc: '西门旁 · 全科/慢病/疫苗',
    cat: 'svc', icon: 'stetho', color: '#1F5FD6', latitude: 23.12841, longitude: 113.26472,
    open: '8:00-21:00', status: 'open',
  }),
  place({
    id: 'p3', mid: 3, name: '社区活动室', desc: '2 号楼 2 层 · 图书角/四点半课堂',
    cat: 'svc', icon: 'users', color: '#1F5FD6', latitude: 23.12888, longitude: 113.2632,
    open: '9:00-21:00', status: 'open',
  }),
  place({
    id: 'p4', mid: 4, name: '共享雨伞 · 1 号楼大厅', desc: '可借 6 把 · 24 小时可还',
    cat: 'tool', icon: 'umbrella', color: '#0E7C6B', latitude: 23.12933, longitude: 113.26452,
    open: '24 小时', status: 'busy',
  }),
  place({
    id: 'p5', mid: 5, name: '共享充电宝 · 南门岗亭', desc: '可借 12 个 · 通借通还',
    cat: 'tool', icon: 'battery', color: '#0E7C6B', latitude: 23.12872, longitude: 113.26362,
    open: '24 小时', status: 'open',
  }),
  place({
    id: 'p6', mid: 6, name: '快递柜 · 1 号楼架空层', desc: '丰巢柜 · 大件请到驿站',
    cat: 'tool', icon: 'package', color: '#0E7C6B', latitude: 23.1291, longitude: 113.2643,
    open: '24 小时', status: 'open',
  }),
  place({
    id: 'p7', mid: 7, name: '生鲜自提 · 1 号楼驿站', desc: '次日自提点 · 生鲜冷链',
    cat: 'tool', icon: 'basket', color: '#0E7C6B', latitude: 23.12895, longitude: 113.26505,
    open: '6:00-21:00', status: 'busy',
  }),
  place({
    id: 'p8', mid: 8, name: '垃圾分类点 · 2 号楼东侧', desc: '四分类投放 · 误时投放至南门',
    cat: 'life', icon: 'sprout', color: '#A86A05', latitude: 23.1286, longitude: 113.2642,
    open: '6:00-22:00', status: 'open',
  }),
  place({
    id: 'p9', mid: 9, name: '老年助餐点 · 社区食堂', desc: '午餐 11:00 / 晚餐 17:00 配送',
    cat: 'life', icon: 'bowl', color: '#A86A05', latitude: 23.1295, longitude: 113.2641,
    open: '11:00-18:30', status: 'open',
  }),
  place({
    id: 'p10', mid: 10, name: 'AED · 物业服务中心', desc: '自动体外除颤器 · 1 号楼服务台',
    cat: 'emergency', icon: 'heart', color: '#C9302C', latitude: 23.12918, longitude: 113.2639,
    open: '24 小时', status: 'open',
  }),
  place({
    id: 'p11', mid: 11, name: '微型消防站 · 南门', desc: '灭火器 / 消防水带 / 应急工具',
    cat: 'emergency', icon: 'flame', color: '#C9302C', latitude: 23.1287, longitude: 113.2636,
    open: '24 小时', status: 'open',
  }),
  place({
    id: 'p12', mid: 12, name: '应急避难场所 · 社区广场', desc: '紧急集合点 · 听从现场引导',
    cat: 'emergency', icon: 'warn', color: '#C9302C', latitude: 23.12878, longitude: 113.26448,
    open: '24 小时', status: 'open',
  }),
];

/** 按分类筛选，再按到 origin 的直线距离排序；limit 用于首页最近 3 个点位。 */
export function placesNear(
  origin: LatLng,
  cat: PlaceFilter = 'all',
  limit?: number,
): NearbyPlace[] {
  const list = COMMUNITY_PLACES
    .filter((p) => cat === 'all' || p.cat === cat)
    .map((p) => {
      const meters = distanceMeters(origin, p);
      const meta = STATUS_META[p.status];
      return {
        ...p,
        meters,
        walk: formatDistance(meters),
        walkMin: walkMinutes(meters),
        statusLabel: meta.label,
        statusTone: meta.tone,
      };
    })
    .sort((a, b) => a.meters - b.meters || a.mid - b.mid);
  return typeof limit === 'number' ? list.slice(0, Math.max(0, limit)) : list;
}
