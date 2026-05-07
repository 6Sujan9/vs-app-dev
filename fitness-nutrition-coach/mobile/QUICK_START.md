# ⚡ Quick Start - React Native Mobile App

## 3-Minute Setup

### Step 1: Install Dependencies
```bash
cd mobile
npm install
```

### Step 2: Start the App
```bash
npm start
```

### Step 3: View on Your Phone
- **iPhone Users:**
  - Open Camera app
  - Scan QR code from terminal
  - Click notification that appears

- **Android Users:**
  - Open Expo Go app
  - Scan QR code from terminal

## Commands Cheat Sheet

| Command | What it does |
|---------|-------------|
| `npm start` | Start development server |
| `npm run android` | Run on Android emulator |
| `npm run ios` | Run on iOS simulator |
| `npm run web` | Run in browser |

## Common Issues & Fixes

| Problem | Solution |
|---------|----------|
| App won't load | Press `r` in terminal to reload |
| "Module not found" | Run `npm install` again |
| Port in use | Close other projects or restart |

## File Locations

- **Add new screens:** `app/screens/NewScreen.js`
- **Change colors:** Edit `app/utils/theme.js`
- **Main navigation:** Edit `App.js`
- **API settings:** Edit `app/utils/api.js`

## Next: Connect to Backend

Update `app/utils/api.js`:
```javascript
const API_BASE_URL = 'your-backend-url';
```

---

**Need help?** Check [React Native Docs](https://reactnative.dev/) or [Expo Docs](https://docs.expo.dev/)
