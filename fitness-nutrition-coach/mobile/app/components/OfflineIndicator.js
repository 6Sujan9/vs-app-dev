import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useOfflineDetection } from '../utils/offlineDetection';

/**
 * Offline Indicator Component
 * Shows a banner when device is offline
 * Automatically hides when connection is restored
 */
const OfflineIndicator = ({ style = {} }) => {
  const { isConnected, connectionType } = useOfflineDetection();
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    // Show indicator when offline
    setShowIndicator(!isConnected);
  }, [isConnected]);

  if (showIndicator) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.icon}>📡</Text>
        <View style={styles.content}>
          <Text style={styles.title}>No Connection</Text>
          <Text style={styles.message}>
            You are offline. Some features may be limited.
          </Text>
        </View>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E67E22',
  },
  icon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  message: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
  },
});

/**
 * Floating offline indicator that appears at bottom
 */
export function FloatingOfflineIndicator({ style = {} }) {
  const { isConnected } = useOfflineDetection();

  if (isConnected) return null;

  return (
    <View style={[styles.floatingContainer, style]}>
      <Text style={styles.icon}>📡</Text>
      <Text style={styles.floatingText}>No Connection</Text>
    </View>
  );
}

StyleSheet.compose(styles, {
  floatingContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  floatingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
});

export default OfflineIndicator;
