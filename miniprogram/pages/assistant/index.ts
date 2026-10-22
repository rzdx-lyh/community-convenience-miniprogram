/**
 * AI 助手（CR-028 按 1.4 设计稿重建 · pgAi）
 *
 * 结构对照 design：`.sbar` + `.nav` + `.aichat`（用户/AI 气泡 + `.think` 思考过程 +
 * `.cites` 来源）+ `.aiask` 输入区；欢迎卡用 `.sug` 预置问句。
 *
 * 问答链路（保留既有 services/qa.ts，不改服务层）：
 *   ① 本地问答库 lookupAnswer（离线可用、演示稳定）
 *   ② 云函数 qa:ask（多轮上下文，sessionId 落 store）
 *   ③ 兜底：AI_FALLBACK_TEXT + `.warn2` 降级提示（绝不空答、不弹错误 toast）
 *
 * URL 入参：`?q=` 或 `?presetQuestion=`（ai-bar / 首页跳转），进入后**自动提问**。
 *
 * ⚠ 气泡纯函数（normalizePresetQuestion / toDegradedTip / buildUserBubble /
 *   buildAiBubble / toBubbleVM / isSafetyLevel）是 CR-012 安全话术的回归护栏，
 *   由 tests/assistant.test.ts 钉死，重写页面时不得删除。
 */
import { AI_FALLBACK_TEXT, lookupAnswer } from '../../config/ai-scenes';
import { ENV, STORAGE_KEYS } from '../../config/env';
import { askQuestion, clearQaHistory, getSuggestions } from '../../services/qa';
import { store } from '../../store/global';
import { getStatusBarHeight } from '../../utils/device';
import { toShortDateTime } from '../../utils/format';
import { confirm, toast } from '../../utils/ui';

/** 归一化预设提问：去空白，超长按契约输入护栏上限 300 字截断 */
export function normalizePresetQuestion(input?: string): string {
  let value = String(input ?? '').trim();
  // ai-bar 跳转时对问题做了 encodeURIComponent，微信不保证自动解码 → 这里兜底解码一次。
  // 只在「长得像被编码」时才解，避免用户提问本身含 % 被误伤；解失败保持原文。
  if (/%[0-9A-Fa-f]{2}/.test(value)) {
    try {
      value = decodeURIComponent(value);
    } catch {
      /* 保留原文 */
    }
  }
  return value.length > 300 ? value.slice(0, 300) : value;
}

/** 对话气泡视图模型（气泡纯函数的返回值） */
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
  /** CR-012：固定安全话术（riskLevel !== 'none'）时隐藏反馈区 */
  isSafety: boolean;
}

/** 页面内气泡：在 BubbleVM 上叠加「思考过程 / 生成中」等渲染态 */
export interface ChatMsg extends BubbleVM {
  pending: boolean;
  steps: ThinkStep[];
  msText: string;
  badge: string;
}

interface ThinkStep {
  t: string;
  done: boolean;
}

/**
 * 判定是否为 CR-012 安全话术（纯函数）。
 * `_riskLevel` 存在且 !== 'none' → true；缺省 / 'none' / 空串 → false。
 */
export function isSafetyLevel(riskLevel?: string): boolean {
  return Boolean(riskLevel) && riskLevel !== 'none';
}

let seq = 0;
function nextId(prefix: string): string {
  seq += 1;
  return `${prefix}-${Date.now()}-${seq}`;
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
    isSafety: false,
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
    isSafety: isSafetyLevel(riskLevel),
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
    isSafety: isSafetyLevel(turn._riskLevel),
  };
}

/** 预置问句（全部来自本地问答库，点击即有稳定答案） */
export const DEFAULT_SUGGESTIONS: string[] = [
  '这个怎么借？',
  '血压多少算偏高？',
  '户号在哪查？',
  '办居住证要带什么？',
];

/** 回答后的追问 chips（原型 aiMsg 底部） */
export const FOLLOW_UPS: string[] = ['要带什么材料', '在哪办', '几点下班'];

const STEP_TEXTS: ThinkStep[] = [
  { t: '理解问题 · 识别服务意图', done: false },
  { t: '检索知识库与实时网页', done: false },
  { t: '组织回答并标注来源', done: false },
];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toMsText(ms: number): string {
  return `${(Math.max(ms, 0) / 1000).toFixed(1)}s`;
}

function freshSteps(): ThinkStep[] {
  return STEP_TEXTS.map((s) => ({ ...s }));
}

