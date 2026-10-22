/**
 * 文化便民活动页 · 视图模型（2026-10-23）
 *
 * 每周义诊 / 邻里活动 / 长者手机课 三个入口共用一页，按 type 切换配置。
 * 只做活动介绍与报名登记；报名走既有 `workorder:create`，不新增接口。
 * 义诊页不提供诊断，指标问题引导到卫生服务站，紧急情况提示 120。
 */

export type ActivityType = 'clinic' | 'neighbor' | 'phone';

export interface ActivityFeature {
  icon: string;
  name: string;
  desc: string;
}

export interface ActivityConfig {
  type: ActivityType;
  title: string;
  badge: string;
  subtitle: string;
  date: string;
  place: string;
  target: string;
  features: ActivityFeature[];
  options: string[];
  notes: string[];
}

export const ACTIVITY_CONFIGS: Record<ActivityType, ActivityConfig> = {
  clinic: {
    type: 'clinic',
    title: '每周义诊',
    badge: '公益 · 免费',
    subtitle: '测血压血糖 · 中医问诊 · 健康档案登记',
    date: '每周六 9:00-11:30',
    place: '社区广场（雨天改社区活动室）',
    target: '社区居民，60 岁以上老人优先',
    features: [
      { icon: 'droplet', name: '测血压', desc: '现场测量并记录' },
      { icon: 'syringe', name: '测血糖', desc: '需空腹，限前 50 名' },
      { icon: 'stetho', name: '中医问诊', desc: '把脉、体质咨询' },
      { icon: 'pill', name: '用药咨询', desc: '带药盒，药师答疑' },
      { icon: 'clipboard', name: '健康档案', desc: '现场建档/更新' },
      { icon: 'doctor', name: '家医签约', desc: '家庭医生咨询' },
    ],
    options: ['测血压', '测血糖', '中医问诊', '用药咨询', '健康档案'],
    notes: [
      '测血糖请空腹前往；测血压前静坐 5 分钟。',
      '请携带身份证/医保卡和正在服用的药盒。',
      '义诊只做健康咨询，不替代医院诊断；胸痛、呼吸困难等紧急情况请直接拨打 120。',
    ],
  },
  neighbor: {
    type: 'neighbor',
    title: '邻里活动',
    badge: '本周活动',
    subtitle: '手工坊 · 读书会 · 邻里互助 · 亲子活动',
    date: '每周日 15:00-17:00',
    place: '社区活动室 / 社区广场',
    target: '全体居民，可带家人参加',
    features: [
      { icon: 'calendar', name: '本周排期', desc: '看活动日历' },
      { icon: 'handshake', name: '报名参加', desc: '名额有限，先到先得' },
      { icon: 'megaphone', name: '发起活动', desc: '约邻居一起玩' },
      { icon: 'building', name: '场地预约', desc: '活动室/广场' },
      { icon: 'book', name: '活动回顾', desc: '往期照片与小结' },
      { icon: 'users', name: '邻里互助', desc: '搭把手、借东西' },
    ],
    options: ['手工坊', '读书会', '亲子活动', '邻里互助', '其他'],
    notes: [
      '活动免费；材料由社区提供或按活动说明自备。',
      '带儿童参加请家长全程看护。',
      '发起活动请在报名备注里写清时间、地点、人数。',
    ],
  },
  phone: {
    type: 'phone',
    title: '长者手机课',
    badge: '免费 · 小班',
    subtitle: '微信挂号 · 查报告 · 防诈骗 · 手机基础',
    date: '每周四 14:00-15:30',
    place: '社区活动室（二楼）',
    target: '55 岁以上居民，零基础可参加',
    features: [
      { icon: 'phone', name: '基础班', desc: '字体/音量/拍照' },
      { icon: 'chat', name: '微信基础', desc: '加好友/发语音' },
      { icon: 'hospital', name: '预约挂号', desc: '手机挂号/查报告' },
      { icon: 'lock', name: '防诈骗', desc: '陌生链接/转账' },
      { icon: 'handshake', name: '一对一辅导', desc: '志愿者协助' },
      { icon: 'book', name: '课程表', desc: '本期课程安排' },
    ],
    options: ['基础班', '进阶班', '预约挂号', '防诈骗'],
    notes: [
      '自带手机，提前充好电；现场有志愿者一对一协助。',
      '课程不涉及任何转账操作，不会索要验证码。',
      '名额有限，报名后请按时参加；连续两次缺席将释放名额。',
    ],
  },
};

/** 入参归一化：非法/缺失回退到义诊 */
export function normalizeActivityType(input?: string): ActivityType {
  const value = String(input ?? '').trim().toLowerCase();
  return (['clinic', 'neighbor', 'phone'] as ActivityType[]).indexOf(value as ActivityType) >= 0
    ? (value as ActivityType)
    : 'clinic';
}

/** 报名工单描述（结构化，便于社区工作人员处理） */
export function buildActivityOrderDescription(
  config: ActivityConfig,
  input: { option?: string; room?: string; contact?: string; note?: string },
): string {
  return [
    `活动：${config.title}`,
    input.option ? `项目：${input.option}` : '',
    input.room ? `房号：${String(input.room).trim()}` : '',
    input.contact ? `联系方式：${String(input.contact).trim()}` : '',
    input.note ? `备注：${String(input.note).trim()}` : '',
    `时间：${config.date}`,
    `地点：${config.place}`,
  ]
    .filter((line) => line !== '')
    .join('\n');
}
