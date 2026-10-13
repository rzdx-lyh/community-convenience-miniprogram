/**
 * 便民电话簿 mock 与后端 seed 的对齐单测
 *
 * 【背景】原 mock 只有 8 条，且含两个**虚构号段** `020-8765xxxx`
 * （社区卫生站 020-87651120 / 自来水报修 020-87653333），真源是 `020-8888xxxx`。
 * 演示走 mock 时电话簿会显示一套根本不存在的号码，必须钉死。
 *
 * 【真源】后端 scripts/seed-data.json → phonebook（pb-1 … pb-11），共 11 条。
 * 本文件把条数、号码集合、分类分布全部锁住：以后谁改漏一条 / 改错一个号，这里立刻红。
 *
 * 说明：mock 数据与后端种子同处一个约定的常量表，测试用**硬编码期望表**比对，
 * 不跨仓库读文件（避免他人机器上路径不存在导致假红）；改种子时同步改本表。
 */
import { beforeAll, describe, expect, it } from 'vitest';

type MockDataModule = typeof import('../miniprogram/mock/data');

/** 后端 seed-data.json → phonebook 的真源快照（11 条，顺序按 sort） */
const SEED_PHONEBOOK: Array<{ _id: string; name: string; phone: string; category: PhoneItem['category'] }> = [
  { _id: 'pb-1', name: '物业服务中心', phone: '020-88888888', category: 'property' },
  { _id: 'pb-2', name: '社区居委会', phone: '020-88886666', category: 'government' },
  { _id: 'pb-3', name: '社区卫生服务站', phone: '020-88885555', category: 'medical' },
  { _id: 'pb-4', name: '自来水供水热线', phone: '020-88884444', category: 'life' },
  { _id: 'pb-5', name: '供电服务热线', phone: '020-88883333', category: 'life' },
  { _id: 'pb-6', name: '燃气服务热线', phone: '020-88882222', category: 'life' },
  { _id: 'pb-7', name: '开锁服务', phone: '020-88881111', category: 'life' },
  { _id: 'pb-8', name: '急救中心', phone: '120', category: 'emergency' },
  { _id: 'pb-9', name: '社区养老服务中心', phone: '020-88880000', category: 'life' },
  { _id: 'pb-10', name: '报警求助', phone: '110', category: 'emergency' },
  { _id: 'pb-11', name: '火警', phone: '119', category: 'emergency' },
];

let mockData: MockDataModule;

/** 走真实 mock handler 取电话簿（不是复制一份逻辑） */
async function fetchPhonebook(category?: PhoneItem['category']): Promise<PhoneItem[]> {
  const res = (await mockData.mockHandlers['phonebook:list'](
    category ? { category } : {},
  )) as PhonebookListResult;
  return res.list ?? [];
}

beforeAll(async () => {
  mockData = await import('../miniprogram/mock/data');
});

describe('phonebook:list · 全量 11 条', () => {
  it('返回 11 条（原 mock 只有 8 条，差 4 处）', async () => {
    const list = await fetchPhonebook();
    expect(list).toHaveLength(11);
  });

  it('按 sort 升序返回（契约：不分页，sort 升序）', async () => {
    const list = await fetchPhonebook();
    expect(list.map((p) => p.sort)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });

  it('逐条与后端 seed 对齐：_id / name / phone / category 全等', async () => {
    const list = await fetchPhonebook();
    expect(list.map((p) => ({ _id: p._id, name: p.name, phone: p.phone, category: p.category }))).toEqual(
      SEED_PHONEBOOK,
    );
  });

  it('号码集合与真源完全一致（多一号、少一号、错一号都会红）', async () => {
    const list = await fetchPhonebook();
    expect(list.map((p) => p.phone).sort()).toEqual(SEED_PHONEBOOK.map((p) => p.phone).sort());
  });

  it('🔴 虚构号段 020-8765 不得再出现', async () => {
    const list = await fetchPhonebook();
    const fake = list.filter((p) => p.phone.indexOf('020-8765') === 0);
    expect(fake.map((p) => `${p.name}:${p.phone}`)).toEqual([]);
  });
});

describe('phonebook:list · 分类分布', () => {
  it('emergency 恰好 3 条，号码集合为 [110, 119, 120]', async () => {
    const list = await fetchPhonebook('emergency');
    expect(list).toHaveLength(3);
    expect(list.map((p) => p.phone).sort()).toEqual(['110', '119', '120']);
  });

  it('life 恰好 5 条（自来水 / 供电 / 燃气 / 开锁 / 养老）', async () => {
    const list = await fetchPhonebook('life');
    expect(list.map((p) => p.phone).sort()).toEqual([
      '020-88880000',
      '020-88881111',
      '020-88882222',
      '020-88883333',
      '020-88884444',
    ]);
  });

  it('property 1 条（物业 020-88888888）· government 1 条（居委会 020-88886666）· medical 1 条（卫生服务站 020-88885555）', async () => {
    expect((await fetchPhonebook('property')).map((p) => p.phone)).toEqual(['020-88888888']);
    expect((await fetchPhonebook('government')).map((p) => p.phone)).toEqual(['020-88886666']);
    expect((await fetchPhonebook('medical')).map((p) => p.phone)).toEqual(['020-88885555']);
  });

  it('3+5+1+1+1 = 11，分类不重不漏', async () => {
    const all = await fetchPhonebook();
    const sum =
      (await fetchPhonebook('emergency')).length +
      (await fetchPhonebook('life')).length +
      (await fetchPhonebook('property')).length +
      (await fetchPhonebook('government')).length +
      (await fetchPhonebook('medical')).length;
    expect(sum).toBe(all.length);
  });
});

describe('紧急求助面板 · 本地兜底号码与真源同源', () => {
  it('兜底每条号码都能在 seed 11 条里找到（断网保命，但号码不得自造）', async () => {
    const { LOCAL_EMERGENCY_CONTACTS } = await import('../miniprogram/config/emergency');
    const seedPhones = SEED_PHONEBOOK.map((p) => p.phone);
    for (const c of LOCAL_EMERGENCY_CONTACTS) {
      expect(seedPhones, `${c.name} / ${c.phone}`).toContain(c.phone);
    }
  });

  it('兜底里也没有 020-8765 号段', async () => {
    const { LOCAL_EMERGENCY_CONTACTS } = await import('../miniprogram/config/emergency');
    expect(LOCAL_EMERGENCY_CONTACTS.filter((c) => c.phone.indexOf('020-8765') === 0)).toEqual([]);
  });
});
