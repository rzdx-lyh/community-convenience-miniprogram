import { describe, expect, it } from 'vitest';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- cloud function is CommonJS
const ai = require('../cloudfunctions/shared/ai.js') as {
  resolveAiConfig: (env: Record<string, string | undefined>) => { apiKey: string; endpoint: string; model: string };
};

describe('免费/通用 AI 接口配置', () => {
  it('优先使用通用 AI_API_KEY / AI_API_URL / AI_MODEL', () => {
    const config = ai.resolveAiConfig({ AI_API_KEY: 'free-key', AI_API_URL: 'https://free.example/v1/chat/completions', AI_MODEL: 'free-model' });
    expect(config).toEqual({ apiKey: 'free-key', endpoint: 'https://free.example/v1/chat/completions', model: 'free-model' });
  });

  it('兼容旧 DeepSeek 环境变量', () => {
    const config = ai.resolveAiConfig({ DEEPSEEK_API_KEY: 'deepseek-key' });
    expect(config.apiKey).toBe('deepseek-key');
    expect(config.endpoint).toContain('api.deepseek.com');
    expect(config.model).toBe('deepseek-chat');
  });

  it('无 Key 时返回空配置，不抛异常', () => {
    expect(ai.resolveAiConfig({}).apiKey).toBe('');
  });
});
