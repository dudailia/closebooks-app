# CloseBooks iOS Launch Checklist

## Current state

- Expo app scaffold exists in `mobile/closebooks-ios`
- connected to production CloseBooks at `https://closebooks-app.vercel.app`
- biometric lock, offline handling, quick shortcuts, and saved sessions are built
- branded icon and splash assets are included
- EAS config is included
- universal-link web routes are included

## Still required for real App Store / TestFlight launch

1. Expo / EAS account login
2. Apple Developer account and bundle signing
3. Set Vercel env vars:
   - `APPLE_TEAM_ID`
   - `IOS_BUNDLE_ID`
   - optional if you want to support multiple bundle IDs:
     - `APPLE_APP_IDS` as a comma-separated list of full `TEAMID.bundleid` values
   - optional Android vars later:
     - `ANDROID_PACKAGE_NAME`
     - `ANDROID_SHA256_CERT_FINGERPRINTS`
4. Optional but recommended for password autofill and universal-link validation:
   - make sure the final bundle identifier in Apple Developer matches
     `com.closebooks.app` or update `app.json` + `IOS_BUNDLE_ID` together
5. Run:

```bash
cd /Users/iliaduda/Desktop/closebooks-app/mobile/closebooks-ios
npm install
npm run build:ios
```

6. Submit to TestFlight:

```bash
npm run submit:ios
```

## Nice next upgrades

- push notifications for close alerts and client actions
- universal-link routing for specific client pages
- native file upload / camera receipt capture
- Face ID preference toggle in app settings
- native notifications inbox
