/** notice 资源服务（契约 notice:list / notice:detail / notice:urgentLatest） */
import { call } from '../utils/request';

export function listNotices(params: NoticeListParams): Promise<NoticeListResult> {
  return call<NoticeListResult>('notice:list', params as unknown as Record<string, unknown>);
}

export function getNoticeDetail(params: NoticeDetailParams): Promise<NoticeDetailResult> {
  return call<NoticeDetailResult>('notice:detail', params as unknown as Record<string, unknown>);
}

/**
 * 首页紧急公告区专用（v1.2 · CR-005）。
 * 空数组是合法空态（{ code:0, list:[], total:0 }），前端渲染「暂无紧急通知，社区运行正常」。
 */
export function listUrgentLatest(params: NoticeUrgentLatestParams = {}): Promise<NoticeUrgentLatestResult> {
  return call<NoticeUrgentLatestResult>(
    'notice:urgentLatest',
    params as unknown as Record<string, unknown>,
  );
}
