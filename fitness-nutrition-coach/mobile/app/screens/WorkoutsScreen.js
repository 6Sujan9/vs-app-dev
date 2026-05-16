import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Modal, TextInput,
} from 'react-native';
import { workoutAPI } from '../utils/api';

const GOALS = ['muscle_gain', 'weight_loss', 'endurance', 'strength', 'flexibility'];
const INTENSITIES = ['light', 'moderate', 'high', 'very_high'];

const WorkoutsScreen = () => {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [editTarget, setEditTarget] = useState(null); // { id, name, description }
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    goal: 'muscle_gain', duration_weeks: '4', frequency: '4',
    intensity: 'moderate', equipment: 'dumbbells, barbell', specific_requirements: '',
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
      const equipment = form.equipment.split(',').map((e) => e.trim()).filter(Boolean);
      await workoutAPI.generateWorkout({
        goal: form.goal,
        duration_weeks: parseInt(form.duration_weeks) || 4,
        frequency: parseInt(form.frequency) || 4,
        intensity: form.intensity,
        equipment,
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
    setEditName(workout.name);
    setEditDesc(workout.description || '');
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }
    setSaving(true);
    try {
      await workoutAPI.updateWorkout(editTarget.id, {
        name: editName.trim(),
        description: editDesc.trim(),
      });
      setEditTarget(null);
      fetchWorkouts();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
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
            <View key={workout.id} style={styles.card}>
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
                {workout.description && !workout.description.trim().startsWith('{') ? (
                  <Text style={styles.description}>{workout.description}</Text>
                ) : null}
              </TouchableOpacity>

              {expanded === workout.id && (
                <View style={styles.exercises}>
                  <Text style={styles.exercisesTitle}>Exercises</Text>
                  {(workout.exercises || []).map((ex, i) => (
                    <View key={i} style={styles.exercise}>
                      <Text style={styles.exerciseName}>{i + 1}. {ex.name}</Text>
                      <View style={styles.exerciseMeta}>
                        {ex.sets && <Text style={styles.exerciseTag}>{ex.sets} sets</Text>}
                        {ex.reps && <Text style={styles.exerciseTag}>{ex.reps} reps</Text>}
                        {ex.rest_seconds && <Text style={styles.exerciseTag}>{ex.rest_seconds}s rest</Text>}
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
                  <Text style={styles.editBtnText}>✏️ Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(workout)}>
                  <Text style={styles.deleteBtnText}>🗑️ Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={!!editTarget} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Workout</Text>
            <TouchableOpacity onPress={() => setEditTarget(null)}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.label}>Name</Text>
          <TextInput style={styles.input} value={editName}
            onChangeText={setEditName} placeholder="Workout name" />
          <Text style={styles.label}>Description (optional)</Text>
          <TextInput style={[styles.input, { height: 100 }]} multiline
            value={editDesc} onChangeText={setEditDesc} placeholder="Add a description..." />
          <TouchableOpacity style={[styles.generateBtn, { marginTop: 20 }]}
            onPress={handleSaveEdit} disabled={saving}>
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.generateBtnText}>Save Changes</Text>}
          </TouchableOpacity>
        </View>
      </Modal>

      {/* AI Generator Modal */}
      <Modal visible={showGenerator} animationType="slide" presentationStyle="pageSheet">
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

          <Text style={styles.label}>Equipment (comma separated)</Text>
          <TextInput style={styles.input} value={form.equipment}
            onChangeText={(v) => setForm((p) => ({ ...p, equipment: v }))}
            placeholder="dumbbells, barbell, bodyweight..." />

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
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1a1a2e' },
  generateBtn: { backgroundColor: '#007AFF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, flexDirection: 'row', alignItems: 'center' },
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
  label: { fontWeight: '600', color: '#1a1a2e', marginBottom: 8, marginTop: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#f8f9fa' },
  chipActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  chipText: { fontSize: 13, color: '#666' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 15, backgroundColor: '#fafafa', marginBottom: 4 },
});

export default WorkoutsScreen;
