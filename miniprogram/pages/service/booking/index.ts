/**
 * 社区门诊取号（CR-028）
 *
 * 科室 → 医生 → 时段 → 取号成功（号码 / 前面等待人数 / 预计分钟）。
 * 纯前端取号（本地生成号码），不新增接口；实际叫号以卫生服务站现场为准。
 */
import { track, trackPageView } from '../../../utils/logger';
import { toast } from '../../../utils/ui';

const info = wx.getWindowInfo();

interface DeptVM {
  name: string;
  icon: string;
}

interface DoctorVM {
  name: string;
  title: string;
  queue: string;
}

const DEPTS: DeptVM[] = [
  { name: '全科', icon: 'stetho' },
  { name: '内科', icon: 'heart' },
  { name: '儿科', icon: 'child' },
  { name: '中医', icon: 'leaf' },
  { name: '口腔', icon: 'pill' },
  { name: '护理', icon: 'nurse' },
];

const DOCTORS: Record<string, DoctorVM[]> = {
  全科: [
    { name: '李医生', title: '全科主治 · 1 诊室', queue: '前面 2 人' },
    { name: '王医生', title: '全科医师 · 2 诊室', queue: '前面 5 人' },
  ],
  内科: [
    { name: '陈医生', title: '内科主治 · 3 诊室', queue: '前面 1 人' },
    { name: '周医生', title: '内科医师 · 3 诊室', queue: '前面 4 人' },
  ],
  儿科: [
    { name: '赵医生', title: '儿科主治 · 4 诊室', queue: '前面 3 人' },
    { name: '孙医生', title: '儿科医师 · 4 诊室', queue: '前面 6 人' },
  ],
  中医: [
    { name: '吴医生', title: '中医主治 · 5 诊室', queue: '前面 2 人' },
  ],
  口腔: [
    { name: '郑医生', title: '口腔医师 · 6 诊室', queue: '前面 4 人' },
  ],
  护理: [
    { name: '护理站', title: '换药 / 注射 · 1 层', queue: '前面 0 人' },
  ],
};

const SLOTS = [
  { name: '09:00-10:00', off: false },
  { name: '10:00-11:00', off: true },
  { name: '11:00-12:00', off: false },
  { name: '14:00-15:00', off: false },
  { name: '15:00-16:00', off: false },
  { name: '16:00-17:00', off: false },
];

function makeNo(): string {
  return `A${Math.floor(Math.random() * 90) + 10}`;
}

Page({
  data: {
    statusBarHeight: info.statusBarHeight,
    depts: DEPTS,
    dept: '',
    doctors: [] as DoctorVM[],
    doctor: '',
    slots: SLOTS,
    slot: '',

    taken: false,
    no: '',
    prev: 0,
    waitMin: 0,
    slotText: '',

    canTake: false,
    btnText: '请先选科室',
  },

  onLoad(): void {
    trackPageView('pages/service/booking/index');
  },

  goBack(): void {
    if (getCurrentPages().length > 1) {
      wx.navigateBack();
      return;
    }
    wx.switchTab({ url: '/pages/index/index' });
  },

  onDept(e: WechatMiniprogram.TouchEvent): void {
    const v = String((e.currentTarget.dataset as { v?: string }).v ?? '');
    if (!v || v === this.data.dept) return;
    track('btn_click', { page: 'booking', target: 'dept', kind: v });
    this.setData({ dept: v, doctors: DOCTORS[v] ?? [], doctor: '', slot: '' });
    this.sync();
  },

  onDoctor(e: WechatMiniprogram.TouchEvent): void {
    const v = String((e.currentTarget.dataset as { v?: string }).v ?? '');
    if (!v) return;
    this.setData({ doctor: v });
    this.sync();
  },

  onSlot(e: WechatMiniprogram.TouchEvent): void {
    const v = String((e.currentTarget.dataset as { v?: string }).v ?? '');
    if (!v) return;
    const hit = SLOTS.find((s) => s.name === v);
    if (hit && hit.off) {
      toast('该时段已约满，请选其他时段');
      return;
    }
    this.setData({ slot: v });
    this.sync();
  },

  /** 按钮文案随缺失项变化，避免用户点了没反应还不知道缺什么 */
  sync(): void {
    const { dept, doctor, slot } = this.data;
    const canTake = !!dept && !!doctor && !!slot;
    this.setData({
      canTake,
      btnText: !dept ? '请先选科室' : !doctor ? '请先选医生' : !slot ? '请先选时段' : '确认取号',
    });
  },

  onTake(): void {
    if (!this.data.canTake) {
      toast(this.data.btnText);
      return;
    }
    const prev = 3;
    const no = makeNo();
    track('btn_click', { page: 'booking', target: 'take', kind: this.data.dept });
    this.setData({
      taken: true,
      no,
      prev,
      waitMin: prev * 6,
      slotText: this.data.slot,
    });
  },

  onReset(): void {
    this.setData({ taken: false, no: '', prev: 0, waitMin: 0, slot: '', slotText: '' });
    this.sync();
  },

  noop(): void {
    /* noop */
  },
});
