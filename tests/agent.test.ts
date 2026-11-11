import { describe, expect, it } from 'vitest';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- cloud function is CommonJS
const agent = require('../cloudfunctions/shared/agent.js') as {
  planIntent: (question: string) => { intent: string; tools: string[] };
  buildRepairDraft: (question: string) => { category: string; title: string; description: string };
  findNearby: (question: string, location?: { latitude: number; longitude: number }) => Array<{ name: string; distanceText: string }>;
};

describe('社区 AI Agent', () => {
  it('报修意图规划知识检索与报修草稿工具', () => {
    const plan = agent.planIntent('厨房水管漏水了，怎么报修？');
    expect(plan.intent).toBe('repair');
    expect(plan.tools).toContain('searchKnowledge');
    expect(plan.tools).toContain('buildRepairDraft');
  });

  it('附近服务意图调用地图工具并返回最近点位', () => {
    expect(agent.planIntent('最近的共享雨伞在哪？').intent).toBe('nearby');
    const places = agent.findNearby('最近的共享雨伞在哪？', { latitude: 23.12894, longitude: 113.26411 });
    expect(places[0].name).toContain('雨伞');
    expect(places[0].distanceText).toMatch(/\d/);
  });

  it('报修草稿识别分类并生成标题描述', () => {
    const draft = agent.buildRepairDraft('楼道灯不亮，晚上看不见');
    expect(draft.category).toBe('electric');
    expect(draft.title.length).toBeGreaterThan(0);
    expect(draft.description).toContain('楼道灯');
  });

  it('工单查询与通知意图使用对应工具', () => {
    expect(agent.planIntent('我的工单处理到哪了？').tools).toContain('queryWorkOrders');
    expect(agent.planIntent('社区最近有什么停水通知？').tools).toContain('searchNotices');
  });
});
