/**
 * 健康档案（CR-028 重写，保留 CR-026 能力）
 *
 * 结构：彩色页头（最近血压）→ 指标卡 + 趋势 → 记录一次自测 → 测量记录 → 家庭医生签约
 *
 * ⚠ 两条红线（写死在文案里，别删）：
 *   1. **数据纯本地**：自测记录只存 Storage，不上传云端、不新增集合；
 *   2. **只给参考不给诊断**：任何异常都落到「复测 / 到社区门诊」，绝不出现确诊类表述。
 */
import { STORAGE_KEYS } from '../../../config/env';
import { createWorkOrder } from '../../../services/workorder';
import { track, trackPageView } from '../../../utils/logger';
import { getStorage, setStorage } from '../../../utils/storage';
import { toast } from '../../../utils/ui';
import {
  buildDoctorOrderDescription,
  interpretBp,
  interpretGlucose,
  latestSummary,
  makeRecordId,
  type HealthRecord,
  type RecordKind,
} from './viewmodel';

const info = wx.getWindowInfo();

/** 自测记录存储键（本地，不上传云端）——保持与 CR-026 完全兼容 */
const RECORD_KEY = STORAGE_KEYS.HEALTH_RECORDS;

const RED_LINE =
  '本页记录仅保存在本机，不会上传；指标解读为一般性参考，不能替代医生诊断，异常请及时到社区门诊就诊。';

interface RecVM extends HealthRecord {
  valueText: string;
  unitText: string;
  icon: string;
}

interface TrendVM {
  k: number;
  h: number;
  on: boolean;
}

function tagOf(level?: string): string {
  if (level === 'normal') return 'ok';
  if (level === 'watch') return 'warn';
  if (level === 'high') return 'hi';
  return 'mute';
}

