# Quick Start Guide - Frontend

## ⚡ Get Running in 5 Minutes

### 1. Install Dependencies (1 minute)
```bash
cd frontend
npm install
```

### 2. Configure Environment (30 seconds)
```bash
cp .env.example .env
```

**Default .env (no changes needed for local development):**
```
REACT_APP_API_URL=http://localhost:8000
REACT_APP_API_TIMEOUT=10000
REACT_APP_ENV=development
```

### 3. Start Development Server (30 seconds)
```bash
npm start
```

App opens at: **http://localhost:3000**

---

## 🧪 Test the Application

### 1. Register a New Account
- Go to http://localhost:3000/register
- Fill in: First Name, Last Name, Email, Password
- Click "Sign Up"

### 2. Complete Profile Setup
- Age: 25
- Weight: 75 kg
- Height: 180 cm
- Fitness Level: Beginner
- Select Goals: At least one
- Fill dietary/medical info
- Click "Complete Setup"

### 3. Explore Dashboard
- View stats overview
- Navigate tabs: Workouts, Nutrition, Progress
- Click "New Workout" or "New Meal Plan"

### 4. Try the Chat
- Click Chat tab or navigate to `/chat`
- Send a message like: "Create a beginner workout plan"
- See AI response (will fail until backend is running)

### 5. Log Progress
- Dashboard → Progress tab
- Click "Log Progress"
- Enter weight, measurements, activity
- Save entry

---

## 📋 Available Pages

| URL | Purpose | Status |
|-----|---------|--------|
| `/login` | User login | ✅ Ready |
| `/register` | New account creation | ✅ Ready |
| `/profile-setup` | Complete profile | ✅ Ready |
| `/dashboard` | Main hub | ✅ Ready |
| `/chat` | AI chat assistant | ✅ Ready (UI only) |

---

## 🔧 Development Commands

```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Eject configuration (⚠️ irreversible)
npm run eject
```

---

## 🗂️ Key Files to Explore

### Main Components
```
src/components/Auth/Login.jsx           - Login page
src/components/Auth/Register.jsx        - Registration page
src/components/Dashboard/Dashboard.jsx  - Main dashboard
src/components/Chat/ChatInterface.jsx   - Chat UI
```

### State Management
```
src/store/authSlice.js      - Authentication state
src/store/userSlice.js      - User profile state
src/store/workoutSlice.js   - Workouts state
src/store/nutritionSlice.js - Meal plans state
```

### API Client
```
src/services/api.js - All API calls (currently mocked until backend ready)
```

---

## 🔌 Backend Integration Checklist

When backend is ready:

1. **Start Backend Server**
   ```bash
   cd ../backend
   python -m uvicorn app.main:app --reload
   ```

2. **Verify Backend Runs on Port 8000**
   - Check: http://localhost:8000/docs (Swagger UI)

3. **Frontend Automatically Works**
   - API client in `src/services/api.js` already configured
   - All endpoints ready to use
   - Token refresh already implemented

4. **Test API Connection**
   - Open browser DevTools → Network tab
   - Login and watch network requests
   - Should see POST /api/v1/auth/login request

---

## 🐛 Troubleshooting

### Port 3000 Already in Use
```bash
# Use different port
PORT=3001 npm start
```

### Module Not Found Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### CORS Errors (When Backend Added)
```
Error: "Access to XMLHttpRequest blocked by CORS policy"

Solution: Ensure backend has correct CORS settings
Backend should allow requests from http://localhost:3000
```

### API Calls Failing
```
Check:
1. Is backend running on port 8000?
2. Is REACT_APP_API_URL set correctly in .env?
3. Check browser DevTools → Network tab for details
4. Check backend logs for errors
```

---

## 📦 Project Structure

```
frontend/
├── public/
│   └── index.html          # Main HTML file
├── src/
│   ├── components/         # React components
│   │   ├── Auth/          # Login/Register
│   │   ├── Dashboard/     # Main dashboard
│   │   ├── Chat/          # Chat interface
│   │   ├── UserProfile/   # Profile setup
│   │   └── styles/        # CSS files
│   ├── services/
│   │   └── api.js         # API client
│   ├── store/             # Redux state
│   ├── App.jsx            # Main app
│   └── index.js           # Entry point
├── package.json
├── .env.example
└── README.md
```

---

## 🎯 Next Steps

### Explore Documentation
1. Read `FRONTEND_DOCUMENTATION.md` - Complete guide
2. Read `API_INTEGRATION_GUIDE.md` - All API examples
3. Read `FRONTEND_BUILD_SUMMARY.md` - Feature overview

### Build Backend
See `../backend` folder and documentation

### Deploy
When ready:
```bash
npm run build  # Creates optimized build
# Upload 'build' folder to hosting
```

---

## 💡 Tips

### Use Redux DevTools
Install [Redux DevTools Chrome Extension](https://chrome.google.com/webstore/detail/redux-devtools/lmjabopchkidglrpbfkpgbkcfjfknbpd) to debug state

### Check API Calls
Open DevTools → Network tab to see all API requests and responses

### Modify API Calls
All API logic is in `src/services/api.js` - easy to modify endpoints or add new ones

### Add New Components
Copy existing component structure and follow the same patterns

---

## ✨ Features Ready to Use

✅ User authentication (login/register)
✅ User profile management
✅ Dashboard with tabs
✅ Workout plan UI
✅ Meal plan UI
✅ Chat interface
✅ Progress logging
✅ Form validation
✅ Error handling
✅ Responsive design

---

## 📞 Need Help?

1. **Check browser console** for error messages
2. **Check DevTools Network tab** for API calls
3. **Read the documentation files** in this directory
4. **Review code comments** in components

---

## 🚀 Ready to Go!

You have a fully functional frontend ready for:
- ✅ Testing UI/UX locally
- ✅ Developing backend against
- ✅ Deploying to production
- ✅ Extending with new features

**Happy coding!** 🎉
