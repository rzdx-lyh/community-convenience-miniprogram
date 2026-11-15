/** 助药提醒：本地药品计划、服药打卡与到点提示。 */
import { ENV, STORAGE_KEYS } from '../../../config/env';
import { getStorage, setStorage } from '../../../utils/storage';
import { confirm, toast } from '../../../utils/ui';
import { track, trackPageView } from '../../../utils/logger';
import {
  buildMedicationStats,
  buildTodayDoses,
  dateKey,
  makeMedicationId,
  nextDoseText,
  normalizeTimes,
  pruneMedicationLogs,
  summarizeDateRange,
  summarizeTimes,
  validateMedicationDraft,
  type MedicationDoseLog,
  type MedicationDoseVM,
  type MedicationDraft,
  type MedicationPlan,
  type MedicationStats,
} from './viewmodel';

const info = wx.getWindowInfo();
const RED_LINE = '本页只帮助记录医生或药师已经确定的用药计划，不提供诊断、处方或剂量建议；漏服、停药或调整剂量请咨询医生或药师。';
const MEDICATION_TEMPLATE_IDS = ENV.MEDICATION_TEMPLATE_IDS;

interface PlanVM extends MedicationPlan {
  timesText: string;
  rangeText: string;
}

function emptyDraft(): MedicationDraft {
  return {
    name: '',
    dosage: '',
    instruction: '',
    times: ['08:00'],
    startDate: dateKey(),
    endDate: '',
    agreed: false,
  };
}

function toPlanVM(plan: MedicationPlan): PlanVM {
  return { ...plan, timesText: summarizeTimes(plan.times), rangeText: summarizeDateRange(plan) };
}

