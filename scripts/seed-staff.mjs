#!/usr/bin/env node
/**
 * 一次性生成工作人员演示账号（初始密码只在终端展示一次）。
 *
 * 用法：node scripts/seed-staff.mjs
 * 产物：scripts/seed/import/staff_accounts.json（JSON Lines，控制台导入）
 *
 * 安全：脚本和产物只保存 scrypt 哈希，不保存明文密码。
 */
import { randomBytes } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { createPasswordRecord } = require('../cloudfunctions/shared/staffAuth.js');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'scripts', 'seed', 'import');
const OUT_JSONL = path.join(ROOT, 'scripts', 'seed', 'staff_accounts.jsonl');
mkdirSync(OUT_DIR, { recursive: true });

const now = new Date().toISOString();
const defs = [
  { username: 'property01', displayName: '物业小王', role: 'property', skills: [] },
  { username: 'admin01', displayName: '社区管理员', role: 'admin', skills: [] },
  { username: 'super01', displayName: '超级管理员', role: 'super_admin', skills: [] },
  { username: 'repair01', displayName: '维修师傅老张', role: 'maintenance', skills: ['water', 'electric', 'door', 'public', 'other'] },
];

const credentials = [];
const rows = defs.map((def) => {
  const password = randomBytes(12).toString('base64url');
  const record = createPasswordRecord(password);
  credentials.push({ username: def.username, password, role: def.role });
  return {
    _id: 'staff-' + def.username,
    username: def.username,
    displayName: def.displayName,
    phone: '',
    passwordHash: record.passwordHash,
    passwordSalt: record.passwordSalt,
    hashAlgorithm: record.hashAlgorithm,
    role: def.role,
    status: 'active',
    skills: def.skills,
    communityId: 'sunshine-community',
    mustChangePassword: true,
    failedCount: 0,
    lockUntil: '',
    lastLoginAt: '',
    createdBy: 'seed-script',
    createdAt: now,
    updatedAt: now,
  };
});

const jsonl = rows.map((row) => JSON.stringify(row)).join('\n') + '\n';
writeFileSync(path.join(OUT_DIR, 'staff_accounts.json'), jsonl);
writeFileSync(OUT_JSONL, jsonl);

console.log('已生成 staff_accounts 演示账号，初始密码只显示这一次：');
for (const item of credentials) {
  console.log(`  ${item.role.padEnd(12)}  ${item.username.padEnd(12)}  ${item.password}`);
}
console.log('\n导入文件：scripts/seed/import/staff_accounts.json');
console.log('首次登录后必须修改密码；请勿把终端输出中的密码写入仓库。');
