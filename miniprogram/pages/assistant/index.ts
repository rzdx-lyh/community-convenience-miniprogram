/**
 * AI 办事助手（FE-2）+ FE-13 增量（URL 入参 `?presetQuestion=`）
 * 契约：qa:ask / qa:history / qa:clear / qa:feedback / qa:suggest
 *
 * 硬性要求（契约附 A.3）：`?presetQuestion=` **只填充输入框，不自动发送**，
 * 防止演示误触发大模型计费；发送必须由用户点「发送」或快捷提问触发。
 *
 * 降级策略：
 * - 服务端返回 degraded=true（无答案 / 无 API Key / CR-012 安全话术拦截）时，
 *   **照常渲染 answer 文本**，只是额外挂一张引导卡片（引导去便民电话簿），
 *   绝不弹错误 toast —— 这是"无云环境也要能演示"的降级铁律。
 * - 请求直接失败（如 503）时，本地补一条降级气泡，保证界面不空白。
 */
import { ENV, STORAGE_KEYS } from '../../config/env';
import { askQuestion, clearQaHistory, feedbackQa, getQaHistory, getSuggestions } from '../../services/qa';
import { store } from '../../store/global';
import { toShortDateTime } from '../../utils/format';
import { track, trackPageView } from '../../utils/logger';
import { confirm, toast } from '../../utils/ui';

/** 归一化预设提问：去空白，超长按契约输入护栏上限 300 字截断 */
export function normalizePresetQuestion(input?: string): string {
  const value = String(input ?? '').trim();
  return value.length > 300 ? value.slice(0, 300) : value;
}

/** 对话气泡视图模型 */
export interface BubbleVM {
  id: string;
  role: 'ai' | 'user';
  text: string;
  sources: string[];
  degraded: boolean;
  /** 降级引导卡文案；非降级为空串（wxml 里不渲染） */
  degradedTip: string;
  answerId: string;
  useful: boolean | null;
  timeText: string;
}

let seq = 0;
function nextId(prefix: string): string {
  seq += 1;
  return `${prefix}-${seq}`;
}

/**
 * 降级引导文案（纯函数）
 * CR-012：命中涉医/涉法/紧急求助时服务端返回固定安全话术 + _riskLevel，
 * 此时不能再说"我没查到"，改为提示这不是专业意见。
 */
export function toDegradedTip(riskLevel?: string): string {
  if (riskLevel && riskLevel !== 'none') return '以上为安全提示，社区无法提供专业医疗或法律意见';
  return '这个问题我没查到，你可以直接打电话问';
}

/** 用户气泡（纯函数） */
export function buildUserBubble(text: string): BubbleVM {
  return {
    id: nextId('u'),
    role: 'user',
    text,
    sources: [],
    degraded: false,
    degradedTip: '',
    answerId: '',
    useful: null,
    timeText: toShortDateTime(Date.now()),
  };
}

/** AI 气泡（纯函数） */
export function buildAiBubble(
  answer: string,
  sources: string[],
  degraded: boolean,
  answerId: string,
  riskLevel?: string,
): BubbleVM {
  return {
    id: nextId('a'),
    role: 'ai',
    text: answer,
    sources: sources ?? [],
    degraded,
    degradedTip: degraded ? toDegradedTip(riskLevel) : '',
    answerId: answerId ?? '',
    useful: null,
    timeText: toShortDateTime(Date.now()),
  };
}

/** qa:history 单轮 → 气泡（纯函数） */
export function toBubbleVM(turn: QaTurn): BubbleVM {
  const isUser = turn.role === 'user';
  return {
    id: nextId(isUser ? 'hu' : 'ha'),
    role: isUser ? 'user' : 'ai',
    text: turn.content ?? '',
    sources: turn.sources ?? [],
    degraded: Boolean(turn.degraded),
    degradedTip: turn.degraded ? toDegradedTip(turn._riskLevel) : '',
    answerId: turn.answerId ?? '',
    useful: null,
    timeText: toShortDateTime(turn.createdAt),
  };
}

