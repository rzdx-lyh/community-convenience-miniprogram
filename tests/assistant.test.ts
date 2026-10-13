/**
 * FE-2 AI 助手页纯函数单测（含 CR-012 安全话术降级行为）
 *
 * 背景：降级气泡原本写死「这个问题我没查到…」，会把服务端返回的安全话术吞掉
 * （用户问「胸痛怎么办」，后端回「请尽快就医或拨打 120」，界面却说没查到）。
 * 本文件把 `toDegradedTip` / `buildAiBubble` 的行为钉死，防止再被覆盖。
 *
 * 页面模块在 Node 下加载需要 Page / Component / wx 三个全局桩，故先桩后动态 import。
 */
import { beforeAll, describe, expect, it } from 'vitest';

type AssistantModule = typeof import('../miniprogram/pages/assistant/index');

const TIP_NOT_FOUND = '这个问题我没查到，你可以直接打电话问';
const TIP_SAFETY = '以上为安全提示，社区无法提供专业医疗或法律意见';

let mod: AssistantModule;

beforeAll(async () => {
  const g = globalThis as unknown as Record<string, unknown>;
  g.Page = () => ({});
  g.Component = () => ({});
  g.App = () => ({});
  g.wx = {
    showToast: () => undefined,
    showLoading: () => undefined,
    hideLoading: () => undefined,
    showModal: () => undefined,
    setClipboardData: () => undefined,
    navigateTo: () => undefined,
    navigateBack: () => undefined,
    switchTab: () => undefined,
    getStorageSync: () => '',
    setStorageSync: () => undefined,
    removeStorageSync: () => undefined,
    getWindowInfo: () => ({ statusBarHeight: 20 }),
    cloud: { init: () => undefined, callFunction: () => undefined },
  };
  mod = await import('../miniprogram/pages/assistant/index');
});

describe('normalizePresetQuestion · 预设提问（FE-13 只填充不发送）', () => {
  it('去首尾空白', () => {
    expect(mod.normalizePresetQuestion('  物业费怎么交？  ')).toBe('物业费怎么交？');
    expect(mod.normalizePresetQuestion('\n\t 停水通知在哪看 \n')).toBe('停水通知在哪看');
  });

  it('超过 300 字截断到正好 300（契约输入护栏上限）', () => {
    const long = '问'.repeat(301);
    const out = mod.normalizePresetQuestion(long);
    expect(out).toHaveLength(300);
    expect(out).toBe('问'.repeat(300));
  });

  it('正好 300 字不截断', () => {
    const exact = '问'.repeat(300);
    expect(mod.normalizePresetQuestion(exact)).toHaveLength(300);
  });

  it('undefined / null / 空串 → 空串', () => {
    expect(mod.normalizePresetQuestion(undefined)).toBe('');
    expect(mod.normalizePresetQuestion(null as unknown as string)).toBe('');
    expect(mod.normalizePresetQuestion('')).toBe('');
    expect(mod.normalizePresetQuestion('   ')).toBe('');
  });
});

describe('toDegradedTip · CR-012 安全话术判定', () => {
  it('none / undefined / 空串 → 「没查到」文案', () => {
    expect(mod.toDegradedTip('none')).toBe(TIP_NOT_FOUND);
    expect(mod.toDegradedTip(undefined)).toBe(TIP_NOT_FOUND);
    expect(mod.toDegradedTip('')).toBe(TIP_NOT_FOUND);
  });

  it('medical / legal / emergency → 安全提示文案（不能再说「没查到」）', () => {
    expect(mod.toDegradedTip('medical')).toBe(TIP_SAFETY);
    expect(mod.toDegradedTip('legal')).toBe(TIP_SAFETY);
    expect(mod.toDegradedTip('emergency')).toBe(TIP_SAFETY);
  });

  it('安全提示与「没查到」必须是两条不同文案', () => {
    expect(mod.toDegradedTip('medical')).not.toBe(mod.toDegradedTip('none'));
  });
});

