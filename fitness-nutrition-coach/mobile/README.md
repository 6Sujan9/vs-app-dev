# Fitness Nutrition Coach - Mobile App (React Native + Expo)

A beginner-friendly React Native mobile application for fitness and nutrition coaching.

## 📱 Features

- **Home Dashboard** - Quick overview of all features
- **Workout Plans** - View and start personalized workouts
- **Nutrition Tracking** - Log meals and track daily calories
- **AI Chat Coach** - Ask fitness questions and get instant advice
- **User Profile** - Manage personal information and view statistics
- **Bottom Tab Navigation** - Easy navigation between all screens

## 📁 Folder Structure

```
mobile/
├── App.js                          # Main app component with navigation
├── app.json                        # Expo configuration
├── babel.config.js                 # Babel configuration
├── package.json                    # Dependencies
├── .gitignore                      # Git ignore file
├── app/
│   ├── screens/                    # Screen components
│   │   ├── HomeScreen.js           # Home/Dashboard screen
│   │   ├── WorkoutsScreen.js       # Workouts management
│   │   ├── NutritionScreen.js      # Nutrition tracking
│   │   ├── ChatScreen.js           # AI Chat interface
│   │   └── ProfileScreen.js        # User profile
│   ├── components/                 # Reusable components (future)
│   ├── navigation/                 # Navigation configuration (future)
│   ├── utils/                      # Utility functions
│   │   ├── api.js                  # API endpoints and config
│   │   └── theme.js                # Theme colors and styles
│   └── assets/                     # Images, icons (create if needed)
└── node_modules/                   # Dependencies (auto-generated)
```

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Expo CLI (will be installed automatically)

### Installation Steps

1. **Navigate to the mobile folder**
   ```bash
   cd mobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the Expo development server**
   ```bash
   npm start
   # or
   yarn start
   ```

## 🎯 Running the App

### Option 1: Using Expo Go App (Easiest for Beginners)

1. Download **Expo Go** app from:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Run the app:
   ```bash
   npm start
   ```

3. Scan the QR code with your phone camera (iOS) or Expo Go app (Android)

### Option 2: Run on Android Emulator

**Requirements:** Android Studio and Android Emulator installed

```bash
npm run android
```

### Option 3: Run on iOS Simulator

**Requirements:** Mac with Xcode installed

```bash
npm run ios
```

### Option 4: Run on Web Browser

```bash
npm run web
```

## 📝 Available Commands

```bash
# Start the development server
npm start

# Run on Android
npm run android

# Run on iOS  
npm run ios

# Run on Web
npm run web

# Eject from Expo (not recommended for beginners)
npm run eject
```

## 🛠️ Development Tips

### Hot Reload
- Press `r` in the terminal to reload the app
- Changes to code are reflected instantly on your device

### Debug Menu
- Shake your device or press `Ctrl+M` (Android) / `Cmd+D` (iOS)
- Use "Debug Remote JS" to debug with Chrome DevTools

### File Structure Tips
- Keep screens in `app/screens/`
- Create reusable components in `app/components/`
- Put utility functions in `app/utils/`
- Update `App.js` to add new screens

## 📦 Dependencies

- **react-native** - Mobile framework
- **expo** - Development platform
- **react-navigation** - Navigation library
- **axios** - HTTP client (for API calls)
- **expo-status-bar** - Status bar management

## 🔌 Backend Integration

The app is configured to connect to the backend API:

**API Base URL:** `http://localhost:8000/api/v1`

Configure in `app/utils/api.js` if your backend URL is different.

## 💡 Next Steps

1. **Customize the theme** - Edit colors in `app/utils/theme.js`
2. **Add more screens** - Create new files in `app/screens/`
3. **Connect to backend** - Update API endpoints in `app/utils/api.js`
4. **Add icons** - Use a library like `react-native-vector-icons`
5. **Build for production** - Use `eas build` command

## 🎓 Learn More

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [React Navigation Guide](https://reactnavigation.org/)

## ✅ Troubleshooting

### "Module not found" error
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
npm start -c
```

### Port already in use
```bash
# Kill the process or use a different port
npm start -- --port 19001
```

### App crashes on startup
- Check the terminal for error messages
- Ensure all dependencies are installed
- Verify `App.js` syntax is correct

## 📞 Support

For issues:
1. Check the error message in the terminal
2. Review Expo documentation
3. Check console logs on your device

Happy coding! 🎉
