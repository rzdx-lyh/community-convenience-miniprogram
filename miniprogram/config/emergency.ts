/**
 * 紧急求助面板 · 本地兜底号码（FE-11）
 * 设计预览 §9-4：号码优先来自 phonebook:list（分类 emergency/property），
 * 无接口或断网时用本地常量兜底，保证「紧急求助」任何情况下都能拨出。
 */
export interface EmergencyContact {
  name: string;
  phone: string;
  /** 展示用备注 */
  remark: string;
}

/**
 * ⚠ 断网/接口失败保命用，**必须保留本地兜底**（首页紧急求助面板首屏就渲染这份常量）。
 * 号码已与后端 phonebook 种子（scripts/seed-data.json pb-1…pb-11）同源核对：
 *   110 / 119 / 120 / 居委会 020-88886666 / 物业 020-88888888 / 养老中心 020-88880000。
 * 后端种子现已补齐 110（报警求助）与 119（火警），首页按 phone 去重合并且以接口数据为准，
 * 断网时才回落到本常量。⚠ 号码若变更必须同步 seeds 与 miniprogram/mock/data.ts。
 */
/**
 * ⚠ 名称与后端 phonebook 种子**逐字一致**（seed：报警求助 / 火警 / 急救中心 /
 * 社区居委会 / 物业服务中心 / 社区养老服务中心）。
 * 原因：同一条目断网显示「110 报警」、联网显示「报警求助」会被一眼看出不一致。
 */
export const LOCAL_EMERGENCY_CONTACTS: EmergencyContact[] = [
  { name: '报警求助', phone: '110', remark: '治安/人身安全' },
  { name: '火警', phone: '119', remark: '火灾/抢险救援' },
  { name: '急救中心', phone: '120', remark: '医疗急救' },
  {
    name: '社区居委会',
    phone: '020-88886666',
    remark: '政务/居委会（与后端 phonebook 种子一致）',
  },
  { name: '物业服务中心', phone: '020-88888888', remark: '24 小时值班（与后端种子一致）' },
  {
    name: '社区养老服务中心',
    phone: '020-88880000',
    remark: '助餐/助浴/上门陪护（lead Q3 批准的占位号）',
  },
];

export const EMERGENCY_FOOTER_TIP = '紧急情况请优先拨打 110/119/120';
