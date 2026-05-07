# 📱 Complete WebView Implementation

## Full App.js Code

```javascript
import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';

// Screens
import HomeScreen from './app/screens/HomeScreen';
import WorkoutsScreen from './app/screens/WorkoutsScreen';
import NutritionScreen from './app/screens/NutritionScreen';
import ChatScreen from './app/screens/ChatScreen';
import ProfileScreen from './app/screens/ProfileScreen';
import WebViewScreen from './app/screens/WebViewScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#999',
        headerShown: true,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          headerTitle: 'Fitness Nutrition Coach',
        }}
      />
      <Tab.Screen 
        name="Workouts" 
        component={WorkoutsScreen}
        options={{
          tabBarLabel: 'Workouts',
          headerTitle: 'My Workouts',
        }}
      />
      <Tab.Screen 
        name="Nutrition" 
        component={NutritionScreen}
        options={{
          tabBarLabel: 'Nutrition',
          headerTitle: 'Nutrition Plans',
        }}
      />
      <Tab.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{
          tabBarLabel: 'Chat',
          headerTitle: 'AI Coach',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          headerTitle: 'My Profile',
        }}
      />
      <Tab.Screen 
        name="Website" 
        component={WebViewScreen}
        options={{
          tabBarLabel: 'Website',
          headerTitle: 'Website',
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={HomeTabs} />
      </Stack.Navigator>
      <StatusBar barStyle="dark-content" />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

---

## Full WebViewScreen.js Code

```javascript
import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { WebView } from 'react-native-webview';

const WebViewScreen = () => {
  const webViewRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);

  // Replace with your actual website URL
  const WEBSITE_URL = 'https://www.example.com';

  const handleLoadStart = () => {
    setLoading(true);
    setError(null);
  };

  const handleLoadEnd = () => {
    setLoading(false);
  };

  const handleError = (error) => {
    console.log('WebView error:', error);
    setError(error.description || 'Failed to load page');
    setLoading(false);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    webViewRef.current?.reload();
  };

  const onRefreshEnd = () => {
    setRefreshing(false);
  };

  const handleNavigationStateChange = (navState) => {
    setCanGoBack(navState.canGoBack);
  };

  const handleGoBack = () => {
    if (canGoBack) {
      webViewRef.current?.goBack();
    }
  };

  return (
    <View style={styles.container}>
      {/* Error State */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>⚠️ Unable to Load</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              webViewRef.current?.reload();
            }}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* WebView with Pull to Refresh */}
      {!error && (
        <ScrollView
          scrollEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              onRefreshEnd={onRefreshEnd}
              tintColor="#007AFF"
            />
          }
          style={styles.scrollView}
        >
          <View style={styles.webViewContainer}>
            <WebView
              ref={webViewRef}
              source={{ uri: WEBSITE_URL }}
              onLoadStart={handleLoadStart}
              onLoadEnd={handleLoadEnd}
              onError={handleError}
              onNavigationStateChange={handleNavigationStateChange}
              startInLoadingState={true}
              scalesPageToFit={true}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              renderLoading={() => (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#007AFF" />
                  <Text style={styles.loadingText}>Loading page...</Text>
                </View>
              )}
              style={styles.webView}
            />
          </View>
        </ScrollView>
      )}

      {/* Loading Spinner Overlay */}
      {loading && !error && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.overlayLoadingText}>Loading...</Text>
        </View>
      )}

      {/* Navigation Bar */}
      <View style={styles.navigationBar}>
        <TouchableOpacity
          style={[styles.navButton, !canGoBack && styles.navButtonDisabled]}
          onPress={handleGoBack}
          disabled={!canGoBack}
        >
          <Text style={[styles.navButtonText, !canGoBack && styles.navButtonTextDisabled]}>
            ← Back
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => {
            webViewRef.current?.reload();
            setLoading(true);
          }}
        >
          <Text style={styles.navButtonText}>🔄 Reload</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => {
            webViewRef.current?.goForward();
          }}
        >
          <Text style={styles.navButtonText}>Forward →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  webViewContainer: {
    flex: 1,
    minHeight: 500,
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    height: 400,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 999,
  },
  overlayLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#fff',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FF3B30',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  navigationBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  navButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF',
  },
  navButtonDisabled: {
    backgroundColor: '#ccc',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  navButtonTextDisabled: {
    color: '#999',
  },
});

