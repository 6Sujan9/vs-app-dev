@echo off
REM Setup script for React Native/Expo development environment (Windows)

echo.
echo 🚀 Setting up Fitness Nutrition Coach Mobile App...
echo.

REM Check Node.js
echo 📦 Checking Node.js...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js not found. Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js version: %NODE_VERSION%

REM Check npm
echo 📦 Checking npm...
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm not found. Please install npm
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✅ npm version: %NPM_VERSION%

REM Install dependencies
echo.
echo 📥 Installing dependencies...
call npm install

echo.
echo ✅ Setup complete!
echo.
echo 📱 To start the app, run:
echo    npm start
echo.
echo 🌐 Available commands:
echo    npm start      - Start development server
echo    npm run android - Run on Android emulator
echo    npm run ios     - Run on iOS simulator
echo    npm run web     - Run in browser
echo.
echo 💡 Tip: Download Expo Go from App Store/Play Store to test on your phone!
echo.
pause
