import { describe, expect, it } from 'vitest';

const cloudRequire = require as unknown as NodeRequire;
const websearch = cloudRequire('../cloudfunctions/qa/websearch.js') as {
  _internal: {
    cleanText: (input: string, max?: number) => string;
    isSafeHttpUrl: (url: string) => boolean;
    parseBingRss: (xml: string) => Array<{ title: string; url: string; snippet: string }>;
    parseSoHtml: (html: string) => Array<{ title: string; url: string; snippet: string }>;
    extractPage: (html: string, title: string, snippet: string) => { title: string; content: string };
  };
};
const ai = cloudRequire('../cloudfunctions/qa/ai.js') as {
  buildRagPrompt: (
    hits: Array<{ title: string; content: string }>,
    question: string,
    web: Array<{ title: string; url: string; content: string }>,
  ) => Array<{ role: string; content: string }>;
};

describe('websearch 安全与解析', () => {
  it('只允许公网 http/https，拒绝 localhost 与私网', () => {
    expect(websearch._internal.isSafeHttpUrl('https://www.gz.gov.cn/')).toBe(true);
    expect(websearch._internal.isSafeHttpUrl('http://localhost/test')).toBe(false);
    expect(websearch._internal.isSafeHttpUrl('http://127.0.0.1/test')).toBe(false);
    expect(websearch._internal.isSafeHttpUrl('http://192.168.1.2/test')).toBe(false);
    expect(websearch._internal.isSafeHttpUrl('file:///etc/passwd')).toBe(false);
  });

  it('解析 360 结构化结果并优先使用 data-mdurl 原文链接', () => {
    const html = `
      <li class="res-list" data-result-pos="1">
        <h3 class="res-title"><a href="https://www.so.com/link?m=redirect" data-mdurl="http://gz.bendibao.com/guide.shtml">广州居住证办理条件</a></h3>
        <p class="res-desc">需要居住登记满半年，并符合合法稳定就业、住所或连续就读条件之一。</p>
      </li>`;
    const rows = websearch._internal.parseSoHtml(html);
    expect(rows).toHaveLength(1);
    expect(rows[0].url).toBe('http://gz.bendibao.com/guide.shtml');
    expect(rows[0].title).toContain('广州居住证');
    expect(rows[0].snippet).toContain('居住登记满半年');
  });

  it('从网页中提取正文并移除脚本、样式', () => {
    const html = `
      <html><head><title>办事指南</title>
      <meta name="description" content="官方办事说明" /></head>
      <body><script>bad()</script><style>.x{}</style>
      <h1>广州居住证办理条件</h1>
      <p>在广州市居住登记满半年，并符合合法稳定就业、合法稳定住所、连续就读条件之一。</p>
      <p>具体材料以受理窗口要求为准。</p></body></html>`;
    const page = websearch._internal.extractPage(html, '备用标题', '备用摘要');
    expect(page.title).toBe('办事指南');
    expect(page.content).toContain('官方办事说明');
    expect(page.content).toContain('居住登记满半年');
    expect(page.content).not.toContain('bad()');
  });

  it('解析 Bing RSS 备用搜索源', () => {
    const xml = `<rss><channel><item><title>通知</title><link>https://example.com/a</link><description>摘要</description></item></channel></rss>`;
    expect(websearch._internal.parseBingRss(xml)).toEqual([
      { title: '通知', url: 'https://example.com/a', snippet: '摘要' },
    ]);
  });
});

describe('AI 网页 RAG Prompt', () => {
  it('网页资料进入 Prompt，并要求按编号引用', () => {
    const messages = ai.buildRagPrompt(
      [{ title: '社区知识', content: '物业电话 020-88888888' }],
      '广州居住证怎么办',
      [{ title: '官方指南', url: 'https://www.gz.gov.cn/a', content: '需要先办理居住登记。' }],
    );
    const text = messages.map((m) => m.content).join('\n');
    expect(text).toContain('官方指南');
    expect(text).toContain('https://www.gz.gov.cn/a');
    expect(text).toContain('需要先办理居住登记');
    expect(text).toContain('[编号]');
  });
});