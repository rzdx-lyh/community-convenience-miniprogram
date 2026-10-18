/**
 * 埋点与日志（FE-0 · E3 简单版）
 * dev 阶段打 console；上报云函数留 TODO，由运维/后端提供 track:report 后接入。
 */
import { ENV } from '../config/env';

/**
 * 埋点事件名。
 * 说明：'workorder_create' 为报修提交成功事件（FE-3 页面已使用），故在此登记。
 * 新增事件请在此扩展，避免页面层传字符串字面量被 TS 拦下。
 */
export type TrackEvent =
  | 'page_view'
  | 'btn_click'
  | 'api_call'
  | 'api_fail'
  | 'workorder_create'
  | 'service_book'
  /** CR-024：页面级 AI 入口问答（source: local / cloud / fallback） */
  | 'ai_answer';

export function track(event: TrackEvent, params: Record<string, unknown> = {}): void {
  const record = { event, params, ts: Date.now() };
  if (ENV.TRACK_ENABLED && !ENV.USE_MOCK) {
    // TODO(FE-10): 云函数 track:report 批量上报，供运营与答辩数据
    console.info('[track]', JSON.stringify(record));
    return;
  }
  console.info('[track-dev]', JSON.stringify(record));
}

/** 页面 PV：各页 onLoad 调用一次 */
export function trackPageView(path: string): void {
  track('page_view', { path });
}