describe('buildUserBubble · 用户气泡', () => {
  it('字段固定：role=user / sources 空 / answerId 空 / degradedTip 空 / text 原样', () => {
    const bubble = mod.buildUserBubble('物业费怎么交？');
    expect(bubble.role).toBe('user');
    expect(bubble.text).toBe('物业费怎么交？');
    expect(bubble.sources).toEqual([]);
    expect(bubble.answerId).toBe('');
    expect(bubble.degradedTip).toBe('');
    expect(bubble.degraded).toBe(false);
    expect(bubble.useful).toBeNull();
  });

  it('多次调用 id 不重复（wx:key 需要稳定唯一 key）', () => {
    const a = mod.buildUserBubble('第一句');
    const b = mod.buildUserBubble('第二句');
    expect(a.id).not.toBe(b.id);
  });
});

describe('buildAiBubble · AI 气泡与降级引导', () => {
  it('未降级：degradedTip 为空串（wxml 据此不渲染引导卡）', () => {
    const bubble = mod.buildAiBubble('物业费可在物业中心缴纳', ['办事指南'], false, 'a_1');
    expect(bubble.role).toBe('ai');
    expect(bubble.degraded).toBe(false);
    expect(bubble.degradedTip).toBe('');
    expect(bubble.sources).toEqual(['办事指南']);
    expect(bubble.answerId).toBe('a_1');
  });

  it('降级 + riskLevel=medical → 安全提示文案', () => {
    const bubble = mod.buildAiBubble('请尽快就医或拨打 120', [], true, 'a_2', 'medical');
    expect(bubble.degraded).toBe(true);
    expect(bubble.degradedTip).toBe(TIP_SAFETY);
  });

  it('降级 + riskLevel 省略 → 「没查到」文案', () => {
    const bubble = mod.buildAiBubble('暂时无法回答', [], true, 'a_3');
    expect(bubble.degraded).toBe(true);
    expect(bubble.degradedTip).toBe(TIP_NOT_FOUND);
  });

  it('降级 + riskLevel=none → 「没查到」文案', () => {
    const bubble = mod.buildAiBubble('暂时无法回答', [], true, 'a_4', 'none');
    expect(bubble.degradedTip).toBe(TIP_NOT_FOUND);
  });

  it('CR-012 回归护栏：降级时 answer 原文必须原样保留，不能被引导卡文案吞掉', () => {
    const answer = '请尽快就医或拨打 120';
    const bubble = mod.buildAiBubble(answer, [], true, 'a_5', 'medical');
    expect(bubble.text).toBe(answer);
    expect(bubble.text).not.toBe(bubble.degradedTip);
  });

  it('sources / answerId 原样透传；sources 缺失兜底为空数组', () => {
    const sources = ['物业电话', '办事指南'];
    const bubble = mod.buildAiBubble('答案', sources, false, 'a_6');
    expect(bubble.sources).toEqual(sources);
    expect(bubble.answerId).toBe('a_6');
    expect(mod.buildAiBubble('答案', undefined as unknown as string[], false, '').sources).toEqual([]);
  });

  it('请求失败（503）本地补气泡的场景与页面一致', () => {
    const bubble = mod.buildAiBubble('AI 服务暂时不可用，你可以直接打电话问', [], true, '', 'none');
    expect(bubble.degraded).toBe(true);
    expect(bubble.degradedTip).toBe(TIP_NOT_FOUND);
    expect(bubble.answerId).toBe('');
  });
});

