import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Modal, TextInput, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { workoutAPI } from '../utils/api';
import { useTheme } from '../context/ThemeContext';

const GOALS = ['muscle_gain', 'weight_loss', 'endurance', 'strength', 'flexibility'];

const GOAL_COLORS = {
  muscle_gain: '#6C63FF',
  weight_loss: '#43D787',
  endurance: '#FFB347',
  strength: '#FF6584',
  flexibility: '#5AC8FA',
};
const goalColor = (goal) => GOAL_COLORS[goal] || '#6C63FF';

const INTENSITY_COLORS = {
  light: { bg: '#43D787', text: '#1a4a2e' },
  moderate: { bg: '#FFB347', text: '#5a3a00' },
  high: { bg: '#FF6584', text: '#5a001a' },
  very_high: { bg: '#FF3B30', text: '#fff' },
};
const intensityStyle = (intensity) => INTENSITY_COLORS[intensity] || INTENSITY_COLORS.moderate;

const INTENSITIES = ['light', 'moderate', 'high', 'very_high'];
const EQUIPMENT = ['dumbbells', 'barbell', 'kettlebell', 'resistance bands', 'pull-up bar', 'bench', 'cable machine', 'treadmill', 'bodyweight'];

const cleanDesc = (text) => {
  if (!text) return '';
  let cleaned = text.replace(/```[\s\S]*?```/g, '').trim();
  if (cleaned.startsWith('{') || cleaned.startsWith('[')) return '';
  cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1');
  return cleaned.trim();
};

