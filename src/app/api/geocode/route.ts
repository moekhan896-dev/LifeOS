import { NextRequest, NextResponse } from 'next/server'

/** Nominatim forward geocode — used to resolve onboarding location to lat/lon for prayer times. */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q) return NextResponse.json({ error: 'missing q' }, { status: 400 })

  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '1')
  url.searchParams.set('q', q)

  const res = await fetch(url.toString(), {
    headers: {
      'User-Agent': 'ArtOS/1.0 (https://github.com/art-os)',
      Accept: 'application/json',
    },
    next: { revalidate: 86400 },
  })

  if (!res.ok) return NextResponse.json({ error: 'geocode failed' }, { status: 502 })

  const data = (await res.json()) as Array<{ lat: string; lon: string }>
  const first = data[0]
  if (!first) return NextResponse.json({ error: 'no results' }, { status: 404 })

  const lat = parseFloat(first.lat)
  const lon = parseFloat(first.lon)
  if (Number.isNaN(lat) || Number.isNaN(lon)) return NextResponse.json({ error: 'bad data' }, { status: 502 })

  return NextResponse.json({ lat, lon })
}
