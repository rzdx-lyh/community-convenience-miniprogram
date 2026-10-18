/**
 * CR-026 · 缴费账单 / 健康档案 视图模型单测
 *
 * 重点守住两条红线（测试即文档，删测试等于删红线）：
 *   ① 缴费页不收款：账单模型里不存在任何支付字段；
 *   ② 健康页不诊断：解读文案不得出现「确诊 / 你患有 / 诊断」等结论性表述。
 */
import { describe, expect, it } from 'vitest';
import {
  BILL_KINDS,
  DEMO_BILLS,
  SEWAGE_UNIT_PRICE,
  buildBillOrderDescription,
  calcWaterFee,
  maskAccount,
  sumUnpaid,
  toBillVM,
} from '../miniprogram/pages/service/bill/viewmodel';
import {
  buildDoctorOrderDescription,
  interpretBp,
  interpretGlucose,
  latestSummary,
  makeRecordId,
  type HealthRecord,
} from '../miniprogram/pages/service/record/viewmodel';

describe('缴费账单 · 阶梯水费', () => {
  it('第一阶梯：15 吨 = 水费 39 + 污水 16.5', () => {
    const r = calcWaterFee(15);
    expect(r.usage).toBe(15);
    expect(r.tiers).toHaveLength(1);
    expect(r.tiers[0].amount).toBe(39);
    expect(r.sewage).toBe(16.5);
    expect(r.total).toBe(55.5);
  });

  it('跨阶梯：25 吨 = 20×2.6 + 5×3.9 + 污水 27.5', () => {
    const r = calcWaterFee(25);
    expect(r.tiers).toHaveLength(2);
    expect(r.tiers[0].amount).toBe(52);
    expect(r.tiers[1].amount).toBe(19.5);
    expect(r.sewage).toBe(27.5);
    expect(r.total).toBe(99);
  });

  it('第三阶梯：40 吨跨满三档', () => {
    const r = calcWaterFee(40);
    expect(r.tiers).toHaveLength(3);
    expect(r.tiers[2].usage).toBe(10);
    expect(r.tiers[2].amount).toBe(52);
  });

  it('非法用量按 0 处理，不产生 NaN', () => {
    [NaN, -5, 0].forEach((v) => {
      const r = calcWaterFee(v);
      expect(r.usage).toBe(0);
      expect(r.total).toBe(0);
      expect(Number.isNaN(r.total)).toBe(false);
    });
  });

  it('每档金额之和 + 污水 = 合计（对账不漂移）', () => {
    [1, 12, 20, 21, 33, 60].forEach((u) => {
      const r = calcWaterFee(u);
      const sum = r.tiers.reduce((s, t) => s + t.amount, 0) + r.sewage;
      expect(Math.abs(sum - r.total)).toBeLessThan(0.02);
    });
  });

  it('污水处理费单价常量与文案一致', () => {
    expect(SEWAGE_UNIT_PRICE).toBe(1.1);
  });
});

