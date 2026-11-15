import { describe, expect, it } from 'vitest';
import {
  buildMedicationStats,
  buildTodayDoses,
  dateKey,
  nextDoseText,
  normalizeTimes,
  planActiveOn,
  pruneMedicationLogs,
  validateMedicationDraft,
  type MedicationDoseLog,
  type MedicationPlan,
} from '../miniprogram/pages/service/medication/viewmodel';

function plan(patch: Partial<MedicationPlan> = {}): MedicationPlan {
  return {
    id: 'med-1',
    name: '二甲双胍片',
    dosage: '1 片',
    instruction: '早餐后服用，按医生处方',
    times: ['08:00', '20:00'],
    startDate: '2026-11-01',
    endDate: '',
    enabled: true,
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
    ...patch,
  };
}

describe('助药提醒视图模型', () => {
  it('日期与时间会标准化去重并排序', () => {
    expect(dateKey(new Date(2026, 10, 16))).toBe('2026-11-16');
    expect(normalizeTimes(['20:00', '08:00', '08:00'])).toEqual(['08:00', '20:00']);
  });

  it('停用、未开始和已结束计划不会进入今日清单', () => {
    expect(planActiveOn(plan(), '2026-11-16')).toBe(true);
    expect(planActiveOn(plan({ enabled: false }), '2026-11-16')).toBe(false);
    expect(planActiveOn(plan({ startDate: '2026-11-17' }), '2026-11-16')).toBe(false);
    expect(planActiveOn(plan({ endDate: '2026-11-15' }), '2026-11-16')).toBe(false);
  });

  it('按时段生成待服、到点、超时、已服和跳过状态', () => {
    const logs: MedicationDoseLog[] = [
      { key: 'med-1|2026-11-16|08:00', status: 'taken', recordedAt: '2026-11-16T08:01:00+08:00' },
      { key: 'med-1|2026-11-16|20:00', status: 'skipped', recordedAt: '2026-11-16T20:02:00+08:00' },
    ];
    const rows = buildTodayDoses(
      [plan({ times: ['07:00', '09:30', '08:00', '20:00'] })],
      logs,
      '2026-11-16',
      new Date(2026, 10, 16, 9, 20),
    );
    expect(rows.map((row) => [row.time, row.status])).toEqual([
      ['07:00', 'late'],
      ['08:00', 'taken'],
      ['09:30', 'upcoming'],
      ['20:00', 'skipped'],
    ]);
  });

  it('统计今日完成比例和剩余次数', () => {
    const rows = buildTodayDoses(
      [plan({ times: ['08:00', '09:00', '20:00'] })],
      [{ key: 'med-1|2026-11-16|08:00', status: 'taken', recordedAt: '2026-11-16T08:01:00+08:00' }],
      '2026-11-16',
      new Date(2026, 10, 16, 8, 5),
    );
    const stats = buildMedicationStats(rows);
    expect(stats.total).toBe(3);
    expect(stats.taken).toBe(1);
    expect(stats.pending).toBe(2);
    expect(stats.percent).toBe(33);
    expect(stats.summary).toContain('1 / 3');
  });

  it('下一提醒优先提示超时且明确禁止自行加倍', () => {
    const rows = buildTodayDoses(
      [plan({ times: ['07:00', '09:00'] })],
      [],
      '2026-11-16',
      new Date(2026, 10, 16, 10, 0),
    );
    const text = nextDoseText(rows, new Date(2026, 10, 16, 10, 0));
    expect(text).toContain('已超时');
    expect(text).toContain('勿自行加倍剂量');
  });

  it('表单缺少药品、剂量、医嘱或同意时必须阻止保存', () => {
    const base = {
      name: '药名',
      dosage: '1 片',
      instruction: '按处方',
      times: ['08:00'],
      startDate: '2026-11-16',
      endDate: '',
      agreed: true,
    };
    expect(validateMedicationDraft(base)).toBe('');
    expect(validateMedicationDraft({ ...base, name: '' })).toContain('药品名称');
    expect(validateMedicationDraft({ ...base, dosage: '' })).toContain('剂量');
    expect(validateMedicationDraft({ ...base, instruction: '' })).toContain('医嘱');
    expect(validateMedicationDraft({ ...base, agreed: false })).toContain('确认');
  });

  it('结束日期不能早于开始日期', () => {
    const error = validateMedicationDraft({
      name: '药名', dosage: '1 片', instruction: '按处方', times: ['08:00'],
      startDate: '2026-11-16', endDate: '2026-11-15', agreed: true,
    });
    expect(error).toContain('结束日期');
  });

  it('只保留最近 90 天的服药打卡', () => {
    const old = new Date(2026, 6, 1).toISOString();
    const recent = new Date(2026, 10, 15).toISOString();
    const rows = pruneMedicationLogs([
      { key: 'old', status: 'taken', recordedAt: old },
      { key: 'new', status: 'taken', recordedAt: recent },
    ], '2026-11-16', 90);
    expect(rows.map((row) => row.key)).toEqual(['new']);
  });
});