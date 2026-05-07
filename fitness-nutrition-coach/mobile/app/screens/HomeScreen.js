import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Button, Card, Badge } from '../components/UIComponents';

const HomeScreen = () => {
  const [loading, setLoading] = React.useState(false);

  const handleQuickStart = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert('Welcome! Complete your profile to get started.');
    }, 1000);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome Back! 👋</Text>
        <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Workouts</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Meals</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Calories</Text>
        </Card>
      </View>

      {/* Features Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Access</Text>

        <Card style={styles.featureCard}>
          <View style={styles.featureContent}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureEmoji}>🏋️</Text>
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Workout Plans</Text>
              <Text style={styles.featureDesc}>Get personalized routines</Text>
            </View>
            <Badge label="New" color="primary" />
          </View>
        </Card>

        <Card style={styles.featureCard}>
          <View style={styles.featureContent}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureEmoji}>🍎</Text>
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Nutrition Plans</Text>
              <Text style={styles.featureDesc}>Customized meal plans</Text>
            </View>
            <Badge label="Pro" color="success" />
          </View>
        </Card>

        <Card style={styles.featureCard}>
          <View style={styles.featureContent}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureEmoji}>💬</Text>
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>AI Chat Coach</Text>
              <Text style={styles.featureDesc}>Get instant fitness advice</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.featureCard}>
          <View style={styles.featureContent}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureEmoji}>📊</Text>
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Track Progress</Text>
              <Text style={styles.featureDesc}>Monitor your journey</Text>
            </View>
          </View>
        </Card>
      </View>

      {/* CTA Section */}
      <View style={styles.ctaSection}>
        <Card style={styles.ctaCard}>
          <Text style={styles.ctaTitle}>Ready to Transform?</Text>
          <Text style={styles.ctaDesc}>Start your fitness journey today with personalized plans</Text>
          <Button
            title={loading ? 'Getting Started...' : 'Get Started'}
            onPress={handleQuickStart}
            variant="primary"
            size="large"
            style={styles.ctaButton}
            loading={loading}
          />
        </Card>
      </View>

      <View style={styles.spacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingTop: 16,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  featureCard: {
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  featureContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureEmoji: {
    fontSize: 28,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 13,
    color: '#999',
  },
  ctaSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  ctaCard: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: 'linear-gradient(135deg, #007AFF 0%, #5AC8FA 100%)',
    borderRadius: 16,
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  ctaDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 16,
    lineHeight: 20,
  },
  ctaButton: {
    marginVertical: 0,
  },
  spacing: {
    height: 20,
  },
});

export default HomeScreen;

