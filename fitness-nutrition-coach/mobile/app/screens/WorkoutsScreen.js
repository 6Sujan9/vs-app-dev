import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Modal, TextInput, KeyboardAvoidingView,
  Platform, Animated, Vibration,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { workoutAPI } from '../utils/api';
import { useTheme } from '../context/ThemeContext';

// ─── Constants ────────────────────────────────────────────────────────────────
const GOALS = ['muscle_gain', 'weight_loss', 'endurance', 'strength', 'flexibility'];
const INTENSITIES = ['light', 'moderate', 'high', 'very_high'];
const EQUIPMENT = ['dumbbells', 'barbell', 'kettlebell', 'resistance bands', 'pull-up bar', 'bench', 'cable machine', 'treadmill', 'bodyweight'];

const GOAL_COLORS = {
  muscle_gain: '#6C63FF',
  weight_loss: '#43D787',
  endurance: '#FFB347',
  strength: '#FF6584',
  flexibility: '#5AC8FA',
};
const goalColor = (goal) => GOAL_COLORS[goal] || '#6C63FF';

const INTENSITY_COLORS = {
  light:     { bg: '#43D787', text: '#1a4a2e' },
  moderate:  { bg: '#FFB347', text: '#5a3a00' },
  high:      { bg: '#FF6584', text: '#5a001a' },
  very_high: { bg: '#FF3B30', text: '#fff'    },
};
const intensityStyle = (i) => INTENSITY_COLORS[i] || INTENSITY_COLORS.moderate;

const PHASE_COLORS = {
  ready:    '#FFB347',
  work:     '#43D787',
  rest:     '#5AC8FA',
  complete: '#6C63FF',
};

const DEFAULT_WORK_SECS = 45;
const DEFAULT_REST_SECS = 60;
const READY_SECS        = 3;

const ANIMATIONS = {
  workout:  require('../../assets/animations/workout.json'),
  running:  require('../../assets/animations/running.json'),
  rest:     require('../../assets/animations/rest.json'),
  complete: require('../../assets/animations/complete.json'),
};

