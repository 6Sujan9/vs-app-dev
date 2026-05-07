import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Animated,
  Dimensions,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ onFinish }) => {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.5);

  useEffect(() => {
    // Logo animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    // Finish after 3 seconds
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        onFinish();
      });
    }, 2500);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, onFinish]);

  return (
    <View style={styles.container}>
      {/* Gradient-like background */}
      <View style={styles.background}>
        <View style={styles.gradientTop} />
        <View style={styles.gradientBottom} />
      </View>

      {/* Main content */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Logo Circle */}
        <View style={styles.logoContainer}>
          <View style={styles.logoBg}>
            <Text style={styles.logoEmoji}>💪</Text>
          </View>
        </View>

        {/* App Title */}
        <Text style={styles.appTitle}>Fitness Coach</Text>
        <Text style={styles.appSubtitle}>Nutrition Companion</Text>

        {/* Loading dots */}
        <View style={styles.dotsContainer}>
          <Animated.View
            style={[
              styles.dot,
              {
                opacity: new Animated.Value(0.5),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              {
                opacity: new Animated.Value(0.7),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              {
                opacity: new Animated.Value(0.9),
              },
            ]}
          />
        </View>
      </Animated.View>

      {/* Bottom text */}
      <Animated.Text
        style={[
          styles.bottomText,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        Getting ready...
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  background: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: '50%',
    backgroundColor: '#007AFF',
    opacity: 0.05,
  },
  gradientBottom: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '50%',
    backgroundColor: '#34C759',
    opacity: 0.05,
  },
  content: {
    alignItems: 'center',
    zIndex: 10,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  logoEmoji: {
    fontSize: 50,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    fontWeight: '500',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
  },
  bottomText: {
    position: 'absolute',
    bottom: 40,
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
});

export default SplashScreen;
