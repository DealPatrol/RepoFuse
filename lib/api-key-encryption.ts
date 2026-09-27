import crypto from 'crypto'

const ENCRYPTION_ALGORITHM = 'aes-256-gcm'

function getEncryptionSecret(): string {
  const secret = process.env.ENCRYPTION_SECRET?.trim()
  if (!secret) {
    throw new Error('ENCRYPTION_SECRET is required to encrypt API keys')
  }
  return secret
}

/**
 * Encrypt an API key using AES-256-GCM
 * Uses userId as part of the key material to ensure keys are user-specific
 */
export function encryptAPIKey(apiKey: string, userId: string): string {
  const iv = crypto.randomBytes(16)
  const salt = crypto.randomBytes(16)

  // Derive key from userId + environment secret
  const keyMaterial = crypto.pbkdf2Sync(
    `${userId}:${getEncryptionSecret()}`,
    salt,
    100000,
    32,
    'sha256'
  )

  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, keyMaterial, iv)
  let encrypted = cipher.update(apiKey, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const authTag = cipher.getAuthTag()

  // Return: salt + iv + authTag + encrypted (all base64)
  return Buffer.concat([salt, iv, authTag, Buffer.from(encrypted, 'hex')]).toString('base64')
}

/**
 * Decrypt an API key using AES-256-GCM
 */
export function decryptAPIKey(encryptedKey: string, userId: string): string {
  const buffer = Buffer.from(encryptedKey, 'base64')

  const salt = buffer.subarray(0, 16)
  const iv = buffer.subarray(16, 32)
  const authTag = buffer.subarray(32, 48)
  const encrypted = buffer.subarray(48).toString('hex')

  // Derive same key from userId + environment secret
  const keyMaterial = crypto.pbkdf2Sync(
    `${userId}:${getEncryptionSecret()}`,
    salt,
    100000,
    32,
    'sha256'
  )

  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, keyMaterial, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

/**
 * Create a hash of the API key for logging/comparison without revealing the full key
 */
export function hashAPIKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex').substring(0, 8)
}
