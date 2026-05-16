import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { workoutAPI, nutritionAPI, progressAPI } from '../utils/api';

const calcStreak = (logs) => {
  if (!logs || logs.length === 0) return 0;
  // SQLite may return "2026-05-17 10:30:00" (space) instead of ISO "T" format
  const days = new Set(
    logs.map((l) => {
      const iso = l.created_at.replace(' ', 'T');
      return new Date(iso).toLocaleDateString('en-CA'); // YYYY-MM-DD in local time
    })
  );
  const today = new Date();
  const todayKey = today.toLocaleDateString('en-CA');
  // Start from today if logged today, otherwise from yesterday
  const startOffset = days.has(todayKey) ? 0 : 1;
  let streak = 0;
  for (let i = startOffset; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (days.has(d.toLocaleDateString('en-CA'))) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
};

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ workouts: 0, mealPlans: 0, streak: 0 });
  const [loading, setLoading] = useState(true);

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
      <View style={styles.header}>
        <Text style={styles.greeting}>Hey, {firstName}! 👋</Text>
        <Text style={styles.date}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <StatCard label="Workouts" value={loading ? '…' : stats.workouts} icon="🏋️" color="#007AFF" />
        <StatCard label="Meal Plans" value={loading ? '…' : stats.mealPlans} icon="🥗" color="#34C759" />
        <StatCard label="Streak" value={loading ? '…' : stats.streak} icon="🔥" color="#FF9500" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Access</Text>

        <FeatureCard
          emoji="🏋️"
          title="Workout Plans"
          desc="AI-generated fitness routines"
          onPress={() => navigation?.navigate('Workouts')}
          color="#e8f0ff"
        />
        <FeatureCard
          emoji="🥗"
          title="Nutrition Plans"
          desc="Personalized meal plans"
          onPress={() => navigation?.navigate('Nutrition')}
          color="#e8fff0"
        />
        <FeatureCard
          emoji="💬"
          title="AI Coach"
          desc="Get instant fitness advice"
          onPress={() => navigation?.navigate('Chat')}
          color="#fff8e8"
        />
        <FeatureCard
          emoji="👤"
          title="My Profile"
          desc="View and update your info"
          onPress={() => navigation?.navigate('Profile')}
          color="#f8e8ff"
        />
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

const FeatureCard = ({ emoji, title, desc, onPress, color }) => (
  <TouchableOpacity style={[styles.featureCard, { backgroundColor: color }]} onPress={onPress} activeOpacity={0.85}>
    <Text style={styles.featureEmoji}>{emoji}</Text>
    <View style={styles.featureText}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDesc}>{desc}</Text>
    </View>
    <Text style={styles.arrow}>›</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { paddingHorizontal: 20, paddingVertical: 24 },
  greeting: { fontSize: 26, fontWeight: '700', color: '#1a1a2e', marginBottom: 4 },
  date: { fontSize: 13, color: '#888' },
  statsContainer: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  statIcon: { fontSize: 22, marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: '700', marginBottom: 2 },
  statLabel: { fontSize: 11, color: '#888', fontWeight: '500' },
  section: { paddingHorizontal: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginBottom: 12 },
  featureCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 16, marginBottom: 10 },
  featureEmoji: { fontSize: 28, marginRight: 14 },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a2e', marginBottom: 2 },
  featureDesc: { fontSize: 12, color: '#666' },
  arrow: { fontSize: 22, color: '#999', fontWeight: '300' },
});

export default HomeScreen;
