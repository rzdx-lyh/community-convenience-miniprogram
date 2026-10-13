/**
 * 首页视图模型（FE-11 / FE-13）
 * 把可单测的纯逻辑从页面里抽出来（规范 §7.3 viewmodel 分层）：
 * 页面只负责 setData 与事件绑定，转换逻辑全部在此，可被 vitest 直接覆盖。
 */
import { GRID_ICON_TEXT } from '../../config/service-grid';

/** 社区名（本期为静态文案；后续可由定位或后端配置下发） */
export const COMMUNITY_NAME = '阳光社区';

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
  };
}

/** Notice（urgent）→ 紧急轮播视图模型：summary 为空回退 title（契约约定） */
export function toUrgentVM(notice: Notice): UrgentVM {
  return { id: notice._id, title: notice.title, sub: notice.summary || notice.title };
}
