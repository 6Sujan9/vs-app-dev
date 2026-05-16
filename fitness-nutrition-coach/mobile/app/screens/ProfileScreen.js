import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Modal, TextInput,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../utils/api';

const FITNESS_LEVELS = ['beginner', 'intermediate', 'advanced'];
const GENDERS = ['male', 'female', 'other'];
const GOALS = ['muscle_gain', 'weight_loss', 'endurance', 'strength', 'flexibility', 'maintenance'];

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    age: '',
    weight: '',
    height: '',
    gender: 'male',
    fitness_level: 'beginner',
    goals: [],
    dietary_restrictions: '',
    medical_conditions: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await userAPI.getProfile();
      setProfile(data);
    } catch (err) {
      console.error('Failed to load profile:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const openEdit = () => {
    setForm({
      age: profile?.age?.toString() || '',
      weight: profile?.weight?.toString() || '',
      height: profile?.height?.toString() || '',
      gender: profile?.gender || 'male',
      fitness_level: profile?.fitness_level || 'beginner',
      goals: profile?.goals || [],
      dietary_restrictions: (profile?.dietary_restrictions || []).join(', '),
      medical_conditions: (profile?.medical_conditions || []).join(', '),
    });
    setShowEdit(true);
  };

  const toggleGoal = (goal) => {
    setForm((p) => ({
      ...p,
      goals: p.goals.includes(goal)
        ? p.goals.filter((g) => g !== goal)
        : [...p.goals, goal],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        age: form.age ? parseInt(form.age) : null,
        weight: form.weight ? parseFloat(form.weight) : null,
        height: form.height ? parseFloat(form.height) : null,
        gender: form.gender,
        fitness_level: form.fitness_level,
        goals: form.goals,
        dietary_restrictions: form.dietary_restrictions
          .split(',').map((s) => s.trim()).filter(Boolean),
        medical_conditions: form.medical_conditions
          .split(',').map((s) => s.trim()).filter(Boolean),
      };
      await userAPI.updateProfile(payload);
      setShowEdit(false);
      fetchProfile();
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const initials = profile
    ? `${(profile.first_name || '?')[0]}${(profile.last_name || '?')[0]}`.toUpperCase()
    : (user?.email?.[0] || '?').toUpperCase();

  const displayName = profile
    ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
    : user?.email || 'User';

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#007AFF" />;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{profile?.email || user?.email}</Text>
          <TouchableOpacity style={styles.editProfileBtn} onPress={openEdit}>
            <Text style={styles.editProfileBtnText}>✏️ Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        {profile && (profile.age || profile.weight || profile.height) ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Body Stats</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <InfoItem label="Age" value={profile.age} unit="yrs" />
                <View style={styles.divider} />
                <InfoItem label="Weight" value={profile.weight} unit="kg" />
                <View style={styles.divider} />
                <InfoItem label="Height" value={profile.height} unit="cm" />
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No stats set yet. Tap "Edit Profile" to add your details.</Text>
            </View>
          </View>
        )}

        {/* Fitness Info */}
        {profile && (profile.fitness_level || profile.gender || (profile.goals || []).length > 0) ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fitness Profile</Text>
            <View style={styles.detailCard}>
              {profile.gender && <DetailRow label="Gender" value={profile.gender} />}
              {profile.fitness_level && (
                <DetailRow label="Fitness Level" value={profile.fitness_level} />
              )}
              {(profile.goals || []).length > 0 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Goals</Text>
                  <View style={styles.goalTags}>
                    {profile.goals.map((g) => (
                      <Text key={g} style={styles.goalTag}>{g.replace(/_/g, ' ')}</Text>
                    ))}
                  </View>
                </View>
              )}
              {(profile.dietary_restrictions || []).length > 0 && (
                <DetailRow label="Diet Restrictions"
                  value={profile.dietary_restrictions.join(', ')} />
              )}
              {(profile.medical_conditions || []).length > 0 && (
                <DetailRow label="Medical Conditions"
                  value={profile.medical_conditions.join(', ')} />
              )}
            </View>
          </View>
        ) : null}

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={showEdit} animationType="slide" presentationStyle="pageSheet">
        <ScrollView style={styles.modal} keyboardShouldPersistTaps="handled">
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={() => setShowEdit(false)}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Age</Text>
          <TextInput style={styles.input} value={form.age} keyboardType="numeric"
            placeholder="e.g. 25" placeholderTextColor="#aaa"
            onChangeText={(v) => setForm((p) => ({ ...p, age: v }))} />

          <Text style={styles.label}>Weight (kg)</Text>
          <TextInput style={styles.input} value={form.weight} keyboardType="decimal-pad"
            placeholder="e.g. 70.5" placeholderTextColor="#aaa"
            onChangeText={(v) => setForm((p) => ({ ...p, weight: v }))} />

          <Text style={styles.label}>Height (cm)</Text>
          <TextInput style={styles.input} value={form.height} keyboardType="decimal-pad"
            placeholder="e.g. 175" placeholderTextColor="#aaa"
            onChangeText={(v) => setForm((p) => ({ ...p, height: v }))} />

          <Text style={styles.label}>Gender</Text>
          <View style={styles.chips}>
            {GENDERS.map((g) => (
              <TouchableOpacity key={g}
                style={[styles.chip, form.gender === g && styles.chipActive]}
                onPress={() => setForm((p) => ({ ...p, gender: g }))}>
                <Text style={[styles.chipText, form.gender === g && styles.chipTextActive]}>
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Fitness Level</Text>
          <View style={styles.chips}>
            {FITNESS_LEVELS.map((l) => (
              <TouchableOpacity key={l}
                style={[styles.chip, form.fitness_level === l && styles.chipActive]}
                onPress={() => setForm((p) => ({ ...p, fitness_level: l }))}>
                <Text style={[styles.chipText, form.fitness_level === l && styles.chipTextActive]}>
                  {l}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Goals (select all that apply)</Text>
          <View style={styles.chips}>
            {GOALS.map((g) => (
              <TouchableOpacity key={g}
                style={[styles.chip, form.goals.includes(g) && styles.chipActive]}
                onPress={() => toggleGoal(g)}>
                <Text style={[styles.chipText, form.goals.includes(g) && styles.chipTextActive]}>
                  {g.replace(/_/g, ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Dietary Restrictions (comma separated)</Text>
          <TextInput style={styles.input} value={form.dietary_restrictions}
            placeholder="e.g. vegetarian, gluten-free" placeholderTextColor="#aaa"
            onChangeText={(v) => setForm((p) => ({ ...p, dietary_restrictions: v }))} />

          <Text style={styles.label}>Medical Conditions (comma separated)</Text>
          <TextInput style={styles.input} value={form.medical_conditions}
            placeholder="e.g. diabetes, asthma" placeholderTextColor="#aaa"
            onChangeText={(v) => setForm((p) => ({ ...p, medical_conditions: v }))} />

          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={saving}>
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.saveBtnText}>Save Profile</Text>}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </Modal>
    </View>
  );
};

const InfoItem = ({ label, value, unit }) => (
  <View style={styles.infoItem}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value ?? '—'}</Text>
    <Text style={styles.infoUnit}>{unit}</Text>
  </View>
);

const DetailRow = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  headerCard: { alignItems: 'center', backgroundColor: '#fff', paddingVertical: 28, paddingHorizontal: 16, marginBottom: 16, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#007AFF', alignItems: 'center', justifyContent: 'center', marginBottom: 12, shadowColor: '#007AFF', shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  avatarText: { fontSize: 34, fontWeight: '700', color: '#fff' },
  name: { fontSize: 22, fontWeight: '700', color: '#1a1a2e', marginBottom: 4 },
  email: { fontSize: 13, color: '#999', marginBottom: 14 },
  editProfileBtn: { backgroundColor: '#007AFF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  editProfileBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 10 },
  infoCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  infoItem: { flex: 1, alignItems: 'center' },
  infoLabel: { fontSize: 12, color: '#999', marginBottom: 4 },
  infoValue: { fontSize: 22, fontWeight: '700', color: '#007AFF' },
  infoUnit: { fontSize: 12, color: '#666', marginTop: 2 },
  divider: { width: 1, height: 44, backgroundColor: '#f0f0f0' },
  detailCard: { backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f4f4f4', flexWrap: 'wrap', gap: 8 },
  detailLabel: { fontSize: 14, color: '#666' },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#1a1a2e', textTransform: 'capitalize', flexShrink: 1, textAlign: 'right' },
  goalTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end' },
  goalTag: { backgroundColor: '#f0f4ff', color: '#007AFF', fontSize: 12, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  emptyCard: { backgroundColor: '#fff', borderRadius: 14, padding: 20, alignItems: 'center' },
  emptyText: { color: '#999', fontSize: 14, textAlign: 'center' },
  logoutBtn: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#ff3b30', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  logoutText: { color: '#ff3b30', fontWeight: '700', fontSize: 15 },
  modal: { flex: 1, padding: 20, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 10 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a1a2e' },
  closeBtn: { fontSize: 20, color: '#666' },
  label: { fontWeight: '600', color: '#1a1a2e', marginBottom: 8, marginTop: 14 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 15, backgroundColor: '#fafafa', marginBottom: 4, color: '#1a1a2e' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#f8f9fa' },
  chipActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  chipText: { fontSize: 13, color: '#666' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  saveBtn: { backgroundColor: '#007AFF', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

export default ProfileScreen;
