/** workorder 资源服务（契约 workorder:create / list / detail / cancel / handle） */
import { call } from '../utils/request';

export function createWorkOrder(params: WorkOrderCreateParams): Promise<WorkOrderCreateResult> {
  return call<WorkOrderCreateResult>('workorder:create', params as unknown as Record<string, unknown>);
}

export function listWorkOrders(params: WorkOrderListParams = {}): Promise<WorkOrderListResult> {
  return call<WorkOrderListResult>('workorder:list', params as unknown as Record<string, unknown>);
}

export function getWorkOrderDetail(params: WorkOrderDetailParams): Promise<WorkOrderDetailResult> {
  return call<WorkOrderDetailResult>('workorder:detail', params as unknown as Record<string, unknown>);
}

export function cancelWorkOrder(params: WorkOrderCancelParams): Promise<WorkOrderCancelResult> {
  return call<WorkOrderCancelResult>('workorder:cancel', params as unknown as Record<string, unknown>);
}

/**
 * 物业/管理员处理工单（状态流转）。
 * CR-011（主理人 2026-10-14 裁决）：业务参数定稿名 `handleAction`。
 * ⚠ 这里**刻意不透传 `action`**：形态 B 下 `data.action` 是分发键（恒为 'handle'），
 *    若把业务值也塞进 `action` 会被分发键覆盖而丢失（后端读取顺序 handleAction → to → action）。
 */
export function handleWorkOrder(params: WorkOrderHandleParams): Promise<WorkOrderHandleResult> {
  const payload: Record<string, unknown> = {
    id: params.id,
    handleAction: params.handleAction ?? params.action,
  };
  if (params.note !== undefined) payload.note = params.note;
  return call<WorkOrderHandleResult>('workorder:handle', payload);
}
