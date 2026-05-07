import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// Set notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class PushNotificationService {
  constructor() {
    this.expoPushToken = null;
    this.notificationListeners = [];
    this.responseListeners = [];
  }

  /**
   * Initialize push notifications
   * Must be called once on app startup
   * @returns {Promise<string|null>} Push token or null if unavailable
   */
  async initialize() {
    try {
      // Check if running on physical device
      if (!Device.isDevice) {
        console.warn('Push notifications only work on physical devices');
        return null;
      }

      // Get current permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not already granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Push notification permission not granted');
        return null;
      }

      // Get push token
      const token = await this.getPushToken();
      this.expoPushToken = token;

      // Setup listeners
      this.setupListeners();

      return token;
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      return null;
    }
  }

  /**
   * Get device push token
   * @private
   */
  async getPushToken() {
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;

      if (!projectId) {
        console.warn('Project ID not found in app config');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      return token.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  /**
   * Setup notification listeners
   * @private
   */
  setupListeners() {
    // Listen for notifications when app is in foreground
    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        this.handleNotificationReceived(notification);
      }
    );
    this.notificationListeners.push(notificationListener);

    // Listen for notification responses (user tapped notification)
    const responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        this.handleNotificationResponse(response);
      }
    );
    this.responseListeners.push(responseListener);
  }

  /**
   * Handle notification received while app is foreground
   * @private
   */
  handleNotificationReceived(notification) {
    console.log('Notification received:', notification);
  }

  /**
   * Handle user tapping on notification
   * @private
   */
  handleNotificationResponse(response) {
    const { notification, actionIdentifier } = response;

    // Navigate based on notification data
    if (notification.request.content.data) {
      const { screen, params } = notification.request.content.data;
      if (screen) {
        console.log('Navigate to:', screen, params);
        // Navigation will be handled by the app using this data
      }
    }
  }

  /**
   * Subscribe to notification received events
   * @param {Function} callback
   * @returns {Function} Unsubscribe function
   */
  subscribeToNotifications(callback) {
    const listener = Notifications.addNotificationReceivedListener(callback);
    this.notificationListeners.push(listener);

    return () => {
      listener.remove();
      this.notificationListeners = this.notificationListeners.filter(
        (l) => l !== listener
      );
    };
  }

  /**
   * Subscribe to notification responses (taps)
   * @param {Function} callback
   * @returns {Function} Unsubscribe function
   */
  subscribeToResponses(callback) {
    const listener = Notifications.addNotificationResponseReceivedListener(callback);
    this.responseListeners.push(listener);

    return () => {
      listener.remove();
      this.responseListeners = this.responseListeners.filter((l) => l !== listener);
    };
  }

  /**
   * Schedule a local notification
   * @param {Object} options - { title, body, delay, data }
   * @returns {Promise<string>} Notification ID
   */
  async scheduleNotification({ title, body, delay = 5, data = {} }) {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          badge: 1,
          sound: 'default',
        },
        trigger: delay ? { seconds: delay } : null,
      });

      return id;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  /**
   * Send a local notification immediately
   * @param {Object} options - { title, body, data }
   * @returns {Promise<string|null>}
   */
  async sendNotification({ title, body, data = {} }) {
    return this.scheduleNotification({
      title,
      body,
      delay: 1,
      data,
    });
  }

  /**
   * Schedule a notification for a specific time
   * @param {Object} options - { title, body, date, data }
   * @returns {Promise<string>}
   */
  async scheduleAtTime({ title, body, date, data = {} }) {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          badge: 1,
          sound: 'default',
        },
        trigger: {
          type: 'date',
          date,
        },
      });

      return id;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  /**
   * Cancel a scheduled notification
   * @param {string} id - Notification ID
   */
  async cancelNotification(id) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling notifications:', error);
    }
  }

  /**
   * Get all scheduled notifications
   * @returns {Promise<Array>}
   */
  async getScheduledNotifications() {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Get push token
   * @returns {string|null}
   */
  getPushToken() {
    return this.expoPushToken;
  }

  /**
   * Cleanup listeners
   */
  cleanup() {
    this.notificationListeners.forEach((listener) => listener.remove());
    this.responseListeners.forEach((listener) => listener.remove());
    this.notificationListeners = [];
    this.responseListeners = [];
  }
}

// Export singleton instance
export default new PushNotificationService();

/**
 * Hook for using push notifications in components
 * @example
 * const { pushToken } = usePushNotifications();
 * pushNotificationService.sendNotification({ title: 'Hello', body: 'World' });
 */
export function usePushNotifications() {
  const [pushToken, setPushToken] = React.useState(null);

  React.useEffect(() => {
    // Initialize push notifications
    const initNotifications = async () => {
      const token = await PushNotificationService.initialize();
      setPushToken(token);
    };

    initNotifications();

    // Subscribe to notifications
    const unsubscribeNotifications = PushNotificationService.subscribeToNotifications(
      (notification) => {
        console.log('Notification received:', notification);
      }
    );

    // Subscribe to responses
    const unsubscribeResponses = PushNotificationService.subscribeToResponses(
      (response) => {
        console.log('Notification response:', response);
      }
    );

    return () => {
      unsubscribeNotifications();
      unsubscribeResponses();
      PushNotificationService.cleanup();
    };
  }, []);

  return {
    pushToken,
    canSend: pushToken !== null,
  };
}
