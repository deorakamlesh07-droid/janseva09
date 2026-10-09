import { getServiceClient, DainikKarya } from './supabase'
import fs from 'fs'
import path from 'path'

const LOCAL_DATA_PATH = path.join(process.cwd(), 'data', 'dainik_karya.json')

function ensureLocalDataDir() {
  const dir = path.dirname(LOCAL_DATA_PATH)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function readLocalData(): DainikKarya[] {
  try {
    ensureLocalDataDir()
    if (!fs.existsSync(LOCAL_DATA_PATH)) {
      // Seed with initial sample activity
      const initial: DainikKarya[] = [
        {
          id: 1,
          title: 'वार्ड 09 मुख्य मार्ग एवं गलियों में विशेष सफ़ाई अभियान',
          description: 'वार्ड 09 में नगर निगम सफ़ाई कर्मचारियों के साथ मिलकर मुख्य सड़क व आंतरिक गलियों से कचरा उठवाया गया तथा नालियों की डीसिल्टिंग व सफ़ाई करवाई गई।',
          work_date: new Date().toISOString().slice(0, 10),
          area: 'मुख्य बाजार व स्टेशन रोड',
          category: 'सफ़ाई कार्य',
          photo_url: null,
          created_at: new Date().toISOString(),
        },
      ]
      fs.writeFileSync(LOCAL_DATA_PATH, JSON.stringify(initial, null, 2), 'utf8')
      return initial
    }
    const raw = fs.readFileSync(LOCAL_DATA_PATH, 'utf8')
    return JSON.parse(raw) as DainikKarya[]
  } catch (err) {
    console.error('[DainikKarya] Local read error:', err)
    return []
  }
}

function writeLocalData(data: DainikKarya[]) {
  try {
    ensureLocalDataDir()
    fs.writeFileSync(LOCAL_DATA_PATH, JSON.stringify(data, null, 2), 'utf8')
  } catch (err) {
    console.error('[DainikKarya] Local write error:', err)
  }
}

export async function getDainikKaryaList(): Promise<DainikKarya[]> {
  try {
    const supabase = getServiceClient()
    const { data, error } = await supabase
      .from('dainik_karya')
      .select('*')
      .order('work_date', { ascending: false })
      .order('id', { ascending: false })

    if (error) {
      console.warn('[DainikKarya] Supabase select warning (using local fallback):', error.message)
      return readLocalData().sort((a, b) => (b.work_date > a.work_date ? 1 : -1) || b.id - a.id)
    }

    return (data as DainikKarya[]) || []
  } catch (err) {
    console.error('[DainikKarya] Fetch exception, using local store:', err)
    return readLocalData()
  }
}

export async function addDainikKarya(item: {
  title: string
  description: string
  work_date: string
  area?: string | null
  category: string
  photo_url?: string | null
}): Promise<{ ok: boolean; data?: DainikKarya; error?: string }> {
  try {
    const supabase = getServiceClient()
    const { data, error } = await supabase
      .from('dainik_karya')
      .insert({
        title: item.title,
        description: item.description,
        work_date: item.work_date,
        area: item.area || null,
        category: item.category || 'सफ़ाई कार्य',
        photo_url: item.photo_url || null,
      })
      .select()
      .single()

    if (error) {
      console.warn('[DainikKarya] Supabase insert warning (saving locally):', error.message)
      const local = readLocalData()
      const newItem: DainikKarya = {
        id: Date.now(),
        title: item.title,
        description: item.description,
        work_date: item.work_date,
        area: item.area || null,
        category: item.category || 'सफ़ाई कार्य',
        photo_url: item.photo_url || null,
        created_at: new Date().toISOString(),
      }
      local.unshift(newItem)
      writeLocalData(local)
      return { ok: true, data: newItem }
    }

    // Also mirror to local cache for instant resilience
    try {
      const local = readLocalData().filter(x => x.id !== (data as DainikKarya).id)
      local.unshift(data as DainikKarya)
      writeLocalData(local)
    } catch {}

    return { ok: true, data: data as DainikKarya }
  } catch (err: any) {
    console.error('[DainikKarya] Add exception:', err)
    return { ok: false, error: err.message || 'त्रुटि आई' }
  }
}

export async function removeDainikKarya(id: number): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = getServiceClient()
    const { error } = await supabase.from('dainik_karya').delete().eq('id', id)

    // Also remove from local
    const local = readLocalData().filter(item => item.id !== id)
    writeLocalData(local)

    if (error) {
      console.warn('[DainikKarya] Supabase delete warning:', error.message)
    }

    return { ok: true }
  } catch (err: any) {
    console.error('[DainikKarya] Remove exception:', err)
    return { ok: false, error: err.message }
  }
}