Page({
  data: {
    bubbles: [] as BubbleVM[],
    lastBubbleId: '',
    inputText: '',
    loading: false,
    showSuggest: true,
    suggestions: [] as string[],
    elderMode: false,
    footerText: ENV.AI_FOOTER_TEXT,
    /** FE-13：是否来自预设提问（进来时自动聚焦输入框） */
    hasPreset: false,
    sessionId: '',
  },

  onLoad(options: Record<string, string | undefined>) {
    trackPageView('pages/assistant/index');
    const elderMode = store.get<boolean>(STORAGE_KEYS.ELDER_MODE, false);
    this.setData({ elderMode });

    const sessionId = store.get<string>(STORAGE_KEYS.QA_SESSION_ID, '');
    this.setData({ sessionId: sessionId ?? '' });

    const preset = normalizePresetQuestion(options.presetQuestion);
    if (preset) this.setData({ inputText: preset, hasPreset: true });

    void this.loadSuggestions();
    void this.loadHistory();
  },

  async loadSuggestions(): Promise<void> {
    try {
      const res = await getSuggestions();
      const list = (res?.questions ?? []).filter((q) => typeof q === 'string' && q.trim());
      if (list.length > 0) this.setData({ suggestions: list });
    } catch {
      // 快捷提问是增强项，失败静默，不影响主流程
    }
  },

  /** 恢复上一轮会话（多轮上下文；sessionId 为空则后端新建） */
  async loadHistory(): Promise<void> {
    try {
      const res = await getQaHistory({ sessionId: this.data.sessionId || undefined });
      const turns = res?.list ?? [];
      if (turns.length === 0) return;
      const bubbles = turns.map(toBubbleVM);
      this.setData({
        bubbles,
        showSuggest: false,
        lastBubbleId: bubbles.length > 0 ? bubbles[bubbles.length - 1].id : '',
      });
    } catch {
      // 历史恢复失败不影响新会话
    }
  },

  onInput(e: WechatMiniprogram.Input): void {
    this.setData({ inputText: String(e.detail.value ?? '') });
  },

  /** wxml 里 bindconfirm 与 bindtap 都指向这个方法 */
  async send(): Promise<void> {
    const question = String(this.data.inputText ?? '').trim();
    if (this.data.loading) return;
    if (!question) {
      toast('请先输入你想问的问题');
      return;
    }
    if (question.length > 300) {
      toast('问题太长了，请精简到 300 字以内');
      return;
    }

    const userBubble = buildUserBubble(question);
    this.setData({
      bubbles: this.data.bubbles.concat(userBubble),
      inputText: '',
      hasPreset: false,
      showSuggest: false,
      loading: true,
      lastBubbleId: userBubble.id,
    });

    try {
      const res = await askQuestion({
        question,
        elderMode: this.data.elderMode,
        sessionId: this.data.sessionId || undefined,
      });
      const sessionId = res?.sessionId ?? this.data.sessionId;
      if (sessionId) {
        store.set(STORAGE_KEYS.QA_SESSION_ID, sessionId);
        this.setData({ sessionId });
      }
      const riskLevel = (res as { _riskLevel?: string })._riskLevel;
      const bubble = buildAiBubble(
        res?.answer ?? '',
        res?.sources ?? [],
        Boolean(res?.degraded),
        res?.answerId ?? '',
        riskLevel,
      );
      this.setData({ bubbles: this.data.bubbles.concat(bubble), lastBubbleId: bubble.id });
      track('btn_click', { page: 'assistant', target: 'ask', degraded: bubble.degraded });
    } catch {
      // request 层对 503 不 toast，这里补一条本地降级气泡，界面不空白
      const bubble = buildAiBubble('AI 服务暂时不可用，你可以直接打电话问', [], true, '', 'none');
      this.setData({ bubbles: this.data.bubbles.concat(bubble), lastBubbleId: bubble.id });
    } finally {
      this.setData({ loading: false });
    }
  },

  onSuggestTap(e: WechatMiniprogram.TouchEvent): void {
    const q = String((e.currentTarget.dataset as { q?: string }).q ?? '').trim();
    if (!q) return;
    this.setData({ inputText: q });
    void this.send();
  },

  /** 语音输入：小程序无免费官方语音转写，降级为引导打字（不假装支持） */
  onVoice(): void {
    toast('语音输入暂未开通，请直接输入文字');
  },

  /** 朗读：复制最近一条回答，引导用手机朗读功能（不假装内置 TTS） */
  onReadAloud(): void {
    const last = [...this.data.bubbles].reverse().find((b) => b.role === 'ai');
    if (!last || !last.text) {
      toast('还没有可以朗读的回答');
      return;
    }
    wx.setClipboardData({
      data: last.text,
      success: () => toast('回答已复制，可用手机朗读功能播放'),
    });
  },

  async onClear(): Promise<void> {
    if (this.data.bubbles.length === 0) return;
    const ok = await confirm('清空对话', '清空后无法恢复，确定清空吗？');
    if (!ok) return;
    try {
      await clearQaHistory({ sessionId: this.data.sessionId || undefined });
    } catch {
      // 后端清空失败也把本地清空，保证用户操作有反馈
    }
    store.set(STORAGE_KEYS.QA_SESSION_ID, '');
    this.setData({ bubbles: [], sessionId: '', showSuggest: true, lastBubbleId: '' });
    toast('已清空');
  },

  async onFeedback(e: WechatMiniprogram.TouchEvent): Promise<void> {
    const dataset = e.currentTarget.dataset as { id?: string; useful?: string };
    const id = String(dataset.id ?? '');
    const useful = Number(dataset.useful ?? 0) === 1;
    const bubbles = this.data.bubbles.map((b) => (b.id === id ? { ...b, useful } : b));
    this.setData({ bubbles });
    const target = this.data.bubbles.find((b) => b.id === id);
    if (!target || !target.answerId) return;
    try {
      await feedbackQa({ answerId: target.answerId, useful });
    } catch {
      // 反馈失败静默，不打断对话
    }
  },

  onGoPhonebook(): void {
    wx.navigateTo({
      url: '/pages/phonebook/index',
      fail: () => toast('页面暂时打不开，请稍后再试'),
    });
  },

  onBack(): void {
    wx.navigateBack({ fail: () => wx.switchTab({ url: '/pages/index/index' }) });
  },
});
