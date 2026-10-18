/**
 * 办事指南 · 视图模型（CR-026）
 *
 * 纯本地常量：事项清单来自社区公开办事口径，不上云、不建档。
 * 内容必须「可核对」：每项都给 材料 / 窗口 / 时限 / 跑几趟，不给模糊承诺。
 *
 * ⚠ 红线：底部固定「以窗口现场办理为准」提示；不出现任何具体金额与承诺性表述。
 */

export interface GuideItem {
  key: string;
  /** 事项名 */
  name: string;
  /** 所属分类（用于筛选 chip） */
  cat: string;
  /** 一句话说明 */
  desc: string;
  /** 所需材料 */
  materials: string[];
  /** 办理窗口 */
  window: string;
  /** 办理时限 */
  limit: string;
  /** 需要跑几趟 */
  trips: string;
  /** 常见退回原因（最容易被问到，写进详情页能少跑一趟） */
  pitfalls: string[];
}

export interface GuideVM {
  key: string;
  name: string;
  cat: string;
  desc: string;
  limit: string;
  trips: string;
}

export const GUIDE_CATS: string[] = ['全部', '证件办理', '补贴申领', '医疗医保', '公积金社保', '其他'];

export const GUIDE_ITEMS: GuideItem[] = [
  {
    key: 'residence',
    name: '居住证办理',
    cat: '证件办理',
    desc: '首次申领 / 续签，材料齐全当场受理',
    materials: ['本人身份证原件', '居住证明（租赁合同或房产证）', '近期一寸免冠照片 1 张'],
    window: '社区服务站 3 号窗口',
    limit: '受理后 5 个工作日可领',
    trips: '1 趟（受理）+ 1 趟（领证）',
    pitfalls: ['租赁合同需在有效期内', '照片须为近期白底一寸', '代办需加带代办人身份证与委托书'],
  },
  {
    key: 'elderly',
    name: '高龄补贴申领',
    cat: '补贴申领',
    desc: '年满 80 周岁可申请，按月发放',
    materials: ['本人身份证', '户口本', '本人银行卡（社保卡亦可）'],
    window: '社区服务站 1 号窗口',
    limit: '按月审核，次月发放',
    trips: '1 趟（可由家属代办）',
    pitfalls: ['银行卡必须为本人名下', '代办需委托书 + 代办人身份证', '户籍迁出本社区需重新申请'],
  },
  {
    key: 'medical',
    name: '医保参保登记',
    cat: '医疗医保',
    desc: '城乡居民医保参保 / 停保',
    materials: ['身份证', '户口本', '参保登记表（窗口领取）'],
    window: '社区服务站 2 号窗口',
    limit: '当场办结，次月生效',
    trips: '1 趟',
    pitfalls: ['每年集中参保期办理，逾期有等待期', '已在单位参保的不能重复登记'],
  },
  {
    key: 'doctor',
    name: '家庭医生签约',
    cat: '医疗医保',
    desc: '免费签约，享优先转诊与慢病随访',
    materials: ['身份证', '医保卡'],
    window: '社区卫生服务站一楼',
    limit: '当场签约，即时生效',
    trips: '1 趟',
    pitfalls: ['服务范围以签约机构为准', '签约后变更需先解约'],
  },
  {
    key: 'fund',
    name: '公积金提取咨询',
    cat: '公积金社保',
    desc: '租房 / 退休 / 购房提取的材料预审',
    materials: ['身份证', '提取申请表', '对应情形证明材料（合同 / 退休证 / 购房合同）'],
    window: '社区服务站 3 号窗口（只做预审，正式办理在公积金中心）',
    limit: '预审当场，正式提取 3 个工作日',
    trips: '1 趟预审 + 1 趟正式办理',
    pitfalls: ['本社区只做材料预审，不办理资金提取', '租房提取需合同在租赁备案有效期内'],
  },
  {
    key: 'birth',
    name: '出生证明补办',
    cat: '证件办理',
    desc: '《出生医学证明》遗失补办指引',
    materials: ['父母双方身份证', '户口本', '原签发机构出具的签发记录'],
    window: '社区服务站 3 号窗口（指引）→ 原签发医院',
    limit: '以原签发机构为准，一般 10 个工作日',
    trips: '2 趟',
    pitfalls: ['必须回原签发医院办理，社区无法直接补办', '需先在户籍地派出所出具未落户证明'],
  },
  {
    key: 'disability',
    name: '残疾人证办理',
    cat: '补贴申领',
    desc: '初次申领与等级评定流程',
    materials: ['身份证', '户口本', '二级以上医院诊断证明', '2 寸照片 2 张'],
    window: '社区服务站 1 号窗口（受理）→ 区残联（评定）',
    limit: '受理后 15 个工作日内完成评定',
    trips: '2 趟',
    pitfalls: ['诊断证明须为二级以上医院出具', '评定需本人到场'],
  },
  {
    key: 'water',
    name: '水费减免申请',
    cat: '其他',
    desc: '低保家庭可申请水费减免',
    materials: ['低保证', '身份证', '近期水费单据'],
    window: '社区服务站 1 号窗口',
    limit: '受理后 10 个工作日',
    trips: '1 趟',
    pitfalls: ['需低保证在有效期内', '减免自受理次月起算，不追溯'],
  },
];

/** 按分类筛选（'全部' 返回全量） */
export function filterGuide(cat: string, keyword = ''): GuideItem[] {
  const kw = String(keyword ?? '').trim();
  return GUIDE_ITEMS.filter((it) => {
    if (cat && cat !== '全部' && it.cat !== cat) return false;
    if (!kw) return true;
    return (
      it.name.indexOf(kw) >= 0 ||
      it.desc.indexOf(kw) >= 0 ||
      it.cat.indexOf(kw) >= 0 ||
      it.materials.some((m) => m.indexOf(kw) >= 0)
    );
  });
}

/** 事项 → 列表视图模型（只带卡片需要的字段，减少 setData 体积） */
export function toGuideVM(item: GuideItem): GuideVM {
  return {
    key: item.key,
    name: item.name,
    cat: item.cat,
    desc: item.desc,
    limit: item.limit,
    trips: item.trips,
  };
}

/** 按 key 找事项 */
export function findGuide(key: string): GuideItem | undefined {
  return GUIDE_ITEMS.find((i) => i.key === key);
}

/** 代办申请提交文案（走 workorder:create，与预约类服务同一结构） */
export function buildGuideOrderDescription(input: {
  matter: string;
  room: string;
  time: string;
  contact: string;
  note?: string;
}): string {
  return [
    `服务：政务事项代办（${input.matter}）`,
    `房号：${String(input.room ?? '').trim()}`,
    `联系电话：${String(input.contact ?? '').trim()}`,
    `期望时间：${input.time}`,
    input.note && input.note.trim() ? `备注：${input.note.trim()}` : '',
  ]
    .filter((line) => line !== '')
    .join('\n');
}
