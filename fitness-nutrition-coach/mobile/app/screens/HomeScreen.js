import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { workoutAPI, nutritionAPI, progressAPI } from '../utils/api';

const QUOTES = [
  "Push yourself, because no one else is going to do it for you.",
  "The only bad workout is the one that didn't happen.",
  "Your body can stand almost anything. It's your mind you have to convince.",
  "Success starts with self-discipline.",
  "Don't limit your challenges — challenge your limits.",
];

const calcStreak = (logs) => {
  if (!logs || logs.length === 0) return 0;
  const days = new Set(
    logs.map((l) => {
      const iso = l.created_at.replace(' ', 'T');
      return new Date(iso).toLocaleDateString('en-CA');
    })
  );
  const today = new Date();
  const todayKey = today.toLocaleDateString('en-CA');
  const startOffset = days.has(todayKey) ? 0 : 1;
  let streak = 0;
  for (let i = startOffset; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (days.has(d.toLocaleDateString('en-CA'))) streak++;
    else break;
  }
  return streak;
};

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const C = theme.colors;

  const [stats, setStats] = useState({ workouts: 0, mealPlans: 0, streak: 0 });
  const [loading, setLoading] = useState(true);
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  // Skeleton pulse animation
  const pulseAnim = useRef(new Animated.Value(0)).current;
  // Counter animations
  const workoutAnim = useRef(new Animated.Value(0)).current;
  const mealAnim = useRef(new Animated.Value(0)).current;
  const streakAnim = useRef(new Animated.Value(0)).current;
  // Displayed animated values
  const [workoutCount, setWorkoutCount] = useState(0);
  const [mealCount, setMealCount] = useState(0);
  const [streakCount, setStreakCount] = useState(0);

  useEffect(() => {
    if (loading) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [loading]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [workoutsData, nutritionData, progressData] = await Promise.allSettled([
          workoutAPI.getWorkouts({ limit: 1 }),
          nutritionAPI.getMealPlans({ limit: 1 }),
          progressAPI.getProgress({ limit: 500, days: 365 }),
        ]);
        const logs = progressData.status === 'fulfilled' ? (progressData.value.logs || []) : [];
        const newStats = {
          workouts: workoutsData.status === 'fulfilled' ? (workoutsData.value.total || 0) : 0,
          mealPlans: nutritionData.status === 'fulfilled' ? (nutritionData.value.total || 0) : 0,
          streak: calcStreak(logs),
        };
        setStats(newStats);

        // Animate counters
        Animated.timing(workoutAnim, { toValue: newStats.workouts, duration: 1000, useNativeDriver: false }).start();
        Animated.timing(mealAnim, { toValue: newStats.mealPlans, duration: 1000, useNativeDriver: false }).start();
        Animated.timing(streakAnim, { toValue: newStats.streak, duration: 1000, useNativeDriver: false }).start();

        workoutAnim.addListener(({ value }) => setWorkoutCount(Math.round(value)));
        mealAnim.addListener(({ value }) => setMealCount(Math.round(value)));
        streakAnim.addListener(({ value }) => setStreakCount(Math.round(value)));
      } catch (err) {
        console.error('Stats fetch error:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
    return () => {
      workoutAnim.removeAllListeners();
      mealAnim.removeAllListeners();
      streakAnim.removeAllListeners();
    };
  }, []);

  const skeletonOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });

  const firstName = user?.first_name || user?.email?.split('@')[0] || 'there';

  const SkeletonCard = () => (
    <Animated.View style={[
      { flex: 1, borderRadius: 14, height: 90, backgroundColor: C.skeleton },
      { opacity: skeletonOpacity },
    ]} />
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Section */}
      <View style={[styles.hero, { backgroundColor: C.hero }]}>
        <View style={[styles.heroBlob1, { backgroundColor: C.heroAccent }]} />
        <View style={[styles.heroBlob2, { backgroundColor: C.heroAccent }]} />
        <Text style={styles.heroDate}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>
        <Text style={styles.heroGreeting}>Hey, {firstName}!</Text>
        <View style={styles.quoteBox}>
          <Text style={styles.quoteText}>"{quote}"</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <StatCard label="Workouts" value={workoutCount} icon="🏋️" color={C.primary} bg={C.primaryBg} cardBg={C.card} textColor={C.text} labelColor={C.textMuted} />
            <StatCard label="Meal Plans" value={mealCount} icon="🥗" color={C.success} bg={C.successBg} cardBg={C.card} textColor={C.text} labelColor={C.textMuted} />
            <StatCard label="Streak" value={streakCount} icon="🔥" color={C.warning} bg={C.warningBg} cardBg={C.card} textColor={C.text} labelColor={C.textMuted} />
          </>
        )}
      </View>

      {/* Quick Access */}
      <View style={[styles.section, { paddingHorizontal: 16 }]}>
        <Text style={[styles.sectionTitle, { color: C.text }]}>Quick Access</Text>
        <FeatureCard
          emoji="🏋️" title="Workout Plans" desc="AI-generated fitness routines"
          onPress={() => navigation?.navigate('Workouts')}
          cardBg={C.primaryBg} accent={C.primary} textColor={C.text} subColor={C.textSub}
        />
        <FeatureCard
          emoji="🥗" title="Nutrition Plans" desc="Personalized meal plans"
          onPress={() => navigation?.navigate('Nutrition')}
          cardBg={C.successBg} accent={C.success} textColor={C.text} subColor={C.textSub}
        />
        <FeatureCard
          emoji="💬" title="AI Coach" desc="Get instant fitness advice"
          onPress={() => navigation?.navigate('Chat')}
          cardBg={C.warningBg} accent={C.warning} textColor={C.text} subColor={C.textSub}
        />
        <FeatureCard
          emoji="👤" title="My Profile" desc="View and update your info"
          onPress={() => navigation?.navigate('Profile')}
          cardBg={'rgba(255,101,132,0.1)'} accent={C.secondary} textColor={C.text} subColor={C.textSub}
        />
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
};