describe('toBubbleVM · qa:history 单轮转气泡', () => {
  const baseTime = '2026-10-14T02:00:00.000Z';

  it('role=user → 用户气泡', () => {
    const vm = mod.toBubbleVM({ role: 'user', content: '停水通知在哪看', createdAt: baseTime });
    expect(vm.role).toBe('user');
    expect(vm.text).toBe('停水通知在哪看');
    expect(vm.sources).toEqual([]);
    expect(vm.answerId).toBe('');
    expect(vm.degradedTip).toBe('');
  });

  it('role=assistant 未降级 → AI 气泡，sources/answerId 落位', () => {
    const vm = mod.toBubbleVM({
      role: 'assistant',
      content: '可在通知列表查看',
      createdAt: baseTime,
      answerId: 'a_7',
      sources: ['通知公告'],
    });
    expect(vm.role).toBe('ai');
    expect(vm.degraded).toBe(false);
    expect(vm.degradedTip).toBe('');
    expect(vm.sources).toEqual(['通知公告']);
    expect(vm.answerId).toBe('a_7');
  });

  it('role=assistant 且 degraded → 带降级引导文案', () => {
    const vm = mod.toBubbleVM({
      role: 'assistant',
      content: '暂未查到',
      createdAt: baseTime,
      answerId: 'a_8',
      degraded: true,
    });
    expect(vm.degraded).toBe(true);
    expect(vm.degradedTip).toBe(TIP_NOT_FOUND);
  });

  it('CR-012：历史轮次带 _riskLevel=medical → 降级文案为安全提示，不退回「没查到」', () => {
    const vm = mod.toBubbleVM({
      role: 'assistant',
      content: '请尽快就医或拨打 120',
      createdAt: baseTime,
      answerId: 'a_9',
      degraded: true,
      _riskLevel: 'medical',
    });
    expect(vm.degraded).toBe(true);
    expect(vm.text).toBe('请尽快就医或拨打 120');
    expect(vm.degradedTip).toBe(TIP_SAFETY);
  });

  it('缺字段兜底：content / sources / answerId 为空时不抛错', () => {
    const vm = mod.toBubbleVM({ role: 'assistant', content: '', createdAt: baseTime });
    expect(vm.text).toBe('');
    expect(vm.sources).toEqual([]);
    expect(vm.answerId).toBe('');
    expect(vm.degraded).toBe(false);
  });

  it('时间文案由 createdAt 转换（非空）', () => {
    const vm = mod.toBubbleVM({ role: 'user', content: 'x', createdAt: baseTime });
    expect(vm.timeText).toBeTruthy();
  });
});

describe('isSafety · CR-012 安全话术标记（驱动 wxml 隐藏 👍/👎）', () => {
  it('_riskLevel 存在且 !== none → true', () => {
    expect(mod.isSafetyLevel('medical')).toBe(true);
    expect(mod.isSafetyLevel('legal')).toBe(true);
    expect(mod.isSafetyLevel('emergency')).toBe(true);
  });

  it('none / undefined / 空串 / 未知值中的 none → false', () => {
    expect(mod.isSafetyLevel('none')).toBe(false);
    expect(mod.isSafetyLevel(undefined)).toBe(false);
    expect(mod.isSafetyLevel('')).toBe(false);
  });

  it('buildAiBubble：命中安全话术 → isSafety=true，且正文原文保留', () => {
    const answer = '请尽快就医或拨打 120';
    const bubble = mod.buildAiBubble(answer, [], true, 'a_s1', 'medical');
    expect(bubble.isSafety).toBe(true);
    expect(bubble.text).toBe(answer);
  });

  it('buildAiBubble：普通回答 / 未降级 / riskLevel=none → isSafety=false（反馈照常显示）', () => {
    expect(mod.buildAiBubble('物业费可在物业中心缴纳', ['办事指南'], false, 'a_s2').isSafety).toBe(false);
    expect(mod.buildAiBubble('暂时无法回答', [], true, 'a_s3', 'none').isSafety).toBe(false);
    expect(mod.buildAiBubble('暂时无法回答', [], true, 'a_s4').isSafety).toBe(false);
  });

  it('buildUserBubble：用户气泡恒为 false', () => {
    expect(mod.buildUserBubble('胸痛怎么办').isSafety).toBe(false);
  });

  it('toBubbleVM：历史轮次带 _riskLevel → isSafety=true；不带 / none → false', () => {
    const base = { role: 'assistant' as const, content: 'x', createdAt: '2026-10-14T02:00:00.000Z' };
    expect(mod.toBubbleVM({ ...base, degraded: true, _riskLevel: 'medical' }).isSafety).toBe(true);
    expect(mod.toBubbleVM({ ...base, degraded: true, _riskLevel: 'none' }).isSafety).toBe(false);
    expect(mod.toBubbleVM({ ...base, degraded: true }).isSafety).toBe(false);
  });

  it('wxml 守卫条件与字段一致：answerId 存在但不安全时才显示反馈', () => {
    // wxml: wx:if="{{item.answerId && !item.isSafety}}"
    const safety = mod.buildAiBubble('请尽快就医或拨打 120', [], true, 'a_s5', 'medical');
    const normal = mod.buildAiBubble('可在物业中心缴纳', ['办事指南'], false, 'a_s6');
    expect(Boolean(safety.answerId && !safety.isSafety)).toBe(false);
    expect(Boolean(normal.answerId && !normal.isSafety)).toBe(true);
  });
});
