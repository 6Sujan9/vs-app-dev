import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ViewPropTypes,
} from 'react-native';

export const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  style,
  textStyle,
  icon,
  loading = false,
}) => {
  const variants = {
    primary: {
      bg: '#007AFF',
      text: '#fff',
    },
    secondary: {
      bg: '#f0f0f0',
      text: '#007AFF',
    },
    success: {
      bg: '#34C759',
      text: '#fff',
    },
    danger: {
      bg: '#FF3B30',
      text: '#fff',
    },
    outline: {
      bg: 'transparent',
      text: '#007AFF',
      border: '#007AFF',
    },
  };

  const sizes = {
    small: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      fontSize: 12,
    },
    medium: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      fontSize: 14,
    },
    large: {
      paddingVertical: 16,
      paddingHorizontal: 32,
      fontSize: 16,
    },
  };

  const variantStyle = variants[variant];
  const sizeStyle = sizes[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.button,
        {
          backgroundColor: disabled ? '#ccc' : variantStyle.bg,
          paddingVertical: sizeStyle.paddingVertical,
          paddingHorizontal: sizeStyle.paddingHorizontal,
          borderWidth: variantStyle.border ? 1 : 0,
          borderColor: variantStyle.border || 'transparent',
        },
        style,
      ]}
    >
      <View style={styles.buttonContent}>
        {icon && <View style={styles.icon}>{icon}</View>}
        <Text
          style={[
            styles.buttonText,
            {
              color: disabled ? '#999' : variantStyle.text,
              fontSize: sizeStyle.fontSize,
            },
            textStyle,
          ]}
        >
          {loading ? '...' : title}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export const Card = ({
  children,
  style,
  onPress,
  shadow = true,
  padding = true,
}) => {
  const content = (
    <View
      style={[
        styles.card,
        shadow && styles.cardShadow,
        padding && styles.cardPadding,
        style,
      ]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={{ overflow: 'hidden', borderRadius: 12 }}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

export const Badge = ({ label, color = 'primary' }) => {
  const colors = {
    primary: { bg: '#007AFF', text: '#fff' },
    success: { bg: '#34C759', text: '#fff' },
    warning: { bg: '#FF9500', text: '#fff' },
    danger: { bg: '#FF3B30', text: '#fff' },
    neutral: { bg: '#e0e0e0', text: '#000' },
  };

  const colorStyle = colors[color];

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: colorStyle.bg },
      ]}
    >
      <Text style={[styles.badgeText, { color: colorStyle.text }]}>
        {label}
      </Text>
    </View>
  );
};

export const Divider = ({ style, color = '#e0e0e0' }) => (
  <View
    style={[
      styles.divider,
      { backgroundColor: color },
      style,
    ]}
  />
);

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontWeight: '600',
  },
  icon: {
    marginRight: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardPadding: {
    padding: 16,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
});
