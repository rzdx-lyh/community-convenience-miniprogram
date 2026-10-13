/** qa 资源服务（契约 qa:ask / history / clear / feedback / suggest） */
import { call } from '../utils/request';

export function askQuestion(params: QaAskParams): Promise<QaAskResult> {
  return call<QaAskResult>('qa:ask', params as unknown as Record<string, unknown>);
}

export function getQaHistory(params: QaHistoryParams = {}): Promise<QaHistoryResult> {
  return call<QaHistoryResult>('qa:history', params as unknown as Record<string, unknown>);
}

export function clearQaHistory(params: QaClearParams = {}): Promise<QaClearResult> {
  return call<QaClearResult>('qa:clear', params as unknown as Record<string, unknown>);
}

export function feedbackQa(params: QaFeedbackParams): Promise<QaFeedbackResult> {
  return call<QaFeedbackResult>('qa:feedback', params as unknown as Record<string, unknown>);
}

export function getSuggestions(): Promise<QaSuggestResult> {
  return call<QaSuggestResult>('qa:suggest', {});
}
