# 🎬 Step-by-Step Visual Guide

## 🎯 Goal: Run the App on Your Phone in 5 Minutes

### STEP 1️⃣: Download Required Software

**On Your Computer:**

1. **Download Node.js**
   - Go to: https://nodejs.org/
   - Click the big green "LTS" button
   - Install it (click Next → Install)
   - Restart your computer

2. **Download a Code Editor** (Optional, but helpful)
   - Visual Studio Code: https://code.visualstudio.com/
   - Or use any text editor

**On Your Phone:**

1. **Download Expo Go**
   - iPhone: [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

✅ **Check:** Can you see Node.js version in terminal?
```bash
node --version
npm --version
```

---

### STEP 2️⃣: Get the Code

Your code is already here! 🎉
```
Location: fitness-nutrition-coach/mobile/
```

Open a terminal/command prompt and navigate there:
```bash
cd fitness-nutrition-coach/mobile
```

---

### STEP 3️⃣: Install Dependencies

Type this command and press Enter:
```bash
npm install
```

Wait... (This takes 2-3 minutes, lots of files downloading)

✅ **When done**, you'll see:
```
added XXX packages in X.XXs
```

---

### STEP 4️⃣: Start the App

Type this command:
```bash
npm start
```

You'll see:
```
Expo Go
├─ press 'a' to open Android emulator
├─ press 'i' to open iOS simulator
├─ press 'w' to open web
├─ press 'r' to reload the app
├─ press 'q' to quit
│
Scan the QR code below with Expo Go (Android) or the Camera app (iOS)
│
█████████████████████
█ QR CODE HERE       █
█████████████████████
```

---

### STEP 5️⃣: View on Your Phone 📱

**For iPhone Users:**
1. Open Camera app
2. Point at QR code
3. Tap notification that appears
4. App opens! 🎉

**For Android Users:**
1. Open Expo Go app
2. Tap "Scan QR Code"
3. Point at QR code
4. App opens! 🎉

---

## 📱 What You Should See

When the app loads, you'll see:

```
┌─────────────────────────┐
│ Fitness Nutrition Coach │
│ Your personal fitness   │
│ and nutrition companion │
│                         │
│ ┌───────────────────┐   │
│ │ 🏋️ Workout Plans  │   │
│ └───────────────────┘   │
│                         │
│ ┌───────────────────┐   │
│ │ 🍎 Nutrition      │   │
│ └───────────────────┘   │
│                         │
│ ┌───────────────────┐   │
│ │ 💬 AI Chat Coach  │   │
│ └───────────────────┘   │
│                         │
│ ┌───────────────────┐   │
│ │ 📊 Track Progress │   │
│ └───────────────────┘   │
│                         │
│    [Get Started]        │
│                         │
├─────────────────────────┤
│ Home │Workouts │Nutri... │
└─────────────────────────┘
```

✅ **Success!** The app is running!

---

## 🔄 Try Making Changes

### Change the Welcome Text

1. Open file: `app/screens/HomeScreen.js`
2. Find the line:
   ```javascript
   Welcome to Fitness Coach
   ```
3. Change it to:
   ```javascript
   My Awesome Fitness App
   ```
4. Save the file
5. Look at your phone... it updates automatically! 🎉

---

## 🎨 Try Changing Colors

1. Open file: `app/utils/theme.js`
2. Find this section:
   ```javascript
   colors: {
     primary: '#007AFF',    // Blue
   ```
3. Change to:
   ```javascript
   colors: {
     primary: '#FF0000',    // Red
   ```
4. Save
5. Watch buttons turn red on your phone! 🔴

---

## 🗂️ File Locations Quick Reference

| Want to do... | Edit this file |
|---|---|
| Change welcome text | `app/screens/HomeScreen.js` |
| Change workout list | `app/screens/WorkoutsScreen.js` |
| Change nutrition display | `app/screens/NutritionScreen.js` |
| Change chat messages | `app/screens/ChatScreen.js` |
| Change profile info | `app/screens/ProfileScreen.js` |
| Change colors/fonts | `app/utils/theme.js` |
| Change API settings | `app/utils/api.js` |
| Change app name | `app.json` |

---

## 🎮 Phone Controls

While app is running on your phone, these work:

| Action | What happens |
|--------|---|
| Tap tabs at bottom | Switch between screens |
| Tap buttons | Trigger actions |
| Type in chat box | Send messages |
| Scroll up/down | See more content |

---

## 💻 Terminal Controls

While app is running in terminal, you can:

| Press | Does |
|---|---|
| `r` | Reload the app |
| `a` | Open Android emulator |
| `i` | Open iOS simulator |
| `w` | Open web version |
| `q` | Stop and exit |

---

## 🆘 Something Went Wrong?

### "npm: command not found"
→ Node.js not installed. Download from https://nodejs.org/

### "Port already in use"
→ Another app is using the same port. Press `q` to quit and try again.

### App shows white screen
→ Press `r` in terminal to reload

### Can't scan QR code
→ Make sure phone and computer are on the same WiFi network

### App won't start
```bash
# Try this:
rm -rf node_modules
npm install
npm start
```

---

## ✅ Checklist to Follow

- [ ] Node.js installed
- [ ] Downloaded Expo Go on phone
- [ ] Ran `npm install` (no errors)
- [ ] Ran `npm start` (see QR code)
- [ ] Scanned QR code
- [ ] App appears on phone
- [ ] Tapped all tabs
- [ ] Changed some text
- [ ] Saw changes on phone
- [ ] Celebrated! 🎉

---

## 🎓 What's Next?

1. ✅ Explore all 5 screens
2. ✅ Play with colors in `theme.js`
3. ✅ Change text in different screens
4. ✅ Connect to your backend API
5. ✅ Add more screens
6. ✅ Build something amazing!

---

## 📚 Need More Help?

| Topic | Where to find |
|---|---|
| Fast setup | `QUICK_START.md` |
| Full guide | `README.md` |
| Architecture | `ARCHITECTURE.md` |
| Troubleshooting | `SETUP_CHECKLIST.md` |

---

## 🚀 You're Ready!

You have everything set up. Now go build amazing things! 🎉

```bash
cd mobile
npm install
npm start
```

Scan the QR code and enjoy! 📱✨
