/**
 * ai-bar · 页面级 AI 询问横条（FE-15 · CR-024）
 *
 * 设计取舍（C3 判断：AI 入口不是 Agent）：
 *   - 入口形态统一为**页面内横条**（不悬浮）——避免与圈子「＋」浮钮、底部操作条打架；
 *   - 上下文只在**打开时注入**（当前服务名 + 3 条预置问题），不维护跨页会话状态；
 *   - 回答链路：本地问答库 → qa:ask 云函数 → 兜底话术 + 转人工。
 *     ⚠ 契约硬红线：不新增接口，qa:ask 已存在；本地库纯离线，不写库、不计费。
 *
 * 用法：<ai-bar page="notice" context="{{title}}" up="{{false}}" />
 */
import { AI_FALLBACK_TEXT, lookupAnswer, pageAiConfig } from '../../config/ai-scenes';
import { askQuestion } from '../../services/qa';
import { track } from '../../utils/logger';

type Role = 'me' | 'ai';

interface AiMessage {
  id: string;
  role: Role;
  text: string;
  cites: string[];
  pending: boolean;
}

/** 生成稳定不重复的消息 id（同一毫秒连发也不会撞 key） */
let seq = 0;
function nextId(prefix: string): string {
  seq += 1;
  return `${prefix}${Date.now()}_${seq}`;
}

Component({
  properties: {
    /** 页面 key（对应 config/ai-scenes.ts 的 PAGE_AI） */
    page: { type: String, value: 'hall' },
    /** 上下文名（覆盖配置里的 name，例如报修详情传工单标题） */
    context: { type: String, value: '' },
    /** true = 横条上边距（服务详情类，贴在内容顶部） */
    up: { type: Boolean, value: false },
    /**
     * true = 只保留弹层、不渲染横条。
     * 办事大厅的 8 张 AI 集群卡需要复用同一套问答面板，但自己就是入口，
     * 不需要再画一根横条——父页用 selectComponent('#aiHub').openWith(...) 唤起。
     */
    bare: { type: Boolean, value: false },
  },

  data: {
    title: '社区服务',
    presets: [] as string[],
    open: false,
    log: [] as AiMessage[],
    input: '',
    lastId: '',
  },

  observers: {
    /** page/context 任一变化就重算标题与预置问题 */
    'page, context': function recompute(page: string, context: string): void {
      const cfg = pageAiConfig(String(page ?? ''));
      const name = String(context ?? '').trim() || cfg.name;
      this.setData({ title: name, presets: cfg.presets });
    },
  },

  methods: {
    /* ---------------- 面板开关 ---------------- */

    onOpen(): void {
      track('btn_click', { target: 'ai_bar_open', kind: this.data.page });
      // 每次打开清空上一轮，避免跨页面残留无关上下文
      this.setData({ open: true, log: [], input: '', lastId: '' });
    },

    /**
     * 外部唤起（办事大厅 AI 集群卡）：覆盖标题与预置问题后打开。
     * 通过 selectComponent('#aiHub') 拿到实例后调用。
     */
    openWith(input: { title?: string; presets?: string[] }): void {
      const title = String(input?.title ?? '').trim() || this.data.title;
      const presets = input?.presets ?? [];
      track('btn_click', { target: 'ai_hub_scene', kind: title });
      this.setData({ title, presets, open: true, log: [], input: '', lastId: '' });
    },

    onClose(): void {
      this.setData({ open: false });
    },

    /** 阻止弹层内部点击冒泡到遮罩关闭 */
    noop(): void {
      /* noop */
    },

    onInput(e: WechatMiniprogram.Input): void {
      this.setData({ input: String(e.detail.value ?? '') });
    },

    /** 「换个问法」输入框回车 */
    onConfirm(): void {
      void this.submit(this.data.input);
    },

    onSend(): void {
      void this.submit(this.data.input);
    },

    /* ---------------- 提问与回答 ---------------- */

    onPresetTap(e: WechatMiniprogram.TouchEvent): void {
      const q = String((e.currentTarget.dataset as { q?: string }).q ?? '');
      if (!q) return;
      void this.submit(q);
    },

    /** 提交一问：本地库优先 → 云 qa:ask → 兜底话术（三级，绝不空答） */
    async submit(raw: string): Promise<void> {
      const q = String(raw ?? '').trim();
      if (!q) return;

      const pendingId = this.pushMessage('ai', '', [], true);
      this.pushMessage('me', q, [], false);
      this.setData({ input: '' });

      // ① 本地问答库：离线可用、演示稳定、零延迟
      const local = lookupAnswer(q);
      if (local) {
        this.fillMessage(pendingId, local.text, local.cites);
        track('ai_answer', { page: this.data.page, source: 'local' });
        return;
      }

      // ② 云函数 qa:ask（真实大模型 + 来源引用）
      try {
        const res = await askQuestion({ question: q });
        if (res && res.answer) {
          this.fillMessage(pendingId, res.answer, res.sources ?? []);
          track('ai_answer', { page: this.data.page, source: 'cloud' });
          return;
        }
      } catch {
        /* 云不可用 → 继续走兜底 */
      }

      // ③ 兜底：给下一步（转人工），不说「我不知道」
      this.fillMessage(pendingId, AI_FALLBACK_TEXT, []);
      track('ai_answer', { page: this.data.page, source: 'fallback' });
    },

    /* ---------------- 消息列表操作 ---------------- */

    pushMessage(role: Role, text: string, cites: string[], pending: boolean): string {
      const id = nextId(role === 'me' ? 'm' : 'a');
      const log = this.data.log.concat([
        { id, role, text, cites: cites ?? [], pending },
      ]);
      this.setData({ log, lastId: id });
      return id;
    },

    fillMessage(id: string, text: string, cites: string[]): void {
      const log = this.data.log.map((m) =>
        m.id === id ? { ...m, text, cites: cites ?? [], pending: false } : m,
      );
      this.setData({ log, lastId: id });
    },

    /* ---------------- 出口 ---------------- */

    /** 转人工：便民电话页（本页就是电话页时提示直接下滑查看） */
    onCallHuman(): void {
      track('btn_click', { target: 'ai_bar_human', kind: this.data.page });
      if (this.data.page === 'phonebook') {
        this.setData({ open: false });
        wx.showToast({ title: '向下查看物业值班电话', icon: 'none' });
        return;
      }
      wx.navigateTo({
        url: '/pages/phonebook/index',
        fail: () => wx.showToast({ title: '页面暂时打不开', icon: 'none' }),
      });
    },

    /** 展开完整对话（多轮追问） */
    onGoAssistant(): void {
      track('btn_click', { target: 'ai_bar_full', kind: this.data.page });
      const q = this.data.log.filter((m) => m.role === 'me').slice(-1)[0]?.text ?? '';
      const url = q
        ? `/pages/assistant/index?presetQuestion=${encodeURIComponent(q)}`
        : '/pages/assistant/index';
      wx.navigateTo({ url, fail: () => wx.showToast({ title: '页面暂时打不开', icon: 'none' }) });
    },
  },
});