Page({
  data: {
    statusBarHeight: info.statusBarHeight,
    today: dateKey(),
    doses: [] as MedicationDoseVM[],
    plans: [] as PlanVM[],
    stats: { total: 0, taken: 0, skipped: 0, pending: 0, percent: 0, summary: '今天还没有服药计划' } as MedicationStats,
    nextDose: '添加药品后会在这里显示',
    hasPlans: false,
    allDone: false,
    redLine: RED_LINE,
    showEditor: false,
    editingId: '',
    draft: emptyDraft(),
    timePicker: '08:00',
    reminderEnabled: false,
    reminderHint: MEDICATION_TEMPLATE_IDS.length ? '可申请微信订阅消息提醒' : '当前为页面内到点提示，后台提醒模板尚未配置',
  },

  onLoad() {
    trackPageView('pages/service/medication/index');
    this.refresh();
  },

  onShow() {
    this.refresh();
  },

  refresh(): void {
    const plans = (getStorage<MedicationPlan[]>(STORAGE_KEYS.MEDICATION_PLANS) ?? [])
      .slice()
      .sort((a, b) => Number(b.enabled) - Number(a.enabled) || b.updatedAt.localeCompare(a.updatedAt));
    const rawLogs = getStorage<MedicationDoseLog[]>(STORAGE_KEYS.MEDICATION_LOGS) ?? [];
    const logs = pruneMedicationLogs(rawLogs);
    if (logs.length !== rawLogs.length) setStorage(STORAGE_KEYS.MEDICATION_LOGS, logs);
    const today = dateKey();
    const doses = buildTodayDoses(plans, logs, today);
    const stats = buildMedicationStats(doses);
    this.setData({
      today,
      doses,
      plans: plans.map(toPlanVM),
      stats,
      nextDose: nextDoseText(doses),
      hasPlans: plans.length > 0,
      allDone: doses.length > 0 && stats.pending === 0,
      reminderEnabled: getStorage<boolean>(STORAGE_KEYS.MEDICATION_REMINDER_ENABLED) === true,
    });
  },

  goBack(): void {
    if (getCurrentPages().length > 1) wx.navigateBack();
    else wx.switchTab({ url: '/pages/index/index' });
  },

  onOpenHelp(): void {
    wx.showModal({
      title: '用药安全提示',
      content: RED_LINE,
      showCancel: false,
      confirmText: '我知道了',
    });
  },

  onOpenEditor(): void {
    this.setData({ showEditor: true, editingId: '', draft: emptyDraft(), timePicker: '08:00' });
  },

  onEditPlan(e: WechatMiniprogram.TouchEvent): void {
    const id = String((e.currentTarget.dataset as { id?: string }).id || '');
    const plan = this.data.plans.find((item) => item.id === id);
    if (!plan) return;
    this.setData({
      showEditor: true,
      editingId: id,
      timePicker: plan.times[0] || '08:00',
      draft: {
        name: plan.name,
        dosage: plan.dosage,
        instruction: plan.instruction,
        times: plan.times.slice(),
        startDate: plan.startDate,
        endDate: plan.endDate,
        agreed: true,
      },
    });
  },

  noop(): void {
    /* 阻止弹层点击穿透 */
  },

  onCloseEditor(): void {
    this.setData({ showEditor: false, editingId: '', draft: emptyDraft() });
  },

  onInputName(e: WechatMiniprogram.Input): void {
    this.setData({ 'draft.name': String(e.detail.value ?? '') });
  },

  onInputDosage(e: WechatMiniprogram.Input): void {
    this.setData({ 'draft.dosage': String(e.detail.value ?? '') });
  },

  onInputInstruction(e: WechatMiniprogram.Input): void {
    this.setData({ 'draft.instruction': String(e.detail.value ?? '') });
  },

  onPickTime(e: WechatMiniprogram.PickerChange): void {
    const value = String(e.detail.value || '');
    const times = normalizeTimes(this.data.draft.times.concat([value]));
    if (times.length > 6) {
      toast('每天最多设置 6 个时间');
      return;
    }
    this.setData({ 'draft.times': times, timePicker: value });
  },

  onRemoveTime(e: WechatMiniprogram.TouchEvent): void {
    const value = String((e.currentTarget.dataset as { time?: string }).time || '');
    const times = this.data.draft.times.filter((item) => item !== value);
    if (times.length === 0) {
      toast('请至少保留一个服用时间');
      return;
    }
    this.setData({ 'draft.times': times });
  },

  onStartDate(e: WechatMiniprogram.PickerChange): void {
    this.setData({ 'draft.startDate': String(e.detail.value || '') });
  },

  onEndDate(e: WechatMiniprogram.PickerChange): void {
    this.setData({ 'draft.endDate': String(e.detail.value || '') });
  },

  onClearEndDate(): void {
    this.setData({ 'draft.endDate': '' });
  },

  onToggleAgreed(): void {
    this.setData({ 'draft.agreed': !this.data.draft.agreed });
  },

  onSavePlan(): void {
    const draft = this.data.draft;
    const error = validateMedicationDraft(draft);
    if (error) {
      toast(error);
      return;
    }
    const plans = getStorage<MedicationPlan[]>(STORAGE_KEYS.MEDICATION_PLANS) ?? [];
    const now = new Date().toISOString();
    const existing = plans.find((item) => item.id === this.data.editingId);
    const plan: MedicationPlan = {
      id: existing?.id || makeMedicationId(),
      name: draft.name.trim(),
      dosage: draft.dosage.trim(),
      instruction: draft.instruction.trim(),
      times: normalizeTimes(draft.times),
      startDate: draft.startDate,
      endDate: draft.endDate,
      enabled: existing?.enabled ?? true,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };
    const next = existing ? plans.map((item) => (item.id === plan.id ? plan : item)) : plans.concat([plan]);
    setStorage(STORAGE_KEYS.MEDICATION_PLANS, next);
    this.setData({ showEditor: false, editingId: '', draft: emptyDraft() });
    this.refresh();
    toast(existing ? '用药计划已更新' : '药品已添加');
    track('btn_click', { page: 'medication', target: existing ? 'edit' : 'create' });
  },

  async onDeletePlan(e: WechatMiniprogram.TouchEvent): Promise<void> {
    const id = String((e.currentTarget.dataset as { id?: string }).id || '');
    const plan = this.data.plans.find((item) => item.id === id);
    if (!plan) return;
    const ok = await confirm('删除药品', `确定删除“${plan.name}”的用药计划吗？历史打卡记录不会再展示。`);
    if (!ok) return;
    setStorage(
      STORAGE_KEYS.MEDICATION_PLANS,
      (getStorage<MedicationPlan[]>(STORAGE_KEYS.MEDICATION_PLANS) ?? []).filter((item) => item.id !== id),
    );
    this.refresh();
    toast('已删除');
  },

  onTogglePlan(e: WechatMiniprogram.SwitchChange): void {
    const id = String((e.currentTarget.dataset as { id?: string }).id || '');
    const enabled = Boolean(e.detail.value);
    const next = (getStorage<MedicationPlan[]>(STORAGE_KEYS.MEDICATION_PLANS) ?? []).map((item) =>
      item.id === id ? { ...item, enabled, updatedAt: new Date().toISOString() } : item,
    );
    setStorage(STORAGE_KEYS.MEDICATION_PLANS, next);
    this.refresh();
  },

  onMarkDose(e: WechatMiniprogram.TouchEvent): void {
    const key = String((e.currentTarget.dataset as { key?: string }).key || '');
    const status = String((e.currentTarget.dataset as { status?: string }).status || '') as 'taken' | 'skipped';
    if (!key || (status !== 'taken' && status !== 'skipped')) return;
    const logs = getStorage<MedicationDoseLog[]>(STORAGE_KEYS.MEDICATION_LOGS) ?? [];
    const current = logs.find((item) => item.key === key);
    const next = current?.status === status
      ? logs.filter((item) => item.key !== key)
      : logs.filter((item) => item.key !== key).concat([{ key, status, recordedAt: new Date().toISOString() }]);
    setStorage(STORAGE_KEYS.MEDICATION_LOGS, pruneMedicationLogs(next));
    this.refresh();
  },

  onEnableReminder(): void {
    if (!MEDICATION_TEMPLATE_IDS.length) {
      const enabled = !this.data.reminderEnabled;
      this.setData({ reminderEnabled: enabled });
      setStorage(STORAGE_KEYS.MEDICATION_REMINDER_ENABLED, enabled);
      toast('已切换页面内到点提示；后台模板未配置');
      return;
    }
    wx.requestSubscribeMessage({
      tmplIds: MEDICATION_TEMPLATE_IDS,
      success: () => {
        setStorage(STORAGE_KEYS.MEDICATION_REMINDER_ENABLED, true);
        this.setData({ reminderEnabled: true });
        toast('提醒设置已更新');
      },
      fail: () => toast('未开启微信提醒，可稍后重试'),
    });
  },

  onShareAppMessage(): { title: string; path: string } {
    return { title: '社区助药提醒：记录用药计划与服药打卡', path: '/pages/service/medication/index' };
  },
});