export default WebViewScreen;
```

---

## Installation Steps

### 1. Install Dependencies

```bash
cd mobile
npm install
```

This installs `react-native-webview` along with other dependencies.

### 2. Update Website URL

Edit `app/screens/WebViewScreen.js` line 19:

```javascript
const WEBSITE_URL = 'https://your-website.com';
```

### 3. Run the App

```bash
npm start
```

### 4. Test WebView

Tap the "Website" tab in your app to see the WebView in action.

---

## What the Code Does

### 1. **State Management**
```javascript
const [loading, setLoading] = useState(true);      // Tracks page loading
const [error, setError] = useState(null);          // Stores error message
const [refreshing, setRefreshing] = useState(false); // Tracks refresh
const [canGoBack, setCanGoBack] = useState(false); // Can navigate back?
```

### 2. **Event Handlers**
- `handleLoadStart()` - Called when page starts loading
- `handleLoadEnd()` - Called when page finishes loading
- `handleError(error)` - Called when there's an error
- `handleRefresh()` - Called when user pulls to refresh
- `handleGoBack()` - Navigate back in history

### 3. **UI Components**
- **Error Screen** - Shows if page fails to load
- **WebView** - Displays the website
- **Loading Overlay** - Shows while loading
- **Navigation Bar** - Back/Reload/Forward buttons

### 4. **Features**
- ✅ Pull-to-refresh support
- ✅ Loading spinner
- ✅ Error handling with retry button
- ✅ Back/Forward navigation
- ✅ Reload functionality
- ✅ JavaScript enabled
- ✅ DOM storage enabled
- ✅ Auto-scaling

---

## Key Features Explained

### Loading Spinner
```javascript
// Shows while page loads
<ActivityIndicator size="large" color="#007AFF" />
```

### Pull to Refresh
```javascript
<RefreshControl
  refreshing={refreshing}
  onRefresh={handleRefresh}
  tintColor="#007AFF"
/>
```

### Error Handling
```javascript
const handleError = (error) => {
  setError(error.description || 'Failed to load page');
  setLoading(false);
};
```

### Navigation Buttons
```javascript
// Back button - disabled if can't go back
<TouchableOpacity
  disabled={!canGoBack}
  onPress={handleGoBack}
>
  <Text>← Back</Text>
</TouchableOpacity>
```

---

## Customization Examples

### Load Different URL
```javascript
const WEBSITE_URL = 'https://www.github.com';
```

### Change Loading Text
```javascript
<Text style={styles.loadingText}>Please wait...</Text>
```

### Change Colors
```javascript
color="#FF0000"           // Change to red
backgroundColor="#000000" // Change to black
```

### Disable JavaScript
```javascript
<WebView
  javaScriptEnabled={false}
  // ... other props
/>
```

---

## Testing URLs

```javascript
// Test with these URLs:
'https://example.com'
'https://www.google.com'
'https://www.github.com'
'https://react-native.dev'
'https://www.wikipedia.org'
```

---

## Troubleshooting

### Page Won't Load
1. Check URL format (must have http:// or https://)
2. Check internet connection
3. Try pressing Reload button

### Blank White Screen
1. Press the Reload button
2. Use pull-to-refresh
3. Check website is accessible in browser

### Loading Spinner Hangs
1. Internet connection issue
2. Website is slow
3. Website doesn't exist
4. Try different website first

### Back Button Disabled
This is normal - it only enables when there's navigation history.

---

## Next Steps

1. ✅ Update `WEBSITE_URL` to your site
2. ✅ Run `npm install`
3. ✅ Test on your phone
4. ✅ Test pull-to-refresh
5. ✅ Test error handling (go offline)
6. ✅ Customize appearance as needed

---

## Resources

- [react-native-webview docs](https://react-native-webview.js.org/)
- [React Native docs](https://reactnative.dev/)
- [Expo docs](https://docs.expo.dev/)

Happy coding! 🚀
