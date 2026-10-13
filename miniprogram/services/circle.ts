/** circle 资源服务（契约 v1.2 新增 · 只读：circle:list / circle:detail） */
import { call } from '../utils/request';

export function listCirclePosts(params: CircleListParams = {}): Promise<CircleListResult> {
  return call<CircleListResult>('circle:list', params as unknown as Record<string, unknown>);
}

export function getCircleDetail(params: CircleDetailParams): Promise<CircleDetailResult> {
  return call<CircleDetailResult>('circle:detail', params as unknown as Record<string, unknown>);
}
