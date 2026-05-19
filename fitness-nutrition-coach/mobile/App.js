import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator, AppState } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';

import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from './app/context/AuthContext';

// Components
import SplashScreen from './app/components/SplashScreen';
import ErrorBoundary from './app/components/ErrorBoundary';
import OfflineIndicator from './app/components/OfflineIndicator';

// Utils
import errorHandler from './app/utils/errorHandler';
import offlineDetection from './app/utils/offlineDetection';

// Screens
import LoginScreen from './app/screens/LoginScreen';
import ProfileSetupScreen from './app/screens/ProfileSetupScreen';
import HomeScreen from './app/screens/HomeScreen';
import WorkoutsScreen from './app/screens/WorkoutsScreen';
import NutritionScreen from './app/screens/NutritionScreen';
import ChatScreen from './app/screens/ChatScreen';
import ProfileScreen from './app/screens/ProfileScreen';
import ProgressScreen from './app/screens/ProgressScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const tabIcon = (name, focusedName) => ({ focused, color, size }) => (
  <Ionicons name={focused ? focusedName : name} size={size} color={color} />
);

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
          headerTitle: 'Fitness Coach',
          tabBarIcon: tabIcon('home-outline', 'home'),
        }}
      />
      <Tab.Screen
        name="Workouts"
        component={WorkoutsScreen}
        options={{
          headerTitle: 'My Workouts',
          tabBarIcon: tabIcon('barbell-outline', 'barbell'),
        }}
      />
      <Tab.Screen
        name="Nutrition"
        component={NutritionScreen}
        options={{
          headerTitle: 'Nutrition Plans',
          tabBarIcon: tabIcon('restaurant-outline', 'restaurant'),
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          headerTitle: 'AI Coach',
          tabBarIcon: tabIcon('chatbubble-outline', 'chatbubble'),
        }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          headerTitle: 'My Progress',
          tabBarIcon: tabIcon('trending-up-outline', 'trending-up'),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerTitle: 'My Profile',
          tabBarIcon: tabIcon('person-outline', 'person'),
        }}
      />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { user, loading, needsProfileSetup } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : needsProfileSetup ? (
        <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      ) : (
        <Stack.Screen name="MainTabs" component={HomeTabs} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [appState, setAppState] = useState(AppState.currentState);

  useEffect(() => {
    const initServices = async () => {
      try {
        await offlineDetection.initialize();
        const unsubscribeErrors = errorHandler.subscribe((error) => {
          console.log('Error event:', error);
        });
        return unsubscribeErrors;
      } catch (error) {
        console.error('Error initializing services:', error);
      }
    };
    const unsubscribe = initServices();
    return () => {
      if (unsubscribe instanceof Function) unsubscribe();
    };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      setAppState(nextAppState);
    });
    return () => subscription.remove();
  }, []);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <ErrorBoundary message="The app encountered an error. Please restart the app." onReset={() => {}}>
      <AuthProvider>
        <View style={styles.container}>
          <OfflineIndicator />
          <NavigationContainer>
            <RootNavigator />
            <StatusBar barStyle="dark-content" />
          </NavigationContainer>
        </View>
      </AuthProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
});
