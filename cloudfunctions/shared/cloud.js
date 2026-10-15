'use strict';

/**
 * wx-server-sdk 单一入口。
 * - 云环境：返回真实 SDK，所有读写走云数据库
 * - 本地/自测：require 失败（或未安装）→ null，全部走 shared/db.js 的 mock 适配层
 * - 强制 mock：CCF_FORCE_MOCK=1（联调与自测用）
 * 密钥/环境 ID 一律来自环境变量，代码零明文。
 */
let cloud = null;
try {
  cloud = require('wx-server-sdk');
} catch (e) {
  cloud = null; // 本地 mock 模式：无 wx-server-sdk
}

if (cloud && process.env.CCF_FORCE_MOCK === '1') {
  console.log('[cloud] CCF_FORCE_MOCK=1，强制本地 mock 模式');
  cloud = null;
}

let cloudDb = null;
if (cloud) {
  try {
    cloud.init({ env: process.env.TCB_ENV || cloud.DYNAMIC_CURRENT_ENV });
    cloudDb = cloud.database();
  } catch (e) {
    console.warn('[cloud] init 失败，降级 mock：', e && e.message);
    cloud = null;
    cloudDb = null;
  }
}

module.exports = { cloud, cloudDb, isCloud: !!cloudDb };
