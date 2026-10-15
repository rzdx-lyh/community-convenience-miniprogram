'use strict';

/**
 * 便民号码真源（唯一出处）。
 *
 * 背景（架构评审新增约束）：CR-012 安全话术里写死了真实号码，
 * 一旦与 phonebook 集合种子漂移，就会出现「话术让打 A 号、便民电话簿里是 B 号」，
 * 评委现场照着打就能发现。因此号码统一在此处定义：
 *   - cloudfunctions/shared/safety.js 的话术从这里取
 *   - scripts/seed.mjs 生成 phonebook 种子也从这里取（用 createRequire 引本 CJS 模块）
 */
const HOTLINE = {
  PROPERTY: '020-88888888', // 物业服务中心（24 小时值班）
  COMMITTEE: '020-88886666', // 社区居委会
  FIRE: '119', // 火警
  POLICE: '110', // 报警
  MEDICAL: '120', // 急救
  LEGAL_AID: '12348', // 公共法律服务热线
};

module.exports = { HOTLINE };
