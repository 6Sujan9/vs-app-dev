import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { workoutAPI } from '../utils/api';

const GOALS = ['muscle_gain', 'weight_loss', 'endurance', 'strength', 'flexibility'];

const GOAL_COLORS = {
  muscle_gain: '#007AFF',
  weight_loss: '#34C759',
  endurance: '#FF9500',
  strength: '#FF3B30',
  flexibility: '#AF52DE',
};
const goalColor = (goal) => GOAL_COLORS[goal] || '#007AFF';
const INTENSITIES = ['light', 'moderate', 'high', 'very_high'];
const EQUIPMENT = ['dumbbells', 'barbell', 'kettlebell', 'resistance bands', 'pull-up bar', 'bench', 'cable machine', 'treadmill', 'bodyweight'];

const cleanDesc = (text) => {
  if (!text) return '';
  let cleaned = text.replace(/```[\s\S]*?```/g, '').trim();
  if (cleaned.startsWith('{') || cleaned.startsWith('[')) return '';
  // Strip markdown bold/italic markers
  cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1');
  return cleaned.trim();
};

const WorkoutsScreen = () => {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '', description: '', goal: 'muscle_gain', intensity: 'moderate',
    duration_weeks: '4', frequency: '4', equipment: [],
  });
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [form, setForm] = useState({
    goal: 'muscle_gain', duration_weeks: '4', frequency: '4',
    intensity: 'moderate', equipment: ['dumbbells', 'barbell'], specific_requirements: '',
  });

  const fetchWorkouts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await workoutAPI.getWorkouts({ limit: 10 });
      setWorkouts(data.plans || []);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWorkouts(); }, [fetchWorkouts]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await workoutAPI.generateWorkout({
        goal: form.goal,
        duration_weeks: parseInt(form.duration_weeks) || 4,
        frequency: parseInt(form.frequency) || 4,
        intensity: form.intensity,
        equipment: form.equipment,
        specific_requirements: form.specific_requirements || '',
      });
      setShowGenerator(false);
      fetchWorkouts();
    } catch (err) {
      Alert.alert('Generation Failed', err.message);
    } finally {
      setGenerating(false);
    }
  };

  const openEdit = (workout) => {
    setEditTarget(workout);
    setEditForm({
      name: workout.name,
      description: workout.description || '',
      goal: workout.goal || 'muscle_gain',
      intensity: workout.intensity || 'moderate',
      duration_weeks: String(workout.duration_weeks || 4),
      frequency: String(workout.frequency || 4),
      equipment: workout.equipment || [],
    });
  };

  const handleSaveEdit = async () => {
    if (!editForm.name.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }
    setSaving(true);
    try {
      await workoutAPI.updateWorkout(editTarget.id, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
      });
      setEditTarget(null);
      fetchWorkouts();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = async (workoutId, form) => {
    setRegenerating(true);
    try {
      await workoutAPI.generateWorkout({
        goal: form.goal,
        intensity: form.intensity,
        duration_weeks: parseInt(form.duration_weeks) || 4,
        frequency: parseInt(form.frequency) || 4,
        equipment: form.equipment,
        specific_requirements: '',
      });
      await workoutAPI.deleteWorkout(workoutId);
      setEditTarget(null);
      fetchWorkouts();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setRegenerating(false);
    }
  };

  const confirmRegenerate = () => {
    const workoutId = editTarget.id;
    const snapshot = { ...editForm };
    Alert.alert(
      'Regenerate Workout',
      'This will replace the current exercises with new AI-generated content.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Regenerate', style: 'destructive', onPress: () => handleRegenerate(workoutId, snapshot) },
      ]
    );
  };

  const handleDelete = (workout) => {
    Alert.alert('Delete Workout', `Delete "${workout.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await workoutAPI.deleteWorkout(workout.id);
          fetchWorkouts();
        } catch (err) {
          Alert.alert('Error', err.message);
        }
      }},
    ]);
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#007AFF" />;

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>My Workouts</Text>
          <TouchableOpacity style={styles.generateBtn} onPress={() => setShowGenerator(true)}>
            <Text style={styles.generateBtnText}>+ AI Generate</Text>
          </TouchableOpacity>
        </View>

        {workouts.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🏋️</Text>
            <Text style={styles.emptyTitle}>No workouts yet</Text>
            <Text style={styles.emptyText}>Use AI to generate a personalized workout plan</Text>
            <TouchableOpacity style={styles.generateBtn} onPress={() => setShowGenerator(true)}>
              <Text style={styles.generateBtnText}>Generate Workout</Text>
            </TouchableOpacity>
          </View>
        ) : (
          workouts.map((workout) => (
            <View key={workout.id} style={[styles.card, { borderLeftColor: goalColor(workout.goal), borderLeftWidth: 4 }]}>
              <TouchableOpacity onPress={() => setExpanded(expanded === workout.id ? null : workout.id)}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{workout.name}</Text>
                  <Text style={styles.chevron}>{expanded === workout.id ? '▲' : '▼'}</Text>
                </View>
                <View style={styles.meta}>
                  <Text style={styles.metaTag}>📅 {workout.duration_weeks}w</Text>
                  <Text style={styles.metaTag}>💪 {workout.intensity}</Text>
                  <Text style={styles.metaTag}>🔁 {workout.frequency}x/wk</Text>
                  <Text style={styles.metaTag}>🏋️ {workout.exercises?.length || 0} exercises</Text>
                </View>
                {!workout.exercises?.length ? (
                  <Text style={styles.regenHint}>⚠️ No exercises found — tap Edit / Regenerate to fix</Text>
                ) : cleanDesc(workout.description) ? (
                  <Text style={styles.description}>{cleanDesc(workout.description)}</Text>
                ) : null}
              </TouchableOpacity>

              {expanded === workout.id && (
                <View style={styles.exercises}>
                  <Text style={styles.exercisesTitle}>Exercises</Text>
                  {(Array.isArray(workout.exercises) ? workout.exercises : []).map((ex, i) => (
                    <View key={i} style={styles.exercise}>
                      <Text style={styles.exerciseName}>{i + 1}. {String(ex.name || '')}</Text>
                      <View style={styles.exerciseMeta}>
                        {!!ex.sets && <Text style={styles.exerciseTag}>{ex.sets} sets</Text>}
                        {!!ex.reps && <Text style={styles.exerciseTag}>{ex.reps} reps</Text>}
                        {!!ex.rest_seconds && <Text style={styles.exerciseTag}>{ex.rest_seconds}s rest</Text>}
                      </View>
                      {ex.notes && typeof ex.notes === 'string' && !ex.notes.trim().startsWith('{') && (
                        <Text style={styles.exerciseNotes}>{ex.notes}</Text>
                      )}
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.actions}>
                <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(workout)}>
                  <Text style={styles.editBtnText}>✏️ Edit / Regenerate</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(workout)}>
                  <Text style={styles.deleteBtnText}>🗑️ Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Edit & Regenerate Modal */}
      <Modal visible={!!editTarget} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.modal} keyboardShouldPersistTaps="handled">
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Workout</Text>
            <TouchableOpacity onPress={() => setEditTarget(null)}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Name</Text>
          <TextInput style={styles.input} value={editForm.name}
            onChangeText={(v) => setEditForm((p) => ({ ...p, name: v }))} placeholder="Workout name" />

          <Text style={styles.label}>Description (optional)</Text>
          <TextInput style={[styles.input, { height: 80 }]} multiline
            value={editForm.description} onChangeText={(v) => setEditForm((p) => ({ ...p, description: v }))}
            placeholder="Add a description..." />

          <TouchableOpacity style={[styles.saveBtn, { marginTop: 16 }]}
            onPress={handleSaveEdit} disabled={saving || regenerating}>
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.saveBtnText}>Save Name & Description</Text>}
          </TouchableOpacity>

          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>🤖 Regenerate with New Settings</Text>

          <Text style={styles.label}>Goal</Text>
          <View style={styles.chips}>
            {GOALS.map((g) => (
              <TouchableOpacity key={g} style={[styles.chip, editForm.goal === g && styles.chipActive]}
                onPress={() => setEditForm((p) => ({ ...p, goal: g }))}>
                <Text style={[styles.chipText, editForm.goal === g && styles.chipTextActive]}>
                  {g.replace(/_/g, ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Intensity</Text>
          <View style={styles.chips}>
            {INTENSITIES.map((i) => (
              <TouchableOpacity key={i} style={[styles.chip, editForm.intensity === i && styles.chipActive]}
                onPress={() => setEditForm((p) => ({ ...p, intensity: i }))}>
                <Text style={[styles.chipText, editForm.intensity === i && styles.chipTextActive]}>
                  {i.replace(/_/g, ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Duration (weeks)</Text>
          <TextInput style={styles.input} value={editForm.duration_weeks} keyboardType="numeric"
            onChangeText={(v) => setEditForm((p) => ({ ...p, duration_weeks: v }))} />

          <Text style={styles.label}>Sessions per Week</Text>
          <TextInput style={styles.input} value={editForm.frequency} keyboardType="numeric"
            onChangeText={(v) => setEditForm((p) => ({ ...p, frequency: v }))} />

          <Text style={styles.label}>Equipment</Text>
          <View style={styles.chips}>
            {EQUIPMENT.map((e) => (
              <TouchableOpacity key={e}
                style={[styles.chip, editForm.equipment.includes(e) && styles.chipActive]}
                onPress={() => setEditForm((p) => ({
                  ...p,
                  equipment: p.equipment.includes(e)
                    ? p.equipment.filter((x) => x !== e)
                    : [...p.equipment, e],
                }))}>
                <Text style={[styles.chipText, editForm.equipment.includes(e) && styles.chipTextActive]}>
                  {e}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={[styles.regenBtn, { marginBottom: 40 }]}
            onPress={confirmRegenerate} disabled={saving || regenerating}>
            {regenerating
              ? <><ActivityIndicator color="#fff" /><Text style={[styles.regenBtnText, { marginLeft: 8 }]}>Generating...</Text></>
              : <Text style={styles.regenBtnText}>🤖 Regenerate with AI</Text>}
          </TouchableOpacity>
        </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* AI Generator Modal */}
      <Modal visible={showGenerator} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.modal} keyboardShouldPersistTaps="handled">
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>🤖 AI Workout Generator</Text>
            <TouchableOpacity onPress={() => setShowGenerator(false)}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Goal</Text>
          <View style={styles.chips}>
            {GOALS.map((g) => (
              <TouchableOpacity key={g} style={[styles.chip, form.goal === g && styles.chipActive]}
                onPress={() => setForm((p) => ({ ...p, goal: g }))}>
                <Text style={[styles.chipText, form.goal === g && styles.chipTextActive]}>
                  {g.replace(/_/g, ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Intensity</Text>
          <View style={styles.chips}>
            {INTENSITIES.map((i) => (
              <TouchableOpacity key={i} style={[styles.chip, form.intensity === i && styles.chipActive]}
                onPress={() => setForm((p) => ({ ...p, intensity: i }))}>
                <Text style={[styles.chipText, form.intensity === i && styles.chipTextActive]}>
                  {i.replace(/_/g, ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Duration (weeks)</Text>
          <TextInput style={styles.input} value={form.duration_weeks} keyboardType="numeric"
            onChangeText={(v) => setForm((p) => ({ ...p, duration_weeks: v }))} />

          <Text style={styles.label}>Sessions per Week</Text>
          <TextInput style={styles.input} value={form.frequency} keyboardType="numeric"
            onChangeText={(v) => setForm((p) => ({ ...p, frequency: v }))} />

          <Text style={styles.label}>Equipment (select all you have)</Text>
          <View style={styles.chips}>
            {EQUIPMENT.map((e) => (
              <TouchableOpacity key={e}
                style={[styles.chip, form.equipment.includes(e) && styles.chipActive]}
                onPress={() => setForm((p) => ({
                  ...p,
                  equipment: p.equipment.includes(e)
                    ? p.equipment.filter((x) => x !== e)
                    : [...p.equipment, e],
                }))}>
                <Text style={[styles.chipText, form.equipment.includes(e) && styles.chipTextActive]}>
                  {e}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Specific Requirements (optional)</Text>
          <TextInput style={[styles.input, { height: 80 }]} multiline value={form.specific_requirements}
            onChangeText={(v) => setForm((p) => ({ ...p, specific_requirements: v }))}
            placeholder="Focus on lower body, avoid high impact..." />

          <TouchableOpacity style={[styles.generateBtn, { marginBottom: 40 }]} onPress={handleGenerate} disabled={generating}>
            {generating
              ? <><ActivityIndicator color="#fff" /><Text style={[styles.generateBtnText, { marginLeft: 8 }]}>Generating...</Text></>
              : <Text style={styles.generateBtnText}>Generate with AI</Text>}
          </TouchableOpacity>
        </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1a1a2e' },
  generateBtn: { backgroundColor: '#007AFF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  generateBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  empty: { alignItems: 'center', padding: 40, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e' },
  emptyText: { fontSize: 14, color: '#666', textAlign: 'center' },
  card: { backgroundColor: '#fff', margin: 12, borderRadius: 12, padding: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a1a2e', flex: 1 },
  chevron: { color: '#007AFF', fontSize: 12 },
  description: { fontSize: 13, color: '#666', marginTop: 6, fontStyle: 'italic' },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  metaTag: { backgroundColor: '#f0f4ff', color: '#007AFF', fontSize: 12, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  exercises: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 12 },
  exercisesTitle: { fontWeight: 'bold', color: '#1a1a2e', marginBottom: 8 },
  exercise: { backgroundColor: '#f8f9fa', borderRadius: 8, padding: 10, marginBottom: 6 },
  exerciseName: { fontWeight: '600', color: '#1a1a2e', marginBottom: 4 },
  exerciseMeta: { flexDirection: 'row', gap: 6 },
  exerciseTag: { backgroundColor: '#ede9fe', color: '#6d28d9', fontSize: 12, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  exerciseNotes: { fontSize: 12, color: '#666', marginTop: 4, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  editBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderWidth: 1, borderColor: '#007AFF', borderRadius: 8 },
  editBtnText: { color: '#007AFF', fontWeight: '600', fontSize: 13 },
  deleteBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderWidth: 1, borderColor: '#ff3b30', borderRadius: 8 },
  deleteBtnText: { color: '#ff3b30', fontWeight: '600', fontSize: 13 },
  modal: { flex: 1, padding: 20, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 10 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a1a2e' },
  closeBtn: { fontSize: 20, color: '#666' },
  saveBtn: { backgroundColor: '#007AFF', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  divider: { height: 1, backgroundColor: '#e0e0e0', marginVertical: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 4 },
  regenHint: { fontSize: 13, color: '#FF9500', marginTop: 6, fontStyle: 'italic' },
  regenBtn: { backgroundColor: '#FF9500', paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginTop: 20 },
  regenBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  label: { fontWeight: '600', color: '#1a1a2e', marginBottom: 8, marginTop: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#f8f9fa' },
  chipActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  chipText: { fontSize: 13, color: '#666' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 15, backgroundColor: '#fafafa', marginBottom: 4 },
});

export default WorkoutsScreen;
