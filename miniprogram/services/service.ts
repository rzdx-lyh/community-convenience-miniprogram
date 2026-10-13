/** service 资源服务（契约 v1.2 新增 · service:list，四类服务宫格聚合） */
import { LOCAL_SERVICE_CATEGORIES } from '../config/service-grid';
import { call } from '../utils/request';

/**
 * 取四类服务分类。
 * ⚠ 契约约定：接口为空或调用失败时回退本地常量 LOCAL_SERVICE_CATEGORIES（零白屏）。
 */
export function listServices(params: ServiceListParams = {}): Promise<ServiceCategory[]> {
  return call<ServiceListResult>('service:list', params as unknown as Record<string, unknown>)
    .then((res) => {
      const list = (res && Array.isArray(res.list) ? res.list : []) as ServiceCategory[];
      return list.length > 0 ? list : LOCAL_SERVICE_CATEGORIES;
    })
    .catch(() => LOCAL_SERVICE_CATEGORIES);
}
