/** CR-024：AI 场景配置（问答库匹配 / 集群场景 / 页面入口覆盖） */
import { describe, expect, it } from 'vitest';
import {
  AI_FALLBACK_TEXT,
  HUB_SCENES,
  PAGE_AI,
  QA_BANK,
  findScene,
  lookupAnswer,
  normQuestion,
  pageAiConfig,
} from '../miniprogram/config/ai-scenes';

describe('normQuestion', () => {
  it('去掉结尾问号、句号、空白与全角标点', () => {
    expect(normQuestion('血压多少算偏高？')).toBe('血压多少算偏高');
    expect(normQuestion('  户号在哪查。  ')).toBe('户号在哪查');
    expect(normQuestion('欠费多久会停！！')).toBe('欠费多久会停');
  });

  it('空值与非字符串不抛错，返回空串', () => {
    expect(normQuestion('')).toBe('');
    expect(normQuestion(null as unknown as string)).toBe('');
    expect(normQuestion(undefined as unknown as string)).toBe('');
  });
});

describe('lookupAnswer', () => {
  it('精确命中（带问号的原文）', () => {
    const hit = lookupAnswer('办居住证要带什么？');
    expect(hit).not.toBeNull();
    expect(hit!.text).toContain('身份证');
    expect(hit!.cites.length).toBeGreaterThan(0);
  });

  it('用户手打不带问号也要命中（全等匹配会大面积落空，这是原型的坑）', () => {
    expect(lookupAnswer('办居住证要带什么')).not.toBeNull();
    expect(lookupAnswer('户号在哪查')).not.toBeNull();
    expect(lookupAnswer('突然停水怎么办')).not.toBeNull();
  });

  it('长句包含兜底：用户多打了字也能命中', () => {
    const hit = lookupAnswer('请问办居住证要带什么');
    expect(hit).not.toBeNull();
    expect(hit!.text).toContain('身份证');
  });

  it('完全无关的问题返回 null（调用方才会走云 / 兜底）', () => {
    expect(lookupAnswer('今天天气怎么样')).toBeNull();
    expect(lookupAnswer('')).toBeNull();
  });

  it('所有预置问题都能在本地库命中（集群卡的答案不能靠云，断网也要能演示）', () => {
    const miss: string[] = [];
    HUB_SCENES.forEach((scene) => {
      scene.questions.forEach((q) => {
        if (!lookupAnswer(q)) miss.push(`${scene.key} / ${q}`);
      });
    });
    Object.keys(PAGE_AI).forEach((page) => {
      PAGE_AI[page].presets.forEach((q) => {
        if (!lookupAnswer(q)) miss.push(`${page} / ${q}`);
      });
    });
    expect(miss).toEqual([]);
  });

  it('医疗/费用类答案必须带降级提示（不能让人当成医嘱或账单）', () => {
    expect(QA_BANK['血压 145/92 要紧吗？'].text).toContain('就医');
    expect(QA_BANK['有糖尿病能这样吃吗？'].text).toContain('不替代处方');
    expect(QA_BANK['热量是怎么算的？'].text).toContain('参考值');
  });

  it('兜底话术给出下一步（转人工电话），而不是「我不知道」', () => {
    expect(AI_FALLBACK_TEXT).toContain('转人工');
    expect(AI_FALLBACK_TEXT).not.toContain('我不知道');
  });
});

describe('HUB_SCENES', () => {
  it('8 个场景，key 唯一', () => {
    expect(HUB_SCENES.length).toBe(8);
    const keys = HUB_SCENES.map((s) => s.key);
    expect(new Set(keys).size).toBe(8);
  });

  it('每个场景都有名称、说明、图标、颜色与 3 条预置问题', () => {
    HUB_SCENES.forEach((s) => {
      expect(s.name).not.toBe('');
      expect(s.desc).not.toBe('');
      expect(s.icon).not.toBe('');
      expect(s.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(s.questions.length).toBe(3);
    });
  });

  it('findScene 命中返回场景、未命中返回 null', () => {
    expect(findScene('guide')?.name).toBe('办事指南');
    expect(findScene('not-exist')).toBeNull();
  });
});

describe('PAGE_AI', () => {
  it('25 个真实页面全部有配置（页面级 AI 入口的覆盖清单）', () => {
    const pages = Object.keys(PAGE_AI);
    expect(pages.length).toBe(25);
    [
      // v1.1.0 既有
      'hall', 'repair-create', 'repair-list', 'repair-detail', 'notice', 'phonebook', 'circle',
      // CR-026 新增的 6 个服务页
      'meal', 'guide', 'bill', 'record', 'tool', 'express',
      // CR-027：13 个兜底项聚合而成的 4 个服务页
      'fresh', 'health', 'culture', 'property',
    ].forEach((key) => expect(pages).toContain(key));
  });

  it('每个页面都有服务名与至少 3 条预置问题', () => {
    Object.keys(PAGE_AI).forEach((key) => {
      expect(PAGE_AI[key].name).not.toBe('');
      expect(PAGE_AI[key].presets.length).toBeGreaterThanOrEqual(3);
    });
  });

  it('未知 page key 回落到通用配置，不至于横条消失', () => {
    expect(pageAiConfig('some-new-page').name).toBe('社区服务');
    expect(pageAiConfig('some-new-page').presets).toEqual([]);
  });
});
