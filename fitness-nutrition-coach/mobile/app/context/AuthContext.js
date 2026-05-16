import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI, setSessionExpiredHandler } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadToken = async () => {
      const token = await AsyncStorage.getItem('access_token');
      const userData = await AsyncStorage.getItem('user_data');
      if (token && userData) {
        setUser(JSON.parse(userData));
      }
      setLoading(false);
    };
    loadToken();
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(() => setUser(null));
  }, []);

  const login = async (email, password) => {
    const data = await authAPI.login({ email, password });
    await AsyncStorage.setItem('access_token', data.access_token);
    // Store full user object from response so we can check profile completeness
    const userData = data.user || { email };
    await AsyncStorage.setItem('user_data', JSON.stringify(userData));
    setUser(userData);
    return data;
  };

  const register = async (userData) => {
    const data = await authAPI.register(userData);
    await AsyncStorage.setItem('access_token', data.access_token);
    const storedUser = data.user || { email: userData.email };
    await AsyncStorage.setItem('user_data', JSON.stringify(storedUser));
    setUser(storedUser);
    return data;
  };

  // Called after profile setup to mark profile as complete
  const completeProfile = (updatedUser) => {
    const merged = { ...user, ...updatedUser };
    AsyncStorage.setItem('user_data', JSON.stringify(merged));
    setUser(merged);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('access_token');
    await AsyncStorage.removeItem('user_data');
    setUser(null);
  };

  // Profile is incomplete if age is not set
  const needsProfileSetup = user && !user.age;

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, completeProfile, needsProfileSetup }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
