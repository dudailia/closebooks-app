# CloseBooks iOS

This is the first native iOS shell for CloseBooks.

It loads the live CloseBooks app from:

- `https://closebooks-app.vercel.app`

Why this approach:

- it reuses your existing Vercel app, auth, and backend immediately
- it gives you the fastest path to TestFlight
- it avoids building a second frontend before the product is fully stabilized

## Run locally

```bash
cd mobile/closebooks-ios
npm install
npx expo start
```

Then press `i` in Expo or open the iOS simulator.

## What to do next

- add branded app icons and splash assets
- add universal links for `closebooks-app.vercel.app`
- add push notifications for client alerts and close status
- add biometric session lock for finance-grade trust
- move the highest-frequency workflows native over time
