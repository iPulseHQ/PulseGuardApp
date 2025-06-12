# PulseGuard Mobile Kiosk App

Een React Native Expo app die fungeert als een kiosk browser voor PulseGuard domain monitoring, met real-time push notificaties.

## Features

- 🖥️ **Kiosk Mode**: Full-screen browser interface voor `app.pulseguard.nl`
- 📱 **Push Notifications**: Real-time meldingen voor domain status changes
- 🔄 **Auto-sync**: Automatische synchronisatie met Laravel backend
- 🌓 **Dark/Light Mode**: Ondersteunt systeem theme preferences
- 🔒 **Secure**: Geïntegreerd met Laravel Sanctum authenticatie

## Notification Types

De app ontvangt push notificaties voor:

- 🔴 **Domain Down**: Wanneer een domain offline gaat
- ✅ **Domain Up**: Wanneer een domain weer online komt
- ⚠️ **High Ping**: Bij hoge response times
- 🔒 **SSL Expiration**: SSL certificaat verloopt binnenkort

## Setup & Installation

### Vereisten

- Node.js 18 of hoger
- Expo CLI: `npm install -g expo-cli`
- EAS CLI: `npm install -g @expo/eas-cli`

### Development Setup

1. **Installeer dependencies:**
   ```bash
   cd PulseGuardApp
   npm install
   ```

2. **Start development server:**
   ```bash
   npx expo start
   ```

3. **Test op device:**
   - Scan QR code met Expo Go app
   - Of gebruik Android/iOS simulator

### Production Build

1. **Login naar Expo:**
   ```bash
   eas login
   ```

2. **Build voor Android:**
   ```bash
   eas build --platform android --profile production
   ```

3. **Build voor iOS:**
   ```bash
   eas build --platform ios --profile production
   ```

## Configuratie

### Project ID Setup

In `app.json`, update de project ID:
```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "your-actual-project-id"
      }
    }
  }
}
```

### Laravel Backend Setup

Zorg ervoor dat je Laravel app de volgende heeft:

1. **API Routes** (`routes/api.php`):
   ```php
   Route::middleware('auth:sanctum')->group(function () {
       Route::post('/expo-push-token', [ExpoPushTokenController::class, 'register']);
       Route::delete('/expo-push-token', [ExpoPushTokenController::class, 'unregister']);
   });
   ```

2. **Database Migration**:
   ```bash
   php artisan migrate
   ```

3. **Event Listeners** geconfigureerd voor Expo notifications

## Kiosk Mode Features

### WebView Security
- Beperkt navigatie tot PulseGuard domein
- Blokkeert externe links
- Ondersteunt authentication flows

### Keep Awake
- Houdt scherm actief tijdens gebruik
- Ideal voor monitoring displays

### Hardware Back Button
- Android back button support
- WebView navigatie geschiedenis

## Push Notification Implementation

### Token Registration
```javascript
// Automatisch geregistreerd bij app start
const token = await Notifications.getExpoPushTokenAsync();
await registerTokenWithServer(token);
```

### Notification Handling
```javascript
// Luistert naar notificaties
Notifications.addNotificationReceivedListener(notification => {
  // Handle foreground notifications
});

Notifications.addNotificationResponseReceivedListener(response => {
  // Handle notification taps
});
```

## Development

### File Structure
```
PulseGuardApp/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx          # Main kiosk WebView
│   │   └── _layout.tsx        # Tab layout (no tabs)
│   └── _layout.tsx            # Root layout
├── hooks/
│   └── useNotifications.tsx   # Notification logic
├── assets/
│   └── images/               # App icons & images
└── app.json                  # Expo configuration
```

### Key Components

1. **KioskScreen** (`app/(tabs)/index.tsx`):
   - Full-screen WebView
   - JavaScript injection voor token sharing
   - Error handling & retry logic

2. **NotificationProvider** (`hooks/useNotifications.tsx`):
   - Token registration
   - Permission handling
   - Notification channels

## Troubleshooting

### Common Issues

1. **Notifications niet werkend:**
   - Check device permissions
   - Verify project ID in app.json
   - Test met fysiek device (niet simulator)

2. **WebView laden mislukt:**
   - Check internet connection
   - Verify PulseGuard server is reachable
   - Check console logs

3. **Authentication problemen:**
   - Clear WebView cache
   - Re-login in browser
   - Check CORS settings in Laravel

### Debug Commands

```bash
# View logs
npx expo start --dev-client

# Clear cache
npx expo start --clear

# View device logs
npx expo install --fix
```

## Deployment

### Android APK
```bash
eas build --platform android --profile preview
```

### Play Store
```bash
eas build --platform android --profile production
eas submit --platform android
```

### App Store
```bash
eas build --platform ios --profile production
eas submit --platform ios
```

## Monitoring & Analytics

- Expo Analytics geïntegreerd
- Error tracking via Expo
- Push notification delivery stats
- WebView performance monitoring

## Security

- HTTPS enforced voor alle requests
- Token encryption in transit
- Secure storage voor device tokens
- Domain whitelisting in WebView

## Support

Voor vragen over de app:
- Check logs in Expo dashboard
- Review Laravel logs voor API issues
- Test notification delivery in Laravel admin panel

## Version History

- **v1.0.0**: Initial kiosk implementation met push notifications