Page({
  data: {
    statusBarHeight: getStatusBarHeight(),
    msgs: [] as ChatMsg[],
    input: '',
    busy: false,
    showWelcome: true,
    suggestions: DEFAULT_SUGGESTIONS,
    followUps: FOLLOW_UPS,
    sessionId: '',
    footerText: ENV.AI_FOOTER_TEXT,
  },

  /** 当前等待回答的气泡 id（防止过期响应写进新会话） */
  pendingId: '',

  onLoad(options: Record<string, string | undefined>) {
    const sessionId = store.get<string>(STORAGE_KEYS.QA_SESSION_ID, '');
    this.setData({ sessionId: sessionId ?? '' });

    // 兼容两种入参：?q=（本次约定）与 ?presetQuestion=（ai-bar 既有跳转）
    const preset = normalizePresetQuestion(options.q ?? options.presetQuestion);
    if (preset) {
      setTimeout(() => {
        void this.ask(preset);
      }, 80);
    }
    void this.loadSuggestions();
  },

  async loadSuggestions(): Promise<void> {
    try {
      const res = await getSuggestions();
      const list = (res?.questions ?? []).filter((q) => typeof q === 'string' && q.trim());
      if (list.length > 0) this.setData({ suggestions: list.slice(0, 4) });
    } catch {
      // 快捷问句是增强项，失败保留本地默认
    }
  },

  goBack(): void {
    if (getCurrentPages().length > 1) {
      wx.navigateBack();
    } else {
      wx.switchTab({ url: '/pages/index/index' });
    }
  },

  onInput(e: WechatMiniprogram.Input): void {
    this.setData({ input: String(e.detail.value ?? '') });
  },

  onSend(): void {
    void this.ask(this.data.input);
  },

  onSuggestTap(e: WechatMiniprogram.TouchEvent): void {
    const q = String((e.currentTarget.dataset as { q?: string }).q ?? '').trim();
    if (!q) return;
    void this.ask(q);
  },

  /**
   * 一问一答：本地库优先 → 云 qa:ask → 兜底话术。
   * `steps` 只是视觉过程，答案仍来自真实链路，不伪造来源。
   */
  async ask(raw: string): Promise<void> {
    const q = String(raw ?? '').trim();
    if (!q) {
      toast('请先输入你想问的问题');
      return;
    }
    if (this.data.busy) return;

    const t0 = Date.now();
    const userMsg: ChatMsg = {
      ...buildUserBubble(q),
      pending: false,
      steps: [],
      msText: '',
      badge: '',
    };
    const aiMsg: ChatMsg = {
      ...buildAiBubble('', [], false, ''),
      pending: true,
      steps: freshSteps(),
      msText: '',
      badge: '社区 AI',
    };
    this.pendingId = aiMsg.id;
    this.setData({
      msgs: this.data.msgs.concat([userMsg, aiMsg]),
      input: '',
      busy: true,
      showWelcome: false,
    });
    this.scrollBottom();

    // ① 云端优先：知识库 + 实时网页 + 大模型；本地库只在云端失败时兜底
    const job = askQuestion({
      question: q,
      sessionId: this.data.sessionId || undefined,
    }).catch(() => null);

    await this.playSteps(aiMsg.id, 220);
    const res = await job;

    if (!res) {
      // ② 兜底：云端不可用时再查本地知识库，至少保证有可执行答复
      const local = lookupAnswer(q);
      if (local) {
        this.finish(aiMsg.id, local.text, local.cites, '云端暂时不可用，以下为本地知识库兜底答复。', '本地知识库', t0);
        return;
      }
      this.finish(
        aiMsg.id,
        AI_FALLBACK_TEXT,
        [],
        '联网检索与模型通道暂时不可用，已用本地知识库作答；具体以社区公告与服务指南为准。',
        '本地知识库',
        t0,
      );
      return;
    }

    const sessionId = res.sessionId ?? this.data.sessionId;
    if (sessionId) {
      store.set(STORAGE_KEYS.QA_SESSION_ID, sessionId);
      this.setData({ sessionId });
    }
    const riskLevel = (res as { _riskLevel?: string })._riskLevel;
    const webCount = Number((res as { _webCount?: number })._webCount || 0);
    // 有网页/知识库来源时说明已经拿到有效资料，不再显示“没查到”的误导提示。
    const tip = res.degraded && !(res.sources && res.sources.length) ? toDegradedTip(riskLevel) : '';
    this.finish(
      aiMsg.id,
      res.answer || AI_FALLBACK_TEXT,
      res.sources ?? [],
      tip,
      webCount > 0 ? '联网检索' : '社区 AI',
      t0,
    );
  },

  /** 逐步点亮 `.think` 的三步（纯视觉节奏） */
  async playSteps(id: string, gap: number): Promise<void> {
    for (let i = 0; i < STEP_TEXTS.length; i += 1) {
      await sleep(gap);
      const msgs = this.data.msgs.map((m) =>
        m.id === id
          ? { ...m, steps: m.steps.map((s, idx) => (idx <= i ? { ...s, done: true } : s)) }
          : m,
      );
      this.setData({ msgs });
    }
  },

  finish(
    id: string,
    text: string,
    sources: string[],
    degradedTip: string,
    badge: string,
    t0: number,
  ): void {
    if (id !== this.pendingId) return;
    const msText = toMsText(Date.now() - t0);
    const msgs = this.data.msgs.map((m) =>
      m.id === id
        ? {
            ...m,
            text,
            sources,
            degraded: Boolean(degradedTip),
            degradedTip,
            badge,
            pending: false,
            msText,
            steps: m.steps.map((s) => ({ ...s, done: true })),
          }
        : m,
    );
    this.setData({ msgs, busy: false });
    this.scrollBottom();
  },

  scrollBottom(): void {
    setTimeout(() => {
      wx.pageScrollTo({ scrollTop: 99999, duration: 220 });
    }, 60);
  },

  /** 语音输入：小程序无免费官方转写，降级为引导打字（不假装支持） */
  onVoice(): void {
    toast('语音输入暂未开通，请直接输入文字');
  },

  onManual(): void {
    wx.navigateTo({
      url: '/pages/phonebook/index',
      fail: () => toast('页面暂时打不开，请稍后再试'),
    });
  },

  async onClear(): Promise<void> {
    if (this.data.msgs.length === 0) return;
    const ok = await confirm('清空对话', '清空后无法恢复，确定清空吗？');
    if (!ok) return;
    try {
      await clearQaHistory({ sessionId: this.data.sessionId || undefined });
    } catch {
      // 云端清空失败也清本地，保证操作有反馈
    }
    store.set(STORAGE_KEYS.QA_SESSION_ID, '');
    this.pendingId = '';
    this.setData({ msgs: [], sessionId: '', showWelcome: true, busy: false });
    toast('已清空');
  },
});
