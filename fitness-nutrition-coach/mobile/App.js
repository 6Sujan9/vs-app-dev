import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, AppState } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';

// Components
import SplashScreen from './app/components/SplashScreen';
import ErrorBoundary from './app/components/ErrorBoundary';
import OfflineIndicator from './app/components/OfflineIndicator';

// Utils
import errorHandler from './app/utils/errorHandler';
import offlineDetection from './app/utils/offlineDetection';
import pushNotificationService from './app/utils/pushNotifications';

// Screens
import HomeScreen from './app/screens/HomeScreen';
import WorkoutsScreen from './app/screens/WorkoutsScreen';
import NutritionScreen from './app/screens/NutritionScreen';
import ChatScreen from './app/screens/ChatScreen';
import ProfileScreen from './app/screens/ProfileScreen';
import WebViewScreen from './app/screens/WebViewScreen';
import ScannerScreen from './app/screens/ScannerScreen';

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
        name="Scanner"
        component={ScannerScreen}
        options={{
          tabBarLabel: 'Scanner',
          headerTitle: 'QR Scanner',
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
  const [showSplash, setShowSplash] = useState(true);
  const [appState, setAppState] = useState(AppState.currentState);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  // Initialize services on app start
  useEffect(() => {
    const initServices = async () => {
      try {
        // Initialize offline detection
        await offlineDetection.initialize();

        // Initialize push notifications
        const token = await pushNotificationService.initialize();
        if (token) {
          console.log('Push notifications enabled. Token:', token);
        } else {
          console.log('Push notifications not available');
        }

        // Subscribe to errors
        const unsubscribeErrors = errorHandler.subscribe((error) => {
          console.log('Error event:', error);
          // Could show error UI here if needed
        });

        return unsubscribeErrors;
      } catch (error) {
        console.error('Error initializing services:', error);
      }
    };

    const unsubscribe = initServices();

    return () => {
      if (unsubscribe instanceof Function) {
        unsubscribe();
      }
    };
  }, []);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [appState]);

  const handleAppStateChange = (nextAppState) => {
    if (appState.match(/inactive|background/) && nextAppState === 'active') {
      // App has come to foreground
      console.log('App came to foreground');
      // Re-initialize connections if needed
    }

    setAppState(nextAppState);
  };

  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <ErrorBoundary
      message="The app encountered an error. Please restart the app."
      onReset={() => {
        // Reset app state if needed
      }}
    >
      <View style={styles.container}>
        <OfflineIndicator />
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MainTabs" component={HomeTabs} />
          </Stack.Navigator>
          <StatusBar barStyle="dark-content" />
        </NavigationContainer>
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
