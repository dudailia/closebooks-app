/** In-memory handoff from client page → upload (replaces sessionStorage). Holds the client's id. */

let _clientId: string | null = null

export function setUploadPrefillClient(clientId: string): void {
  _clientId = clientId
}

export function consumeUploadPrefillClient(): string | null {
  const v = _clientId
  _clientId = null
  return v
}
