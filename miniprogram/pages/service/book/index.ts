/**
 * 通用预约（CR-028）
 *
 * 38 项「需预约登记」服务的统一入口：服务类型 → 时间 → 地址 → 提交收据。
 * 入口参数：svc（服务名）/ opts（可选类型，`|` 分隔）/ cat（分类 key）。
 * 无参数时给默认值并在页内允许重新选择，保证任何入口进来都能走完流程。
 *
 * 红线：只做登记与转派，不收预付款；费用口径统一写「上门后按明码标价结算」。
 */
import { LOCAL_SERVICE_CATEGORIES } from '../../../config/service-grid';
import { createWorkOrder } from '../../../services/workorder';
import { track, trackPageView } from '../../../utils/logger';
import { toast } from '../../../utils/ui';

const info = wx.getWindowInfo();

const DEFAULT_OPTS = ['上门服务', '到站办理', '电话咨询'];
const DEFAULT_SLOTS = [
  { name: '上午 9-11', remain: '余 3 位' },
  { name: '下午 14-16', remain: '余 5 位' },
  { name: '傍晚 16-18', remain: '余 2 位' },
  { name: '周末全天', remain: '余 6 位' },
];
const UNITS = ['1 号楼', '2 号楼', '3 号楼', '7 号楼'];

interface OptVM {
  name: string;
  on: boolean;
}

interface SlotVM {
  name: string;
  remain: string;
}

interface DayVM {
  label: string;
  md: string;
}

interface StepVM {
  n: number;
  text: string;
  cls: string;
}