function nowText(): string {
  const d = new Date();
  const p = (n: number): string => (n < 10 ? `0${n}` : String(n));
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

Page({
  data: {
    statusBarHeight: info.statusBarHeight,

    /** 档案概览 */
    summary: '',
    redLine: RED_LINE,
    count: 0,
    bpCount: 0,
    latestSys: '--',
    latestDia: '--',
    bpLevelText: '待记录',
    bpTag: 'mute',
    gluText: '--',
    gluLevelText: '待记录',
    gluTag: 'mute',
    trend: [] as TrendVM[],

    /** 录入区 */
    kind: 'bp' as RecordKind,
    sys: '',
    dia: '',
    glucose: '',
    when: 'fasting' as 'fasting' | 'post',
    preview: null as { levelText: string; advice: string; level: string } | null,

    /** 记录列表 */
    records: [] as RecVM[],

    /** 签约弹层 */
    showSign: false,
    signRoom: '',
    signContact: '',
    signNote: '',
    submitting: false,
  },

  onLoad(options: Record<string, string | undefined>) {
    trackPageView('pages/service/record/index');
    this.loadRecords();
    // 从「家庭医生签约」宫格直接进来时展开签约弹层，别让用户再找一遍
    if (String(options?.sign ?? '') === '1') {
      this.setData({ showSign: true });
    }
  },

  onShow() {
    // 从其他页返回时刷新概览，避免看到过期摘要
    this.loadRecords();
  },

  loadRecords(): void {
    const list = getStorage<HealthRecord[]>(RECORD_KEY) ?? [];
    const bpList = list.filter((r) => r.kind === 'bp');
    const bp = bpList[0];
    const glu = list.filter((r) => r.kind === 'glucose')[0];

    const recent = bpList.slice(0, 7).reverse();
    const vals = recent.map((r) => r.sys);
    const min = vals.length ? Math.min(...vals) - 4 : 0;
    const max = vals.length ? Math.max(...vals) + 4 : 1;
    const trend: TrendVM[] = recent.map((r, i) => ({
      k: i,
      h: Math.max(24, Math.min(100, Math.round(((r.sys - min) / (max - min || 1)) * 76 + 24))),
      on: i === recent.length - 1,
    }));

    this.setData({
      records: list.slice(0, 10).map((r) => ({
        ...r,
        valueText: r.kind === 'bp' ? `${r.sys} / ${r.dia}` : `${r.glucose}`,
        unitText: r.kind === 'bp' ? 'mmHg' : 'mmol/L',
        icon: r.kind === 'bp' ? 'heart' : 'droplet',
      })),
      count: list.length,
      bpCount: bpList.length,
      latestSys: bp ? String(bp.sys) : '--',
      latestDia: bp ? String(bp.dia) : '--',
      bpLevelText: bp ? bp.levelText : '待记录',
      bpTag: tagOf(bp?.level),
      gluText: glu ? String(glu.glucose) : '--',
      gluLevelText: glu ? glu.levelText : '待记录',
      gluTag: tagOf(glu?.level),
      trend,
      summary: latestSummary(list),
    });
  },

  goBack(): void {
    if (getCurrentPages().length > 1) {
      wx.navigateBack();
      return;
    }
    wx.switchTab({ url: '/pages/index/index' });
  },

  /** 页头右上角：预约上门测量（走通用预约页，不新增页面） */
  onBookMeasure(): void {
    wx.navigateTo({
      url: `/pages/service/book/index?svc=${encodeURIComponent('上门健康测量')}&cat=health&opts=${encodeURIComponent('血压|血糖|两项都测')}`,
      fail: () => toast('预约页暂时打不开，请稍后再试'),
    });
  },

  onAskAi(): void {
    wx.navigateTo({
      url: '/pages/assistant/index',
      fail: () => toast('AI 助手暂时打不开，请稍后再试'),
    });
  },

  /* ============================ 录入区 ============================ */

  onSwitchKind(e: WechatMiniprogram.TouchEvent): void {
    const k = String((e.currentTarget.dataset as { k?: string }).k ?? 'bp') as RecordKind;
    if (k === this.data.kind) return;
    track('btn_click', { page: 'record', target: 'switch_kind', kind: k });
    this.setData({ kind: k, preview: null });
  },

  onSwitchWhen(e: WechatMiniprogram.TouchEvent): void {
    const w = String((e.currentTarget.dataset as { w?: string }).w ?? 'fasting') as 'fasting' | 'post';
    if (w === this.data.when) return;
    this.setData({ when: w, preview: null });
  },

  onInputSys(e: WechatMiniprogram.Input): void {
    this.setData({ sys: String(e.detail.value ?? ''), preview: null });
  },

  onInputDia(e: WechatMiniprogram.Input): void {
    this.setData({ dia: String(e.detail.value ?? ''), preview: null });
  },

  onInputGlucose(e: WechatMiniprogram.Input): void {
    this.setData({ glucose: String(e.detail.value ?? ''), preview: null });
  },

  /** 边填边出解读（不做诊断，只给趋势与就医提示） */
  onInterpret(): void {
    if (this.data.kind === 'bp') {
      const sys = Number(this.data.sys);
      const dia = Number(this.data.dia);
      if (!this.data.sys || !this.data.dia || !Number.isFinite(sys) || !Number.isFinite(dia)) {
        toast('请填写收缩压与舒张压');
        return;
      }
      this.setData({ preview: interpretBp(sys, dia) });
      return;
    }
    const v = Number(this.data.glucose);
    if (!this.data.glucose || !Number.isFinite(v)) {
      toast('请填写血糖值');
      return;
    }
    this.setData({ preview: interpretGlucose(v, this.data.when) });
  },

  onSave(): void {
    if (this.data.kind === 'bp') {
      const sys = Number(this.data.sys);
      const dia = Number(this.data.dia);
      if (!this.data.sys || !this.data.dia || !Number.isFinite(sys) || !Number.isFinite(dia)) {
        toast('请填写收缩压与舒张压');
        return;
      }
      if (sys < 60 || sys > 260 || dia < 30 || dia > 200) {
        toast('数值超出常见范围，请确认后重填');
        return;
      }
      const r = interpretBp(sys, dia);
      const item: HealthRecord = {
        id: makeRecordId(),
        kind: 'bp',
        sys,
        dia,
        glucose: 0,
        timeText: nowText(),
        level: r.level,
        levelText: r.levelText,
        advice: r.advice,
      };
      this.append(item);
      return;
    }
    const v = Number(this.data.glucose);
    if (!this.data.glucose || !Number.isFinite(v)) {
      toast('请填写血糖值');
      return;
    }
    if (v < 1 || v > 40) {
      toast('数值超出常见范围，请确认后重填');
      return;
    }
    const r = interpretGlucose(v, this.data.when);
    const item: HealthRecord = {
      id: makeRecordId(),
      kind: 'glucose',
      sys: 0,
      dia: 0,
      glucose: v,
      timeText: this.data.when === 'fasting' ? `${nowText()} · 空腹` : `${nowText()} · 餐后2h`,
      level: r.level,
      levelText: r.levelText,
      advice: r.advice,
    };
    this.append(item);
  },

  append(item: HealthRecord): void {
    const list = getStorage<HealthRecord[]>(RECORD_KEY) ?? [];
    list.unshift(item);
    // 本地存储有容量上限，只留最近 100 条
    setStorage(RECORD_KEY, list.slice(0, 100));
    track('btn_click', { page: 'record', target: 'save', kind: item.kind, level: item.level });
    this.setData({ sys: '', dia: '', glucose: '', preview: null });
    this.loadRecords();
    wx.showToast({ title: '已记录', icon: 'success' });
  },

  onRemove(e: WechatMiniprogram.TouchEvent): void {
    const id = String((e.currentTarget.dataset as { id?: string }).id ?? '');
    if (!id) return;
    wx.showModal({
      title: '删除这条记录？',
      content: '删除后无法恢复，记录仅保存在本机。',
      confirmText: '删除',
      confirmColor: '#E5484D',
      success: (res) => {
        if (!res.confirm) return;
        const list = (getStorage<HealthRecord[]>(RECORD_KEY) ?? []).filter((r) => r.id !== id);
        setStorage(RECORD_KEY, list);
        this.loadRecords();
      },
    });
  },

  /* ============================ 家庭医生签约 ============================ */

  onSign(): void {
    track('btn_click', { page: 'record', target: 'sign_open' });
    this.setData({ showSign: true, signRoom: '', signContact: '', signNote: '' });
  },

  onCloseSign(): void {
    this.setData({ showSign: false });
  },

  onInputSignRoom(e: WechatMiniprogram.Input): void {
    this.setData({ signRoom: String(e.detail.value ?? '') });
  },

  onInputSignContact(e: WechatMiniprogram.Input): void {
    this.setData({ signContact: String(e.detail.value ?? '') });
  },

  onInputSignNote(e: WechatMiniprogram.Input): void {
    this.setData({ signNote: String(e.detail.value ?? '') });
  },

  async onSubmitSign(): Promise<void> {
    if (this.data.submitting) return;
    const room = String(this.data.signRoom ?? '').trim();
    const contact = String(this.data.signContact ?? '').trim();
    if (!room) {
      toast('请填写楼栋房号');
      return;
    }
    if (!contact) {
      toast('请填写联系电话');
      return;
    }
    if (!/^\d{7,15}$/.test(contact.replace(/[-\s]/g, ''))) {
      toast('请填写正确的联系电话');
      return;
    }
    this.setData({ submitting: true });
    try {
      await createWorkOrder({
        title: '家庭医生签约申请',
        category: 'other',
        description: buildDoctorOrderDescription({
          room,
          contact,
          note: this.data.signNote,
        }),
      });
      this.setData({ showSign: false, submitting: false });
      wx.showToast({ title: '已提交，社区医生会联系你', icon: 'none' });
    } catch {
      this.setData({ submitting: false });
      toast('提交失败，请稍后重试');
    }
  },

  noop(): void {
    /* noop */
  },
});
