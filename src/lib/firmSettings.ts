const KEY = 'closebooks_firm_settings'

export interface FirmSettings {
  firmName: string
  firmTagline: string
  accentColor: string  // hex, e.g. '#2d5a27'
  preparedBy: string
}

const DEFAULTS: FirmSettings = {
  firmName:    '',
  firmTagline: 'Certified Public Accountants',
  accentColor: '#2d5a27',
  preparedBy:  '',
}

export function loadFirmSettings(): FirmSettings {
  if (typeof window === 'undefined') return { ...DEFAULTS }
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULTS }
    return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULTS }
  }
}

export function saveFirmSettings(settings: FirmSettings): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(settings))
}
