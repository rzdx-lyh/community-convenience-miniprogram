/**
 * 健康档案 · 视图模型（CR-026）
 *
 * 数据来源：**纯本地**（Storage）。自测记录属于敏感个人信息，
 * 本项目不上传云端 —— 既不申请隐私接口，也不新增集合，合规成本为零。
 *
 * ⚠ 红线（与 CR-012 同源）：
 *   1. 指标解读只给**一般性参考**，任何异常都必须落到「就医 / 复测」，绝不给诊断结论；
 *   2. 文案里不得出现「确诊」「你患有」这类表述。
 */

export type RecordKind = 'bp' | 'glucose';

export interface HealthRecord {
  id: string;
  kind: RecordKind;
  /** 血压：收缩压 */
  sys: number;
  /** 血压：舒张压 */
  dia: number;
  /** 血糖 mmol/L */
  glucose: number;
  /** 记录时间文本 */
  timeText: string;
  /** 解读结论 */
  level: 'normal' | 'watch' | 'high';
  levelText: string;
  advice: string;
}

export interface InterpretResult {
  level: 'normal' | 'watch' | 'high';
  levelText: string;
  advice: string;
}

/**
 * 血压解读（家测口径：≥135/85 为偏高，≥140/90 为高）。
 * ⚠ 只给趋势判断与就医提示，不做诊断。
 */
export function interpretBp(sysRaw: number, diaRaw: number): InterpretResult {
  const sys = Number(sysRaw);
  const dia = Number(diaRaw);
  if (!Number.isFinite(sys) || !Number.isFinite(dia) || sys <= 0 || dia <= 0) {
    return { level: 'normal', levelText: '数据无效', advice: '请填写正确的收缩压与舒张压。' };
  }
  if (sys >= 140 || dia >= 90) {
    return {
      level: 'high',
      levelText: '偏高',
      advice: '安静休息 5 分钟后复测；连续 3 天同一时段仍偏高请到社区门诊就诊。若伴头痛、胸闷、视物模糊请立即就医。',
    };
  }
  if (sys >= 135 || dia >= 85) {
    return {
      level: 'watch',
      levelText: '临界',
      advice: '建议同一时段连测 3 天看趋势，少盐少油、规律作息。持续上升请到社区门诊咨询。',
    };
  }
  if (sys < 90 || dia < 60) {
    return {
      level: 'watch',
      levelText: '偏低',
      advice: '若有头晕乏力，起身慢一点、注意补水；频繁出现请到社区门诊咨询。',
    };
  }
  return { level: 'normal', levelText: '正常', advice: '保持在正常范围，建议每周固定时段测一次并记录。' };
}

/** 血糖解读（mmol/L，末梢血空腹/餐后 2 小时口径不同，这里按用户选的时段判断） */
export function interpretGlucose(valueRaw: number, when: 'fasting' | 'post' ): InterpretResult {
  const v = Number(valueRaw);
  if (!Number.isFinite(v) || v <= 0) {
    return { level: 'normal', levelText: '数据无效', advice: '请填写正确的血糖值。' };
  }
  if (when === 'fasting') {
    if (v >= 7.0) {
      return { level: 'high', levelText: '偏高', advice: '空腹血糖偏高，请尽快到社区门诊复查；勿自行调整用药。' };
    }
    if (v >= 6.1) {
      return { level: 'watch', levelText: '临界', advice: '处于临界范围，建议复查空腹血糖并关注饮食与运动。' };
    }
    return { level: 'normal', levelText: '正常', advice: '空腹血糖在正常范围，保持规律饮食与运动。' };
  }
  if (v >= 11.1) {
    return { level: 'high', levelText: '偏高', advice: '餐后血糖偏高，请到社区门诊复查；勿自行调整用药。' };
  }
  if (v >= 7.8) {
    return { level: 'watch', levelText: '临界', advice: '处于临界范围，建议减少精制主食、餐后适度走动后复查。' };
  }
  return { level: 'normal', levelText: '正常', advice: '餐后血糖在正常范围，保持现有饮食习惯。' };
}

/**
 * 生成记录 id（同一毫秒连点也不撞 wx:key）
 * 纯随机数会在大量连点时撞号（200 次约 9% 概率），故叠加一个自增序号兜底。
 */
let seq = 0;
export function makeRecordId(): string {
  seq = (seq + 1) % 100000;
  return `hr_${Date.now()}_${seq}`;
}

/** 档案卡：最近一条记录的一句话摘要（无记录时给引导，不留空白区） */
export function latestSummary(list: HealthRecord[]): string {
  if (list.length === 0) return '还没有自测记录，先记一条看看趋势';
  const bp = list.filter((r) => r.kind === 'bp')[0];
  const glu = list.filter((r) => r.kind === 'glucose')[0];
  const parts: string[] = [];
  if (bp) parts.push(`最近血压 ${bp.sys}/${bp.dia}（${bp.levelText}）`);
  if (glu) parts.push(`最近血糖 ${glu.glucose}（${glu.levelText}）`);
  return parts.join(' · ') || '还没有自测记录';
}

/** 家庭医生签约文案（走 workorder:create，与预约类服务同一结构） */
export function buildDoctorOrderDescription(input: {
  room: string;
  contact: string;
  note?: string;
}): string {
  return [
    '服务：家庭医生签约',
    `房号：${String(input.room ?? '').trim()}`,
    `联系电话：${String(input.contact ?? '').trim()}`,
    input.note && input.note.trim() ? `备注：${input.note.trim()}` : '',
  ]
    .filter((line) => line !== '')
    .join('\n');
}
