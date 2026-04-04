export async function geocodeAndUpdate(
  query: string,
  updateProfile: (u: { userLat: number; userLng: number }) => void
): Promise<boolean> {
  const q = query.trim()
  if (!q) return false
  try {
    const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`)
    if (!res.ok) return false
    const j = (await res.json()) as { lat?: number; lon?: number }
    if (typeof j.lat === 'number' && typeof j.lon === 'number') {
      updateProfile({ userLat: j.lat, userLng: j.lon })
      return true
    }
  } catch {
    /* ignore */
  }
  return false
}
