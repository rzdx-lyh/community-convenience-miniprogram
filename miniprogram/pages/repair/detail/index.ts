/**
 * 报修详情页（FE-5）
 * 契约：workorder:detail（拉取全量） / workorder:cancel（仅 pending 可取消）
 *
 * 设计要点：
 * - 视图模型一律由纯函数 toDetailVM / buildTimeline 推导，便于 vitest 覆盖；
 * - 状态时间轴四节点 pending→assigned→processing→done；canceled/closed 走终止态，
 *   不硬塞进四节点（否则已取消的工单会显示一排灰节点，语义错）。
 */
import { ENV, STORAGE_KEYS } from '../../../config/env';
import { cancelWorkOrder, getWorkOrderDetail } from '../../../services/workorder';
import { store } from '../../../store/global';
import { CATEGORY_LABELS, STATUS_LABELS, labelOf } from '../../../utils/dict';
import { toDateTime } from '../../../utils/format';
import { track, trackPageView } from '../../../utils/logger';
import { confirm, toast } from '../../../utils/ui';

/** 时间轴节点 */
export interface TimelineNode {
  key: string;
  label: string;
  /** 已到达（高亮） */
  reached: boolean;
  /** 当前所处节点 */
  current: boolean;
}

/** 主流程四节点（canceled / closed 为终止态，不在此列） */
const FLOW: { key: WorkOrder['status']; label: string }[] = [
  { key: 'pending', label: '已提交' },
  { key: 'assigned', label: '已派单' },
  { key: 'processing', label: '处理中' },
  { key: 'done', label: '已完成' },
];

/**
 * 状态 → 时间轴（纯函数）
 * - canceled：仅「已提交」高亮，终止文案「已取消」
 * - closed：四节点全高亮，终止文案「已关闭」
 * - 其余：按主流程下标推导；未知状态按第 1 节点处理（兜底，绝不抛错）
 */
export function buildTimeline(status: WorkOrder['status']): {
  nodes: TimelineNode[];
  terminal: string;
} {
  if (status === 'canceled') {
    return {
      nodes: FLOW.map((n, i) => ({ key: n.key, label: n.label, reached: i === 0, current: false })),
      terminal: '已取消',
    };
  }
  if (status === 'closed') {
    return {
      nodes: FLOW.map((n) => ({ key: n.key, label: n.label, reached: true, current: false })),
      terminal: '已关闭',
    };
  }
  const idx = FLOW.map((n) => n.key).indexOf(status);
  const reachedIndex = idx < 0 ? 0 : idx;
  return {
    nodes: FLOW.map((n, i) => ({
      key: n.key,
      label: n.label,
      reached: i <= reachedIndex,
      current: i === reachedIndex,
    })),
    terminal: '',
  };
}

/** 详情页视图模型 */
export interface DetailVM {
  id: string;
  title: string;
  statusLabel: string;
  statusKey: string;
  categoryLabel: string;
  createdText: string;
  updatedText: string;
  description: string;
  aiSummary: string;
  hasSummary: boolean;
  images: string[];
  hasImages: boolean;
  /** 物业处理备注；与 assignee 都为空时整块不渲染 */
  handleNote: string;
  hasHandle: boolean;
  assignee: string;
  timeline: TimelineNode[];
  terminal: string;
  canCancel: boolean;
}

/** WorkOrder → 视图模型（纯函数） */
export function toDetailVM(order: WorkOrder): DetailVM {
  const { nodes, terminal } = buildTimeline(order.status);
  return {
    id: order._id,
    title: order.title,
    statusLabel: labelOf(STATUS_LABELS, order.status, order.status),
    statusKey: order.status,
    categoryLabel: labelOf(CATEGORY_LABELS, order.category, order.category),
    createdText: toDateTime(order.createdAt),
    updatedText: toDateTime(order.updatedAt),
    description: order.description,
    aiSummary: order.aiSummary || '',
    hasSummary: Boolean(order.aiSummary),
    images: order.images ?? [],
    hasImages: (order.images ?? []).length > 0,
    handleNote: order.handleNote || '',
    hasHandle: Boolean(order.handleNote || order.assignee),
    assignee: order.assignee || '',
    timeline: nodes,
    terminal,
    canCancel: order.status === 'pending',
  };
}

Page({
  data: {
    id: '',
    vm: null as DetailVM | null,
    loading: true,
    elderMode: false,
    aiFooter: ENV.AI_FOOTER_TEXT,
  },

  onLoad(options: Record<string, string | undefined>) {
    trackPageView('pages/repair/detail/index');
    this.setData({ elderMode: store.get<boolean>(STORAGE_KEYS.ELDER_MODE, false) });
    const id = String(options.id ?? '').trim();
    if (!id) {
      toast('工单不存在');
      setTimeout(() => wx.navigateBack(), 600);
      return;
    }
    this.setData({ id });
    void this.load(id);
  },

  onShow() {
    const elderMode = store.get<boolean>(STORAGE_KEYS.ELDER_MODE, false);
    if (elderMode !== this.data.elderMode) this.setData({ elderMode });
  },

  async load(id: string): Promise<void> {
    this.setData({ loading: true });
    try {
      const res = await getWorkOrderDetail({ id });
      if (!res || !res.workorder) {
        toast('工单不存在或已被删除');
        return;
      }
      this.setData({ vm: toDetailVM(res.workorder) });
    } catch {
      // request 层已统一 toast
    } finally {
      this.setData({ loading: false });
    }
  },

  onPreviewImage(e: WechatMiniprogram.TouchEvent): void {
    const index = Number((e.currentTarget.dataset as { index?: string }).index ?? 0);
    const images = this.data.vm?.images ?? [];
    if (images.length === 0) return;
    wx.previewImage({ current: images[index] ?? images[0], urls: images });
  },

  async onCancel(): Promise<void> {
    const vm = this.data.vm;
    if (!vm || !vm.canCancel) return;
    const ok = await confirm('取消报修', '取消后需要重新提交，确定取消吗？');
    if (!ok) return;
    try {
      await cancelWorkOrder({ id: vm.id });
      track('btn_click', { page: 'repair-detail', target: 'cancel' });
      toast('已取消');
      // 列表页 onShow 会自动刷新，无需事件通道
      setTimeout(() => wx.navigateBack(), 600);
    } catch {
      // request 层已统一 toast
    }
  },
});
