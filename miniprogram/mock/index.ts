/**
 * mock 分发（FE-0）
 * 只有在 ENV.USE_MOCK === true 时被调用；接口名与契约完全一致，
 * 因此 USE_MOCK 置 false 后前端零改动即可切到真实云函数。
 */
import { ENV } from '../config/env';
import { mockHandlers } from './data';

export function mockDispatch<T>(name: string, data: Record<string, unknown>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const handler = mockHandlers[name];
    setTimeout(() => {
      if (!handler) {
        // 未实现的 mock 直接抛错并在控制台高亮，避免"静默返回 undefined"误导联调
        console.error(`[mock] 未实现的接口: ${name}`);
        reject(new Error(`[mock] 未实现接口: ${name}`));
        return;
      }
      resolve(handler(data) as T);
    }, ENV.MOCK_DELAY);
  });
}
