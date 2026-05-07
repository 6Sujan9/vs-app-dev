## 📋 Setup Verification Checklist

Use this checklist to verify your React Native/Expo app setup:

### ✅ Pre-Installation
- [ ] Node.js installed (check: `node --version`)
- [ ] npm installed (check: `npm --version`)
- [ ] You're in the `mobile/` folder

### ✅ Installation Complete
- [ ] Ran `npm install` successfully
- [ ] No error messages in the terminal
- [ ] `node_modules/` folder exists

### ✅ First Start
- [ ] `npm start` runs without errors
- [ ] Terminal shows QR code
- [ ] Tunnel/Local/LAN option appears

### ✅ App on Phone
- [ ] Downloaded Expo Go app
- [ ] Can scan QR code
- [ ] App appears and loads
- [ ] Tabs at bottom are clickable

### ✅ Navigation Works
- [ ] Home tab loads
- [ ] Workouts tab loads
- [ ] Nutrition tab loads
- [ ] Chat tab loads
- [ ] Profile tab loads

### ✅ Making Changes
- [ ] Edit a file (e.g., change a text)
- [ ] App auto-refreshes
- [ ] Changes appear on phone

### ✅ Backend Ready
- [ ] Backend server is running
- [ ] API endpoints are accessible
- [ ] Backend URL matches in `app/utils/api.js`

### 🎉 You're All Set!

If all checkboxes are ticked, your mobile app is ready for development!

---

## 🚨 If Something Fails

1. **Installation failed?**
   - Delete `node_modules/` folder
   - Run `npm install` again

2. **Can't see QR code?**
   - Press `q` to quit
   - Run `npm start` again

3. **App won't load on phone?**
   - Make sure phone and computer are on same WiFi
   - Press `r` in terminal to reload
   - Close and reopen Expo Go app

4. **Errors in terminal?**
   - Copy the error message
   - Search in [React Native docs](https://reactnative.dev/)
   - Check [Expo docs](https://docs.expo.dev/)
