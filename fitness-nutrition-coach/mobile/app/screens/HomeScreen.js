import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
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
  const [stats, setStats] = useState({ workouts: 0, mealPlans: 0, streak: 0 });
  const [loading, setLoading] = useState(true);
  const quote = QUOTES[new Date().getDay() % QUOTES.length];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [workoutsData, nutritionData, progressData] = await Promise.allSettled([
          workoutAPI.getWorkouts({ limit: 1 }),
          nutritionAPI.getMealPlans({ limit: 1 }),
          progressAPI.getProgress({ limit: 500, days: 365 }),
        ]);
        const logs = progressData.status === 'fulfilled' ? (progressData.value.logs || []) : [];
        setStats({
          workouts: workoutsData.status === 'fulfilled' ? (workoutsData.value.total || 0) : 0,
          mealPlans: nutritionData.status === 'fulfilled' ? (nutritionData.value.total || 0) : 0,
          streak: calcStreak(logs),
        });
      } catch (err) {
        console.error('Stats fetch error:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const firstName = user?.first_name || user?.email?.split('@')[0] || 'there';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Gradient Hero */}
      <View style={styles.hero}>
        <View style={styles.heroBlob1} />
        <View style={styles.heroBlob2} />
        <Text style={styles.heroDate}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>
        <Text style={styles.heroGreeting}>Hey, {firstName}! 👋</Text>
        <View style={styles.quoteBox}>
          <Text style={styles.quoteIcon}>"</Text>
          <Text style={styles.quoteText}>{quote}</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <StatCard label="Workouts" value={loading ? '…' : stats.workouts} icon="🏋️" color="#007AFF" />
        <StatCard label="Meal Plans" value={loading ? '…' : stats.mealPlans} icon="🥗" color="#34C759" />
        <StatCard label="Streak" value={loading ? '…' : stats.streak} icon="🔥" color="#FF9500" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Access</Text>
        <FeatureCard emoji="🏋️" title="Workout Plans" desc="AI-generated fitness routines"
          onPress={() => navigation?.navigate('Workouts')} color="#e8f0ff" accent="#007AFF" />
        <FeatureCard emoji="🥗" title="Nutrition Plans" desc="Personalized meal plans"
          onPress={() => navigation?.navigate('Nutrition')} color="#e8fff0" accent="#34C759" />
        <FeatureCard emoji="💬" title="AI Coach" desc="Get instant fitness advice"
          onPress={() => navigation?.navigate('Chat')} color="#fff8e8" accent="#FF9500" />
        <FeatureCard emoji="👤" title="My Profile" desc="View and update your info"
          onPress={() => navigation?.navigate('Profile')} color="#f8e8ff" accent="#AF52DE" />
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
};

const StatCard = ({ label, value, icon, color }) => (
  <View style={[styles.statCard, { borderTopColor: color, borderTopWidth: 3 }]}>
    <Text style={styles.statIcon}>{icon}</Text>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const FeatureCard = ({ emoji, title, desc, onPress, color, accent }) => (
  <TouchableOpacity
    style={[styles.featureCard, { backgroundColor: color, borderLeftColor: accent, borderLeftWidth: 4 }]}
    onPress={onPress} activeOpacity={0.85}>
    <Text style={styles.featureEmoji}>{emoji}</Text>
    <View style={styles.featureText}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDesc}>{desc}</Text>
    </View>
    <Text style={[styles.arrow, { color: accent }]}>›</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },

  // Hero
  hero: { backgroundColor: '#1a237e', paddingHorizontal: 20, paddingTop: 48, paddingBottom: 36, overflow: 'hidden' },
  heroBlob1: { position: 'absolute', right: -40, top: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(100,140,255,0.25)' },
  heroBlob2: { position: 'absolute', left: -30, bottom: -30, width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(80,120,255,0.18)' },
  heroDate: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 6, letterSpacing: 0.5 },
  heroGreeting: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 16 },
  quoteBox: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 14, flexDirection: 'row' },
  quoteIcon: { fontSize: 28, color: 'rgba(255,255,255,0.5)', lineHeight: 28, marginRight: 6 },
  quoteText: { fontSize: 13, color: 'rgba(255,255,255,0.9)', lineHeight: 20, flex: 1, fontStyle: 'italic' },

  // Stats
  statsContainer: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginVertical: 20 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  statIcon: { fontSize: 22, marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: '700', marginBottom: 2 },
  statLabel: { fontSize: 11, color: '#888', fontWeight: '500' },

  // Section
  section: { paddingHorizontal: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginBottom: 12 },
  featureCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 16, marginBottom: 10 },
  featureEmoji: { fontSize: 28, marginRight: 14 },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a2e', marginBottom: 2 },
  featureDesc: { fontSize: 12, color: '#666' },
  arrow: { fontSize: 22, fontWeight: '300' },
});

export default HomeScreen;