const WorkoutsScreen = () => {
  const { theme } = useTheme();
  const C = theme.colors;

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

  // Skeleton pulse
  const pulseAnim = React.useRef(new Animated.Value(0)).current;
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
  const skeletonOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });

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

  const handleRegenerate = async (workoutId, regenForm) => {
    setRegenerating(true);
    try {
      await workoutAPI.generateWorkout({
        goal: regenForm.goal,
        intensity: regenForm.intensity,
        duration_weeks: parseInt(regenForm.duration_weeks) || 4,
        frequency: parseInt(regenForm.frequency) || 4,
        equipment: regenForm.equipment,
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
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await workoutAPI.deleteWorkout(workout.id);
            fetchWorkouts();
          } catch (err) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, padding: 16 }}>
        {[1, 2, 3].map((i) => (
          <Animated.View
            key={i}
            style={{
              height: 120,
              borderRadius: 14,
              backgroundColor: C.skeleton,
              marginBottom: 12,
              opacity: skeletonOpacity,
            }}
          />
        ))}
      </View>
    );
  }

  const ic = (goal) => intensityStyle(goal);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView>
        <View style={[styles.header]}>
          <Text style={[styles.title, { color: C.text }]}>My Workouts</Text>
          <TouchableOpacity
            style={[styles.generateBtn, { backgroundColor: C.primary }]}
            onPress={() => setShowGenerator(true)}
          >
            <Text style={styles.generateBtnText}>+ AI Generate</Text>
          </TouchableOpacity>
        </View>

        {workouts.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🏋️</Text>
            <Text style={[styles.emptyTitle, { color: C.text }]}>No workouts yet</Text>
            <Text style={[styles.emptyText, { color: C.textSub }]}>Use AI to generate a personalized workout plan</Text>
            <TouchableOpacity
              style={[styles.generateBtn, { backgroundColor: C.primary }]}
              onPress={() => setShowGenerator(true)}
            >
              <Text style={styles.generateBtnText}>Generate Workout</Text>
            </TouchableOpacity>
          </View>
        ) : (
          workouts.map((workout) => (
            <View
              key={workout.id}
              style={[
                styles.card,
                {
                  backgroundColor: C.card,
                  borderLeftColor: goalColor(workout.goal),
                  borderLeftWidth: 4,
                  shadowColor: C.shadow,
                },
              ]}
            >
              <TouchableOpacity onPress={() => setExpanded(expanded === workout.id ? null : workout.id)}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, { color: C.text }]}>{workout.name}</Text>
                  <Text style={[styles.chevron, { color: C.primary }]}>{expanded === workout.id ? '▲' : '▼'}</Text>
                </View>

                {/* Goal + Intensity badges */}
                <View style={styles.badgeRow}>
                  <View style={[styles.goalBadge, { backgroundColor: `${goalColor(workout.goal)}22` }]}>
                    <Text style={[styles.goalBadgeText, { color: goalColor(workout.goal) }]}>
                      {(workout.goal || '').replace(/_/g, ' ')}
                    </Text>
                  </View>
                  {workout.intensity ? (
                    <View style={[styles.intensityBadge, { backgroundColor: ic(workout.intensity).bg }]}>
                      <Text style={[styles.intensityBadgeText, { color: ic(workout.intensity).text }]}>
                        {workout.intensity.replace(/_/g, ' ')}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.meta}>
                  <Text style={[styles.metaTag, { backgroundColor: C.primaryBg, color: C.primary }]}>📅 {workout.duration_weeks}w</Text>
                  <Text style={[styles.metaTag, { backgroundColor: C.primaryBg, color: C.primary }]}>🔁 {workout.frequency}x/wk</Text>
                  <Text style={[styles.metaTag, { backgroundColor: C.primaryBg, color: C.primary }]}>🏋️ {workout.exercises?.length || 0} exercises</Text>
                </View>

                {!workout.exercises?.length ? (
                  <Text style={[styles.regenHint, { color: C.warning }]}>
                    ⚠️ No exercises found — tap Edit / Regenerate to fix
                  </Text>
                ) : cleanDesc(workout.description) ? (
                  <Text style={[styles.description, { color: C.textSub }]}>{cleanDesc(workout.description)}</Text>
                ) : null}
              </TouchableOpacity>

              {expanded === workout.id && (
                <View style={[styles.exercises, { borderTopColor: C.divider }]}>
                  <Text style={[styles.exercisesTitle, { color: C.text }]}>Exercises</Text>
                  {(Array.isArray(workout.exercises) ? workout.exercises : []).map((ex, i) => (
                    <View key={i} style={[styles.exercise, { backgroundColor: C.surfaceAlt }]}>
                      <Text style={[styles.exerciseName, { color: C.text }]}>{i + 1}. {String(ex.name || '')}</Text>
                      <View style={styles.exerciseMeta}>
                        {!!ex.sets && (
                          <Text style={[styles.exerciseTag, { backgroundColor: C.primaryBg, color: C.primary }]}>
                            {ex.sets} sets
                          </Text>
                        )}
                        {!!ex.reps && (
                          <Text style={[styles.exerciseTag, { backgroundColor: C.primaryBg, color: C.primary }]}>
                            {ex.reps} reps
                          </Text>
                        )}
                        {!!ex.rest_seconds && (
                          <Text style={[styles.exerciseTag, { backgroundColor: C.primaryBg, color: C.primary }]}>
                            {ex.rest_seconds}s rest
                          </Text>
                        )}
                      </View>
                      {ex.notes && typeof ex.notes === 'string' && !ex.notes.trim().startsWith('{') && (
                        <Text style={[styles.exerciseNotes, { color: C.textSub }]}>{ex.notes}</Text>
                      )}
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.editBtn, { borderColor: C.primary }]}
                  onPress={() => openEdit(workout)}
                >
                  <Text style={[styles.editBtnText, { color: C.primary }]}>✏️ Edit / Regenerate</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.deleteBtn, { borderColor: C.danger }]}
                  onPress={() => handleDelete(workout)}
                >
                  <Text style={[styles.deleteBtnText, { color: C.danger }]}>🗑️ Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Edit & Regenerate Modal */}
      <Modal visible={!!editTarget} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView
            style={[styles.modal, { backgroundColor: C.surface }]}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: C.text }]}>Edit Workout</Text>
              <TouchableOpacity onPress={() => setEditTarget(null)}>
                <Text style={[styles.closeBtn, { color: C.textSub }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: C.text }]}>Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: C.inputBg, borderColor: C.inputBorder, color: C.text }]}
              value={editForm.name}
              onChangeText={(v) => setEditForm((p) => ({ ...p, name: v }))}
              placeholder="Workout name"
              placeholderTextColor={C.textMuted}
            />

            <Text style={[styles.label, { color: C.text }]}>Description (optional)</Text>
            <TextInput
              style={[styles.input, { height: 80, backgroundColor: C.inputBg, borderColor: C.inputBorder, color: C.text }]}
              multiline
              value={editForm.description}
              onChangeText={(v) => setEditForm((p) => ({ ...p, description: v }))}
              placeholder="Add a description..."
              placeholderTextColor={C.textMuted}
            />

            <TouchableOpacity
              style={[styles.saveBtn, { marginTop: 16, backgroundColor: C.primary }]}
              onPress={handleSaveEdit}
              disabled={saving || regenerating}
            >
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.saveBtnText}>Save Name & Description</Text>}
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: C.divider }]} />
            <Text style={[styles.sectionTitle, { color: C.text }]}>🤖 Regenerate with New Settings</Text>

            <Text style={[styles.label, { color: C.text }]}>Goal</Text>
            <View style={styles.chips}>
              {GOALS.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.chip,
                    { borderColor: C.border, backgroundColor: C.surfaceAlt },
                    editForm.goal === g && { backgroundColor: C.primary, borderColor: C.primary },
                  ]}
                  onPress={() => setEditForm((p) => ({ ...p, goal: g }))}
                >
                  <Text style={[
                    styles.chipText,
                    { color: C.textSub },
                    editForm.goal === g && styles.chipTextActive,
                  ]}>
                    {g.replace(/_/g, ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: C.text }]}>Intensity</Text>
            <View style={styles.chips}>
              {INTENSITIES.map((i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.chip,
                    { borderColor: C.border, backgroundColor: C.surfaceAlt },
                    editForm.intensity === i && { backgroundColor: C.primary, borderColor: C.primary },
                  ]}
                  onPress={() => setEditForm((p) => ({ ...p, intensity: i }))}
                >
                  <Text style={[
                    styles.chipText,
                    { color: C.textSub },
                    editForm.intensity === i && styles.chipTextActive,
                  ]}>
                    {i.replace(/_/g, ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: C.text }]}>Duration (weeks)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: C.inputBg, borderColor: C.inputBorder, color: C.text }]}
              value={editForm.duration_weeks}
              keyboardType="numeric"
              onChangeText={(v) => setEditForm((p) => ({ ...p, duration_weeks: v }))}
              placeholderTextColor={C.textMuted}
            />

            <Text style={[styles.label, { color: C.text }]}>Sessions per Week</Text>
            <TextInput
              style={[styles.input, { backgroundColor: C.inputBg, borderColor: C.inputBorder, color: C.text }]}
              value={editForm.frequency}
              keyboardType="numeric"
              onChangeText={(v) => setEditForm((p) => ({ ...p, frequency: v }))}
              placeholderTextColor={C.textMuted}
            />

            <Text style={[styles.label, { color: C.text }]}>Equipment</Text>
            <View style={styles.chips}>
              {EQUIPMENT.map((e) => (
                <TouchableOpacity
                  key={e}
                  style={[
                    styles.chip,
                    { borderColor: C.border, backgroundColor: C.surfaceAlt },
                    editForm.equipment.includes(e) && { backgroundColor: C.primary, borderColor: C.primary },
                  ]}
                  onPress={() => setEditForm((p) => ({
                    ...p,
                    equipment: p.equipment.includes(e)
                      ? p.equipment.filter((x) => x !== e)
                      : [...p.equipment, e],
                  }))}
                >
                  <Text style={[
                    styles.chipText,
                    { color: C.textSub },
                    editForm.equipment.includes(e) && styles.chipTextActive,
                  ]}>
                    {e}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.regenBtn, { marginBottom: 40, backgroundColor: C.warning }]}
              onPress={confirmRegenerate}
              disabled={saving || regenerating}
            >
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
          <ScrollView
            style={[styles.modal, { backgroundColor: C.surface }]}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: C.text }]}>🤖 AI Workout Generator</Text>
              <TouchableOpacity onPress={() => setShowGenerator(false)}>
                <Text style={[styles.closeBtn, { color: C.textSub }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: C.text }]}>Goal</Text>
            <View style={styles.chips}>
              {GOALS.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.chip,
                    { borderColor: C.border, backgroundColor: C.surfaceAlt },
                    form.goal === g && { backgroundColor: C.primary, borderColor: C.primary },
                  ]}
                  onPress={() => setForm((p) => ({ ...p, goal: g }))}
                >
                  <Text style={[
                    styles.chipText,
                    { color: C.textSub },
                    form.goal === g && styles.chipTextActive,
                  ]}>
                    {g.replace(/_/g, ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: C.text }]}>Intensity</Text>
            <View style={styles.chips}>
              {INTENSITIES.map((i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.chip,
                    { borderColor: C.border, backgroundColor: C.surfaceAlt },
                    form.intensity === i && { backgroundColor: C.primary, borderColor: C.primary },
                  ]}
                  onPress={() => setForm((p) => ({ ...p, intensity: i }))}
                >
                  <Text style={[
                    styles.chipText,
                    { color: C.textSub },
                    form.intensity === i && styles.chipTextActive,
                  ]}>
                    {i.replace(/_/g, ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: C.text }]}>Duration (weeks)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: C.inputBg, borderColor: C.inputBorder, color: C.text }]}
              value={form.duration_weeks}
              keyboardType="numeric"
              onChangeText={(v) => setForm((p) => ({ ...p, duration_weeks: v }))}
              placeholderTextColor={C.textMuted}
            />

            <Text style={[styles.label, { color: C.text }]}>Sessions per Week</Text>
            <TextInput
              style={[styles.input, { backgroundColor: C.inputBg, borderColor: C.inputBorder, color: C.text }]}
              value={form.frequency}
              keyboardType="numeric"
              onChangeText={(v) => setForm((p) => ({ ...p, frequency: v }))}
              placeholderTextColor={C.textMuted}
            />

            <Text style={[styles.label, { color: C.text }]}>Equipment (select all you have)</Text>
            <View style={styles.chips}>
              {EQUIPMENT.map((e) => (
                <TouchableOpacity
                  key={e}
                  style={[
                    styles.chip,
                    { borderColor: C.border, backgroundColor: C.surfaceAlt },
                    form.equipment.includes(e) && { backgroundColor: C.primary, borderColor: C.primary },
                  ]}
                  onPress={() => setForm((p) => ({
                    ...p,
                    equipment: p.equipment.includes(e)
                      ? p.equipment.filter((x) => x !== e)
                      : [...p.equipment, e],
                  }))}
                >
                  <Text style={[
                    styles.chipText,
                    { color: C.textSub },
                    form.equipment.includes(e) && styles.chipTextActive,
                  ]}>
                    {e}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: C.text }]}>Specific Requirements (optional)</Text>
            <TextInput
              style={[styles.input, { height: 80, backgroundColor: C.inputBg, borderColor: C.inputBorder, color: C.text }]}
              multiline
              value={form.specific_requirements}
              onChangeText={(v) => setForm((p) => ({ ...p, specific_requirements: v }))}
              placeholder="Focus on lower body, avoid high impact..."
              placeholderTextColor={C.textMuted}
            />

            <TouchableOpacity
              style={[styles.generateBtn, { marginBottom: 40, backgroundColor: C.primary }]}
              onPress={handleGenerate}
              disabled={generating}
            >
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold' },
  generateBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  generateBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  empty: { alignItems: 'center', padding: 40, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold' },
  emptyText: { fontSize: 14, textAlign: 'center' },
  card: { margin: 12, borderRadius: 14, padding: 16, elevation: 2, shadowOpacity: 0.08, shadowRadius: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', flex: 1 },
  chevron: { fontSize: 12 },
  badgeRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  goalBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  goalBadgeText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  intensityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  intensityBadgeText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  description: { fontSize: 13, marginTop: 6, fontStyle: 'italic' },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  metaTag: { fontSize: 12, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  exercises: { marginTop: 12, borderTopWidth: 1, paddingTop: 12 },
  exercisesTitle: { fontWeight: 'bold', marginBottom: 8 },
  exercise: { borderRadius: 8, padding: 10, marginBottom: 6 },
  exerciseName: { fontWeight: '600', marginBottom: 4 },
  exerciseMeta: { flexDirection: 'row', gap: 6 },
  exerciseTag: { fontSize: 12, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  exerciseNotes: { fontSize: 12, marginTop: 4, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  editBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderWidth: 1, borderRadius: 8 },
  editBtnText: { fontWeight: '600', fontSize: 13 },
  deleteBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderWidth: 1, borderRadius: 8 },
  deleteBtnText: { fontWeight: '600', fontSize: 13 },
  modal: { flex: 1, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 10 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  closeBtn: { fontSize: 20 },
  saveBtn: { paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  divider: { height: 1, marginVertical: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  regenHint: { fontSize: 13, marginTop: 6, fontStyle: 'italic' },
  regenBtn: { paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginTop: 20 },
  regenBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  label: { fontWeight: '600', marginBottom: 8, marginTop: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13 },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 4 },
});

export default WorkoutsScreen;
