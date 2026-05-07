# 🏗️ Mobile App Architecture & Flow

## Application Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    REACT NATIVE APP                         │
│                  (Mobile Screens)                           │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
    ┌───▼──┐           ┌────▼────┐        ┌────▼────┐
    │Bottom│           │  App.js │        │  Utils  │
    │  Tab │◄──────────│Navigation├──────►│   API   │
    │ Nav  │           │System   │        │ Config  │
    └─┬──┬─┘           └────┬────┘        └────┬────┘
      │  │                  │                  │
      │  └──────────────────┼──────────────────┘
      │                     │
    ┌─▼─────────────────────▼─────────────────────┐
    │         5 SCREEN COMPONENTS                 │
    ├───────────────────────────────────────────┤
    │  • HomeScreen     (Dashboard)              │
    │  • WorkoutsScreen (Workouts)               │
    │  • NutritionScreen (Meals)                 │
    │  • ChatScreen     (AI Chat)                │
    │  • ProfileScreen  (Account)                │
    └──────────┬───────────────────────┬─────────┘
               │                       │
        ┌──────▼─────┐       ┌─────────▼──────┐
        │  Utils/    │       │   Components   │
        │  theme.js  │       │   (Ready to    │
        │ (Colors)   │       │    add)        │
        └────────────┘       └────────────────┘
               ▲                       ▲
               │                       │
               └───────────┬───────────┘
                           │
                    ┌──────▼────────┐
                    │  Backend API  │
                    │ (http calls)  │
                    └───────────────┘
```

## Data Flow Diagram

```
User Input (Phone)
       │
       ▼
┌──────────────────┐
│   Screen Event   │ (onClick, onChange, etc)
│   Handler        │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  State Update    │
│  (React State)   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   Re-render UI   │
│   Component      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   Update Screen  │
│   on Phone       │
└──────────────────┘

Optional: Call API
         │
         ▼
┌──────────────────┐
│   Call Backend   │ (using api.js config)
│   API            │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   Get Response   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   Update State   │
│   with Data      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   Show New Data  │
│   to User        │
└──────────────────┘
```

## Navigation Flow

```
                    ┌─────────────┐
                    │   HOME      │
                    └─────┬───────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
    ┌───▼────┐    ┌──────▼──────┐   ┌──────▼──────┐
    │WORKOUTS│    │ NUTRITION   │   │ CHAT        │
    └────────┘    └─────────────┘   └─────────────┘
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │
                    ┌─────▼────┐
                    │ PROFILE  │
                    └──────────┘
```

## File Structure & Relationships

```
App.js (Main Component)
  │
  ├─► App.json (Configuration)
  │
  ├─► Navigation Setup
  │   └─► Bottom Tab Navigator
  │       ├─► HomeStack
  │       │   └─► HomeScreen.js
  │       │
  │       ├─► WorkoutStack
  │       │   └─► WorkoutsScreen.js
  │       │
  │       ├─► NutritionStack
  │       │   └─► NutritionScreen.js
  │       │
  │       ├─► ChatStack
  │       │   └─► ChatScreen.js
  │       │
  │       └─► ProfileStack
  │           └─► ProfileScreen.js
  │
  └─► Utilities
      ├─► app/utils/api.js (API Configuration)
      │   └─► Backend: http://localhost:8000/api/v1
      │
      └─► app/utils/theme.js (Design System)
          ├─► Colors (primary, success, danger, etc)
          ├─► Spacing (xs, sm, md, lg, xl)
          ├─► Border Radius (sm, md, lg, xl)
          └─► Font Sizes (xs, sm, md, lg, xl, xxl)
