# 📱 PulseGuard Mobile App

Een native React Native app gebouwd met Expo SDK 54 voor server monitoring en uptime tracking.

## ✨ Features

- 🔐 **Clerk Authenticatie** - Veilige login met email/wachtwoord of Google OAuth
- 📊 **Native Dashboard** - Realtime overzicht van al je servers
- 🌐 **Domein Monitoring** - Bekijk status, response times en uptime
- 🚨 **Incident Management** - Beheer incidenten rechtstreeks vanuit de app
- 🔔 **Push Notifications** - Ontvang alerts wanneer servers down gaan
- 🎨 **Native Tabs** - Liquid Glass tabs op iOS 26+ met SF Symbols

## 🏗️ Architectuur

```
┌─────────────────────────────────────────────────────────────┐
│                    PulseGuard Mobile App                     │
│                  (Expo SDK 54 + Native Tabs)                │
├─────────────────────────────────────────────────────────────┤
│  @clerk/clerk-expo          React Query           Native UI │
│  (Authentication)           (API State)          (Reanimated)│
└───────────────────────────────┬─────────────────────────────┘
                                │ REST API (Bearer Token)
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    PulseGuard Backend                        │
│              (NestJS + Prisma + Clerk JWT)                  │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Getting Started

### Vereisten

- Node.js 18+
- npm of yarn
- Expo CLI: `npm install -g expo-cli`
- EAS CLI (voor builds): `npm install -g eas-cli`

### Installatie

1. **Clone en installeer dependencies:**
   ```bash
   cd PulseGuardApp
   npm install
   ```

2. **Maak je .env bestand:**
   ```bash
   cp .env.example .env
   # Vul je Clerk publishable key in
   ```

3. **Start de development server:**
   ```bash
   npx expo start
   ```

4. **Open op je device:**
   - Scan de QR code met Expo Go (beperkte functionaliteit)
   - Of maak een development build (aanbevolen)

### Development Build (Aanbevolen)

Voor volledige functionaliteit (push notifications):

```bash
# Android
npx expo run:android

# iOS
npx expo run:ios
```

## 📁 Project Structuur

```
PulseGuardApp/
├── app/                      # Expo Router pages
│   ├── _layout.tsx          # Root layout met Clerk & React Query
│   ├── (auth)/              # Auth screens
│   │   ├── sign-in.tsx
│   │   └── sign-up.tsx
│   └── (tabs)/              # Main app tabs
│       ├── _layout.tsx      # NativeTabs layout
│       ├── index.tsx        # Dashboard
│       ├── domains.tsx      # Domains list
│       ├── incidents.tsx    # Incidents management
│       └── settings.tsx     # Settings & account
├── hooks/                    # Custom React hooks
│   ├── useDashboard.ts
│   ├── useDomains.ts
│   ├── useIncidents.ts
│   └── useNotifications.ts
├── lib/                      # Utilities & API
│   ├── api/
│   │   └── client.ts        # Axios client met Clerk auth
│   └── auth/
│       └── token-cache.ts   # Secure token storage
└── assets/                   # Images, fonts, etc.
```

## 🔧 Environment Variables

| Variable | Beschrijving |
|----------|-------------|
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `EXPO_PUBLIC_API_URL` | Backend API URL |
| `EXPO_PUBLIC_PROJECT_ID` | Expo project ID (voor push notifications) |

## 📱 Native Tabs

De app gebruikt Expo Router's `NativeTabs` voor een echte native tab bar:

- **iOS**: Liquid Glass effect op iOS 26+
- **Android**: Material Design 3 bottom navigation
- **SF Symbols**: Native iOS iconen met fallback drawables voor Android

## 🔔 Push Notifications

Push notifications werken alleen in development/production builds, niet in Expo Go.

### Setup:

1. Maak een EAS project: `eas build:configure`
2. Zorg dat `EXPO_PUBLIC_PROJECT_ID` klopt in `.env`
3. Bouw de app: `eas build --platform android/ios`

## 🚢 Deployment

### Android (Play Store)

```bash
eas build --platform android --profile production
eas submit --platform android
```

### iOS (App Store)

```bash
eas build --platform ios --profile production
eas submit --platform ios
```

## 📖 Tech Stack

- **Framework**: Expo SDK 54 + Expo Router v5
- **UI**: React Native 0.79 + Reanimated 3
- **Auth**: Clerk (@clerk/clerk-expo)
- **State**: TanStack Query (React Query)
- **HTTP**: Axios
- **Navigation**: Native Tabs + Stack

## 📄 License

MIT © PulseGuard
