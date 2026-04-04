import {
  Coordinates,
  CalculationMethod,
  CalculationParameters,
  PrayerTimes,
  Madhab,
} from 'adhan'

export type PrayerCalcMethodKey =
  | 'north_america'
  | 'muslim_world_league'
  | 'egyptian'
  | 'karachi'
  | 'umm_al_qura'
  | 'dubai'
  | 'moonsighting_committee'
  | 'kuwait'
  | 'qatar'
  | 'singapore'
  | 'tehran'
  | 'turkey'

const METHOD_GETTERS: Record<
  PrayerCalcMethodKey,
  () => CalculationParameters
> = {
  north_america: () => CalculationMethod.NorthAmerica(),
  muslim_world_league: () => CalculationMethod.MuslimWorldLeague(),
  egyptian: () => CalculationMethod.Egyptian(),
  karachi: () => CalculationMethod.Karachi(),
  umm_al_qura: () => CalculationMethod.UmmAlQura(),
  dubai: () => CalculationMethod.Dubai(),
  moonsighting_committee: () => CalculationMethod.MoonsightingCommittee(),
  kuwait: () => CalculationMethod.Kuwait(),
  qatar: () => CalculationMethod.Qatar(),
  singapore: () => CalculationMethod.Singapore(),
  tehran: () => CalculationMethod.Tehran(),
  turkey: () => CalculationMethod.Turkey(),
}

export const PRAYER_CALC_METHOD_OPTIONS: { key: PrayerCalcMethodKey; label: string }[] = [
  { key: 'north_america', label: 'ISNA (North America)' },
  { key: 'muslim_world_league', label: 'Muslim World League' },
  { key: 'egyptian', label: 'Egyptian General Authority' },
  { key: 'karachi', label: 'University of Islamic Sciences, Karachi' },
  { key: 'umm_al_qura', label: 'Umm al-Qura' },
  { key: 'dubai', label: 'Dubai' },
  { key: 'moonsighting_committee', label: 'Moonsighting Committee' },
  { key: 'kuwait', label: 'Kuwait' },
  { key: 'qatar', label: 'Qatar' },
  { key: 'singapore', label: 'Singapore' },
  { key: 'tehran', label: 'Tehran' },
  { key: 'turkey', label: 'Turkey (Diyanet)' },
]

export function getPrayerParams(methodKey: string, hanafiAsr: boolean): CalculationParameters {
  const getter = METHOD_GETTERS[methodKey as PrayerCalcMethodKey] ?? METHOD_GETTERS.north_america
  const p = getter()
  p.madhab = hanafiAsr ? Madhab.Hanafi : Madhab.Shafi
  return p
}

export type PrayerNameKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'

export function computePrayerTimesRecord(
  lat: number,
  lng: number,
  date: Date,
  methodKey: string,
  hanafiAsr: boolean
): Record<PrayerNameKey, Date> {
  const coords = new Coordinates(lat, lng)
  const params = getPrayerParams(methodKey, hanafiAsr)
  const pt = new PrayerTimes(coords, date, params)
  return {
    fajr: pt.fajr,
    dhuhr: pt.dhuhr,
    asr: pt.asr,
    maghrib: pt.maghrib,
    isha: pt.isha,
  }
}

/** 12-hour locale string e.g. 5:47 AM */
export function formatPrayerTime12(d: Date): string {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

/** HH:mm 24h for schedule blocks */
export function formatPrayerTime24(d: Date): string {
  const h = d.getHours()
  const m = d.getMinutes()
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function prayerRecordTo12(
  lat: number,
  lng: number,
  date: Date,
  methodKey: string,
  hanafiAsr: boolean
): Record<PrayerNameKey, string> {
  const r = computePrayerTimesRecord(lat, lng, date, methodKey, hanafiAsr)
  return {
    fajr: formatPrayerTime12(r.fajr),
    dhuhr: formatPrayerTime12(r.dhuhr),
    asr: formatPrayerTime12(r.asr),
    maghrib: formatPrayerTime12(r.maghrib),
    isha: formatPrayerTime12(r.isha),
  }
}

export function prayerRecordTo24(
  lat: number,
  lng: number,
  date: Date,
  methodKey: string,
  hanafiAsr: boolean
): Record<PrayerNameKey, string> {
  const r = computePrayerTimesRecord(lat, lng, date, methodKey, hanafiAsr)
  return {
    fajr: formatPrayerTime24(r.fajr),
    dhuhr: formatPrayerTime24(r.dhuhr),
    asr: formatPrayerTime24(r.asr),
    maghrib: formatPrayerTime24(r.maghrib),
    isha: formatPrayerTime24(r.isha),
  }
}
