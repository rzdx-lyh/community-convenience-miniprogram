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
 * ⚠ 110/119 目前后端 phonebook 种子只有 120，**必须保留本地兜底**
 * （后端已承诺补 `报警服务 110` / `消防火警 119` 两条种子，补完并确认后再评估是否撤掉）。
 */
export const LOCAL_EMERGENCY_CONTACTS: EmergencyContact[] = [
  { name: '110 报警', phone: '110', remark: '治安/人身安全' },
  { name: '119 火警', phone: '119', remark: '火灾/抢险救援' },
  { name: '120 急救', phone: '120', remark: '医疗急救' },
  {
    name: '社区居委会',
    phone: '020-88886666',
    remark: '政务/居委会（与后端 phonebook 种子一致）',
  },
  { name: '物业值班', phone: '020-88888888', remark: '24 小时值班（与后端种子一致）' },
  {
    name: '社区养老服务中心',
    phone: '020-88880000',
    remark: '助餐/助浴/上门陪护（lead Q3 批准的占位号）',
  },
];

export const EMERGENCY_FOOTER_TIP = '紧急情况请优先拨打 110/119/120';
