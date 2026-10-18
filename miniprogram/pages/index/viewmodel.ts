/**
 * 首页视图模型（FE-11 / FE-13）
 * 把可单测的纯逻辑从页面里抽出来（规范 §7.3 viewmodel 分层）：
 * 页面只负责 setData 与事件绑定，转换逻辑全部在此，可被 vitest 直接覆盖。
 */
import { GRID_ICON_TEXT } from '../../config/service-grid';
import { toRelativeTime } from '../../utils/format';

/** 社区名（本期为静态文案；后续可由定位或后端配置下发） */
export const COMMUNITY_NAME = '阳光社区';

/** 首页「社区动态」展示条数（v1.0.1 / CR-019） */
export const FEED_LIMIT = 3;

export type UrgentState = 'loading' | 'normal' | 'empty' | 'error';

export interface UrgentVM {
  id: string;
  title: string;
  sub: string;
}

export interface GridVM {
  key: string;
  title: string;
  /** 小字第 1 行（≤2 项，`｜` 分隔） */
  subLine1: string;
  /** 小字第 2 行 */
  subLine2: string;
  iconText: string;
  theme: string;
  decoText: string;
  /** 该分类下的服务项数（原型首页分类卡右上角「13 项」） */
  count: number;
}

/**
 * 宫格小字按 2 行排版：'挂号｜义诊｜疫苗档案' → '挂号｜义诊' / '疫苗档案'
 * 规则：前 2 项一行，其余第二行；不足 2 项时第二行为空串（wxml 里 wx:if 跳过渲染）。
 */
export function splitSubtitle(subtitle: string): { line1: string; line2: string } {
  const parts = String(subtitle ?? '').split('｜');
  return { line1: parts.slice(0, 2).join('｜'), line2: parts.slice(2).join('｜') };
}

/** ServiceCategory → 宫格视图模型 */
export function toGridVM(category: ServiceCategory): GridVM {
  const { line1, line2 } = splitSubtitle(category.subtitle);
  return {
    key: category.key,
    title: category.title,
    subLine1: line1,
    subLine2: line2,
    iconText: GRID_ICON_TEXT[category.key] ?? '🏠',
    theme: category.iconTheme,
    decoText: '＋',
    count: (category.items ?? []).length,
  };
}

/** Notice（urgent）→ 紧急轮播视图模型：summary 为空回退 title（契约约定） */
export function toUrgentVM(notice: Notice): UrgentVM {
  return { id: notice._id, title: notice.title, sub: notice.summary || notice.title };
}

/* ============================================================
 * v1.0.1 / CR-019 · 首屏「社区动态」补全模块
 * 复用 notice:list 出参（type=activity），零新增接口。
 * ============================================================ */

/** 动态条视图模型 */
export interface FeedVM {
  id: string;
  title: string;
  /** 「活动 · 2 天前」 */
  meta: string;
  type: string;
  typeLabel: string;
  location: string;
}

/** 通知类型 → 中文标签（与 docs/02 PRD 术语一致） */
export const FEED_TYPE_LABELS: Record<Notice['type'], string> = {
  notice: '公告',
  activity: '活动',
  urgent: '紧急',
};

/**
 * Notice → 动态条视图模型（纯函数）。
 * 时间用相对时间（刚刚 / N 小时前），比绝对时间更适合"动态"语义；
 * location 缺省为空串，wxml 用 wx:if 跳过。
 */
export function toFeedVM(notice: Notice): FeedVM {
  const typeLabel = FEED_TYPE_LABELS[notice.type] ?? '通知';
  const rel = toRelativeTime(notice.publishAt);
  return {
    id: notice._id,
    title: notice.title,
    meta: rel ? `${typeLabel} · ${rel}` : typeLabel,
    type: notice.type,
    typeLabel,
    location: notice.location ?? '',
  };
}
