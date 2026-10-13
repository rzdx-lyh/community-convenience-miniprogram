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

export function handleWorkOrder(params: WorkOrderHandleParams): Promise<WorkOrderHandleResult> {
  return call<WorkOrderHandleResult>('workorder:handle', params as unknown as Record<string, unknown>);
}
