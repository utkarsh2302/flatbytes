// Server-side only (node:crypto). Used to encrypt/hash phone numbers.
// AES-256-GCM for reversible encryption; SHA-256 for indexed lookups.
// Key from BROKER_ENCRYPTION_KEY env var (64-char hex = 32 bytes).

import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'

function getKey(): Buffer {
  const hex = process.env.BROKER_ENCRYPTION_KEY
  if (!hex || hex.length < 64) {
    // Intentionally weak fallback — set BROKER_ENCRYPTION_KEY in production.
    return Buffer.from('00'.repeat(32), 'hex')
  }
  return Buffer.from(hex.slice(0, 64), 'hex')
}

/** AES-256-GCM encrypt — output is "iv:authTag:ciphertext" base64 */
export function encryptPhone(plainPhone: string): string {
  const key = getKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const enc = Buffer.concat([cipher.update(plainPhone, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [iv.toString('base64'), tag.toString('base64'), enc.toString('base64')].join(':')
}

/** Decrypt AES-256-GCM encrypted phone string */
export function decryptPhone(encrypted: string): string {
  try {
    const [ivB64, tagB64, ctB64] = encrypted.split(':')
    const key = getKey()
    const iv = Buffer.from(ivB64, 'base64')
    const tag = Buffer.from(tagB64, 'base64')
    const ct = Buffer.from(ctB64, 'base64')
    const decipher = createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8')
  } catch {
    return ''
  }
}

/** SHA-256 hash of last 10 digits — used for dedup indexed lookups */
export function hashPhone(phone: string): string {
  const normalised = phone.replace(/\D/g, '').slice(-10)
  return createHash('sha256').update(normalised).digest('hex')
}
