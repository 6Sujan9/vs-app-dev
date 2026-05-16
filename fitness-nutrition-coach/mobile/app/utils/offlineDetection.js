import React from 'react';
import NetInfo from '@react-native-community/netinfo';

class OfflineDetection {
  constructor() {
    this.isConnected = true;
    this.listeners = [];
    this.unsubscribe = null;
  }

  /**
   * Initialize offline detection
   * Starts listening to network changes
   */
  async initialize() {
    try {
      // Get initial connection state
      const state = await NetInfo.fetch();
      this.isConnected = state.isConnected && state.isInternetReachable;

      // Subscribe to network changes
      this.unsubscribe = NetInfo.addEventListener((state) => {
        const previousStatus = this.isConnected;
        this.isConnected = state.isConnected && state.isInternetReachable;

        // Only trigger listeners if status changed
        if (previousStatus !== this.isConnected) {
          this.notifyListeners({
            isConnected: this.isConnected,
            type: state.type,
            previousStatus,
          });
        }
      });

      return this.isConnected;
    } catch (error) {
      console.warn('Error initializing offline detection:', error);
      return true; // Default to connected on error
    }
  }

  /**
   * Subscribe to connectivity changes
   * @param {Function} callback - Called with {isConnected, type, previousStatus}
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }

    this.listeners.push(callback);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((listener) => listener !== callback);
    };
  }

  /**
   * Notify all listeners of status change
   * @private
   */
  notifyListeners(state) {
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (error) {
        console.warn('Error in offline detection listener:', error);
      }
    });
  }

  /**
   * Check if device is currently connected
   * @returns {boolean}
   */
  getStatus() {
    return this.isConnected;
  }

  /**
   * Get detailed connection info
   * @returns {Promise<Object>}
   */
  async getDetails() {
    try {
      const state = await NetInfo.fetch();
      return {
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type, // wifi, cellular, bluetooth, ethernet, none, unknown
        details: state.details,
      };
    } catch (error) {
      console.warn('Error getting connection details:', error);
      return {
        isConnected: true,
        isInternetReachable: true,
        type: 'unknown',
        details: null,
      };
    }
  }

  /**
   * Cleanup and unsubscribe from network events
   */
  cleanup() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.listeners = [];
  }
}

// Export singleton instance
const offlineDetection = new OfflineDetection();
export default offlineDetection;

/**
 * Hook for using offline detection in components
 * @example
 * const { isConnected } = useOfflineDetection();
 */
export function useOfflineDetection() {
  const [isConnected, setIsConnected] = React.useState(true);
  const [connectionType, setConnectionType] = React.useState('unknown');

  React.useEffect(() => {
    offlineDetection.initialize();

    const unsubscribe = offlineDetection.subscribe((state) => {
      setIsConnected(state.isConnected);
      setConnectionType(state.type || 'unknown');
    });

    return () => {
      unsubscribe();
      // Optional: cleanup on unmount
      // OfflineDetection.cleanup();
    };
  }, []);

  return {
    isConnected,
    connectionType,
    isOnline: isConnected,
    isOffline: !isConnected,
  };
}
