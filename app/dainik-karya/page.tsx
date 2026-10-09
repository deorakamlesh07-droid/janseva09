import { Metadata } from 'next'
import { getDainikKaryaList } from '@/lib/dainikKarya'
import DainikKaryaClient from './DainikKaryaClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'दैनिक कार्य रिपोर्ट · वार्ड 09, जोधपुर | जनसेवा 09',
  description: 'वार्ड 09, जोधपुर में प्रतिदिन होने वाले सफ़ाई, सड़क, स्ट्रीट लाइट और जनहित कार्यों का दैनिक ब्योरा एवं रिपोर्ट।',
}

export default async function DainikKaryaPage() {
  const list = await getDainikKaryaList()
  return <DainikKaryaClient initialList={list} />
}
