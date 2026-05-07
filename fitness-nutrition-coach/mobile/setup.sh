#!/bin/bash
# Setup script for React Native/Expo development environment

echo "🚀 Setting up Fitness Nutrition Coach Mobile App..."
echo ""

# Check Node.js
echo "📦 Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js from https://nodejs.org/"
    exit 1
fi
echo "✅ Node.js version: $(node --version)"

# Check npm
echo "📦 Checking npm..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install npm"
    exit 1
fi
echo "✅ npm version: $(npm --version)"

# Install dependencies
echo ""
echo "📥 Installing dependencies..."
npm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "📱 To start the app, run:"
echo "   npm start"
echo ""
echo "🌐 Available commands:"
echo "   npm start      - Start development server"
echo "   npm run android - Run on Android emulator"
echo "   npm run ios     - Run on iOS simulator"
echo "   npm run web     - Run in browser"
echo ""
echo "💡 Tip: Download Expo Go from App Store/Play Store to test on your phone!"
