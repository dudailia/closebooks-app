import { NextResponse } from 'next/server'

export const dynamic = 'force-static'

export async function GET() {
  const packageName = process.env.ANDROID_PACKAGE_NAME || 'com.closebooks.app'
  const sha256 = process.env.ANDROID_SHA256_CERT_FINGERPRINTS
    ?.split(',')
    .map((value) => value.trim())
    .filter(Boolean) ?? []

  return NextResponse.json(
    [
      {
        relation: ['delegate_permission/common.handle_all_urls'],
        target: {
          namespace: 'android_app',
          package_name: packageName,
          sha256_cert_fingerprints: sha256,
        },
      },
    ],
    {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
      },
    },
  )
}