const StatCard = ({ label, value, icon, color, bg, cardBg, textColor, labelColor }) => (
  <View style={[styles.statCard, { backgroundColor: cardBg, borderTopColor: color, borderTopWidth: 3 }]}>
    <Text style={styles.statIcon}>{icon}</Text>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={[styles.statLabel, { color: labelColor }]}>{label}</Text>
  </View>
);

const FeatureCard = ({ emoji, title, desc, onPress, cardBg, accent, textColor, subColor }) => (
  <TouchableOpacity
    style={[styles.featureCard, { backgroundColor: cardBg, borderLeftColor: accent, borderLeftWidth: 4 }]}
    onPress={onPress}
    activeOpacity={0.82}
  >
    <Text style={styles.featureEmoji}>{emoji}</Text>
    <View style={styles.featureText}>
      <Text style={[styles.featureTitle, { color: textColor }]}>{title}</Text>
      <Text style={[styles.featureDesc, { color: subColor }]}>{desc}</Text>
    </View>
    <Text style={[styles.arrow, { color: accent }]}>›</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 36,
    overflow: 'hidden',
  },
  heroBlob1: {
    position: 'absolute',
    right: -40,
    top: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  heroBlob2: {
    position: 'absolute',
    left: -30,
    bottom: -30,
    width: 130,
    height: 130,
    borderRadius: 65,
  },
  heroDate: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  heroGreeting: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 16,
  },
  quoteBox: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    padding: 14,
  },
  quoteText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginVertical: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: { fontSize: 22, marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: '700', marginBottom: 2 },
  statLabel: { fontSize: 11, fontWeight: '500' },
  section: { marginBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  featureEmoji: { fontSize: 28, marginRight: 14 },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  featureDesc: { fontSize: 12 },
  arrow: { fontSize: 22, fontWeight: '300' },
});

export default HomeScreen;