describe('缴费账单 · 列表与脱敏', () => {
  it('三种户号类型齐全，单位不同', () => {
    expect(BILL_KINDS.map((k) => k.key)).toEqual(['water', 'electric', 'gas']);
    expect(BILL_KINDS.map((k) => k.unit)).toEqual(['吨', '度', '立方米']);
  });

  it('同一账期有水电燃气三条 → id 必须唯一（wx:key 不能用 period）', () => {
    const ids = DEMO_BILLS.map(toBillVM).map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('待缴合计只累加未缴的', () => {
    const unpaid = DEMO_BILLS.filter((b) => !b.paid).reduce((s, b) => s + b.amount, 0);
    expect(sumUnpaid(DEMO_BILLS)).toBe(Math.round(unpaid * 100) / 100);
    expect(sumUnpaid([])).toBe(0);
  });

  it('户号脱敏只留末 4 位，短号原样返回', () => {
    expect(maskAccount('880012345678')).toBe('********5678');
    expect(maskAccount('123')).toBe('123');
    expect(maskAccount('')).toBe('');
  });

  it('绑定工单描述含户号与房号，且不含支付字样', () => {
    const text = buildBillOrderDescription({ kind: '水费', account: '88001234', room: '3-2-502' });
    expect(text).toContain('88001234');
    expect(text).toContain('3-2-502');
    expect(text).not.toMatch(/支付|收款|代扣/);
  });
});

describe('健康档案 · 血压解读', () => {
  it('140/90 及以上判偏高', () => {
    expect(interpretBp(140, 88).level).toBe('high');
    expect(interpretBp(138, 92).level).toBe('high');
  });

  it('135/85 临界区间判临界', () => {
    expect(interpretBp(136, 82).level).toBe('watch');
    expect(interpretBp(128, 86).level).toBe('watch');
  });

  it('90/60 以下判偏低（也是 watch，但文案不同）', () => {
    const r = interpretBp(85, 58);
    expect(r.level).toBe('watch');
    expect(r.levelText).toBe('偏低');
  });

  it('正常区间', () => {
    expect(interpretBp(120, 78).level).toBe('normal');
  });

  it('非法输入不给异常结论', () => {
    [NaN, 0, -1].forEach((v) => {
      expect(interpretBp(v, 80).levelText).toBe('数据无效');
    });
  });

  it('任何解读文案都不得出现诊断性表述', () => {
    const cases = [interpretBp(150, 95), interpretBp(136, 86), interpretBp(85, 55), interpretBp(120, 78)];
    cases.forEach((r) => {
      expect(r.advice).not.toMatch(/确诊|你患有|诊断|服药方案/);
    });
  });
});

describe('健康档案 · 血糖解读', () => {
  it('空腹 7.0 及以上偏高，6.1-7.0 临界', () => {
    expect(interpretGlucose(7.2, 'fasting').level).toBe('high');
    expect(interpretGlucose(6.5, 'fasting').level).toBe('watch');
    expect(interpretGlucose(5.6, 'fasting').level).toBe('normal');
  });

  it('餐后 11.1 及以上偏高，7.8-11.1 临界', () => {
    expect(interpretGlucose(12, 'post').level).toBe('high');
    expect(interpretGlucose(8.5, 'post').level).toBe('watch');
    expect(interpretGlucose(6.9, 'post').level).toBe('normal');
  });

  it('同一数值在空腹/餐后口径下结论不同（时段必须参与判断）', () => {
    expect(interpretGlucose(7.0, 'fasting').level).toBe('high');
    expect(interpretGlucose(7.0, 'post').level).toBe('normal');
  });

  it('异常文案引导就医/复查，不做诊断', () => {
    const r = interpretGlucose(8, 'fasting');
    expect(r.advice).toContain('复查');
    expect(r.advice).not.toMatch(/确诊|你患有/);
  });
});

describe('健康档案 · 记录与摘要', () => {
  const mk = (over: Partial<HealthRecord>): HealthRecord => ({
    id: makeRecordId(),
    kind: 'bp',
    sys: 120,
    dia: 78,
    glucose: 0,
    timeText: '2026-10-18 09:00',
    level: 'normal',
    levelText: '正常',
    advice: '保持',
    ...over,
  });

  it('id 不重复（同毫秒连点也不撞 wx:key）', () => {
    const ids = new Set(Array.from({ length: 200 }, () => makeRecordId()));
    expect(ids.size).toBe(200);
  });

  it('空列表给引导文案，不留空白区', () => {
    expect(latestSummary([])).toContain('还没有');
  });

  it('摘要取每类各一条，最多两句', () => {
    const list = [mk({ kind: 'glucose', glucose: 6.2, levelText: '正常' }), mk({})];
    const s = latestSummary(list);
    expect(s).toContain('最近血压');
    expect(s).toContain('最近血糖');
  });

  it('签约工单描述含房号与电话，且声明不上传自测记录', () => {
    const text = buildDoctorOrderDescription({ room: '3-2-502', contact: '13800138000', note: '有高血压老人' });
    expect(text).toContain('3-2-502');
    expect(text).toContain('13800138000');
    expect(text).toContain('家庭医生签约');
  });
});
