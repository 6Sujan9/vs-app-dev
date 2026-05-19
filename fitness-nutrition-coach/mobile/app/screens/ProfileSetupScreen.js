import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../utils/api';

const FITNESS_LEVELS = ['beginner', 'intermediate', 'advanced'];
const GENDERS = ['male', 'female', 'other'];
const GOALS = ['muscle_gain', 'weight_loss', 'endurance', 'strength', 'flexibility', 'maintenance'];
const DIETARY = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'keto', 'paleo', 'low-carb', 'high-protein', 'sugar-free', 'nut-free'];

const ProfileSetupScreen = () => {
  const { completeProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1); // 2-step form
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

  const toggleGoal = (goal) => {
    setForm((p) => ({
      ...p,
      goals: p.goals.includes(goal)
        ? p.goals.filter((g) => g !== goal)
        : [...p.goals, goal],
    }));
  };

  const handleNext = () => {
    if (!form.age || !form.weight || !form.height) {
      Alert.alert('Required', 'Please fill in age, weight and height.');
      return;
    }
    setStep(2);
  };

  const handleSave = async () => {
    if (form.goals.length === 0) {
      Alert.alert('Required', 'Please select at least one goal.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        age: parseInt(form.age),
        weight: parseFloat(form.weight),
        height: parseFloat(form.height),
        gender: form.gender,
        fitness_level: form.fitness_level,
        goals: form.goals,
        dietary_restrictions: form.dietary_restrictions,
        medical_conditions: form.medical_conditions
          .split(',').map((s) => s.trim()).filter(Boolean),
      };
      await userAPI.updateProfile(payload);
      completeProfile(payload); // marks profile complete → navigates to dashboard
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>💪</Text>
        <Text style={styles.title}>Let's set up your profile</Text>
        <Text style={styles.subtitle}>
          {step === 1
            ? 'Tell us about your body so the AI can personalise your plans'
            : 'Now set your fitness goals and preferences'}
        </Text>
        {/* Progress dots */}
        <View style={styles.steps}>
          <View style={[styles.dot, step >= 1 && styles.dotActive]} />
          <View style={[styles.dot, step >= 2 && styles.dotActive]} />
        </View>
      </View>

      <View style={styles.card}>
        {step === 1 ? (
          <>
            <Text style={styles.label}>Age</Text>
            <TextInput style={styles.input} placeholder="e.g. 22" placeholderTextColor="#aaa"
              keyboardType="numeric" value={form.age}
              onChangeText={(v) => setForm((p) => ({ ...p, age: v }))} />

            <Text style={styles.label}>Weight (kg)</Text>
            <TextInput style={styles.input} placeholder="e.g. 70" placeholderTextColor="#aaa"
              keyboardType="decimal-pad" value={form.weight}
              onChangeText={(v) => setForm((p) => ({ ...p, weight: v }))} />

            <Text style={styles.label}>Height (cm)</Text>
            <TextInput style={styles.input} placeholder="e.g. 175" placeholderTextColor="#aaa"
              keyboardType="decimal-pad" value={form.height}
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

            <TouchableOpacity style={styles.btn} onPress={handleNext}>
              <Text style={styles.btnText}>Next →</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
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

            <Text style={styles.label}>Dietary Restrictions (optional)</Text>
            <View style={styles.chips}>
              {DIETARY.map((d) => (
                <TouchableOpacity key={d}
                  style={[styles.chip, form.dietary_restrictions.includes(d) && styles.chipActive]}
                  onPress={() => setForm((p) => ({
                    ...p,
                    dietary_restrictions: p.dietary_restrictions.includes(d)
                      ? p.dietary_restrictions.filter((x) => x !== d)
                      : [...p.dietary_restrictions, d],
                  }))}>
                  <Text style={[styles.chipText, form.dietary_restrictions.includes(d) && styles.chipTextActive]}>
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Medical Conditions (optional)</Text>
            <TextInput style={styles.input} value={form.medical_conditions}
              placeholder="e.g. diabetes, asthma" placeholderTextColor="#aaa"
              onChangeText={(v) => setForm((p) => ({ ...p, medical_conditions: v }))} />

            <TouchableOpacity style={styles.backLink} onPress={() => setStep(1)}>
              <Text style={styles.backLinkText}>← Back</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btn, saving && { opacity: 0.7 }]}
              onPress={handleSave} disabled={saving}>
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Complete Setup 🎉</Text>}
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 24, paddingHorizontal: 24 },
  logo: { fontSize: 56, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '700', color: '#1a1a2e', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20 },
  steps: { flexDirection: 'row', gap: 8, marginTop: 16 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#cdd5ff' },
  dotActive: { backgroundColor: '#007AFF', width: 24 },
  card: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 16, padding: 24, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 },
  label: { fontWeight: '600', color: '#1a1a2e', marginBottom: 8, marginTop: 14, fontSize: 14 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 13, fontSize: 15, backgroundColor: '#fafafa', color: '#1a1a2e' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#f8f9fa' },
  chipActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  chipText: { fontSize: 13, color: '#666' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  btn: { backgroundColor: '#007AFF', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  backLink: { marginTop: 16, alignItems: 'center' },
  backLinkText: { color: '#007AFF', fontSize: 14 },
});

export default ProfileSetupScreen;
