import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DARK_KEY = '@fitness_dark_mode';

export const lightTheme = {
  isDark: false,
  colors: {
    bg: '#F5F5F7',
    surface: '#FFFFFF',
    surfaceAlt: '#F0F0F5',
    card: '#FFFFFF',
    text: '#1A1A2E',
    textSub: '#555',
    textMuted: '#999',
    primary: '#6C63FF',
    primaryBg: 'rgba(108,99,255,0.1)',
    secondary: '#FF6584',
    success: '#43D787',
    successBg: 'rgba(67,215,135,0.12)',
    warning: '#FFB347',
    warningBg: 'rgba(255,179,71,0.12)',
    danger: '#FF3B30',
    dangerBg: 'rgba(255,59,48,0.1)',
    border: 'rgba(0,0,0,0.08)',
    divider: 'rgba(0,0,0,0.06)',
    tabBar: '#FFFFFF',
    tabBorder: 'rgba(0,0,0,0.1)',
    header: '#FFFFFF',
    headerText: '#1A1A2E',
    hero: '#1a237e',
    heroAccent: 'rgba(108,99,255,0.3)',
    statusBar: 'dark',
    inputBg: '#F0F0F5',
    inputBorder: '#E0E0E0',
    skeleton: '#E8E8E8',
    overlay: 'rgba(0,0,0,0.5)',
    shadow: '#000',
  },
};

export const darkTheme = {
  isDark: true,
  colors: {
    bg: '#0F0F0F',
    surface: '#1A1A1A',
    surfaceAlt: '#242424',
    card: '#1E1E1E',
    text: '#FFFFFF',
    textSub: '#AAAAAA',
    textMuted: '#555',
    primary: '#7C73FF',
    primaryBg: 'rgba(124,115,255,0.15)',
    secondary: '#FF6584',
    success: '#43D787',
    successBg: 'rgba(67,215,135,0.15)',
    warning: '#FFB347',
    warningBg: 'rgba(255,179,71,0.15)',
    danger: '#FF453A',
    dangerBg: 'rgba(255,69,58,0.12)',
    border: 'rgba(255,255,255,0.08)',
    divider: 'rgba(255,255,255,0.06)',
    tabBar: '#1A1A1A',
    tabBorder: 'rgba(255,255,255,0.1)',
    header: '#1A1A1A',
    headerText: '#FFFFFF',
    hero: '#1a237e',
    heroAccent: 'rgba(108,99,255,0.4)',
    statusBar: 'light',
    inputBg: '#242424',
    inputBorder: '#333333',
    skeleton: '#2A2A2A',
    overlay: 'rgba(0,0,0,0.7)',
    shadow: '#6C63FF',
  },
};

const ThemeContext = createContext({ theme: lightTheme, toggleTheme: () => {} });

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(lightTheme);

  useEffect(() => {
    AsyncStorage.getItem(DARK_KEY).then(v => {
      if (v === 'true') setTheme(darkTheme);
    });
  }, []);

  const toggleTheme = async () => {
    const next = theme.isDark ? lightTheme : darkTheme;
    setTheme(next);
    await AsyncStorage.setItem(DARK_KEY, String(next.isDark));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
