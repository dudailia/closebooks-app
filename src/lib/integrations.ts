// ---------------------------------------------------------------------------
// Integration connections — stored in localStorage
// ---------------------------------------------------------------------------

export interface QBOConnection {
  companyId: string
  companyName: string
  connectedAt: string
  lastSyncAt: string | null
  totalSynced: number
}

const QBO_KEY = 'closebooks_qbo'

export function getQBOConnection(): QBOConnection | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(QBO_KEY)
    return raw ? (JSON.parse(raw) as QBOConnection) : null
  } catch {
    return null
  }
}

export function saveQBOConnection(conn: QBOConnection): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(QBO_KEY, JSON.stringify(conn))
}

export function disconnectQBO(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(QBO_KEY)
}

export function isQBOConnected(): boolean {
  return getQBOConnection() !== null
}

/** Record a successful push — updates lastSyncAt and totalSynced. */
export function recordQBOSync(count: number): void {
  const conn = getQBOConnection()
  if (!conn) return
  saveQBOConnection({
    ...conn,
    lastSyncAt: new Date().toISOString(),
    totalSynced: conn.totalSynced + count,
  })
}
