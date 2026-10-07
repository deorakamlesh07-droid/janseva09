import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side client (uses service role key — bypasses RLS)
export function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
  return createClient(url, key)
}

export type Shikayat = {
  id: number
  code: string
  name: string
  phone: string
  mohalla: string
  category: string
  detail: string
  photo_url: string | null
  status: 'दर्ज' | 'स्वीकृत' | 'काम चालू' | 'काम पूरा' | 'पूरा' | 'देखा' | 'निगम को भेजा' | 'हटाई'
  deadline: string | null
  after_photo_url: string | null
  admin_note: string | null
  created_at: string
  updated_at: string | null
}

export type KhoyaPaya = {
  id: number
  kind: 'खोया' | 'मिला'
  area: string
  title: string
  detail: string
  photo_url: string | null
  name: string | null
  phone: string
  created_at: string
}

export type BloodDonor = {
  id: number
  name: string
  blood_group: string
  mohalla: string | null
  phone: string
  created_at: string
}

export type BloodRequest = {
  id: number
  blood_group: string
  name: string | null
  phone: string
  detail: string | null
  created_at: string
}
