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

export const LOCAL_EMERGENCY_CONTACTS: EmergencyContact[] = [
  { name: '110 报警', phone: '110', remark: '治安/人身安全' },
  { name: '119 火警', phone: '119', remark: '火灾/抢险救援' },
  { name: '120 急救', phone: '120', remark: '医疗急救' },
  { name: '社区居委会值班', phone: '020-87650001', remark: '工作日 9:00-18:00' },
  { name: '物业值班', phone: '020-87650002', remark: '24 小时值班' },
];

export const EMERGENCY_FOOTER_TIP = '紧急情况请优先拨打 110/119/120';
