// Test-mode notice for every place a customer can start paying. It is shown
// only when the server's Stripe key really is a test key, so it can't end up
// on a live deployment.

export const STRIPE_TEST_MODE_NOTE = 'Billing is in Stripe test mode. No real charges are made.'

/** Server-only: STRIPE_SECRET_KEY is not exposed to the browser. */
export function isStripeTestMode(): boolean {
  const key = process.env.STRIPE_SECRET_KEY ?? ''
  return key.startsWith('sk_test_') || key.startsWith('rk_test_')
}
