'use strict';

/**
 * 手机号 AES-256-GCM 加密存储 + 展示脱敏（PRD 第 7 节隐私合规）
 * 密钥只走环境变量 PHONE_AES_KEY（64 位 hex：`openssl rand -hex 32`）；
 * 未配置时仅本地 mock 使用固定开发密钥并打告警日志，真环境必须配置。
 */
const nodeCrypto = require('crypto');

const DEV_KEY = nodeCrypto.createHash('sha256').update('community-convenience-dev-phone-key').digest();

function aesKey() {
  const hex = process.env.PHONE_AES_KEY;
  if (hex && /^[0-9a-f]{64}$/i.test(hex)) return Buffer.from(hex, 'hex');
  console.warn('[crypto] 未配置 PHONE_AES_KEY，使用本地开发密钥（真环境必须在控制台配置）');
  return DEV_KEY;
}

/** 加密：v1.<iv>.<tag>.<ciphertext>，全部 base64 */
function encryptPhone(plain) {
  if (!plain) return '';
  const iv = nodeCrypto.randomBytes(12);
  const c = nodeCrypto.createCipheriv('aes-256-gcm', aesKey(), iv);
  const enc = Buffer.concat([c.update(String(plain), 'utf8'), c.final()]);
  const tag = c.getAuthTag();
  return ['v1', iv.toString('base64'), tag.toString('base64'), enc.toString('base64')].join('.');
}

/** 解密：非 v1. 前缀视为历史明文，原样返回（向后兼容，不抛错） */
function decryptPhone(stored) {
  if (!stored) return '';
  const s = String(stored);
  if (!s.startsWith('v1.')) return s;
  try {
    const [, ivB64, tagB64, dataB64] = s.split('.');
    const d = nodeCrypto.createDecipheriv('aes-256-gcm', aesKey(), Buffer.from(ivB64, 'base64'));
    d.setAuthTag(Buffer.from(tagB64, 'base64'));
    return Buffer.concat([d.update(Buffer.from(dataB64, 'base64')), d.final()]).toString('utf8');
  } catch (e) {
    console.warn('[crypto] 手机号解密失败：', e && e.message);
    return '';
  }
}

/** 脱敏：138****1234 */
function maskPhone(plain) {
  const s = String(plain || '');
  if (/^1\d{10}$/.test(s)) return s.slice(0, 3) + '****' + s.slice(7);
  if (s.length > 4) return s.slice(0, 3) + '****' + s.slice(-4);
  return s;
}

const isValidPhone = (v) => /^1[3-9]\d{9}$/.test(String(v || '').trim());

module.exports = { encryptPhone, decryptPhone, maskPhone, isValidPhone };
