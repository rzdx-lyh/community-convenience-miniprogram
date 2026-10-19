/**
 * 健康服务 · 视图模型（CR-027）
 *
 * 4 个子频道：疫苗预约 / 体检报告代取 / 慢性病咨询 / 健康报告。
 * 数据本地配置；预约与申请都走既有 `workorder:create`，不新增云函数、不改契约。
 *
 * ⚠ 红线（与 CR-012 / CR-026 同源）：
 *   1. **不做诊断**：只给办事口径（带什么材料、去哪办、多久），不给诊疗结论；
 *   2. **不替代医嘱**：任何涉及指标的页面都必须提示「以医生诊断为准」；
 *   3. 疫苗 / 体检这类**个人信息**，登记后由线下核对，本页不展示他人记录。
 */

export type HealthTab = 'vaccine' | 'report' | 'chronic' | 'annual';

export const HEALTH_TABS: Array<{ key: HealthTab; name: string; note: string }> = [
  { key: 'vaccine', name: '疫苗预约', note: '社区卫生服务站 · 儿童/成人/流感' },
  { key: 'report', name: '体检报告代取', note: '行动不便可申请上门代取' },
  { key: 'chronic', name: '慢性病咨询', note: '高血压 / 糖尿病 · 需带病历与用药清单' },
  { key: 'annual', name: '健康报告', note: '65 岁以上年度免费体检 · 报告汇总' },
];

export interface HealthItem {
  id: string;
  name: string;
  /** 适用对象 */
  target: string;
  /** 需要带的材料 */
  materials: string;
  /** 办理地点 / 窗口 */
  place: string;
  /** 时间或时限 */
  time: string;
  /** 注意事项 */
  tips: string;
}

/** 疫苗 */
export const VACCINE_ITEMS: HealthItem[] = [
  {
    id: 'v1',
    name: '流感疫苗',
    target: '6 月龄以上，老人与慢性病患者优先',
    materials: '身份证 / 医保卡；儿童带《预防接种证》',
    place: '社区卫生服务站 2 楼预防接种门诊',
    time: '周一至周五 8:30-11:30、14:00-16:30',
    tips: '发热或急性病发作期请延后；接种后留观 30 分钟',
  },
  {
    id: 'v2',
    name: '儿童常规疫苗',
    target: '0-6 岁（按免疫程序）',
    materials: '《预防接种证》+ 监护人身份证',
    place: '社区卫生服务站 2 楼预防接种门诊',
    time: '周二、周四 8:30-11:30',
    tips: '漏种的可以补种，带接种证让医生排补种计划',
  },
  {
    id: 'v3',
    name: '成人乙肝疫苗',
    target: '未接种或无抗体者',
    materials: '身份证；有化验单的带上',
    place: '社区卫生服务站 2 楼预防接种门诊',
    time: '周三 8:30-11:30',
    tips: '共 3 针（0、1、6 月），预约时说明是第几针',
  },
  {
    id: 'v4',
    name: '老年人肺炎疫苗',
    target: '60 岁以上本市户籍',
    materials: '身份证 / 老年卡',
    place: '社区卫生服务站 2 楼预防接种门诊',
    time: '周五 8:30-11:30',
    tips: '部分人群可免费，现场确认资格后安排',
  },
];

/** 体检报告代取 */
export const REPORT_STEPS: Array<{ step: string; text: string }> = [
  { step: '1', text: '在本页提交代取申请，填楼栋房号与联系电话' },
  { step: '2', text: '工作人员电话核实身份（需报本人姓名与身份证后 4 位）' },
  { step: '3', text: '到院代取后送到驿站或上门，当面签收' },
];

export const REPORT_ITEMS: HealthItem[] = [
  {
    id: 'r1',
    name: '门诊化验报告代取',
    target: '本人行动不便 / 在外地',
    materials: '本人身份证号后 4 位 + 就诊卡号；代取人身份证',
    place: '社区卫生服务站 1 楼检验科',
    time: '工作日 10:00 前提交，当日可取',
    tips: '涉及隐私的结果一律密封交付，工作人员不拆阅',
  },
  {
    id: 'r2',
    name: '年度体检报告代取',
    target: '65 岁以上已完成免费体检',
    materials: '本人身份证后 4 位 + 体检编号',
    place: '社区卫生服务站 3 楼健康管理科',
    time: '体检后 7 个工作日出报告',
    tips: '报告可一并申请医生电话解读，在备注里写「需要解读」',
  },
];

/** 慢性病咨询 */
export const CHRONIC_ITEMS: HealthItem[] = [
  {
    id: 'c1',
    name: '高血压随访咨询',
    target: '已确诊高血压、需调整用药或随访',
    materials: '近期血压记录 + 正在吃的药盒或清单',
    place: '社区卫生服务站 3 楼慢病管理门诊',
    time: '周一、周三 8:30-11:30',
    tips: '带上「健康档案」页记录的血压曲线，医生看得更快',
  },
  {
    id: 'c2',
    name: '糖尿病随访咨询',
    target: '已确诊糖尿病、需调糖或并发症筛查',
    materials: '空腹 / 餐后血糖记录 + 用药清单',
    place: '社区卫生服务站 3 楼慢病管理门诊',
    time: '周二、周四 8:30-11:30',
    tips: '当天需空腹抽血的，请预约上午并别吃早餐',
  },
  {
    id: 'c3',
    name: '冠心病 / 高血脂咨询',
    target: '需复查血脂、调整他汀类用药',
    materials: '最近一次血脂化验单 + 用药清单',
    place: '社区卫生服务站 3 楼慢病管理门诊',
    time: '周五 8:30-11:30',
    tips: '复查血脂需空腹 8-12 小时',
  },
];

/** 健康报告（年度免费体检） */
export const ANNUAL_INFO: Array<{ label: string; value: string }> = [
  { label: '免费对象', value: '65 岁以上常住居民（每年 1 次）' },
  { label: '体检项目', value: '一般体格检查、血常规、尿常规、肝肾功能、血脂、血糖、心电图、B 超' },
  { label: '集中时间', value: '每年 4-6 月，具体排期见社区公告' },
  { label: '预约方式', value: '本页提交预约，或到党群服务中心 201 现场登记' },
  { label: '报告领取', value: '体检后 7 个工作日出报告，可申请代取或上门送达' },
  { label: '温馨提示', value: '体检当天空腹，带身份证与医保卡；高血压患者可少量温水送服降压药' },
];

export function itemsOf(tab: HealthTab): HealthItem[] {
  switch (tab) {
    case 'report':
      return REPORT_ITEMS;
    case 'chronic':
      return CHRONIC_ITEMS;
    default:
      return VACCINE_ITEMS;
  }
}

export function findHealthItem(tab: HealthTab, id: string): HealthItem | undefined {
  return itemsOf(tab).find((i) => i.id === id);
}

/** 预约 / 申请工单描述（走 workorder:create） */
export function buildHealthOrderDescription(input: {
  tabName: string;
  name: string;
  room: string;
  contact: string;
  slot?: string;
  note?: string;
}): string {
  return [
    `服务：${input.tabName} · ${input.name}`,
    `楼栋房号：${String(input.room ?? '').trim()}`,
    `联系电话：${String(input.contact ?? '').trim()}`,
    input.slot && input.slot.trim() ? `期望时段：${input.slot.trim()}` : '',
    input.note && input.note.trim() ? `备注：${input.note.trim()}` : '',
    '说明：本页只做预约登记，不做诊断；具体安排以工作人员电话确认为准。',
  ]
    .filter((line) => line !== '')
    .join('\n');
}
