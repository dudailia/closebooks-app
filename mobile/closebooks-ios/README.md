# CloseBooks iOS

This is the first native iOS shell for CloseBooks.

It loads the live CloseBooks app from:

- `https://closebooks-app.vercel.app`

What is already built:

- secure webview shell tied to your live Vercel deployment
- remembered session URL, so users reopen exactly where they left off
- quick-launch shortcuts for Dashboard, Clients, Advisory, and Upload
- biometric lock with Face ID / Touch ID support
- offline banner and connection-aware recovery
- branded app icon and splash assets
- EAS config for development, preview, and production builds

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

## Build for TestFlight

```bash
cd mobile/closebooks-ios
npx eas build --platform ios --profile production
```

## What to do next

- add push notifications for client alerts and close status
- add universal links and route-specific native entry points
- move the highest-frequency workflows native over time
