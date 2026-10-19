/**
 * 服务分类页视图模型（FE-14 · CR-022）
 *
 * 为什么单独成文件：页面文件一 import 就会执行 `Page({...})`，
 * 而 `Page` 只在微信运行时存在，vitest 里直接报 ReferenceError。
 * 本项目其他页（index / repair-list）都把纯函数放 viewmodel.ts，这里保持一致。
 */

/** 期望时段候选项（固定 4 档，避免引入日期选择器组件） */
export const TIME_SLOTS: string[] = ['今天下午', '明天上午', '明天下午', '本周末'];

export interface ItemVM {
  key: string;
  name: string;
  desc: string;
  iconText: string;
  /** true = 本页内弹层预约；false = 交给 navigateByTarget */
  book: boolean;
  opts: string[];
}

export interface GroupVM {
  key: string;
  name: string;
  note: string;
  items: ItemVM[];
}

/** 取服务名首字做图标（无图标资源时的稳定降级，不会出现空白块） */
export function initialOfName(name: string): string {
  return String(name ?? '').trim().slice(0, 1) || '服';
}

/** 把单个服务项拍平成视图模型；预约标志与选项都从 targetParams 解出
 *  CR-028：预约类服务改指独立预约页，参数名 book → svc；
 *          这里同时兼容两种写法（旧数据 / 服务端缓存仍可能是 book）。 */
export function toItemVM(item: ServiceItem): ItemVM {
  const params = item.targetParams ?? {};
  return {
    key: item.key,
    name: item.name,
    desc: item.desc ?? '',
    iconText: initialOfName(item.name),
    book: String(params.svc ?? params.book ?? '') !== '',
    opts: String(params.opts ?? '')
      .split('|')
      .map((s) => s.trim())
      .filter((s) => s !== ''),
  };
}

/**
 * ServiceCategory → 板块视图模型（纯函数）。
 * 无 groups 的旧数据合成单个板块，保证任何数据形态都能渲染。
 */
export function toGroupsVM(category?: ServiceCategory | null): GroupVM[] {
  if (!category) return [];
  const groups = category.groups ?? [];
  if (groups.length === 0) {
    return [
      {
        key: `${category.key}_all`,
        name: category.title,
        note: '',
        items: (category.items ?? []).map(toItemVM),
      },
    ];
  }
  return groups.map((group) => ({
    key: group.key,
    name: group.name,
    note: group.note ?? '',
    items: group.items.map(toItemVM),
  }));
}

/** 统计某分类下的服务项数（页头「共 N 项服务」） */
export function countItems(category?: ServiceCategory | null): number {
  if (!category) return 0;
  return (category.items ?? []).length;
}

/** 按 key 找分类；找不到回退第一个（接口少返一类时不至于白屏） */
export function pickCategory(list: ServiceCategory[], key?: string): ServiceCategory | undefined {
  if (!list || list.length === 0) return undefined;
  return list.find((c) => c.key === key) ?? list[0];
}

/** 页面内按 item.key 找到原始 ServiceItem（导航需要完整对象） */
export function findRawItem(
  category: ServiceCategory | undefined,
  key: string,
): ServiceItem | undefined {
  if (!category) return undefined;
  return (category.items ?? []).find((i) => i.key === key);
}

/** 预约提交文案：结构化拼装，便于客服一眼看清需求（纯函数，可单测） */
export function buildBookingDescription(input: {
  svc: string;
  opt?: string;
  room: string;
  time: string;
  note?: string;
}): string {
  return [
    `服务：${input.svc}`,
    input.opt ? `选项：${input.opt}` : '',
    `房号：${String(input.room ?? '').trim()}`,
    `期望时间：${input.time}`,
    input.note && input.note.trim() ? `备注：${input.note.trim()}` : '',
  ]
    .filter((line) => line !== '')
    .join('\n');
}