```

## Component Hierarchy

```
App (Root Component)
├── StatusBar
└── NavigationContainer
    └── Stack Navigator
        └── HomeTabs (Bottom Tabs)
            ├── HomeTab
            │   └── HomeScreen
            │       ├── Header
            │       ├── ScrollView
            │       └── Cards/Buttons
            │
            ├── WorkoutsTab
            │   └── WorkoutsScreen
            │       ├── Header
            │       └── Workout Cards
            │
            ├── NutritionTab
            │   └── NutritionScreen
            │       ├── Header
            │       ├── Progress Bar
            │       └── Meal Cards
            │
            ├── ChatTab
            │   └── ChatScreen
            │       ├── Messages List
            │       └── Input Box
            │
            └── ProfileTab
                └── ProfileScreen
                    ├── Avatar
                    ├── Info Cards
                    └── Action Buttons
```

## Technology Stack Diagram

```
┌─────────────────────────────────────────┐
│     React Native (Mobile Framework)     │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Expo (Development Platform)    │   │
│  ├─────────────────────────────────┤   │
│  │                                 │   │
│  │  ┌─────────────────────────┐    │   │
│  │  │ React (UI Library)      │    │   │
│  │  ├─────────────────────────┤    │   │
│  │  │                         │    │   │
│  │  │ React Navigation        │    │   │
│  │  │ (Tab Navigation)        │    │   │
│  │  │                         │    │   │
│  │  │ Axios (HTTP Client)     │    │   │
│  │  │                         │    │   │
│  │  └─────────────────────────┘    │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
           │
           ▼
    ┌──────────────┐
    │   Backend    │
    │     API      │
    └──────────────┘
```

## API Communication Flow

```
Mobile App                              Backend
    │                                      │
    ├─ Register ───────────────────────►  │
    │  POST /auth/register                │
    │                                      │
    │  {email, username, password}        │
    │                                      │
    │ ◄────────────── User Created ──────┤
    │                {id, token}          │
    │                                      │
    ├─ Generate Workout ──────────────►  │
    │  POST /workouts/generate            │
    │                                      │
    │  {goal, duration, intensity}        │
    │                                      │
    │ ◄──────── Workout Plan ──────────┤
    │             {exercises}             │
    │                                      │
    ├─ Chat Message ──────────────────►  │
    │  POST /chat/send                    │
    │                                      │
    │  {message, context}                 │
    │                                      │
    │ ◄────── AI Response ──────────────┤
    │        {ai_response}                │
    │                                      │
```

## Development Workflow

```
1. Edit Code
   ↓
2. Save File
   ↓
3. Hot Reload (Press R)
   ↓
4. App Refreshes on Phone
   ↓
5. See Changes Instantly
   ↓
6. Iterate
```

## Deployment Architecture (Future)

```
┌──────────────────────────────────────────┐
│      Development (Local)                 │
│  npm start → Expo Go on Phone            │
└──────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────┐
│      Testing (Emulator/Device)           │
│  npm run android / npm run ios           │
└──────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────┐
│      Production (Native Build)           │
│  eas build → App Store / Play Store      │
└──────────────────────────────────────────┘
```

## Directory Tree (Visual)

```
mobile/
│
├── 📱 Screens (UI)
│   ├── HomeScreen       → Welcome & Features
│   ├── WorkoutsScreen   → Workout Plans
│   ├── NutritionScreen  → Meal Tracking
│   ├── ChatScreen       → AI Assistant
│   └── ProfileScreen    → User Account
│
├── 🔧 Utilities
│   ├── api.js          → Backend Config
│   └── theme.js        → Design System
│
├── 📚 Docs
│   ├── GETTING_STARTED.md
│   ├── QUICK_START.md
│   ├── README.md
│   └── PROJECT_OVERVIEW.md
│
├── ⚙️ Config
│   ├── App.js          → Navigation
│   ├── app.json        → Settings
│   ├── babel.config.js → Transpiler
│   └── package.json    → Dependencies
│
└── 🛠️ Setup
    ├── setup.bat       → Windows
    └── setup.sh        → Mac/Linux
```

---

## Key Takeaways

1. **Modular Design** - Each screen is independent
2. **Reusable Components** - Utils and theme shared
3. **Easy Customization** - Colors in theme.js
4. **Backend Ready** - API config in app/utils/api.js
5. **Hot Reload** - Instant feedback during development

This architecture makes it easy to add features and scale the app! 🚀