const getExerciseAnimation = (exercise, phase) => {
  if (phase === 'rest' || phase === 'ready') return ANIMATIONS.rest;
  if (phase === 'complete') return ANIMATIONS.complete;
  const name = (exercise?.name || '').toLowerCase();
  if (/run|cardio|jog|treadmill|bike|cycl|jump|burpee|hiit|sprint/.test(name)) return ANIMATIONS.running;
  return ANIMATIONS.workout;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const cleanDesc = (text) => {
  if (!text) return '';
  let c = text.replace(/```[\s\S]*?```/g, '').trim();
  if (c.startsWith('{') || c.startsWith('[')) return '';
  return c.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').trim();
};

const fmtTime = (secs) => {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const fmtElapsed = (secs) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

const getWorkTime = (ex) =>
  ex?.duration_minutes ? Math.round(ex.duration_minutes * 60) : DEFAULT_WORK_SECS;

const getRestTime = (ex) => ex?.rest_seconds || DEFAULT_REST_SECS;

// ─── Timer Progress Bar ───────────────────────────────────────────────────────
const TimerProgress = ({ timeLeft, totalTime, phaseColor }) => {
  const widthAnim = useRef(new Animated.Value(0)).current;
  const progress = totalTime > 0 ? Math.max(0, 1 - timeLeft / totalTime) : 0;

  useEffect(() => {
    Animated.timing(widthAnim, { toValue: progress, duration: 800, useNativeDriver: false }).start();
  }, [progress]);

  return (
    <View style={{ width: '80%', height: 6, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 3, marginTop: 16 }}>
      <Animated.View style={{
        height: 6, borderRadius: 3, backgroundColor: phaseColor,
        width: widthAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
      }} />
    </View>
  );
};

// ─── Workout Timer Modal ───────────────────────────────────────────────────────
const WorkoutTimerModal = ({ visible, workout, onClose }) => {
  const { theme } = useTheme();
  const C = theme.colors;

  const exercises = workout?.exercises || [];

  // Timer state
  const [phase, setPhase]               = useState('ready');
  const [exIndex, setExIndex]           = useState(0);
  const [currentSet, setCurrentSet]     = useState(1);
  const [timeLeft, setTimeLeft]         = useState(READY_SECS);
  const [totalTime, setTotalTime]       = useState(READY_SECS);
  const [isPaused, setIsPaused]         = useState(false);
  const [pendingNextEx, setPendingNextEx] = useState(false);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  // Pulse animation for the circle
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef(null);

  const startPulse = () => {
    pulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.97, duration: 700, useNativeDriver: true }),
      ])
    );
    pulseLoop.current.start();
  };

  const stopPulse = () => {
    if (pulseLoop.current) pulseLoop.current.stop();
    pulseAnim.setValue(1);
  };

  // Reset on open
  useEffect(() => {
    if (visible && exercises.length > 0) {
      setPhase('ready');
      setExIndex(0);
      setCurrentSet(1);
      setTimeLeft(READY_SECS);
      setTotalTime(READY_SECS);
      setIsPaused(false);
      setPendingNextEx(false);
      setTotalElapsed(0);
      setCompletedCount(0);
      startPulse();
    }
    return () => stopPulse();
  }, [visible]);

  // Pulse when phase changes
  useEffect(() => {
    stopPulse();
    startPulse();
  }, [phase]);

  // Timer tick (setTimeout pattern — reads fresh state each tick)
  useEffect(() => {
    if (!visible || phase === 'complete' || isPaused || timeLeft <= 0) return;
    const t = setTimeout(() => {
      setTimeLeft(prev => prev - 1);
      setTotalElapsed(prev => prev + 1);
    }, 1000);
    return () => clearTimeout(t);
  }, [visible, phase, isPaused, timeLeft]);

  // Phase transition when timeLeft reaches 0
  useEffect(() => {
    if (timeLeft > 0 || !visible || phase === 'complete') return;

    Vibration.vibrate([0, 200, 100, 200]);

    if (phase === 'ready') {
      const wt = getWorkTime(exercises[exIndex]);
      setPhase('work');
      setTimeLeft(wt);
      setTotalTime(wt);
      return;
    }

    if (phase === 'work') {
      const totalSets = exercises[exIndex]?.sets || 1;
      if (currentSet < totalSets) {
        // More sets: rest between sets
        const rt = getRestTime(exercises[exIndex]);
        setPhase('rest');
        setPendingNextEx(false);
        setTimeLeft(rt);
        setTotalTime(rt);
      } else {
        // Last set of this exercise
        setCompletedCount(c => c + 1);
        const nextIdx = exIndex + 1;
        if (nextIdx >= exercises.length) {
          setPhase('complete');
          stopPulse();
        } else {
          const rt = getRestTime(exercises[exIndex]);
          setPhase('rest');
          setPendingNextEx(true);
          setTimeLeft(rt);
          setTotalTime(rt);
        }
      }
      return;
    }

    if (phase === 'rest') {
      if (pendingNextEx) {
        const nextIdx = exIndex + 1;
        const wt = getWorkTime(exercises[nextIdx]);
        setExIndex(nextIdx);
        setCurrentSet(1);
        setPendingNextEx(false);
        setPhase('work');
        setTimeLeft(wt);
        setTotalTime(wt);
      } else {
        const wt = getWorkTime(exercises[exIndex]);
        setCurrentSet(s => s + 1);
        setPhase('work');
        setTimeLeft(wt);
        setTotalTime(wt);
      }
    }
  }, [timeLeft, visible, phase, exIndex, currentSet, pendingNextEx, exercises]);

  // Controls
  const skipExercise = () => {
    Vibration.vibrate(100);
    const nextIdx = exIndex + 1;
    if (nextIdx >= exercises.length) {
      setCompletedCount(c => c + 1);
      setPhase('complete');
      stopPulse();
    } else {
      const rt = getRestTime(exercises[exIndex]);
      setPhase('rest');
      setPendingNextEx(true);
      setTimeLeft(rt);
      setTotalTime(rt);
    }
  };

  const prevExercise = () => {
    if (exIndex === 0) return;
    Vibration.vibrate(50);
    const prevIdx = exIndex - 1;
    const wt = getWorkTime(exercises[prevIdx]);
    setExIndex(prevIdx);
    setCurrentSet(1);
    setPendingNextEx(false);
    setPhase('work');
    setTimeLeft(wt);
    setTotalTime(wt);
  };

  const skipRest = () => {
    Vibration.vibrate(50);
    setTimeLeft(0);
  };

  const handleStop = () => {
    Alert.alert('Stop Workout', 'Are you sure you want to stop?', [
      { text: 'Continue', style: 'cancel' },
      { text: 'Stop', style: 'destructive', onPress: () => { stopPulse(); onClose(); } },
    ]);
  };

  if (!workout) return null;

  const phaseColor = PHASE_COLORS[phase] || '#6C63FF';
  const currentEx  = exercises[exIndex];
  const nextEx     = phase === 'rest' && pendingNextEx ? exercises[exIndex + 1] : null;
  const totalSets  = currentEx?.sets || 1;

  const phaseLabel = {
    ready:    'GET READY',
    work:     'WORK',
    rest:     'REST',
    complete: 'COMPLETE',
  }[phase];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={[timerStyles.container, { backgroundColor: '#0A0A0A' }]}>
        {/* Header */}
        <View style={timerStyles.header}>
          <Text style={timerStyles.workoutName} numberOfLines={1}>{workout.name}</Text>
          <TouchableOpacity onPress={handleStop} style={timerStyles.stopBtn}>
            <Text style={timerStyles.stopBtnText}>✕ Stop</Text>
          </TouchableOpacity>
        </View>

        {phase !== 'complete' ? (
          <>
            {/* Exercise info */}
            <View style={timerStyles.exInfo}>
              <Text style={[timerStyles.exCounter, { color: phaseColor }]}>
                {phase === 'ready' ? 'Starting in...' : `Exercise ${exIndex + 1} of ${exercises.length}`}
              </Text>
              {currentEx && phase !== 'ready' && (
                <Text style={timerStyles.exName} numberOfLines={2}>{currentEx.name}</Text>
              )}
              {phase === 'work' && (
                <Text style={[timerStyles.setCounter, { color: phaseColor }]}>
                  Set {currentSet} of {totalSets}
                </Text>
              )}
            </View>

            {/* Timer circle + Lottie */}
            <View style={timerStyles.circleWrap}>
              <LottieView
                key={`lottie-${phase}-${exIndex}`}
                source={getExerciseAnimation(currentEx, phase)}
                autoPlay
                loop
                style={timerStyles.lottieAnim}
              />
              <Animated.View style={[
                timerStyles.circle,
                {
                  borderColor: phaseColor,
                  backgroundColor: `${phaseColor}18`,
                  transform: [{ scale: pulseAnim }],
                },
              ]}>
                <Text style={[timerStyles.phaseLabel, { color: phaseColor }]}>{phaseLabel}</Text>
                <Text style={timerStyles.timerNum}>{fmtTime(timeLeft)}</Text>
              </Animated.View>
              <TimerProgress timeLeft={timeLeft} totalTime={totalTime} phaseColor={phaseColor} />
            </View>

            {/* REST info */}
            {phase === 'rest' && (
              <View style={timerStyles.restInfo}>
                {nextEx ? (
                  <>
                    <Text style={timerStyles.upNextLabel}>NEXT UP</Text>
                    <Text style={timerStyles.upNextName}>{nextEx.name}</Text>
                    {nextEx.sets && <Text style={timerStyles.upNextMeta}>{nextEx.sets} sets · {nextEx.reps || ''} reps</Text>}
                  </>
                ) : (
                  <Text style={timerStyles.upNextLabel}>More sets coming up</Text>
                )}
                <TouchableOpacity onPress={skipRest} style={[timerStyles.skipRestBtn, { borderColor: phaseColor }]}>
                  <Text style={[timerStyles.skipRestText, { color: phaseColor }]}>Skip Rest →</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Controls */}
            <View style={timerStyles.controls}>
              <TouchableOpacity
                style={[timerStyles.ctrlBtn, { opacity: exIndex === 0 ? 0.3 : 1 }]}
                onPress={prevExercise}
                disabled={exIndex === 0}
              >
                <Text style={timerStyles.ctrlIcon}>⏮</Text>
                <Text style={timerStyles.ctrlLabel}>Prev</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[timerStyles.playPauseBtn, { backgroundColor: phaseColor }]}
                onPress={() => setIsPaused(p => !p)}
              >
                <Text style={timerStyles.playPauseIcon}>{isPaused ? '▶' : '⏸'}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={timerStyles.ctrlBtn} onPress={skipExercise}>
                <Text style={timerStyles.ctrlIcon}>⏭</Text>
                <Text style={timerStyles.ctrlLabel}>Skip</Text>
              </TouchableOpacity>
            </View>

            {/* Bottom progress dots */}
            <View style={timerStyles.dots}>
              {exercises.map((_, i) => (
                <View key={i} style={[
                  timerStyles.dot,
                  {
                    backgroundColor: i < completedCount ? '#43D787'
                      : i === exIndex ? phaseColor
                      : 'rgba(255,255,255,0.15)',
                    width: i === exIndex ? 16 : 8,
                  },
                ]} />
              ))}
            </View>

            {/* Elapsed */}
            <Text style={timerStyles.elapsed}>Total time: {fmtElapsed(totalElapsed)}</Text>
          </>
        ) : (
          /* ── Complete screen ── */
          <View style={timerStyles.completeWrap}>
            <LottieView
              source={ANIMATIONS.complete}
              autoPlay
              loop={false}
              style={timerStyles.lottieComplete}
            />
            <Text style={timerStyles.completeTitle}>Workout Complete!</Text>
            <Text style={timerStyles.completeSub}>Amazing work, keep it up!</Text>

            <View style={timerStyles.summaryCard}>
              <SummaryRow icon="✅" label="Exercises done" value={`${completedCount} / ${exercises.length}`} />
              <SummaryRow icon="⏱️" label="Total time" value={fmtElapsed(totalElapsed)} />
            </View>

            <TouchableOpacity
              style={[timerStyles.doneBtn, { backgroundColor: PHASE_COLORS.complete }]}
              onPress={onClose}
            >
              <Text style={timerStyles.doneBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
};

const SummaryRow = ({ icon, label, value }) => (
  <View style={timerStyles.summaryRow}>
    <Text style={timerStyles.summaryIcon}>{icon}</Text>
    <Text style={timerStyles.summaryLabel}>{label}</Text>
    <Text style={timerStyles.summaryValue}>{value}</Text>
  </View>
);

const timerStyles = StyleSheet.create({
  container:     { flex: 1, alignItems: 'center', paddingTop: 56 },
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingHorizontal: 20, marginBottom: 8 },
  workoutName:   { fontSize: 15, fontWeight: '700', color: '#fff', flex: 1, marginRight: 12 },
  stopBtn:       { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)' },
  stopBtnText:   { color: '#FF6584', fontWeight: '700', fontSize: 13 },

  exInfo:        { alignItems: 'center', paddingHorizontal: 24, marginBottom: 10 },
  exCounter:     { fontSize: 13, fontWeight: '700', letterSpacing: 2, marginBottom: 8 },
  exName:        { fontSize: 26, fontWeight: '800', color: '#fff', textAlign: 'center', lineHeight: 32 },
  setCounter:    { fontSize: 14, fontWeight: '600', marginTop: 8 },

  circleWrap:    { alignItems: 'center', marginBottom: 12 },
  lottieAnim:    { width: 90, height: 90, marginBottom: 6 },
  circle:        { width: 200, height: 200, borderRadius: 100, borderWidth: 10, alignItems: 'center', justifyContent: 'center' },
  phaseLabel:    { fontSize: 12, fontWeight: '800', letterSpacing: 3, marginBottom: 4 },
  timerNum:      { fontSize: 68, fontWeight: '800', color: '#fff', letterSpacing: -2 },

  restInfo:      { alignItems: 'center', marginBottom: 28, paddingHorizontal: 32 },
  upNextLabel:   { fontSize: 11, fontWeight: '700', color: '#999', letterSpacing: 2, marginBottom: 6 },
  upNextName:    { fontSize: 20, fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: 4 },
  upNextMeta:    { fontSize: 13, color: '#aaa', marginBottom: 14 },
  skipRestBtn:   { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5 },
  skipRestText:  { fontWeight: '700', fontSize: 14 },

  controls:      { flexDirection: 'row', alignItems: 'center', gap: 32, marginBottom: 28 },
  ctrlBtn:       { alignItems: 'center', gap: 4 },
  ctrlIcon:      { fontSize: 28, color: '#fff' },
  ctrlLabel:     { fontSize: 11, color: '#666', fontWeight: '600' },
  playPauseBtn:  { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  playPauseIcon: { fontSize: 28, color: '#fff' },

  dots:          { flexDirection: 'row', gap: 6, marginBottom: 16, flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: 32 },
  dot:           { height: 8, borderRadius: 4 },
  elapsed:       { fontSize: 12, color: '#555', fontWeight: '500' },

  completeWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  lottieComplete:{ width: 200, height: 200, marginBottom: 8 },
  completeTitle: { fontSize: 32, fontWeight: '800', color: '#fff', marginBottom: 8 },
  completeSub:   { fontSize: 16, color: '#aaa', marginBottom: 32 },
  summaryCard:   { width: '100%', backgroundColor: '#1A1A1A', borderRadius: 18, padding: 20, marginBottom: 32, gap: 16 },
  summaryRow:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  summaryIcon:   { fontSize: 24 },
  summaryLabel:  { flex: 1, fontSize: 15, color: '#aaa' },
  summaryValue:  { fontSize: 18, fontWeight: '700', color: '#fff' },
  doneBtn:       { paddingHorizontal: 48, paddingVertical: 16, borderRadius: 30 },
  doneBtnText:   { color: '#fff', fontWeight: '800', fontSize: 17 },
});

// ─── WorkoutsScreen ───────────────────────────────────────────────────────────
const WorkoutsScreen = () => {
  const { theme } = useTheme();
  const C = theme.colors;

  const [workouts, setWorkouts]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [generating, setGenerating]     = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [expanded, setExpanded]         = useState(null);
  const [editTarget, setEditTarget]     = useState(null);
  const [saving, setSaving]             = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [timerWorkout, setTimerWorkout] = useState(null);
  const [showTimer, setShowTimer]       = useState(false);

  const [editForm, setEditForm] = useState({
    name: '', description: '', goal: 'muscle_gain', intensity: 'moderate',
    duration_weeks: '4', frequency: '4', equipment: [],
  });
  const [form, setForm] = useState({
    goal: 'muscle_gain', duration_weeks: '4', frequency: '4',
    intensity: 'moderate', equipment: ['dumbbells', 'barbell'], specific_requirements: '',
  });

  // Skeleton pulse
  const pulseAnim = useRef(new Animated.Value(0)).current;
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
    if (!editForm.name.trim()) { Alert.alert('Error', 'Name cannot be empty'); return; }
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
    const id = editTarget.id;
    const snap = { ...editForm };
    Alert.alert('Regenerate Workout', 'Replace exercises with new AI-generated content?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Regenerate', style: 'destructive', onPress: () => handleRegenerate(id, snap) },
    ]);
  };

  const handleDelete = (workout) => {
    Alert.alert('Delete Workout', `Delete "${workout.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await workoutAPI.deleteWorkout(workout.id); fetchWorkouts(); }
        catch (err) { Alert.alert('Error', err.message); }
      }},
    ]);
  };

  const startTimer = (workout) => {
    const exs = workout.exercises || [];
    if (exs.length === 0) {
      Alert.alert('No Exercises', 'This workout has no exercises. Generate or add exercises first.');
      return;
    }
    setTimerWorkout(workout);
    setShowTimer(true);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, padding: 16 }}>
        {[1, 2, 3].map((i) => (
          <Animated.View key={i} style={{
            height: 120, borderRadius: 14, backgroundColor: C.skeleton,
            marginBottom: 12, opacity: skeletonOpacity,
          }} />
        ))}
      </View>
    );
  }

  const ic = intensityStyle;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={[styles.title, { color: C.text }]}>My Workouts</Text>
          <TouchableOpacity style={[styles.generateBtn, { backgroundColor: C.primary }]} onPress={() => setShowGenerator(true)}>
            <Text style={styles.generateBtnText}>+ AI Generate</Text>
          </TouchableOpacity>
        </View>

        {workouts.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🏋️</Text>
            <Text style={[styles.emptyTitle, { color: C.text }]}>No workouts yet</Text>
            <Text style={[styles.emptyText, { color: C.textSub }]}>Use AI to generate a personalized workout plan</Text>
            <TouchableOpacity style={[styles.generateBtn, { backgroundColor: C.primary }]} onPress={() => setShowGenerator(true)}>
              <Text style={styles.generateBtnText}>Generate Workout</Text>
            </TouchableOpacity>
          </View>
        ) : (
          workouts.map((workout) => (
            <View key={workout.id} style={[styles.card, {
              backgroundColor: C.card, borderLeftColor: goalColor(workout.goal),
              borderLeftWidth: 4, shadowColor: C.shadow,
            }]}>
              <TouchableOpacity onPress={() => setExpanded(expanded === workout.id ? null : workout.id)}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, { color: C.text }]}>{workout.name}</Text>
                  <Text style={[styles.chevron, { color: C.primary }]}>{expanded === workout.id ? '▲' : '▼'}</Text>
                </View>

                <View style={styles.badgeRow}>
                  <View style={[styles.goalBadge, { backgroundColor: `${goalColor(workout.goal)}22` }]}>
                    <Text style={[styles.goalBadgeText, { color: goalColor(workout.goal) }]}>
                      {(workout.goal || '').replace(/_/g, ' ')}
                    </Text>
                  </View>
                  {workout.intensity && (
                    <View style={[styles.intensityBadge, { backgroundColor: ic(workout.intensity).bg }]}>
                      <Text style={[styles.intensityBadgeText, { color: ic(workout.intensity).text }]}>
                        {workout.intensity.replace(/_/g, ' ')}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.meta}>
                  <Text style={[styles.metaTag, { backgroundColor: C.primaryBg, color: C.primary }]}>📅 {workout.duration_weeks}w</Text>
                  <Text style={[styles.metaTag, { backgroundColor: C.primaryBg, color: C.primary }]}>🔁 {workout.frequency}x/wk</Text>
                  <Text style={[styles.metaTag, { backgroundColor: C.primaryBg, color: C.primary }]}>🏋️ {workout.exercises?.length || 0} exercises</Text>
                </View>

                {!workout.exercises?.length ? (
                  <Text style={[styles.regenHint, { color: C.warning }]}>⚠️ No exercises — tap Edit / Regenerate to fix</Text>
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
                        {!!ex.sets && <Text style={[styles.exerciseTag, { backgroundColor: C.primaryBg, color: C.primary }]}>{ex.sets} sets</Text>}
                        {!!ex.reps && <Text style={[styles.exerciseTag, { backgroundColor: C.primaryBg, color: C.primary }]}>{ex.reps} reps</Text>}
                        {!!ex.rest_seconds && <Text style={[styles.exerciseTag, { backgroundColor: C.primaryBg, color: C.primary }]}>{ex.rest_seconds}s rest</Text>}
                      </View>
                      {ex.notes && typeof ex.notes === 'string' && !ex.notes.trim().startsWith('{') && (
                        <Text style={[styles.exerciseNotes, { color: C.textSub }]}>{ex.notes}</Text>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {/* Action buttons */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.startBtn, { backgroundColor: C.success }]}
                  onPress={() => startTimer(workout)}
                >
                  <Text style={styles.startBtnText}>▶ Start</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.editBtn, { borderColor: C.primary }]} onPress={() => openEdit(workout)}>
                  <Text style={[styles.editBtnText, { color: C.primary }]}>✏️ Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.deleteBtn, { borderColor: C.danger }]} onPress={() => handleDelete(workout)}>
                  <Text style={[styles.deleteBtnText, { color: C.danger }]}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Timer Modal */}
      <WorkoutTimerModal
        key={timerWorkout?.id}
        visible={showTimer}
        workout={timerWorkout}
        onClose={() => { setShowTimer(false); setTimerWorkout(null); }}
      />

      {/* Edit & Regenerate Modal */}
      <Modal visible={!!editTarget} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView style={[styles.modal, { backgroundColor: C.surface }]} keyboardShouldPersistTaps="handled">
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: C.text }]}>Edit Workout</Text>
              <TouchableOpacity onPress={() => setEditTarget(null)}>
                <Text style={[styles.closeBtn, { color: C.textSub }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: C.text }]}>Name</Text>
            <TextInput style={[styles.input, { backgroundColor: C.inputBg, borderColor: C.inputBorder, color: C.text }]}
              value={editForm.name} onChangeText={(v) => setEditForm((p) => ({ ...p, name: v }))}
              placeholder="Workout name" placeholderTextColor={C.textMuted} />

            <Text style={[styles.label, { color: C.text }]}>Description (optional)</Text>
            <TextInput style={[styles.input, { height: 80, backgroundColor: C.inputBg, borderColor: C.inputBorder, color: C.text }]}
              multiline value={editForm.description} onChangeText={(v) => setEditForm((p) => ({ ...p, description: v }))}
              placeholder="Add a description..." placeholderTextColor={C.textMuted} />

            <TouchableOpacity style={[styles.saveBtn, { marginTop: 16, backgroundColor: C.primary }]}
              onPress={handleSaveEdit} disabled={saving || regenerating}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Name & Description</Text>}
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: C.divider }]} />
            <Text style={[styles.sectionTitle, { color: C.text }]}>🤖 Regenerate with New Settings</Text>

            <Text style={[styles.label, { color: C.text }]}>Goal</Text>
            <View style={styles.chips}>
              {GOALS.map((g) => (
                <TouchableOpacity key={g}
                  style={[styles.chip, { borderColor: C.border, backgroundColor: C.surfaceAlt },
                    editForm.goal === g && { backgroundColor: C.primary, borderColor: C.primary }]}
                  onPress={() => setEditForm((p) => ({ ...p, goal: g }))}>
                  <Text style={[styles.chipText, { color: C.textSub }, editForm.goal === g && styles.chipTextActive]}>
                    {g.replace(/_/g, ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: C.text }]}>Intensity</Text>
            <View style={styles.chips}>
              {INTENSITIES.map((i) => (
                <TouchableOpacity key={i}
                  style={[styles.chip, { borderColor: C.border, backgroundColor: C.surfaceAlt },
                    editForm.intensity === i && { backgroundColor: C.primary, borderColor: C.primary }]}
                  onPress={() => setEditForm((p) => ({ ...p, intensity: i }))}>
                  <Text style={[styles.chipText, { color: C.textSub }, editForm.intensity === i && styles.chipTextActive]}>
                    {i.replace(/_/g, ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: C.text }]}>Duration (weeks)</Text>
            <TextInput style={[styles.input, { backgroundColor: C.inputBg, borderColor: C.inputBorder, color: C.text }]}
              value={editForm.duration_weeks} keyboardType="numeric"
              onChangeText={(v) => setEditForm((p) => ({ ...p, duration_weeks: v }))} placeholderTextColor={C.textMuted} />

            <Text style={[styles.label, { color: C.text }]}>Sessions per Week</Text>
            <TextInput style={[styles.input, { backgroundColor: C.inputBg, borderColor: C.inputBorder, color: C.text }]}
              value={editForm.frequency} keyboardType="numeric"
              onChangeText={(v) => setEditForm((p) => ({ ...p, frequency: v }))} placeholderTextColor={C.textMuted} />

            <Text style={[styles.label, { color: C.text }]}>Equipment</Text>
            <View style={styles.chips}>
              {EQUIPMENT.map((e) => (
                <TouchableOpacity key={e}
                  style={[styles.chip, { borderColor: C.border, backgroundColor: C.surfaceAlt },
                    editForm.equipment.includes(e) && { backgroundColor: C.primary, borderColor: C.primary }]}
                  onPress={() => setEditForm((p) => ({
                    ...p, equipment: p.equipment.includes(e)
                      ? p.equipment.filter((x) => x !== e) : [...p.equipment, e],
                  }))}>
                  <Text style={[styles.chipText, { color: C.textSub }, editForm.equipment.includes(e) && styles.chipTextActive]}>
                    {e}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={[styles.regenBtn, { marginBottom: 40, backgroundColor: C.warning }]}
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
          <ScrollView style={[styles.modal, { backgroundColor: C.surface }]} keyboardShouldPersistTaps="handled">
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: C.text }]}>🤖 AI Workout Generator</Text>
              <TouchableOpacity onPress={() => setShowGenerator(false)}>
                <Text style={[styles.closeBtn, { color: C.textSub }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: C.text }]}>Goal</Text>
            <View style={styles.chips}>
              {GOALS.map((g) => (
                <TouchableOpacity key={g}
                  style={[styles.chip, { borderColor: C.border, backgroundColor: C.surfaceAlt },
                    form.goal === g && { backgroundColor: C.primary, borderColor: C.primary }]}
                  onPress={() => setForm((p) => ({ ...p, goal: g }))}>
                  <Text style={[styles.chipText, { color: C.textSub }, form.goal === g && styles.chipTextActive]}>
                    {g.replace(/_/g, ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: C.text }]}>Intensity</Text>
            <View style={styles.chips}>
              {INTENSITIES.map((i) => (
                <TouchableOpacity key={i}
                  style={[styles.chip, { borderColor: C.border, backgroundColor: C.surfaceAlt },
                    form.intensity === i && { backgroundColor: C.primary, borderColor: C.primary }]}
                  onPress={() => setForm((p) => ({ ...p, intensity: i }))}>
                  <Text style={[styles.chipText, { color: C.textSub }, form.intensity === i && styles.chipTextActive]}>
                    {i.replace(/_/g, ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: C.text }]}>Duration (weeks)</Text>
            <TextInput style={[styles.input, { backgroundColor: C.inputBg, borderColor: C.inputBorder, color: C.text }]}
              value={form.duration_weeks} keyboardType="numeric"
              onChangeText={(v) => setForm((p) => ({ ...p, duration_weeks: v }))} placeholderTextColor={C.textMuted} />

            <Text style={[styles.label, { color: C.text }]}>Sessions per Week</Text>
            <TextInput style={[styles.input, { backgroundColor: C.inputBg, borderColor: C.inputBorder, color: C.text }]}
              value={form.frequency} keyboardType="numeric"
              onChangeText={(v) => setForm((p) => ({ ...p, frequency: v }))} placeholderTextColor={C.textMuted} />

            <Text style={[styles.label, { color: C.text }]}>Equipment (select all you have)</Text>
            <View style={styles.chips}>
              {EQUIPMENT.map((e) => (
                <TouchableOpacity key={e}
                  style={[styles.chip, { borderColor: C.border, backgroundColor: C.surfaceAlt },
                    form.equipment.includes(e) && { backgroundColor: C.primary, borderColor: C.primary }]}
                  onPress={() => setForm((p) => ({
                    ...p, equipment: p.equipment.includes(e)
                      ? p.equipment.filter((x) => x !== e) : [...p.equipment, e],
                  }))}>
                  <Text style={[styles.chipText, { color: C.textSub }, form.equipment.includes(e) && styles.chipTextActive]}>
                    {e}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: C.text }]}>Specific Requirements (optional)</Text>
            <TextInput style={[styles.input, { height: 80, backgroundColor: C.inputBg, borderColor: C.inputBorder, color: C.text }]}
              multiline value={form.specific_requirements}
              onChangeText={(v) => setForm((p) => ({ ...p, specific_requirements: v }))}
              placeholder="Focus on lower body, avoid high impact..." placeholderTextColor={C.textMuted} />

            <TouchableOpacity style={[styles.generateBtn, { marginBottom: 40, backgroundColor: C.primary }]}
              onPress={handleGenerate} disabled={generating}>
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
  header:             { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  title:              { fontSize: 22, fontWeight: 'bold' },
  generateBtn:        { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  generateBtnText:    { color: '#fff', fontWeight: '600', fontSize: 14 },
  empty:              { alignItems: 'center', padding: 40, gap: 12 },
  emptyIcon:          { fontSize: 48 },
  emptyTitle:         { fontSize: 18, fontWeight: 'bold' },
  emptyText:          { fontSize: 14, textAlign: 'center' },
  card:               { margin: 12, borderRadius: 14, padding: 16, elevation: 2, shadowOpacity: 0.08, shadowRadius: 4 },
  cardHeader:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle:          { fontSize: 16, fontWeight: 'bold', flex: 1 },
  chevron:            { fontSize: 12 },
  badgeRow:           { flexDirection: 'row', gap: 6, marginBottom: 8 },
  goalBadge:          { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  goalBadgeText:      { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  intensityBadge:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  intensityBadgeText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  description:        { fontSize: 13, marginTop: 6, fontStyle: 'italic' },
  meta:               { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  metaTag:            { fontSize: 12, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  exercises:          { marginTop: 12, borderTopWidth: 1, paddingTop: 12 },
  exercisesTitle:     { fontWeight: 'bold', marginBottom: 8 },
  exercise:           { borderRadius: 8, padding: 10, marginBottom: 6 },
  exerciseName:       { fontWeight: '600', marginBottom: 4 },
  exerciseMeta:       { flexDirection: 'row', gap: 6 },
  exerciseTag:        { fontSize: 12, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  exerciseNotes:      { fontSize: 12, marginTop: 4, fontStyle: 'italic' },
  actions:            { flexDirection: 'row', gap: 8, marginTop: 12 },
  startBtn:           { flex: 2, alignItems: 'center', paddingVertical: 10, borderRadius: 8 },
  startBtnText:       { color: '#fff', fontWeight: '700', fontSize: 14 },
  editBtn:            { flex: 2, alignItems: 'center', paddingVertical: 10, borderWidth: 1, borderRadius: 8 },
  editBtnText:        { fontWeight: '600', fontSize: 13 },
  deleteBtn:          { flex: 1, alignItems: 'center', paddingVertical: 10, borderWidth: 1, borderRadius: 8 },
  deleteBtnText:      { fontWeight: '600', fontSize: 13 },
  modal:              { flex: 1, padding: 20 },
  modalHeader:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 10 },
  modalTitle:         { fontSize: 20, fontWeight: 'bold' },
  closeBtn:           { fontSize: 20 },
  saveBtn:            { paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  saveBtnText:        { color: '#fff', fontWeight: '600', fontSize: 14 },
  divider:            { height: 1, marginVertical: 20 },
  sectionTitle:       { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  regenHint:          { fontSize: 13, marginTop: 6, fontStyle: 'italic' },
  regenBtn:           { paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginTop: 20 },
  regenBtnText:       { color: '#fff', fontWeight: '600', fontSize: 14 },
  label:              { fontWeight: '600', marginBottom: 8, marginTop: 12 },
  chips:              { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip:               { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipText:           { fontSize: 13 },
  chipTextActive:     { color: '#fff', fontWeight: '600' },
  input:              { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 4 },
});

export default WorkoutsScreen;
