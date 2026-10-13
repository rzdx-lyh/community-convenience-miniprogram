/**
 * AI 助手（FE-13 增量：URL 入参 `?presetQuestion=`）
 * 契约附 A.3 硬性要求：**只填充输入框，不自动发送**（防止演示误触发 LLM 计费）。
 * 对话主体由 FE-2 实现，这里只把入参落到 data.inputText，发送必须由用户点「发送」触发。
 */
import { trackPageView } from '../../utils/logger';

/** 归一化预设提问：去空白，超长按契约输入护栏上限 300 字截断 */
export function normalizePresetQuestion(input?: string): string {
  const value = String(input ?? '').trim();
  return value.length > 300 ? value.slice(0, 300) : value;
}

Page({
  data: {
    /** 输入框内容（presetQuestion 只填充到这里，绝不自动发送） */
    inputText: '',
    /** 是否来自预设提问，供 FE-2 决定是否聚焦输入框 */
    hasPreset: false,
  },

  onLoad(options: Record<string, string | undefined>) {
    trackPageView('pages/assistant/index');
    const preset = normalizePresetQuestion(options.presetQuestion);
    if (preset) this.setData({ inputText: preset, hasPreset: true });
  },
});
