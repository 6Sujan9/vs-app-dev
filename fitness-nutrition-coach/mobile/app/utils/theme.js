export const theme = {
  colors: {
    // Primary colors
    primary: '#007AFF',
    primaryLight: '#5AC8FA',
    primaryDark: '#0051CC',

    // Semantic colors
    success: '#34C759',
    successLight: '#D1F5E0',
    warning: '#FF9500',
    warningLight: '#FFE8D1',
    danger: '#FF3B30',
    dangerLight: '#FFEBE8',
    info: '#5AC8FA',
    infoLight: '#D1EBFF',

    // Neutral colors
    white: '#fff',
    black: '#000',
    dark: '#1A1A1A',
    gray900: '#1a1a1a',
    gray800: '#2d2d2d',
    gray700: '#404040',
    gray600: '#595959',
    gray500: '#757575',
    gray400: '#9e9e9e',
    gray300: '#c9c9c9',
    gray200: '#e0e0e0',
    gray100: '#f5f5f5',
    gray50: '#fafafa',
    light: '#f8f9fa',

    // Semantic text/background
    text: '#1A1A1A',
    textSecondary: '#666',
    textTertiary: '#999',
    textInverse: '#fff',
    background: '#f8f9fa',
    backgroundSecondary: '#fff',
    border: '#e0e0e0',
    divider: '#e0e0e0',

    // Overlay
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayLight: 'rgba(0, 0, 0, 0.1)',
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    xxxl: 40,
  },

  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 999,
  },

  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 28,
    h1: 32,
    h2: 28,
    h3: 24,
    h4: 20,
    h5: 18,
    h6: 16,
  },

  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },

  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },

  shadows: {
    xs: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 1,
      elevation: 1,
    },
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.25,
      shadowRadius: 24,
      elevation: 12,
    },
  },

  transitions: {
    fast: 200,
    base: 300,
    slow: 500,
  },
};
