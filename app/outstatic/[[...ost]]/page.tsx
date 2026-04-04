import { Outstatic } from 'outstatic'
import { OstClient } from 'outstatic/client'

export default async function Page({ params }: { params: Promise<{ ost: string[] }> }) {
  const ostData = await Outstatic()
  const resolvedParams = await params
  return <OstClient ostData={ostData} params={resolvedParams} />
}
