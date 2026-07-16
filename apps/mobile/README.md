# Trip Itinerary Planner — Mobile (Expo / React Native)

Shares `@trip-itinerary/*` packages with the web app. Auth (email/password + Google +
Apple SSO) gates the planner; the JWT is stored in `expo-secure-store`.

## Why a dev build (not Expo Go)
This app uses native modules (`expo-apple-authentication`, `expo-secure-store`,
`react-native-maps`, `expo-auth-session`) that aren't in Expo Go, so you need an
**Expo Dev Client** build.

## First-time setup
```bash
npm i -g eas-cli            # Expo Application Services CLI
cd apps/mobile
eas login                   # your Expo account
eas init                    # links the app + writes extra.eas.projectId into app.json
```

## Build & run a dev client
```bash
# iOS simulator (macOS) or a device; Android emulator/device
eas build --profile development --platform ios      # or: android
# install the resulting build, then start the JS bundler:
pnpm --filter @trip-itinerary/mobile dev            # expo start --dev-client
```

## Environment (set in your shell or an apps/mobile/.env)
```
EXPO_PUBLIC_API_BASE_URL=https://<your-api-domain>
EXPO_PUBLIC_GOOGLE_CLIENT_ID=<google web client id>
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=<google iOS client id>       # native iOS
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=<google Android client id>
```
Apple Sign In works on iOS only and requires the Apple Developer Program. Google
Sign In needs OAuth client IDs from Google Cloud (iOS/Android for native builds).

## Store submission (later)
`eas build --profile production` then `eas submit -p ios` / `eas submit -p android`.
