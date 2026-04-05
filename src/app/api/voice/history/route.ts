import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    calls: [
      { id: 'c1', timestamp: new Date(Date.now() - 3*60*60*1000).toISOString(), command: 'Close the books for Smith Construction', intent: 'close_books', response: 'Starting close now. Text you when done.', status: 'complete', durationSeconds: 242 },
      { id: 'c2', timestamp: new Date(Date.now() - 27*60*60*1000).toISOString(), command: "What's Smith Construction's cash position?", intent: 'get_metric', response: 'Smith Construction has $847,293 in checking.', status: 'answered', durationSeconds: 8 },
      { id: 'c3', timestamp: new Date(Date.now() - 2*24*60*60*1000).toISOString(), command: 'Who needs exceptions reviewed?', intent: 'list_exceptions', response: 'You have 10 exceptions across 3 clients.', status: 'answered', durationSeconds: 15 },
    ]
  })
}
