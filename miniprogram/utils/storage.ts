/**
 * storage 读写封装（FE-0）
 * - 统一 try/catch：隐私模式或超配额时降级为内存态，绝不因 storage 抛错打断页面
 * - 统一 JSON 序列化，避免各处手写 parse/stringify
 */
const memoryFallback: Record<string, unknown> = {};

export function getStorage<T>(key: string): T | null {
  try {
    const raw = wx.getStorageSync(key);
    if (raw === '' || raw === null || raw === undefined) return null;
    return raw as T;
  } catch {
    return (memoryFallback[key] as T) ?? null;
  }
}

export function setStorage<T>(key: string, value: T): void {
  memoryFallback[key] = value;
  try {
    wx.setStorageSync(key, value);
  } catch {
    /* 写入失败不影响内存态，进程内仍可读 */
  }
}

export function removeStorage(key: string): void {
  delete memoryFallback[key];
  try {
    wx.removeStorageSync(key);
  } catch {
    /* ignore */
  }
}

/** 读取一次后即删除（契约附 A.3：pendingCircleFilter 消费即清除） */
export function consumeStorage<T>(key: string): T | null {
  const value = getStorage<T>(key);
  if (value !== null) removeStorage(key);
  return value;
}
