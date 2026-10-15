/**
 * 分页工具（FE-0 · C4）
 * 契约约定：page 从 1 起，pageSize 默认 10 上限 50；hasMore 一律以 total 判定，不靠 list.length。
 */
import { ENV } from '../config/env';

export interface PageResult<T> {
  list: T[];
  total: number;
}

export interface Pager<T> {
  /** 加载下一页；无更多或正在加载时返回空结果 */
  next(): Promise<PageResult<T>>;
  /** 重置到第 1 页 */
  reset(): void;
  hasMore(): boolean;
  loading(): boolean;
  /** 当前页码（从 1 起） */
  currentPage(): number;
}

type Fetcher<T> = (page: number, pageSize: number) => Promise<PageResult<T>>;

export function createPager<T>(fetcher: Fetcher<T>, pageSize: number = ENV.PAGE_SIZE): Pager<T> {
  let page = 1;
  let total = 0;
  let loaded = 0;
  let isLoading = false;

  return {
    async next(): Promise<PageResult<T>> {
      if (isLoading) return { list: [], total };
      if (total > 0 && loaded >= total) return { list: [], total };
      isLoading = true;
      try {
        const res = await fetcher(page, pageSize);
        total = typeof res.total === 'number' ? res.total : 0;
        const list = res.list ?? [];
        loaded += list.length;
        page += 1;
        return { list, total };
      } finally {
        isLoading = false;
      }
    },
    reset(): void {
      page = 1;
      total = 0;
      loaded = 0;
      isLoading = false;
    },
    hasMore(): boolean {
      if (total === 0) return true; // 还没请求过，允许首次加载
      return loaded < total;
    },
    loading(): boolean {
      return isLoading;
    },
    currentPage(): number {
      return page;
    },
  };
}

/** 归一化分页入参：page 最小 1，pageSize 兜底 10、封顶 50 */
export function normalizePage(page?: number, pageSize?: number): { page: number; pageSize: number } {
  const p = Number.isFinite(page) && (page as number) >= 1 ? Math.floor(page as number) : 1;
  const raw = Number.isFinite(pageSize) && (pageSize as number) >= 1 ? Math.floor(pageSize as number) : ENV.PAGE_SIZE;
  return { page: p, pageSize: Math.min(raw, ENV.MAX_PAGE_SIZE) };
}
