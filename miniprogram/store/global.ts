/**
 * 全局轻量状态（FE-0 · C3）
 * 只有三项全局态：elderMode / profile / agreedPrivacy（外加 pendingCircleFilter 这类过渡态）。
 * 发布订阅 + storage 持久化；禁止页面之间互相读写 data。
 */
import { getStorage, setStorage } from '../utils/storage';

type Listener = (key: string, value: unknown) => void;

class GlobalStore {
  private state: Record<string, unknown> = {};
  private listeners: Listener[] = [];

  get<T>(key: string, fallback: T): T {
    if (key in this.state) return this.state[key] as T;
    const cached = getStorage<T>(key);
    this.state[key] = cached ?? fallback;
    return this.state[key] as T;
  }

  /** 只回读 storage，不落缓存（用于每次都要拿最新值的场景） */
  peek<T>(key: string, fallback: T): T {
    const cached = getStorage<T>(key);
    return cached ?? fallback;
  }

  set(key: string, value: unknown): void {
    this.state[key] = value;
    setStorage(key, value); // elderMode / profile 等需持久化
    this.listeners.forEach((fn) => fn(key, value));
  }

  subscribe(fn: Listener): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((f) => f !== fn);
    };
  }
}

export const store = new GlobalStore();
