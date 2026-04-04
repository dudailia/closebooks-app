/** Fire-and-forget notification. Never throws. */
export function notify(event: string, details: Record<string, string | number> = {}) {
  fetch('/api/notify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, details }),
  }).catch(() => {})
}
