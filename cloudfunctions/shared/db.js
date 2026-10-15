'use strict';

/**
 * DB 适配层：同一份业务代码在「微信云开发」与「本地 mock」两种模式下零改动切换。
 *
 * 云环境  ：直接透传 wx-server-sdk 的 database() API
 * 本地mock：内存集合（可自动载入 scripts/seed-data.json），
 *           API 面严格对齐云数据库子集：
 *           collection().where().orderBy().skip().limit().get()/count()
 *           collection().add() / .doc(id).get()/.update()/.remove()
 *           db.command（gt/gte/lt/lte/neq/in/nin/inc/mul/set/remove/and/or）
 *           db.RegExp({regexp, options})
 *
 * 身份：cloudfunctions/shared/auth.js 的 getOpenId()（云环境取 wxContext.OPENID，
 *      mock 取 globalThis.__MOCK_OPENID__，由自测脚本/本地服务按场景注入）
 */
const fs = require('fs');
const path = require('path');
const { cloud, cloudDb, isCloud } = require('./cloud');

/* ------------------------------------------------------------------ *
 * 1. 查询指令（command）
 * ------------------------------------------------------------------ */
function makeCommand() {
  const w = (name) => (...args) => ({ __cmd: name, args });
  return {
    gt: w('gt'), gte: w('gte'), lt: w('lt'), lte: w('lte'),
    eq: w('eq'), neq: w('neq'), in: w('in'), nin: w('nin'),
    inc: w('inc'), mul: w('mul'), set: w('set'), remove: w('remove'),
    exists: w('exists'), and: w('and'), or: w('or'),
  };
}
const MOCK_COMMAND = makeCommand();
const isCmd = (v) => !!(v && typeof v === 'object' && typeof v.__cmd === 'string');
const isRegexpCmd = (v) => !!(v && typeof v === 'object' && v.__regexp);

/* ------------------------------------------------------------------ *
 * 2. mock 存储
 * ------------------------------------------------------------------ */
// cloudfunctions/shared/ → 上两级即仓库根目录
const SEED_FILE = path.join(__dirname, '..', '..', 'scripts', 'seed-data.json');
const store = { collections: new Map(), seeded: false };

const clone = (v) => (v === undefined ? v : JSON.parse(JSON.stringify(v)));
const genId = () => 'm_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

function autoSeed() {
  if (store.seeded) return;
  store.seeded = true;
  if (process.env.CCF_MOCK_NO_SEED === '1') return;
  try {
    const data = JSON.parse(fs.readFileSync(SEED_FILE, 'utf8'));
    Object.keys(data || {}).forEach((k) => {
      if (Array.isArray(data[k])) store.collections.set(k, clone(data[k]));
    });
    console.log('[db][mock] 已载入种子数据：' + [...store.collections.keys()].join(', '));
  } catch (e) {
    console.log('[db][mock] 未载入种子数据（可先执行 node scripts/seed.mjs）：' + (e && e.message));
  }
}

function rowsOf(name) {
  autoSeed();
  if (!store.collections.has(name)) store.collections.set(name, []);
  return store.collections.get(name);
}

/* ------------------------------------------------------------------ *
 * 3. 条件匹配（mock）
 * ------------------------------------------------------------------ */
function matchValue(val, cond) {
  if (isRegexpCmd(cond)) {
    const re = new RegExp(cond.__regexp.regexp, cond.__regexp.options || '');
    if (Array.isArray(val)) return val.some((v) => re.test(String(v)));
    return re.test(String(val === undefined || val === null ? '' : val));
  }
  if (isCmd(cond)) {
    const v = cond.args[0];
    switch (cond.__cmd) {
      case 'gt': return val > v;
      case 'gte': return val >= v;
      case 'lt': return val < v;
      case 'lte': return val <= v;
      case 'eq': return val === v;
      case 'neq': return val !== v;
      case 'in': return Array.isArray(v) && v.includes(val);
      case 'nin': return Array.isArray(v) && !v.includes(val);
      case 'exists': return (val !== undefined) === (v !== false);
      default: return false;
    }
  }
  // 数组字段（如 tags）：云数据库语义为「包含该元素即命中」
  if (Array.isArray(val)) return val.some((x) => x === cond);
  return val === cond;
}

function matchDoc(doc, where) {
  if (!where) return true;
  if (isCmd(where)) {
    if (where.__cmd === 'or') return (where.args[0] || []).some((w) => matchDoc(doc, w));
    if (where.__cmd === 'and') return (where.args[0] || []).every((w) => matchDoc(doc, w));
    return false;
  }
  return Object.keys(where).every((k) => matchValue(doc[k], where[k]));
}

