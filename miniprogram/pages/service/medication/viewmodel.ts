/** 助药提醒 · 纯视图模型（本地数据，不上传云端） */
export type MedicationDoseStatus = 'taken' | 'skipped' | 'due' | 'late' | 'upcoming';

export interface MedicationPlan {
  id: string;
  name: string;
  dosage: string;
  instruction: string;
  times: string[];
  startDate: string;
  endDate: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MedicationDoseLog {
  key: string;
  status: 'taken' | 'skipped';
  recordedAt: string;
}

export interface MedicationDoseVM {
  key: string;
  planId: string;
  date: string;
  time: string;
  name: string;
  dosage: string;
  instruction: string;
  status: MedicationDoseStatus;
  statusLabel: string;
  actionable: boolean;
}

export interface MedicationStats {
  total: number;
  taken: number;
  skipped: number;
  pending: number;
  percent: number;
  summary: string;
}

export interface MedicationDraft {
  name: string;
  dosage: string;
  instruction: string;
  times: string[];
  startDate: string;
  endDate: string;
  agreed: boolean;
}

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function dateKey(date = new Date()): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function validTime(value: string): boolean {
  const m = /^(\d{2}):(\d{2})$/.exec(String(value || ''));
  if (!m) return false;
  return Number(m[1]) >= 0 && Number(m[1]) <= 23 && Number(m[2]) >= 0 && Number(m[2]) <= 59;
}

export function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return false;
  const d = new Date(`${value}T00:00:00`);
  return Number.isFinite(d.getTime()) && dateKey(d) === value;
}

export function normalizeTimes(times: string[]): string[] {
  return Array.from(new Set((times || []).map((x) => String(x || '').trim()).filter(validTime))).sort();
}

export function timeMinutes(value: string): number {
  if (!validTime(value)) return 0;
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
}

export function planActiveOn(plan: MedicationPlan, day = dateKey()): boolean {
  if (!plan.enabled) return false;
  if (plan.startDate && plan.startDate > day) return false;
  if (plan.endDate && plan.endDate < day) return false;
  return true;
}

export const DOSE_STATUS_LABEL: Record<MedicationDoseStatus, string> = {
  taken: '已服用',
  skipped: '已跳过',
  due: '到点服药',
  late: '已超时',
  upcoming: '待服用',
};

export function buildTodayDoses(
  plans: MedicationPlan[],
  logs: MedicationDoseLog[],
  day = dateKey(),
  now = new Date(),
): MedicationDoseVM[] {
  const logMap = new Map(logs.map((item) => [item.key, item.status]));
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const out: MedicationDoseVM[] = [];
  for (const plan of plans) {
    if (!planActiveOn(plan, day)) continue;
    for (const time of normalizeTimes(plan.times)) {
      const key = `${plan.id}|${day}|${time}`;
      const logged = logMap.get(key);
      const mins = timeMinutes(time);
      let status: MedicationDoseStatus = 'upcoming';
      if (logged === 'taken' || logged === 'skipped') status = logged;
      else if (mins + 120 < nowMinutes) status = 'late';
      else if (mins <= nowMinutes) status = 'due';
      out.push({
        key,
        planId: plan.id,
        date: day,
        time,
        name: plan.name,
        dosage: plan.dosage,
        instruction: plan.instruction,
        status,
        statusLabel: DOSE_STATUS_LABEL[status],
        actionable: status !== 'taken' && status !== 'skipped',
      });
    }
  }
  return out.sort((a, b) => timeMinutes(a.time) - timeMinutes(b.time) || a.name.localeCompare(b.name));
}

export function buildMedicationStats(doses: MedicationDoseVM[]): MedicationStats {
  const total = doses.length;
  const taken = doses.filter((d) => d.status === 'taken').length;
  const skipped = doses.filter((d) => d.status === 'skipped').length;
  const pending = total - taken - skipped;
  const percent = total ? Math.round((taken / total) * 100) : 0;
  let summary = '今天还没有服药计划';
  if (total && pending === 0) summary = `今日 ${taken} 次已服用，${skipped} 次已跳过`;
  else if (total) summary = `今日 ${taken} / ${total} 次已完成`;
  return { total, taken, skipped, pending, percent, summary };
}

export function nextDoseText(doses: MedicationDoseVM[], now = new Date()): string {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const late = doses.find((d) => d.status === 'late');
  if (late) return `${late.name} ${late.time} 已超时，请按医嘱处理，勿自行加倍剂量`;
  const due = doses.find((d) => d.status === 'due');
  if (due) return `${due.name} ${due.time} 到点服药`;
  const upcoming = doses.find((d) => d.status === 'upcoming' && timeMinutes(d.time) >= nowMinutes);
  if (upcoming) return `下一次：${upcoming.time} · ${upcoming.name}`;
  if (doses.length) return '今天的计划已全部处理';
  return '添加药品后会在这里显示';
}

export function validateMedicationDraft(draft: MedicationDraft): string {
  const name = String(draft.name || '').trim();
  const dosage = String(draft.dosage || '').trim();
  const instruction = String(draft.instruction || '').trim();
  const times = normalizeTimes(draft.times || []);
  if (!name) return '请填写药品名称';
  if (name.length > 40) return '药品名称不超过 40 字';
  if (!dosage) return '请填写每次剂量';
  if (dosage.length > 40) return '剂量不超过 40 字';
  if (!instruction) return '请填写医嘱或服用说明';
  if (instruction.length > 80) return '服用说明不超过 80 字';
  if (times.length === 0) return '请至少添加一个服用时间';
  if (times.length > 6) return '每天最多设置 6 个时间';
  if (!validDate(draft.startDate)) return '请选择有效的开始日期';
  if (draft.endDate && !validDate(draft.endDate)) return '请选择有效的结束日期';
  if (draft.endDate && draft.endDate < draft.startDate) return '结束日期不能早于开始日期';
  if (!draft.agreed) return '请确认已按医生或药师说明填写';
  return '';
}

export function pruneMedicationLogs(logs: MedicationDoseLog[], day = dateKey(), keepDays = 90): MedicationDoseLog[] {
  const min = new Date(`${day}T00:00:00`);
  min.setDate(min.getDate() - keepDays);
  return logs.filter((item) => {
    const recorded = new Date(item.recordedAt);
    return Number.isFinite(recorded.getTime()) && recorded >= min;
  });
}

export function makeMedicationId(now = Date.now()): string {
  return `med_${now.toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function summarizeTimes(times: string[]): string {
  return normalizeTimes(times).join('、');
}

export function summarizeDateRange(plan: MedicationPlan): string {
  if (!plan.endDate) return `${plan.startDate} 起长期`;
  return `${plan.startDate} 至 ${plan.endDate}`;
}