/**
 * targetType 路由分发工具（FE-11）
 * 契约 §service:list「targetType 路由表」1:1 落地。
 *
 * 设计：解析（resolveTarget，纯函数、可单测）与执行（navigateByTarget，含副作用）分离，
 * 保证 6 种 targetType 的分发逻辑可被 vitest 覆盖而不需要 mock 小程序运行时。
 */
import { STORAGE_KEYS } from '../config/env';
import { makePhoneCall, toast } from './ui';
import { consumeStorage, setStorage } from './storage';
import { track } from './logger';

/** 已在 app.json 注册的 Tab 页（switchTab 专用） */
const TAB_PAGES: string[] = [
  '/pages/index/index',
  '/pages/repair/list/index',
  '/pages/circle/index',
  '/pages/profile/index',
];

export const NOTICE_LIST_PATH = '/pages/notice/list/index';
export const ASSISTANT_PATH = '/pages/assistant/index';
export const CIRCLE_PATH = '/pages/circle/index';

export interface CircleFilter {
  type?: string;
  tag?: string;
}

export type NavAction =
  | { kind: 'page'; path: string; query: Record<string, string>; useSwitchTab: boolean }
  | { kind: 'notice'; query: CircleFilter }
  | { kind: 'circle'; filter: CircleFilter }
  | { kind: 'assistant'; presetQuestion: string }
  | { kind: 'phone'; phone: string }
  | { kind: 'toast'; tip: string }
  | { kind: 'none' };

/**
 * 把一个 ServiceItem 解析为可执行的导航动作（纯函数，无副作用）。
 * 未知/缺失 targetType 一律解析为 'none'，调用方静默忽略，绝不抛错。
 */
export function resolveTarget(item?: ServiceItem | null): NavAction {
  if (!item || !item.targetType) return { kind: 'none' };
  const params: Record<string, string> = item.targetParams ?? {};

  switch (item.targetType) {
    case 'page': {
      const path = item.targetPath ?? '';
      if (!path) return { kind: 'none' };
      return { kind: 'page', path, query: params, useSwitchTab: TAB_PAGES.indexOf(path) >= 0 };
    }
    case 'notice':
      return { kind: 'notice', query: { type: params.type, tag: params.tag } };
    case 'circle':
      return { kind: 'circle', filter: { type: params.type, tag: params.tag } };
    case 'assistant':
      return { kind: 'assistant', presetQuestion: params.presetQuestion ?? '' };
    case 'phone':
      return { kind: 'phone', phone: params.phone ?? '' };
    case 'toast':
      return { kind: 'toast', tip: item.tip ?? params.tip ?? '暂未开通' };
    default:
      return { kind: 'none' };
  }
}

/** 把 query 对象拼成 URL query 串（跳过空值，encodeURIComponent 防中文/特殊字符） */
export function buildQuery(query: Record<string, string | undefined> | CircleFilter): string {
  const source = query as Record<string, string | undefined>;
  const parts: string[] = [];
  Object.keys(source).forEach((key) => {
    const value = source[key];
    if (value === undefined || value === null || value === '') return;
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  });
  return parts.length > 0 ? `?${parts.join('&')}` : '';
}

/** 写入待消费的圈子筛选态（契约附 A.3：switchTab 不支持 query，走全局态） */
export function setPendingCircleFilter(filter: CircleFilter): void {
  setStorage<CircleFilter>(STORAGE_KEYS.PENDING_CIRCLE_FILTER, filter);
}

/** 读取并清除待消费的圈子筛选态 */
export function consumePendingCircleFilter(): CircleFilter | null {
  return consumeStorage<CircleFilter>(STORAGE_KEYS.PENDING_CIRCLE_FILTER);
}

/** 执行导航动作（含副作用） */
export function navigateByTarget(item?: ServiceItem | null): void {
  const action = resolveTarget(item);
  track('btn_click', { target: item?.key ?? '', kind: action.kind });

  switch (action.kind) {
    case 'page': {
      const url = `${action.path}${buildQuery(action.query)}`;
      if (action.useSwitchTab) {
        wx.switchTab({ url: action.path, fail: () => wx.navigateTo({ url }) });
      } else {
        wx.navigateTo({ url, fail: () => toast('页面暂时打不开，请稍后再试') });
      }
      return;
    }
    case 'notice': {
      wx.navigateTo({
        url: `${NOTICE_LIST_PATH}${buildQuery(action.query)}`,
        fail: () => toast('页面暂时打不开，请稍后再试'),
      });
      return;
    }
    case 'circle': {
      setPendingCircleFilter(action.filter);
      wx.switchTab({ url: CIRCLE_PATH, fail: () => toast('页面暂时打不开，请稍后再试') });
      return;
    }
    case 'assistant': {
      wx.navigateTo({
        url: `${ASSISTANT_PATH}${buildQuery({ presetQuestion: action.presetQuestion })}`,
        fail: () => toast('页面暂时打不开，请稍后再试'),
      });
      return;
    }
    case 'phone': {
      if (!action.phone) {
        toast('号码缺失，请稍后再试');
        return;
      }
      makePhoneCall(action.phone);
      return;
    }
    case 'toast': {
      toast(action.tip);
      return;
    }
    default:
      return;
  }
}

/** 首页「本周公告」pill：通知列表（本周通知） */
export function goNoticeList(query: CircleFilter = {}): void {
  wx.navigateTo({
    url: `${NOTICE_LIST_PATH}${buildQuery(query)}`,
    fail: () => toast('页面暂时打不开，请稍后再试'),
  });
}

/** 首页「最近路况」pill：社区圈子路况筛选（契约 §circle:list 说明） */
export function goCircleRoad(): void {
  setPendingCircleFilter({ type: 'road' });
  wx.switchTab({ url: CIRCLE_PATH, fail: () => toast('页面暂时打不开，请稍后再试') });
}