interface TlVM {
  cls: string;
  title: string;
  desc: string;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function buildDays(): DayVM[] {
  const labels = ['今天', '明天', '后天'];
  return labels.map((label, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return { label, md: `${pad(d.getMonth() + 1)}-${pad(d.getDate())}` };
  });
}

/** 从服务网格里反查「板块 · 分类」，让页头不是孤零零一个服务名 */
function metaOf(svc: string): { catName: string; grpName: string; opts: string[] } {
  const categories = LOCAL_SERVICE_CATEGORIES ?? [];
  for (const c of categories) {
    for (const g of c.groups ?? []) {
      const hit = (g.items ?? []).find((i) => i.name === svc);
      if (hit) {
        const raw = String((hit.targetParams as Record<string, unknown> | undefined)?.opts ?? '');
        return { catName: c.title, grpName: g.name, opts: raw ? raw.split('|') : [] };
      }
    }
  }
  return { catName: '社区服务', grpName: '便民预约', opts: [] };
}

function makeNo(): string {
  const d = new Date();
  const r = Math.floor(Math.random() * 900) + 100;
  return `YY${pad(d.getMonth() + 1)}${pad(d.getDate())}${r}`;
}

Page({
  data: {
    statusBarHeight: info.statusBarHeight,

    svc: '社区便民服务',
    catName: '社区服务',
    grpName: '便民预约',

    step: 1,
    steps: [] as StepVM[],

    optList: [] as OptVM[],
    opts: [] as string[],

    days: buildDays(),
    dayIndex: 0,
    slots: DEFAULT_SLOTS as SlotVM[],
    slot: '',

    units: UNITS,
    unit: '',
    room: '',
    note: '',

    sumTxt: '未选服务类型',
    subTxt: '第 1 步 / 共 3 步',
    optText: '',
    addrText: '待选',
    ready: false,

    done: false,
    no: '',
    receiptText: '',
    timeline: [] as TlVM[],

    showHelp: false,
    submitting: false,
  },

  onLoad(options: Record<string, string | undefined>): void {
    trackPageView('pages/service/book/index');
    const decode = (v: string | undefined): string => {
      const s = String(v ?? '').trim();
      if (!s) return '';
      try {
        return decodeURIComponent(s);
      } catch {
        return s;
      }
    };
    const svc = decode(options?.svc) || '社区便民服务';
    const meta = metaOf(svc);
    const rawOpts = decode(options?.opts);
    let optList = rawOpts ? rawOpts.split('|').filter((x) => x !== '') : meta.opts;
    if (optList.length === 0) optList = svc === '社区便民服务' ? DEFAULT_OPTS : ['标准服务'];
    // 只有一项时直接选中，避免用户被一个「唯一的选项」卡住
    const opts = optList.length === 1 ? [optList[0]] : [];
    this.setData({
      svc,
      catName: meta.catName,
      grpName: meta.grpName,
      opts,
      optList: optList.map((name) => ({ name, on: opts.indexOf(name) >= 0 })),
    });
    this.refresh();
  },

  /** 统一重算步骤条 / 底部摘要 / 是否可提交 */
  refresh(): void {
    const st = this.data.step;
    const steps: StepVM[] = [
      { n: 1, text: '服务类型', cls: st === 1 ? 'on' : st > 1 ? 'done' : '' },
      { n: 2, text: '时间', cls: st === 2 ? 'on' : st > 2 ? 'done' : '' },
      { n: 3, text: '地址确认', cls: st === 3 ? 'on' : '' },
    ];
    const sumTxt =
      st === 1
        ? this.data.opts.length
          ? this.data.opts.join('、')
          : '未选服务类型'
        : st === 2
          ? this.data.slot || '未选时间'
          : this.data.unit
            ? `${this.data.unit}${this.data.room ? ` ${this.data.room}` : ''}`
            : '未选地址';
    const subTxt =
      st === 1 ? '第 1 步 / 共 3 步' : st === 2 ? '第 2 步 / 共 3 步' : '上门后按明码标价结算';
    this.setData({
      steps,
      sumTxt,
      subTxt,
      optText: this.data.opts.join('、'),
      addrText: `${this.data.unit || '待选'}${this.data.room ? ` ${this.data.room}` : ''}`,
      ready: this.data.opts.length > 0 && !!this.data.slot && !!this.data.unit,
    });
  },

  goBack(): void {
    if (getCurrentPages().length > 1) {
      wx.navigateBack();
      return;
    }
    wx.switchTab({ url: '/pages/index/index' });
  },

  openHelp(): void {
    this.setData({ showHelp: true });
  },

  closeHelp(): void {
    this.setData({ showHelp: false });
  },

  noop(): void {
    /* 阻止弹层点击冒泡 */
  },

  onChooseOpt(e: WechatMiniprogram.TouchEvent): void {
    const v = String((e.currentTarget.dataset as { v?: string }).v ?? '');
    if (!v) return;
    const opts = this.data.opts.indexOf(v) >= 0
      ? this.data.opts.filter((x) => x !== v)
      : this.data.opts.concat([v]);
    this.setData({ opts, optList: this.data.optList.map((o) => ({ ...o, on: opts.indexOf(o.name) >= 0 })) });
    this.refresh();
  },

  onChooseDay(e: WechatMiniprogram.TouchEvent): void {
    const i = Number((e.currentTarget.dataset as { v?: string }).v ?? 0);
    if (!Number.isFinite(i)) return;
    this.setData({ dayIndex: i });
  },

  onChooseSlot(e: WechatMiniprogram.TouchEvent): void {
    const v = String((e.currentTarget.dataset as { v?: string }).v ?? '');
    if (!v) return;
    track('btn_click', { page: 'book', target: 'slot', kind: v });
    this.setData({ slot: v });
    this.refresh();
  },

  onChooseUnit(e: WechatMiniprogram.TouchEvent): void {
    const v = String((e.currentTarget.dataset as { v?: string }).v ?? '');
    if (!v) return;
    this.setData({ unit: v });
    this.refresh();
  },

  onInputRoom(e: WechatMiniprogram.Input): void {
    this.setData({ room: String(e.detail.value ?? '') });
    this.refresh();
  },

  onInputNote(e: WechatMiniprogram.Input): void {
    this.setData({ note: String(e.detail.value ?? '') });
  },

  /** 下一步：当前步校验不过就停在原地，并明确告诉用户缺什么 */
  onNext(): void {
    const st = this.data.step;
    if (st === 1) {
      if (this.data.opts.length === 0) {
        toast('请先选择要办的服务类型');
        return;
      }
      this.setData({ step: 2 });
      this.refresh();
      return;
    }
    if (st === 2) {
      if (!this.data.slot) {
        toast('请先选择上门时段');
        return;
      }
      this.setData({ step: 3 });
      this.refresh();
    }
  },

  onStep(e: WechatMiniprogram.TouchEvent): void {
    const n = Number((e.currentTarget.dataset as { n?: string }).n ?? 0);
    if (!n || n === this.data.step) return;
    if (n > this.data.step) {
      this.onNext();
      return;
    }
    this.setData({ step: n });
    this.refresh();
  },

  async onSubmit(): Promise<void> {
    if (this.data.submitting) return;
    if (!this.data.ready) {
      toast('请补全服务类型、时间与地址');
      return;
    }
    this.setData({ submitting: true });
    const day = this.data.days[this.data.dayIndex] ?? this.data.days[0];
    const whenText = `${day ? day.label : '今天'} ${this.data.slot}`;
    const no = makeNo();
    try {
      await createWorkOrder({
        title: `预约 · ${this.data.svc}`,
        category: 'other',
        description: [
          `服务：${this.data.svc}`,
          this.data.opts.length ? `类型：${this.data.opts.join('、')}` : '',
          `时间：${whenText}`,
          `地址：${this.data.unit}${this.data.room ? ` ${this.data.room}` : ''}`,
          this.data.note.trim() ? `备注：${this.data.note.trim()}` : '',
        ]
          .filter((x) => x !== '')
          .join('\n'),
      });
      track('btn_click', { page: 'book', target: 'submit', kind: this.data.svc });
      this.setData({
        submitting: false,
        done: true,
        no,
        receiptText: `${this.data.opts.length ? `服务类型：${this.data.opts.join('、')} · ` : ''}${whenText} · ${this.data.unit}${
          this.data.room ? ` ${this.data.room}` : ''
        }`,
        timeline: [
          { cls: 'done', title: '已提交', desc: `${this.data.svc} 预约登记` },
          { cls: 'now', title: '社区受理中', desc: '预计 2 小时内电话确认' },
          { cls: 'todo', title: '上门 / 到场', desc: '按约定时间提供服务' },
          { cls: 'todo', title: '完成并评价', desc: '服务结束后邀请评价' },
        ],
      });
    } catch {
      this.setData({ submitting: false });
      toast('提交失败，请稍后重试');
    }
  },
});
