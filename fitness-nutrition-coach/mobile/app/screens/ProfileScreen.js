import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Modal, TextInput, KeyboardAvoidingView, Platform,
  Switch, Animated,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { userAPI, authAPI } from '../utils/api';
import Constants from 'expo-constants';

const FITNESS_LEVELS = ['beginner', 'intermediate', 'advanced'];
const GENDERS = ['male', 'female', 'other'];
const GOALS = ['muscle_gain', 'weight_loss', 'endurance', 'strength', 'flexibility', 'maintenance'];
const DIETARY = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'keto', 'paleo', 'low-carb', 'high-protein', 'sugar-free', 'nut-free'];

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const C = theme.colors;

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
    dietary_restrictions: [],
    medical_conditions: '',
  });

  // Change Password state
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [cpForm, setCpForm] = useState({ current: '', next: '', confirm: '' });
  const [cpErrors, setCpErrors] = useState({});
  const [cpSaving, setCpSaving] = useState(false);
  const [cpGeneralError, setCpGeneralError] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  // Stat counter animations
  const ageAnim = useRef(new Animated.Value(0)).current;
  const weightAnim = useRef(new Animated.Value(0)).current;
  const heightAnim = useRef(new Animated.Value(0)).current;
  const [displayAge, setDisplayAge] = useState(0);
  const [displayWeight, setDisplayWeight] = useState(0);
  const [displayHeight, setDisplayHeight] = useState(0);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (profile) {
      if (profile.age) {
        Animated.timing(ageAnim, { toValue: profile.age, duration: 900, useNativeDriver: false }).start();
        ageAnim.addListener(({ value }) => setDisplayAge(Math.round(value)));
      }
      if (profile.weight) {
        Animated.timing(weightAnim, { toValue: profile.weight, duration: 900, useNativeDriver: false }).start();
        weightAnim.addListener(({ value }) => setDisplayWeight(Math.round(value * 10) / 10));
      }
      if (profile.height) {
        Animated.timing(heightAnim, { toValue: profile.height, duration: 900, useNativeDriver: false }).start();
        heightAnim.addListener(({ value }) => setDisplayHeight(Math.round(value)));
      }
    }
    return () => {
      ageAnim.removeAllListeners();
      weightAnim.removeAllListeners();
      heightAnim.removeAllListeners();
    };
  }, [profile]);

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
      dietary_restrictions: profile?.dietary_restrictions || [],
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
        dietary_restrictions: form.dietary_restrictions,
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

  const closeCpModal = () => {
    setShowChangePwd(false);
    setCpForm({ current: '', next: '', confirm: '' });
    setCpErrors({});
    setCpGeneralError('');
    setShowCurrentPwd(false);
    setShowNewPwd(false);
    setShowConfirmPwd(false);
  };

  const handleChangePassword = async () => {
    const errs = {};
    if (!cpForm.current) errs.current = 'Current password is required';
    if (!cpForm.next) errs.next = 'New password is required';
    else if (cpForm.next.length < 6) errs.next = 'Password must be at least 6 characters';
    if (!cpForm.confirm) errs.confirm = 'Please confirm your new password';
    else if (cpForm.next && cpForm.next !== cpForm.confirm) errs.confirm = 'Passwords do not match';
    setCpErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setCpSaving(true);
    setCpGeneralError('');
    try {
      await authAPI.changePassword({ current_password: cpForm.current, new_password: cpForm.next });
      closeCpModal();
      Alert.alert('Success', 'Password changed successfully!');
    } catch (err) {
      setCpGeneralError(err.message || 'Failed to change password. Please try again.');
    } finally {
      setCpSaving(false);
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

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color={C.primary} />;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Header */}
        <View style={[styles.hero, { backgroundColor: C.hero }]}>
          <View style={styles.heroBlob1} />
          <View style={styles.heroBlob2} />
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{profile?.email || user?.email}</Text>
          <TouchableOpacity style={styles.editProfileBtn} onPress={openEdit}>
            <Text style={styles.editProfileBtnText}>✏️ Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Body Stats */}
        {profile && (profile.age || profile.weight || profile.height) ? (
          <View style={[styles.section, { marginTop: 8 }]}>
            <Text style={[styles.sectionTitle, { color: C.text }]}>Body Stats</Text>
            <View style={[styles.infoCard, { backgroundColor: C.card, shadowColor: C.shadow }]}>
              <View style={styles.infoRow}>
                <InfoItem
                  label="Age"
                  value={profile.age ? (displayAge || profile.age) : null}
                  unit="yrs"
                  C={C}
                />
                <View style={[styles.divider, { backgroundColor: C.divider }]} />
                <InfoItem
                  label="Weight"
                  value={profile.weight ? (displayWeight || profile.weight) : null}
                  unit="kg"
                  C={C}
                />
                <View style={[styles.divider, { backgroundColor: C.divider }]} />
                <InfoItem
                  label="Height"
                  value={profile.height ? (displayHeight || profile.height) : null}
                  unit="cm"
                  C={C}
                />
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <View style={[styles.emptyCard, { backgroundColor: C.card }]}>
              <Text style={[styles.emptyText, { color: C.textMuted }]}>
                No stats set yet. Tap "Edit Profile" to add your details.
              </Text>
            </View>
          </View>
        )}

        {/* Fitness Info */}
        {profile && (profile.fitness_level || profile.gender || (profile.goals || []).length > 0) ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: C.text }]}>Fitness Profile</Text>
            <View style={[styles.detailCard, { backgroundColor: C.card, shadowColor: C.shadow }]}>
              {profile.gender && (
                <DetailRow label="Gender" value={profile.gender} C={C} />
              )}
              {profile.fitness_level && (
                <DetailRow label="Fitness Level" value={profile.fitness_level} C={C} />
              )}
              {(profile.goals || []).length > 0 && (
                <View style={[styles.detailRow, { borderBottomColor: C.divider }]}>
                  <Text style={[styles.detailLabel, { color: C.textSub }]}>Goals</Text>
                  <View style={styles.goalTags}>
                    {profile.goals.map((g) => (
                      <Text
                        key={g}
                        style={[styles.goalTag, { backgroundColor: C.primaryBg, color: C.primary }]}
                      >
                        {g.replace(/_/g, ' ')}
                      </Text>
                    ))}
                  </View>
                </View>
              )}
              {(profile.dietary_restrictions || []).length > 0 && (
                <DetailRow
                  label="Diet Restrictions"
                  value={profile.dietary_restrictions.join(', ')}
                  C={C}
                />
              )}
              {(profile.medical_conditions || []).length > 0 && (
                <DetailRow
                  label="Medical Conditions"
                  value={profile.medical_conditions.join(', ')}
                  C={C}
                />
              )}
            </View>
          </View>
        ) : null}

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>Settings</Text>
          <View style={[styles.detailCard, { backgroundColor: C.card, shadowColor: C.shadow }]}>
            <View style={[styles.detailRow, { borderBottomColor: C.divider }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={{ fontSize: 18 }}>{theme.isDark ? '🌙' : '☀️'}</Text>
                <Text style={[styles.detailLabel, { color: C.text }]}>Dark Mode</Text>
              </View>
              <Switch
                value={theme.isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: '#767577', true: C.primary }}
                thumbColor={theme.isDark ? '#fff' : '#f4f3f4'}
              />
            </View>
            <TouchableOpacity
              style={[styles.detailRow, { borderBottomColor: C.divider }]}
              onPress={() => setShowChangePwd(true)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={{ fontSize: 18 }}>🔒</Text>
                <Text style={[styles.detailLabel, { color: C.text }]}>Change Password</Text>
              </View>
              <Text style={{ color: C.textMuted, fontSize: 18 }}>›</Text>
            </TouchableOpacity>
            <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
              <Text style={[styles.detailLabel, { color: C.textSub }]}>Version</Text>
              <Text style={[styles.detailValue, { color: C.textMuted }]}>
                {Constants.expoConfig?.version || '1.0.0'}
              </Text>
            </View>
          </View>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.logoutBtn, { backgroundColor: C.card, borderColor: C.danger }]}
            onPress={handleLogout}
          >
            <Text style={[styles.logoutText, { color: C.danger }]}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Change Password Modal */}
      <Modal visible={showChangePwd} animationType="slide" presentationStyle="pageSheet" onRequestClose={closeCpModal}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView
            style={[styles.modal, { backgroundColor: C.surface }]}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: C.text }]}>Change Password</Text>
              <TouchableOpacity onPress={closeCpModal}>
                <Text style={[styles.closeBtn, { color: C.textSub }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {cpGeneralError ? (
              <View style={[styles.generalErrorBox, { backgroundColor: `${C.danger}18`, borderColor: `${C.danger}40` }]}>
                <Text style={[styles.generalErrorText, { color: C.danger }]}>{cpGeneralError}</Text>
              </View>
            ) : null}

            <Text style={[styles.label, { color: C.text }]}>Current Password</Text>
            <View style={[styles.pwdInputWrap, { backgroundColor: C.inputBg, borderColor: cpErrors.current ? C.danger : C.inputBorder }]}>
              <TextInput
                style={[styles.pwdInput, { color: C.text }]}
                value={cpForm.current}
                secureTextEntry={!showCurrentPwd}
                placeholder="Enter current password"
                placeholderTextColor={C.textMuted}
                onChangeText={(v) => { setCpForm((p) => ({ ...p, current: v })); setCpErrors((e) => ({ ...e, current: '' })); }}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowCurrentPwd((v) => !v)}>
                <Text style={{ fontSize: 18, color: C.textMuted }}>{showCurrentPwd ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
            {cpErrors.current ? <Text style={[styles.errorText, { color: C.danger }]}>{cpErrors.current}</Text> : null}

            <Text style={[styles.label, { color: C.text }]}>New Password</Text>
            <View style={[styles.pwdInputWrap, { backgroundColor: C.inputBg, borderColor: cpErrors.next ? C.danger : C.inputBorder }]}>
              <TextInput
                style={[styles.pwdInput, { color: C.text }]}
                value={cpForm.next}
                secureTextEntry={!showNewPwd}
                placeholder="Enter new password (min. 6 chars)"
                placeholderTextColor={C.textMuted}
                onChangeText={(v) => { setCpForm((p) => ({ ...p, next: v })); setCpErrors((e) => ({ ...e, next: '' })); }}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowNewPwd((v) => !v)}>
                <Text style={{ fontSize: 18, color: C.textMuted }}>{showNewPwd ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
            {cpErrors.next ? <Text style={[styles.errorText, { color: C.danger }]}>{cpErrors.next}</Text> : null}

            <Text style={[styles.label, { color: C.text }]}>Confirm New Password</Text>
            <View style={[styles.pwdInputWrap, { backgroundColor: C.inputBg, borderColor: cpErrors.confirm ? C.danger : C.inputBorder }]}>
              <TextInput
                style={[styles.pwdInput, { color: C.text }]}
                value={cpForm.confirm}
                secureTextEntry={!showConfirmPwd}
                placeholder="Confirm new password"
                placeholderTextColor={C.textMuted}
                onChangeText={(v) => { setCpForm((p) => ({ ...p, confirm: v })); setCpErrors((e) => ({ ...e, confirm: '' })); }}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirmPwd((v) => !v)}>
                <Text style={{ fontSize: 18, color: C.textMuted }}>{showConfirmPwd ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
            {cpErrors.confirm ? <Text style={[styles.errorText, { color: C.danger }]}>{cpErrors.confirm}</Text> : null}

            <View style={styles.pwdBtnRow}>
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: C.border }]} onPress={closeCpModal}>
                <Text style={[styles.cancelBtnText, { color: C.textSub }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, { flex: 1, backgroundColor: C.primary, marginTop: 0 }, cpSaving && { opacity: 0.7 }]}
                onPress={handleChangePassword}
                disabled={cpSaving}
              >
                {cpSaving
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.saveBtnText}>Save</Text>}
              </TouchableOpacity>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={showEdit} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView
            style={[styles.modal, { backgroundColor: C.surface }]}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: C.text }]}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowEdit(false)}>
                <Text style={[styles.closeBtn, { color: C.textSub }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: C.text }]}>Age</Text>
            <TextInput
              style={[styles.input, { backgroundColor: C.inputBg, borderColor: C.inputBorder, color: C.text }]}
              value={form.age}
              keyboardType="numeric"
              placeholder="e.g. 25"
              placeholderTextColor={C.textMuted}
              onChangeText={(v) => setForm((p) => ({ ...p, age: v }))}
            />

            <Text style={[styles.label, { color: C.text }]}>Weight (kg)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: C.inputBg, borderColor: C.inputBorder, color: C.text }]}
              value={form.weight}
              keyboardType="decimal-pad"
              placeholder="e.g. 70.5"
              placeholderTextColor={C.textMuted}
              onChangeText={(v) => setForm((p) => ({ ...p, weight: v }))}
            />

            <Text style={[styles.label, { color: C.text }]}>Height (cm)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: C.inputBg, borderColor: C.inputBorder, color: C.text }]}
              value={form.height}
              keyboardType="decimal-pad"
              placeholder="e.g. 175"
              placeholderTextColor={C.textMuted}
              onChangeText={(v) => setForm((p) => ({ ...p, height: v }))}
            />

            <Text style={[styles.label, { color: C.text }]}>Gender</Text>
            <View style={styles.chips}>
              {GENDERS.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.chip,
                    { borderColor: C.border, backgroundColor: C.surfaceAlt },
                    form.gender === g && { backgroundColor: C.primary, borderColor: C.primary },
                  ]}
                  onPress={() => setForm((p) => ({ ...p, gender: g }))}
                >
                  <Text style={[
                    styles.chipText,
                    { color: C.textSub },
                    form.gender === g && styles.chipTextActive,
                  ]}>
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: C.text }]}>Fitness Level</Text>
            <View style={styles.chips}>
              {FITNESS_LEVELS.map((l) => (
                <TouchableOpacity
                  key={l}
                  style={[
                    styles.chip,
                    { borderColor: C.border, backgroundColor: C.surfaceAlt },
                    form.fitness_level === l && { backgroundColor: C.primary, borderColor: C.primary },
                  ]}
                  onPress={() => setForm((p) => ({ ...p, fitness_level: l }))}
                >
                  <Text style={[
                    styles.chipText,
                    { color: C.textSub },
                    form.fitness_level === l && styles.chipTextActive,
                  ]}>
                    {l}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: C.text }]}>Goals (select all that apply)</Text>
            <View style={styles.chips}>
              {GOALS.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.chip,
                    { borderColor: C.border, backgroundColor: C.surfaceAlt },
                    form.goals.includes(g) && { backgroundColor: C.primary, borderColor: C.primary },
                  ]}
                  onPress={() => toggleGoal(g)}
                >
                  <Text style={[
                    styles.chipText,
                    { color: C.textSub },
                    form.goals.includes(g) && styles.chipTextActive,
                  ]}>
                    {g.replace(/_/g, ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: C.text }]}>Dietary Restrictions</Text>
            <View style={styles.chips}>
              {DIETARY.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.chip,
                    { borderColor: C.border, backgroundColor: C.surfaceAlt },
                    form.dietary_restrictions.includes(d) && { backgroundColor: C.primary, borderColor: C.primary },
                  ]}
                  onPress={() => setForm((p) => ({
                    ...p,
                    dietary_restrictions: p.dietary_restrictions.includes(d)
                      ? p.dietary_restrictions.filter((x) => x !== d)
                      : [...p.dietary_restrictions, d],
                  }))}
                >
                  <Text style={[
                    styles.chipText,
                    { color: C.textSub },
                    form.dietary_restrictions.includes(d) && styles.chipTextActive,
                  ]}>
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: C.text }]}>Medical Conditions (comma separated)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: C.inputBg, borderColor: C.inputBorder, color: C.text }]}
              value={form.medical_conditions}
              placeholder="e.g. diabetes, asthma"
              placeholderTextColor={C.textMuted}
              onChangeText={(v) => setForm((p) => ({ ...p, medical_conditions: v }))}
            />

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: C.primary }, saving && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.saveBtnText}>Save Profile</Text>}
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const InfoItem = ({ label, value, unit, C }) => (
  <View style={styles.infoItem}>
    <Text style={[styles.infoLabel, { color: C.textMuted }]}>{label}</Text>
    <Text style={[styles.infoValue, { color: C.primary }]}>{value ?? '—'}</Text>
    <Text style={[styles.infoUnit, { color: C.textSub }]}>{unit}</Text>
  </View>
);

