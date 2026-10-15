'use strict';

/**
 * 知识库检索（零成本关键词 + 同义词打分，无 embedding 依赖）
 * 数据：cloudfunctions/shared/kb/kb.json（代码内置，非数据库集合，重新部署即生效）
 * 打分：keyword 命中 1 分、同义词命中 0.8 分、标题整句命中 5 分，取 Top3
 * 阈值：最高分 < 1.0 判定未命中 → 不调用大模型
 */
const data = require('./kb.json');

const SUGGEST_QUESTIONS = [
  '家里水管漏水怎么报修？',
  '物业电话是多少？',
  '怎么办居住证？',
  '社区最近有什么活动？',
  '怎么交水电费？',
];

const FALLBACK_TEXT =
  '抱歉，我暂时无法回答这个问题。您可以：1）拨打物业服务中心 020-88888888；' +
  '2）在小程序提交报修工单；3）前往社区党群服务中心现场咨询。';

/** 降级时必须附带的便民电话（Top3） */
const HOTLINES = [
  { name: '物业服务中心', phone: '020-88888888' },
  { name: '社区居委会', phone: '020-88886666' },
  { name: '社区卫生服务站', phone: '020-88885555' },
];
const hotlineLines = () => HOTLINES.map((h) => `${h.name} ${h.phone}`).join('；');

function searchKB(question, { topN = 3, threshold = 1.0 } = {}) {
  const q = String(question || '').trim();
  if (!q) return [];
  const scored = data
    .map((item) => {
      let score = 0;
      (item.keywords || []).forEach((kw) => {
        if (q.includes(kw) || kw.includes(q)) score += 1;
      });
      (item.synonyms || []).forEach((sy) => {
        if (q.includes(sy) || sy.includes(q)) score += 0.8;
      });
      if (q.includes(item.title) || item.title.includes(q)) score += 5;
      return { item, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  const top = scored.slice(0, topN);
  if (!top.length || top[0].score < threshold) return [];
  return top.map((x) => x.item);
}

module.exports = { data, searchKB, SUGGEST_QUESTIONS, FALLBACK_TEXT, HOTLINES, hotlineLines };
