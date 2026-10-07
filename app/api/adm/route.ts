import { NextRequest, NextResponse } from 'next/server'
import {
  setAdminSessionCookie,
  clearAdminSessionCookie,
  verifyAdminSession,
  isLoginRateLimited,
  recordFailedLogin,
  clearFailedLogin,
} from '@/lib/auth'

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return req.headers.get('x-real-ip') || '127.0.0.1'
}

// Check if currently authenticated via HTTP-only cookie
export async function GET(req: NextRequest) {
  const isAuthed = verifyAdminSession(req)
  return NextResponse.json({ ok: true, authed: isAuthed })
}

// Login or Logout
export async function POST(req: NextRequest) {
  const ip = getClientIp(req)

  // 1. Check Rate Limiting
  if (isLoginRateLimited(ip)) {
    return NextResponse.json(
      { error: 'बहुत सारे गलत प्रयास। कृपया 15 मिनट बाद पुनः प्रयास करें।' },
      { status: 429 }
    )
  }

  try {
    const body = await req.json().catch(() => ({}))

    // Handle logout action
    if (body.action === 'logout') {
      const res = NextResponse.json({ ok: true, authed: false })
      clearAdminSessionCookie(res)
      return res
    }

    const { pw } = body

    if (!pw || pw !== process.env.ADMIN_PASSWORD) {
      const { remainingAttempts, isLocked } = recordFailedLogin(ip)
      const msg = isLocked
        ? 'गलत पासवर्ड। बहुत अधिक प्रयासों के कारण 15 मिनट के लिए लॉक कर दिया गया है।'
        : `गलत पासवर्ड। ${remainingAttempts} प्रयास शेष हैं।`

      return NextResponse.json({ error: msg }, { status: 401 })
    }

    // Success: Clear failed attempts and set HTTP-only signed session cookie
    clearFailedLogin(ip)
    const res = NextResponse.json({ ok: true, authed: true })
    setAdminSessionCookie(res)
    return res
  } catch (err: any) {
    console.error('Admin auth error:', err)
    return NextResponse.json({ error: 'सर्वर में त्रुटि आई' }, { status: 500 })
  }
}