function cmpValue(a, b) {
  if (a === b) return 0;
  const an = a === undefined || a === null;
  const bn = b === undefined || b === null;
  if (an && bn) return 0;
  if (an) return -1;
  if (bn) return 1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (typeof a === 'boolean' && typeof b === 'boolean') return (a ? 1 : 0) - (b ? 1 : 0);
  return String(a) < String(b) ? -1 : 1;
}

function applyUpdate(doc, data) {
  Object.keys(data || {}).forEach((k) => {
    const v = data[k];
    if (isCmd(v)) {
      switch (v.__cmd) {
        case 'inc': doc[k] = (Number(doc[k]) || 0) + Number(v.args[0] || 0); break;
        case 'mul': doc[k] = (Number(doc[k]) || 0) * Number(v.args[0] || 1); break;
        case 'set': doc[k] = v.args[0]; break;
        case 'remove': delete doc[k]; break;
        default: doc[k] = v.args[0]; break;
      }
    } else {
      doc[k] = clone(v);
    }
  });
}

/* ------------------------------------------------------------------ *
 * 4. mock 集合实现
 * ------------------------------------------------------------------ */
class MockCollection {
  constructor(name) {
    this.name = name;
    this._conds = [];
    this._orders = [];
    this._skip = 0;
    this._limit = 0;
    this._docId = null;
  }

  doc(id) {
    const c = new MockCollection(this.name);
    c._docId = id;
    return c;
  }

  where(cond) { this._conds.push(cond); return this; }
  orderBy(field, dir = 'asc') {
    this._orders.push([field, String(dir).toLowerCase() === 'desc' ? -1 : 1]);
    return this;
  }
  skip(n) { this._skip = Math.max(0, Number(n) || 0); return this; }
  limit(n) { this._limit = Math.max(0, Number(n) || 0); return this; }

  _matched() {
    let out = rowsOf(this.name).filter((d) => this._conds.every((c) => matchDoc(d, c)));
    if (this._orders.length) {
      out = out.slice().sort((a, b) => {
        for (const [f, dir] of this._orders) {
          const c = cmpValue(a[f], b[f]);
          if (c !== 0) return c * dir;
        }
        return 0;
      });
    }
    return out;
  }

  async get() {
    if (this._docId !== null && this._docId !== undefined) {
      const d = rowsOf(this.name).find((x) => x._id === this._docId);
      return { data: d ? clone(d) : null };
    }
    const out = this._matched();
    const sliced = this._limit > 0 ? out.slice(this._skip, this._skip + this._limit) : out.slice(this._skip);
    return { data: clone(sliced) };
  }

  async count() { return { total: this._matched().length }; }

  async add({ data } = {}) {
    const doc = clone(data || {});
    if (!doc._id) doc._id = genId();
    rowsOf(this.name).push(doc);
    return { _id: doc._id };
  }

  async update({ data } = {}) {
    if (this._docId !== null && this._docId !== undefined) {
      const d = rowsOf(this.name).find((x) => x._id === this._docId);
      if (!d) return { stats: { updated: 0 } };
      applyUpdate(d, data || {});
      return { stats: { updated: 1 } };
    }
    const hit = this._matched();
    hit.forEach((d) => applyUpdate(d, data || {}));
    return { stats: { updated: hit.length } };
  }

  async remove() {
    if (this._docId !== null && this._docId !== undefined) {
      const arr = rowsOf(this.name);
      const i = arr.findIndex((x) => x._id === this._docId);
      if (i < 0) return { stats: { removed: 0 } };
      arr.splice(i, 1);
      return { stats: { removed: 1 } };
    }
    return { stats: { removed: 0 } };
  }
}

/* ------------------------------------------------------------------ *
 * 5. 对外 db 对象
 * ------------------------------------------------------------------ */
const db = {
  /** 云环境透传 SDK command；mock 返回本地解释的指令构造器 */
  command: isCloud ? cloudDb.command : MOCK_COMMAND,

  /** db.RegExp({regexp, options}) —— 两种模式语义一致 */
  RegExp: isCloud
    ? (opt) => cloudDb.RegExp(opt)
    : (opt) => ({ __regexp: { regexp: (opt && opt.regexp) || '', options: (opt && opt.options) || '' } }),

  collection(name) {
    return isCloud ? cloudDb.collection(name) : new MockCollection(name);
  },

  get __isMock() { return !isCloud; },

  /** mock 模式专用：载入/重置/导出数据（仅自测与本地联调用，云环境下为空操作） */
  __mock: {
    isMock: !isCloud,
    load(data = {}) {
      store.seeded = true;
      Object.keys(data).forEach((k) => {
        if (Array.isArray(data[k])) store.collections.set(k, clone(data[k]));
      });
    },
    reset() {
      store.collections.clear();
      store.seeded = false;
    },
    dump() {
      const out = {};
      store.collections.forEach((v, k) => { out[k] = clone(v); });
      return out;
    },
    collection(name) { return rowsOf(name); },
  },
};

module.exports = { db };
