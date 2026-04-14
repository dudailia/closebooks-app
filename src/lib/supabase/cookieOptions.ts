const isProduction = process.env.NODE_ENV === 'production'

/**
 * Shared Supabase cookie options for SSR.
 * Supabase Auth stores session in cookie chunks; `httpOnly` cannot be set on
 * the client-side portions of that flow — middleware applies secure + sameSite here.
 */
export const supabaseCookieOptions: {
  secure?: boolean
  sameSite?: 'strict' | 'lax' | 'none'
  path?: string
} = {
  secure: isProduction,
  sameSite: 'lax',
  path: '/',
}
