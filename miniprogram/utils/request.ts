/**
 * 全站唯一请求出口（FE-0 · 契约驱动）
 * - 统一响应结构 { code, msg, data }（契约 §统一响应）
 * - 统一错误码 toast（503 = AI 降级，不打扰用户）
 * - 401 静默重登并重试原请求一次
 * - mock / 真实云函数双通道由 ENV.USE_MOCK 一个开关切换
 * ⚠ 页面层禁止直接 wx.cloud.callFunction，必须走 call<T>()
 */
import { ENV } from '../config/env';
import { mockDispatch } from '../mock/index';
import { login } from '../services/auth';

/** 契约统一响应信封 */
export interface ApiEnvelope<T> {
  code: number;
  msg: string;
  data: T;
}

/** 业务错误：携带契约错误码，供调用方精准处理 */
export class ApiError extends Error {
  readonly code: number;
  constructor(code: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

/** 契约错误码 → 用户可见文案（503 降级不 toast） */
const ERROR_TOAST: Record<number, string> = {
  400: '提交内容有误，请检查后重试',
  401: '登录已过期，正在重新登录…',
  403: '暂无权限执行该操作',
  404: '内容不存在或已删除',
  429: '操作太频繁，请稍后再试',
  500: '服务开小差了，请稍后重试',
};

function toastFor(code: number, msg: string): void {
  if (code === 503) return; // AI 已降级，契约约定不打扰用户
  wx.showToast({ title: ERROR_TOAST[code] ?? msg ?? '请求失败', icon: 'none' });
}

/** 单次云函数调用（不解包业务 code，交由上层判定） */
function rawCall<T>(name: string, data: Record<string, unknown>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    wx.cloud.callFunction({
      name,
      data,
      success: (res) => {
        const body = (res.result ?? { code: 500, msg: '空响应', data: null }) as ApiEnvelope<T>;
        if (body.code === 0) {
          resolve(body.data);
          return;
        }
        toastFor(body.code, body.msg);
        reject(new ApiError(body.code, body.msg));
      },
      fail: (err) => {
        wx.showToast({ title: '网络异常，请检查网络后重试', icon: 'none' });
        reject(new ApiError(-1, err.errMsg || '网络异常'));
      },
    });
  });
}

/** 401 时静默重登并重试原请求一次 */
async function rawCallWithRelogin<T>(name: string, data: Record<string, unknown>): Promise<T> {
  try {
    return await rawCall<T>(name, data);
  } catch (err) {
    if (err instanceof ApiError && err.code === 401 && name !== 'auth:login') {
      try {
        await login();
      } catch {
        /* 重登失败则抛出原错误 */
      }
      return rawCall<T>(name, data);
    }
    throw err;
  }
}

/**
 * 真实通道分发（形态 B，2026-10-14 与后端定稿）
 *
 * 调用形态：`wx.cloud.callFunction({ name: '<资源>', data: { action: '<动作>', ...业务入参 } })`
 * - `name` = 云函数目录名（auth / user / workorder / notice / circle / service / phonebook / qa）
 * - `data.action` = 分发键（动作名）
 *
 * service 层仍以契约的 `'<资源>:<动作>'` 字符串（如 `'workorder:handle'`）调用，
 * 由本函数统一拆分 —— service 层永不手写 name，也不必关心分发键。
 *
 * ⚠ 契约抬头那句 `name = "<资源>:<动作>"` 与它自己的 `notice:urgentLatest` 请求示例矛盾，
 *    属表述残留；以**请求示例 + 后端实现**为准（形态 B），架构师将在 CR-011 订正抬头表述。
 * ⚠ `action` 必须放在展开的**最后**：形态 B 下它与业务入参同名（如 workorder:handle 的业务入参
 *    历史上也叫 action），放在最后可保证分发键永不被业务字段覆盖；业务值一律走 `handleAction`。
 */
function dispatch<T>(name: string, data: Record<string, unknown>): Promise<T> {
  if (name.indexOf(':') < 0) return rawCallWithRelogin<T>(name, data);
  const [resource, action] = name.split(':');
  return rawCallWithRelogin<T>(resource, { ...data, action });
}

/**
 * 全站唯一请求出口。
 * @param name 云函数动作名，严格照抄契约，如 'notice:urgentLatest'（半角冒号）
 * @param data 入参对象，字段与契约入参一致
 */
export function call<T>(name: string, data: Record<string, unknown> = {}): Promise<T> {
  if (ENV.USE_MOCK) return mockDispatch<T>(name, data);
  return dispatch<T>(name, data);
}
