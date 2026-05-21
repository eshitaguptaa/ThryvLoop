import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const SALT = 'thryvloop-workspace-v1';
const ALGO = 'aes-256-gcm';

function getKey() {
  const secret = (process.env.WORKSPACE_TOKEN_ENCRYPTION_KEY || '').trim();
  if (!secret || secret.length < 16) {
    throw new Error('WORKSPACE_TOKEN_ENCRYPTION_KEY must be set (min 16 characters)');
  }
  return scryptSync(secret, SALT, 32);
}

/** @param {string} plaintext */
export function encryptToken(plaintext) {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64url')}.${tag.toString('base64url')}.${enc.toString('base64url')}`;
}

/** @param {string} payload */
export function decryptToken(payload) {
  const key = getKey();
  const [ivB64, tagB64, dataB64] = payload.split('.');
  if (!ivB64 || !tagB64 || !dataB64) throw new Error('Invalid encrypted token');
  const iv = Buffer.from(ivB64, 'base64url');
  const tag = Buffer.from(tagB64, 'base64url');
  const data = Buffer.from(dataB64, 'base64url');
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}
