import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

export const ADMIN_COOKIE_NAME = 'ward9_admin_session'
const SESSION_MAX_AGE = 7 * 24 * 60 * 60 // 7 days in seconds

// Secret used for signing the HMAC token
function getSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_PASSWORD + '_ward9_secure_salt_73849102'
  )
}

/**
 * Creates a cryptographically signed session token:
 * format: <timestamp>.<signature>
 */
export function createAdminToken(): string {
  const secret = getSecret()
  const timestamp = Date.now().toString()
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(`admin:${timestamp}`)
  const signature = hmac.digest('hex')
  return `${timestamp}.${signature}`
}

/**
 * Validates the session token signature and expiration
 */
export function verifyAdminToken(token: string | null | undefined): boolean {
  if (!token) return false
  const parts = token.split('.')
  if (parts.length !== 2) return false

  const [timestampStr, signature] = parts
  const timestamp = parseInt(timestampStr, 10)
  if (isNaN(timestamp)) return false

  // Check expiration (7 days)
  const now = Date.now()
  if (now - timestamp > SESSION_MAX_AGE * 1000 || timestamp > now + 60000) {
    return false // expired or from future
  }

  const secret = getSecret()
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(`admin:${timestampStr}`)
  const expectedSignature = hmac.digest('hex')

  // Timing safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    )
  } catch {
    return false
  }
}

/**
 * Verifies admin session from a NextRequest
 */
export function verifyAdminSession(req: NextRequest): boolean {
  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value
  return verifyAdminToken(token)
}

/**
 * Attaches the secure HTTP-Only admin session cookie to a NextResponse
 */
export function setAdminSessionCookie(res: NextResponse): void {
  const token = createAdminToken()
  res.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })
}

/**
 * Clears the admin session cookie on logout
 */
export function clearAdminSessionCookie(res: NextResponse): void {
  res.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}

// ── In-Memory IP Rate Limiter for Login Attempts ──
interface RateLimitRecord {
  attempts: number
  lockoutUntil: number
}

const loginAttempts = new Map<string, RateLimitRecord>()

export function isLoginRateLimited(ip: string): boolean {
  const record = loginAttempts.get(ip)
  if (!record) return false
  const now = Date.now()
  if (record.lockoutUntil > now) return true
  // Lockout expired, reset
  if (record.lockoutUntil !== 0 && record.lockoutUntil <= now) {
    loginAttempts.delete(ip)
  }
  return false
}

export function recordFailedLogin(ip: string): { remainingAttempts: number; isLocked: boolean } {
  const now = Date.now()
  const record = loginAttempts.get(ip) || { attempts: 0, lockoutUntil: 0 }
  record.attempts += 1

  if (record.attempts >= 5) {
    record.lockoutUntil = now + 15 * 60 * 1000 // 15 minutes lockout
    loginAttempts.set(ip, record)
    return { remainingAttempts: 0, isLocked: true }
  }

  loginAttempts.set(ip, record)
  return { remainingAttempts: 5 - record.attempts, isLocked: false }
}

export function clearFailedLogin(ip: string): void {
  loginAttempts.delete(ip)
}
