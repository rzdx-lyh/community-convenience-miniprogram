import { describe, expect, it } from 'vitest';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- cloud function is CommonJS
const vision = require('../cloudfunctions/shared/vision.js') as {
  parseVisionResult: (content: string) => null | {
    category: string;
    title: string;
    description: string;
    urgency: string;
    safetyTip: string;
    confidence: number;
  };
  buildVisionMessages: (url: string) => Array<{ role: string; content: unknown }>;
};

describe('报修多模态识图', () => {
  it('解析模型 JSON 并限制分类与紧急程度', () => {
    const result = vision.parseVisionResult('{"category":"water","title":"水管漏水","description":"厨房水管接口渗水","urgency":"high","safetyTip":"先关闭总阀","confidence":0.92}');
    expect(result?.category).toBe('water');
    expect(result?.urgency).toBe('high');
    expect(result?.confidence).toBe(0.92);
  });

  it('非法分类回退 other、非法紧急程度回退 medium', () => {
    const result = vision.parseVisionResult('```json\n{"category":"bogus","title":"问题","description":"描述","urgency":"urgent","confidence":2}\n```');
    expect(result?.category).toBe('other');
    expect(result?.urgency).toBe('medium');
    expect(result?.confidence).toBe(1);
  });

  it('提示词要求只输出结构化 JSON', () => {
    const messages = vision.buildVisionMessages('https://example.com/a.jpg');
    expect(messages[0].content).toContain('只输出 JSON');
    expect(messages[1].content).toBeTruthy();
  });

  it('非 JSON 内容返回 null，不抛异常', () => {
    expect(vision.parseVisionResult('这不是 JSON')).toBeNull();
  });
});
