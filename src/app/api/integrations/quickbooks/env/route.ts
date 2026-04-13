import { NextResponse } from 'next/server'
import { isQBOOAuthConfigured } from '@/lib/qboConfig'

export async function GET() {
  return NextResponse.json({ oauthConfigured: isQBOOAuthConfigured() })
}