const DetailRow = ({ label, value, C }) => (
  <View style={[styles.detailRow, { borderBottomColor: C.divider }]}>
    <Text style={[styles.detailLabel, { color: C.textSub }]}>{label}</Text>
    <Text style={[styles.detailValue, { color: C.text }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    paddingTop: 52,
    paddingBottom: 32,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  heroBlob1: {
    position: 'absolute',
    right: -50,
    top: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(100,140,255,0.2)',
  },
  heroBlob2: {
    position: 'absolute',
    left: -40,
    bottom: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(80,120,255,0.15)',
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarText: { fontSize: 34, fontWeight: '700', color: '#fff' },
  name: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 4 },
  email: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 16 },
  editProfileBtn: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  editProfileBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  section: { paddingHorizontal: 16, marginBottom: 20, marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  infoCard: {
    borderRadius: 14,
    padding: 16,
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  infoItem: { flex: 1, alignItems: 'center' },
  infoLabel: { fontSize: 12, marginBottom: 4 },
  infoValue: { fontSize: 22, fontWeight: '700' },
  infoUnit: { fontSize: 12, marginTop: 2 },
  divider: { width: 1, height: 44 },
  detailCard: {
    borderRadius: 14,
    paddingHorizontal: 16,
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    flexWrap: 'wrap',
    gap: 8,
  },
  detailLabel: { fontSize: 14 },
  detailValue: { fontSize: 14, fontWeight: '600', textTransform: 'capitalize', flexShrink: 1, textAlign: 'right' },
  goalTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end' },
  goalTag: { fontSize: 12, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  emptyCard: { borderRadius: 14, padding: 20, alignItems: 'center' },
  emptyText: { fontSize: 14, textAlign: 'center' },
  logoutBtn: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: { fontWeight: '700', fontSize: 15 },
  modal: { flex: 1, padding: 20 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  closeBtn: { fontSize: 20 },
  label: { fontWeight: '600', marginBottom: 8, marginTop: 14 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13 },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  saveBtn: { borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  pwdInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 4,
  },
  pwdInput: { flex: 1, padding: 12, fontSize: 15 },
  eyeBtn: { paddingHorizontal: 12, paddingVertical: 12 },
  errorText: { fontSize: 12, marginBottom: 4, marginLeft: 2 },
  generalErrorBox: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 8 },
  generalErrorText: { fontSize: 13 },
  pwdBtnRow: { flexDirection: 'row', gap: 12, marginTop: 28 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: { fontWeight: '600', fontSize: 15 },
});

export default ProfileScreen;
