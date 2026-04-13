/** In-memory handoff from client page → upload (replaces sessionStorage). */

let _clientName: string | null = null

export function setUploadPrefillClient(name: string): void {
  _clientName = name
}

export function consumeUploadPrefillClient(): string | null {
  const v = _clientName
  _clientName = null
  return v
}
