# 📱 Mobile App Complete Setup Guide

## What's Been Created

Your React Native/Expo mobile app is ready to go! Here's what you have:

### 📁 Complete Folder Structure

```
mobile/
├── App.js                    ← Main app entry point
├── app.json                  ← Expo configuration
├── babel.config.js           ← JavaScript transpiler config
├── package.json              ← Dependencies list
├── .gitignore                ← Files to ignore in Git
├── QUICK_START.md            ← Fast setup guide (START HERE)
├── README.md                 ← Full documentation
├── SETUP_CHECKLIST.md        ← Verification checklist
├── setup.sh                  ← Linux/Mac setup script
├── setup.bat                 ← Windows setup script
└── app/
    ├── screens/              ← App pages
    │   ├── HomeScreen.js         (Welcome page)
    │   ├── WorkoutsScreen.js      (Workouts list)
    │   ├── NutritionScreen.js     (Meal tracking)
    │   ├── ChatScreen.js          (AI assistant)
    │   └── ProfileScreen.js       (User profile)
    ├── components/           ← Reusable UI components (ready to add)
    ├── navigation/           ← Navigation setup (ready to expand)
    └── utils/                ← Helper functions
        ├── api.js                 (Backend configuration)
        └── theme.js               (Colors & styles)
```

## 🎯 5 Screens Included

| Screen | Features |
|--------|----------|
| **Home** | Welcome page with feature overview |
| **Workouts** | View and start workout plans |
| **Nutrition** | Log meals and track calories |
| **Chat** | Talk to AI fitness coach |
| **Profile** | Manage user information |

## 🚀 Get Started in 2 Minutes

### Step 1: Open Terminal & Navigate
```bash
cd fitness-nutrition-coach/mobile
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Start the App
```bash
npm start
```

### Step 4: View on Your Phone
- Scan the QR code with your phone
- Use Expo Go app (free download from App Store/Play Store)

## 📋 Setup Methods

### Method 1: Automatic (Easiest)
**Windows Users:**
```bash
setup.bat
```

**Mac/Linux Users:**
```bash
chmod +x setup.sh
./setup.sh
```

### Method 2: Manual
```bash
cd mobile
npm install
npm start
```

## 🎮 Available Commands

```bash
npm start        # Start dev server (recommended first time)
npm run android  # Run on Android emulator
npm run ios      # Run on iOS simulator  
npm run web      # Run in web browser
npm run eject    # Extract from Expo (advanced)
```

## 🔍 How to Use the App

1. **Download Expo Go**
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Run the development server**
   ```bash
   npm start
   ```

3. **Connect Your Phone**
   - Same WiFi network as your computer
   - iPhone: Use camera to scan QR code
   - Android: Use Expo Go app to scan QR code

4. **View Changes Instantly**
   - Edit any file in `app/screens/` or `App.js`
   - Press `r` in terminal to reload
   - Changes appear on your phone automatically

## 🛠️ Customization

### Change App Name
Edit `app.json`:
```json
{
  "expo": {
    "name": "Your App Name",
    "slug": "your-app-name"
  }
}
```

### Change Colors
Edit `app/utils/theme.js`:
```javascript
colors: {
  primary: '#007AFF',      // Change this
  success: '#34C759',      // And this
  // ... more colors
}
```

### Add New Screen
1. Create `app/screens/MyNewScreen.js`
2. Import in `App.js`
3. Add to navigation

### Connect Backend
Edit `app/utils/api.js`:
```javascript
const API_BASE_URL = 'http://your-backend-url:8000/api/v1';
```

## 📚 File Reference

| File | Purpose |
|------|---------|
| `App.js` | Navigation & app structure |
| `app.json` | Expo settings |
| `package.json` | Project info & dependencies |
| `app/screens/*` | Individual screens |
| `app/utils/api.js` | Backend API config |
| `app/utils/theme.js` | UI colors & spacing |

## ✅ What's Ready to Use

- ✅ Bottom tab navigation
- ✅ 5 functional screens
- ✅ Responsive design
- ✅ API configuration
- ✅ Theme system
- ✅ Hot reload enabled

## ⚠️ Common Issues & Solutions

### "Command not found: npm"
→ Install Node.js: https://nodejs.org/

### "Port already in use"
→ Kill the process: `npm start -- --port 19001`

### "Module not found"
→ Reinstall: `rm -rf node_modules && npm install`

### "White screen on phone"
→ Press `r` in terminal to reload

## 📖 Learning Resources

- [React Native Docs](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation Guide](https://reactnavigation.org/)

## 🎓 Next Steps

1. ✅ Install and run the app
2. ✅ Test on your phone
3. ✅ Explore the code
4. ✅ Customize colors and text
5. ✅ Add more screens
6. ✅ Connect to your backend API
7. ✅ Build and deploy

## 🚀 Ready?

```bash
cd mobile
npm install
npm start
```

**Scan the QR code and start building! 🎉**

---

**Questions?** Check the included documentation:
- `QUICK_START.md` - Fast version
- `README.md` - Detailed guide
- `SETUP_CHECKLIST.md` - Verification steps
