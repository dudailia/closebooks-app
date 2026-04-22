import { NextResponse } from 'next/server'

export const dynamic = 'force-static'

export async function GET() {
  const teamId = process.env.APPLE_TEAM_ID
  const bundleId = process.env.IOS_BUNDLE_ID || 'com.closebooks.app'
  const configuredAppIds = process.env.APPLE_APP_IDS
    ?.split(',')
    .map((value) => value.trim())
    .filter(Boolean)

  const appIds = configuredAppIds?.length
    ? configuredAppIds
    : [teamId ? `${teamId}.${bundleId}` : bundleId]

  return NextResponse.json(
    {
      applinks: {
        apps: [],
        details: appIds.map((appId) => ({
          appID: appId,
          paths: [
            '/',
            '/dashboard/*',
            '/login',
            '/signup',
            '/pricing',
            '/get-started',
          ],
        })),
      },
      webcredentials: {
        apps: appIds,
      },
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
      },
    },
  )
}
