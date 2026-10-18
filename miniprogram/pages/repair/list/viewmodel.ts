/**
 * 办事大厅页视图模型（v1.0.1 / CR-019）
 *
 * 背景：TabBar 第 2 项由「服务订单」改名「办事大厅」并升格为**聚合入口**——
 * 上方 = 搜索 + 四类服务入口（数据源 service:list，复用首页同一兜底常量）；
 * 下方 = 我的报修记录（数据源 workorder:list，行为零回归）。
 *
 * 分层原则（与 pages/index/viewmodel.ts 一致）：纯函数在此，页面只做 setData 与事件绑定。
 */
import { GRID_ICON_TEXT } from '../../../config/service-grid';

/** 页面名（TabBar / 导航栏 / 埋点统一口径） */
export const HALL_NAME = '办事大厅';

export interface HallCatVM {
  key: string;
  title: string;
  /** 分类副标题（原始「｜」串，展示端单行省略） */
  sub: string;
  iconText: string;
}

export interface HallRowVM {
  key: string;
  name: string;
  categoryKey: string;
  categoryTitle: string;
  iconText: string;
}

/** 带原始 ServiceItem 的检索行（item 不进 setData，仅模块内用于跳转分发） */
export interface HallRow extends HallRowVM {
  item: ServiceItem;
}

/** 搜索结果最多展示条数（8 个子项全命中也不至于刷满一屏） */
export const HALL_MATCH_LIMIT = 6;

/**
 * 口语 → 服务项 的同义词表（v1.0.1，纯前端、可单测）。
 * 说明：用户搜"药品""漏水"这类**场景词**，而服务项叫"挂号""水电燃气"，
 * 不做别名映射就会出现「搜什么都是没找到」。本表只解决高频口语，不做无限扩张。
 */
export const SEARCH_ALIASES: Record<string, string[]> = {
  药: ['挂号'],
  药品: ['挂号'],
  看病: ['挂号'],
  医院: ['挂号'],
  发热: ['挂号'],
  水费: ['水电燃气'],
  电费: ['水电燃气'],
  燃气费: ['水电燃气'],
  交费: ['水电燃气'],
  漏水: ['水电燃气'],
  维修: ['水电燃气'],
  报修: ['水电燃气'],
  修理: ['水电燃气'],
  吃饭: ['助餐'],
  午饭: ['助餐'],
  洗澡: ['助浴'],
  陪护: ['上门陪护'],
  养老: ['上门陪护', '助餐', '适老化改造'],
  补贴: ['适老化改造'],
  体检: ['健康报告', '每周义诊'],
  报告: ['健康报告'],
  疫苗: ['疫苗档案'],
  义诊: ['每周义诊', '义诊'],
  活动: ['每周义诊', '义诊', '助餐'],
};

/** ServiceCategory → 入口卡视图模型 */
export function toHallCatVM(category: ServiceCategory): HallCatVM {
  return {
    key: category.key,
    title: category.title,
    sub: category.subtitle ?? '',
    iconText: GRID_ICON_TEXT[category.key] ?? '🏠',
  };
}

/** 四类服务 → 可检索行（扁平化 8 个子项，保持分类归属） */
export function buildHallRows(categories: ServiceCategory[]): HallRow[] {
  const rows: HallRow[] = [];
  (categories ?? []).forEach((category) => {
    (category.items ?? []).forEach((item) => {
      rows.push({
        key: `${category.key}:${item.key}`,
        name: item.name,
        categoryKey: category.key,
        categoryTitle: category.title,
        iconText: GRID_ICON_TEXT[category.key] ?? '🏠',
        item,
      });
    });
  });
  return rows;
}

/** 命中的别名目标集合（子串双向匹配：搜「药品」命中键「药」，搜「药」命中键「药品」） */
function resolveAliasTargets(query: string): string[] {
  const targets: string[] = [];
  Object.keys(SEARCH_ALIASES).forEach((alias) => {
    if (query.indexOf(alias) >= 0 || alias.indexOf(query) >= 0) {
      targets.push(...SEARCH_ALIASES[alias]);
    }
  });
  return targets;
}

/**
 * 服务检索（纯函数）。
 * 打分：完全同名 10 / 名称互含 6 / 别名命中 5 / 分类名互含 3；同分保持原序（不抖动）。
 * 空关键词或全部未命中 → 返回空数组（调用方渲染"没找到 + 问 AI"）。
 */
export function searchHallRows(rows: HallRow[], keyword: string, limit = HALL_MATCH_LIMIT): HallRow[] {
  const query = String(keyword ?? '').trim();
  if (!query || (rows ?? []).length === 0) return [];

  const aliasTargets = resolveAliasTargets(query);
  const scored = rows
    .map((row) => {
      let score = 0;
      if (row.name === query) score += 10;
      else if (row.name.indexOf(query) >= 0 || query.indexOf(row.name) >= 0) score += 6;
      if (aliasTargets.indexOf(row.name) >= 0) score += 5;
      if (row.categoryTitle.indexOf(query) >= 0 || query.indexOf(row.categoryTitle) >= 0) score += 3;
      return { row, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((x) => x.row);
}
