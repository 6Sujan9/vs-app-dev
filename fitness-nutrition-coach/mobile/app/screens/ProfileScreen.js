import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Button, Card, Divider } from '../components/UIComponents';

const ProfileScreen = () => {
  const [profile] = React.useState({
    name: 'John Doe',
    email: 'john@example.com',
    age: 28,
    weight: 75,
    height: 180,
    fitnessLevel: 'Intermediate',
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.headerCard}>
        <Card style={styles.profileCardStyle}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>JD</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{profile.name}</Text>
              <Text style={styles.email}>{profile.email}</Text>
            </View>
          </View>
        </Card>
      </View>

      {/* Info Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        
        <Card style={styles.infoSection}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Age</Text>
              <Text style={styles.infoValue}>{profile.age}</Text>
              <Text style={styles.infoUnit}>years</Text>
            </View>
            <Divider style={styles.verticalDivider} color="#e0e0e0" />
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Weight</Text>
              <Text style={styles.infoValue}>{profile.weight}</Text>
              <Text style={styles.infoUnit}>kg</Text>
            </View>
            <Divider style={styles.verticalDivider} color="#e0e0e0" />
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Height</Text>
              <Text style={styles.infoValue}>{profile.height}</Text>
              <Text style={styles.infoUnit}>cm</Text>
            </View>
          </View>
        </Card>
      </View>

      {/* Fitness Level */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fitness Status</Text>
        <Card style={styles.levelCard}>
          <View style={styles.levelContent}>
            <View>
              <Text style={styles.levelLabel}>Current Level</Text>
              <Text style={styles.levelValue}>{profile.fitnessLevel}</Text>
            </View>
            <View style={[styles.levelBadge, styles.intermediateBadge]}>
              <Text style={styles.levelBadgeText}>→</Text>
            </View>
          </View>
        </Card>
      </View>

      {/* Action Buttons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        
        <Button
          title="Edit Profile"
          variant="primary"
          size="medium"
          style={styles.actionButton}
        />
        
        <Button
          title="View Statistics"
          variant="secondary"
          size="medium"
          style={styles.actionButton}
        />
        
        <Button
          title="Settings"
          variant="secondary"
          size="medium"
          style={styles.actionButton}
        />
        
        <Button
          title="Logout"
          variant="danger"
          size="medium"
          style={styles.actionButton}
        />
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
  headerCard: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  profileCardStyle: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  email: {
    fontSize: 13,
    color: '#999',
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  infoSection: {
    paddingVertical: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#007AFF',
  },
  infoUnit: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  verticalDivider: {
    width: 1,
    height: 40,
    marginHorizontal: 12,
  },
  levelCard: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  levelContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelLabel: {
    fontSize: 13,
    color: '#999',
    marginBottom: 4,
  },
  levelValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  levelBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
  },
  intermediateBadge: {
    backgroundColor: '#FFF3E0',
  },
  levelBadgeText: {
    fontSize: 24,
    color: '#FF9500',
  },
  actionButton: {
    marginBottom: 12,
  },
  spacing: {
    height: 20,
  },
});

export default ProfileScreen;
