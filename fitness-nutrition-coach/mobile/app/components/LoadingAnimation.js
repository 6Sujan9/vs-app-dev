import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  Animated,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

export const LoadingSpinner = ({ size = 'medium', color = '#007AFF' }) => {
  const rotation = new Animated.Value(0);

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
  }, [rotation]);

  const spinInterpolate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const sizeMap = {
    small: { container: 30, ring: 3 },
    medium: { container: 50, ring: 4 },
    large: { container: 70, ring: 5 },
  };

  const sizeConfig = sizeMap[size] || sizeMap.medium;

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.spinner,
          {
            width: sizeConfig.container,
            height: sizeConfig.container,
            borderWidth: sizeConfig.ring,
            borderColor: color,
            transform: [{ rotate: spinInterpolate }],
          },
        ]}
      />
    </View>
  );
};

export const LoadingDots = ({ color = '#007AFF' }) => {
  const dot1Anim = new Animated.Value(0);
  const dot2Anim = new Animated.Value(0);
  const dot3Anim = new Animated.Value(0);

  useEffect(() => {
    const createAnimationSequence = (delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot1Anim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot1Anim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      );

    // Stagger the animations
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dot1Anim, {
            toValue: -10,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(dot1Anim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.delay(200),
          Animated.timing(dot2Anim, {
            toValue: -10,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(dot2Anim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.delay(400),
          Animated.timing(dot3Anim, {
            toValue: -10,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(dot3Anim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, 0);
  }, [dot1Anim, dot2Anim, dot3Anim]);

  return (
    <View style={styles.dotsContainer}>
      <Animated.View
        style={[
          styles.dot,
          { backgroundColor: color, transform: [{ translateY: dot1Anim }] },
        ]}
      />
      <Animated.View
        style={[
          styles.dot,
          { backgroundColor: color, transform: [{ translateY: dot2Anim }] },
        ]}
      />
      <Animated.View
        style={[
          styles.dot,
          { backgroundColor: color, transform: [{ translateY: dot3Anim }] },
        ]}
      />
    </View>
  );
};

export const LoadingBar = ({ color = '#007AFF' }) => {
  const barAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(barAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(barAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [barAnim]);

  const progressWidth = barAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.barContainer}>
      <Animated.View
        style={[
          styles.bar,
          { backgroundColor: color, width: progressWidth },
        ]}
      />
    </View>
  );
};

export const LoadingPulse = ({ color = '#007AFF' }) => {
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  return (
    <Animated.View
      style={[
        styles.pulse,
        {
          backgroundColor: color,
          transform: [{ scale: pulseAnim }],
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    borderRadius: 100,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  barContainer: {
    width: '100%',
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 2,
  },
  pulse: {
    width: 60,
    height: 60,
    borderRadius: 30,
    opacity: 0.7,
  },
});
