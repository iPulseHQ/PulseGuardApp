#!/bin/bash

# PulseGuard Expo App Deployment Script
# Usage: ./scripts/deploy.sh [platform] [profile]
# Example: ./scripts/deploy.sh android production

set -e

PLATFORM=${1:-"android"}
PROFILE=${2:-"production"}

echo "🚀 Starting PulseGuard Expo App deployment..."
echo "Platform: $PLATFORM"
echo "Profile: $PROFILE"

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI not found. Installing..."
    npm install -g @expo/eas-cli
fi

# Login to Expo (if not already logged in)
echo "🔐 Checking Expo authentication..."
if ! eas whoami &> /dev/null; then
    echo "Please log in to Expo:"
    eas login
fi

# Clean cache and install dependencies
echo "🧹 Cleaning cache and installing dependencies..."
rm -rf node_modules/.cache
npm ci

# Check project configuration
echo "🔍 Checking project configuration..."
if [ ! -f "eas.json" ]; then
    echo "❌ eas.json not found. Creating default configuration..."
    eas build:configure
fi

# Update app version (patch version)
echo "📦 Updating app version..."
npm version patch --no-git-tag-version

# Build the app
echo "🔨 Building for $PLATFORM with $PROFILE profile..."
case $PLATFORM in
    "android")
        eas build --platform android --profile $PROFILE --non-interactive
        ;;
    "ios")
        eas build --platform ios --profile $PROFILE --non-interactive
        ;;
    "all")
        eas build --platform all --profile $PROFILE --non-interactive
        ;;
    *)
        echo "❌ Invalid platform: $PLATFORM"
        echo "Valid platforms: android, ios, all"
        exit 1
        ;;
esac

echo "✅ Build completed successfully!"

# Optional: Submit to app stores if production build
if [ "$PROFILE" = "production" ]; then
    read -p "Do you want to submit to app stores? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "📱 Submitting to app stores..."
        if [ "$PLATFORM" = "android" ] || [ "$PLATFORM" = "all" ]; then
            eas submit --platform android --latest
        fi
        if [ "$PLATFORM" = "ios" ] || [ "$PLATFORM" = "all" ]; then
            eas submit --platform ios --latest
        fi
    fi
fi

echo "🎉 Deployment process completed!"
echo ""
echo "Next steps:"
echo "1. Test the build on your device"
echo "2. Update the Laravel backend if needed"
echo "3. Monitor the app performance in Expo dashboard" 