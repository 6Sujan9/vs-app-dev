import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Modal, TextInput, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { progressAPI } from '../utils/api';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const MOODS = [
  { label: 'Great', emoji: '💪' },
  { label: 'Good', emoji: '😊' },
  { label: 'Okay', emoji: '😐' },
  { label: 'Tired', emoji: '😴' },
];

const EMPTY_FORM = {
  weight: '', body_fat_percentage: '', muscle_mass: '',
  chest: '', waist: '', hips: '', thighs: '', arms: '',
  notes: '', mood: '',
};

const toPayload = (form) => {
  const p = {};
  if (form.weight) p.weight = parseFloat(form.weight);
  if (form.body_fat_percentage) p.body_fat_percentage = parseFloat(form.body_fat_percentage);
  if (form.muscle_mass) p.muscle_mass = parseFloat(form.muscle_mass);
  if (form.chest) p.chest = parseFloat(form.chest);
  if (form.waist) p.waist = parseFloat(form.waist);
  if (form.hips) p.hips = parseFloat(form.hips);
  if (form.thighs) p.thighs = parseFloat(form.thighs);
  if (form.arms) p.arms = parseFloat(form.arms);
  const moodObj = MOODS.find((m) => m.label === form.mood);
  const moodPrefix = moodObj ? `${moodObj.emoji} ${moodObj.label}` : '';
  const combined = [moodPrefix, form.notes.trim()].filter(Boolean).join(' — ');
  if (combined) p.notes = combined;
  return p;
};

const logToForm = (log) => {
  let mood = '';
  let notes = log.notes || '';
  for (const m of MOODS) {
    const prefix = `${m.emoji} ${m.label} — `;
    const prefixNoNote = `${m.emoji} ${m.label}`;
    if (notes.startsWith(prefix)) {
      mood = m.label;
      notes = notes.slice(prefix.length);
      break;
    } else if (notes === prefixNoNote) {
      mood = m.label;
      notes = '';
      break;
    }
  }
  return {
    weight: log.weight != null ? String(log.weight) : '',
    body_fat_percentage: log.body_fat_percentage != null ? String(log.body_fat_percentage) : '',
    muscle_mass: log.muscle_mass != null ? String(log.muscle_mass) : '',
    chest: log.chest != null ? String(log.chest) : '',
    waist: log.waist != null ? String(log.waist) : '',
    hips: log.hips != null ? String(log.hips) : '',
    thighs: log.thighs != null ? String(log.thighs) : '',
    arms: log.arms != null ? String(log.arms) : '',
    notes,
    mood,
  };
};

const getBMICategory = (bmi) => {
  if (bmi < 18.5) return { label: 'Underweight', color: '#5AC8FA' };
  if (bmi < 25) return { label: 'Normal', color: '#43D787' };
  if (bmi < 30) return { label: 'Overweight', color: '#FFB347' };
  return { label: 'Obese', color: '#FF6584' };
};

const WeightChart = ({ logs, C }) => {
  const [chartWidth, setChartWidth] = React.useState(0);
  const entries = [...logs].filter((l) => l.weight).slice(0, 10).reverse();
  if (entries.length < 2) return null;

  const CHART_H = 120;
  const PAD = 20;
  const weights = entries.map((e) => e.weight);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const range = maxW - minW || 1;

  const getX = (i) => PAD + (i / (entries.length - 1)) * (chartWidth - PAD * 2);
  const getY = (w) => PAD + ((maxW - w) / range) * (CHART_H - PAD * 2);
  const points = chartWidth > 0 ? entries.map((e, i) => ({ x: getX(i), y: getY(e.weight) })) : [];

  const fmt = (d) => {
    const dt = new Date(String(d).replace(' ', 'T'));
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <View style={{ marginBottom: 20 }}>
      <View
        style={{ height: CHART_H, position: 'relative', backgroundColor: C.warningBg, borderRadius: 12, overflow: 'hidden' }}
        onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}
      >
        {points.flatMap((pt, i) => {
          const els = [];
          if (i < points.length - 1) {
            const next = points[i + 1];
            const dx = next.x - pt.x;
            const dy = next.y - pt.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            els.push(
              <View key={`line-${i}`} style={{
                position: 'absolute',
                left: (pt.x + next.x) / 2 - len / 2,
                top: (pt.y + next.y) / 2 - 1,
                width: len,
                height: 2,
                backgroundColor: C.warning,
                opacity: 0.6,
                transform: [{ rotate: `${angle}deg` }],
              }} />
            );
          }
          els.push(
            <View key={`dot-${i}`} style={{
              position: 'absolute',
              left: pt.x - 5,
              top: pt.y - 5,
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: C.warning,
              zIndex: 2,
            }} />,
            <Text key={`val-${i}`} style={{
              position: 'absolute',
              left: pt.x - 16,
              top: pt.y - 18,
              fontSize: 9,
              color: C.warning,
              fontWeight: '700',
              width: 32,
              textAlign: 'center',
            }}>{entries[i].weight}</Text>
          );
          return els;
        })}
      </View>
      {entries.length > 0 && chartWidth > 0 && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, paddingHorizontal: 4 }}>
          <Text style={{ fontSize: 10, color: C.textMuted }}>{fmt(entries[0].created_at)}</Text>
          <Text style={{ fontSize: 10, color: C.textMuted }}>{fmt(entries[entries.length - 1].created_at)}</Text>
        </View>
      )}
    </View>
  );
};

const AchievementBadges = ({ logs, C }) => {
  const badges = [];
  if (logs.length >= 1) badges.push({ label: 'First Log', icon: '🌟', color: C.warning });
  if (logs.length >= 5) badges.push({ label: '5 Entries', icon: '📊', color: C.primary });
  if (logs.length >= 10) badges.push({ label: '10 Entries', icon: '🏆', color: '#FFD700' });
  if (logs.length >= 20) badges.push({ label: '20 Entries', icon: '💎', color: C.secondary });

  // Check streak
  const days = new Set(
    logs.map((l) => {
      const iso = (l.created_at || '').replace(' ', 'T');
      return new Date(iso).toLocaleDateString('en-CA');
    })
  );
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (days.has(d.toLocaleDateString('en-CA'))) streak++;
    else break;
  }
  if (streak >= 7) badges.push({ label: '7-Day Streak', icon: '🔥', color: '#FF6584' });

  if (badges.length === 0) return null;

  return (
    <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
      <Text style={[styles.sectionTitle, { color: C.text, marginBottom: 10 }]}>Achievements</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {badges.map((b, i) => (
          <View
            key={i}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
              backgroundColor: `${b.color}22`,
              borderWidth: 1,
              borderColor: b.color,
            }}
          >
            <Text style={{ fontSize: 14 }}>{b.icon}</Text>
            <Text style={{ fontSize: 12, fontWeight: '700', color: b.color }}>{b.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const ProgressScreen = () => {
  const { theme } = useTheme();
  const C = theme.colors;
  const { user } = useAuth();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [logMode, setLogMode] = useState('quick');

  const [editLog, setEditLog] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState(EMPTY_FORM);

  // Animated stat counters
  const weightAnim = useRef(new Animated.Value(0)).current;
  const fatAnim = useRef(new Animated.Value(0)).current;
  const [displayWeight, setDisplayWeight] = useState(0);
  const [displayFat, setDisplayFat] = useState(0);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await progressAPI.getProgress({ limit: 20 });
      setLogs(data.logs || []);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // Animate counters when logs load
  useEffect(() => {
    if (!loading && logs.length > 0) {
      const latest = logs[0];
      if (latest.weight) {
        Animated.timing(weightAnim, { toValue: latest.weight, duration: 900, useNativeDriver: false }).start();
        weightAnim.addListener(({ value }) => setDisplayWeight(Math.round(value * 10) / 10));
      }
      if (latest.body_fat_percentage) {
        Animated.timing(fatAnim, { toValue: latest.body_fat_percentage, duration: 900, useNativeDriver: false }).start();
        fatAnim.addListener(({ value }) => setDisplayFat(Math.round(value * 10) / 10));
      }
    }
    return () => {
      weightAnim.removeAllListeners();
      fatAnim.removeAllListeners();
    };
  }, [loading, logs]);

  const handleLog = async () => {
    if (!form.weight && logMode === 'quick') {
      Alert.alert('Required', 'Please enter your weight.');
      return;
    }
    const hasAnyValue = Object.entries(form).some(
      ([key, val]) => !['notes', 'mood'].includes(key) && val !== ''
    );
    if (!hasAnyValue) {
      Alert.alert('Required', 'Please enter at least one measurement.');
      return;
    }
    setSaving(true);
    try {
      await progressAPI.logProgress(toPayload(form));
      setShowModal(false);
      setForm(EMPTY_FORM);
      fetchLogs();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (log) => {
    setEditLog(log);
    setEditForm(logToForm(log));
    setShowEditModal(true);
  };

  const handleEdit = async () => {
    setSaving(true);
    try {
      await progressAPI.updateProgress(editLog.id, toPayload(editForm));
      setShowEditModal(false);
      setEditLog(null);
      fetchLogs();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (log) => {
    Alert.alert(
      'Delete Entry',
      `Delete the progress log from ${formatDate(log.created_at)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await progressAPI.deleteProgress(log.id);
              fetchLogs();
            } catch (err) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  };

  const latest = logs[0];
  const previous = logs[1];
  const weightChange = latest?.weight && previous?.weight
    ? (latest.weight - previous.weight).toFixed(1) : null;

  const formatDate = (dateStr) => {
    const d = new Date(dateStr.replace(' ', 'T'));
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // BMI calculation
  const userHeight = user?.profile?.height || null;
  let bmiValue = null;
  let bmiCat = null;
  if (latest?.weight && userHeight) {
    const heightM = userHeight / 100;
    bmiValue = (latest.weight / (heightM * heightM)).toFixed(1);
    bmiCat = getBMICategory(parseFloat(bmiValue));
  }

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color={C.warning} />;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={[styles.title, { color: C.text }]}>Progress</Text>
          <TouchableOpacity
            style={[styles.logBtn, { backgroundColor: C.warning }]}
            onPress={() => setShowModal(true)}
          >
            <Text style={styles.logBtnText}>+ Log</Text>
          </TouchableOpacity>
        </View>

        {latest ? (
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: C.card, shadowColor: C.shadow }]}>
              <Text style={styles.statIcon}>⚖️</Text>
              <Text style={[styles.statValue, { color: C.text }]}>
                {latest.weight ? `${displayWeight || latest.weight} kg` : '—'}
              </Text>
              <Text style={[styles.statLabel, { color: C.textMuted }]}>Current Weight</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: C.card, shadowColor: C.shadow }]}>
              <Text style={styles.statIcon}>📊</Text>
              <Text style={[styles.statValue, { color: C.text }]}>
                {latest.body_fat_percentage ? `${displayFat || latest.body_fat_percentage}%` : '—'}
              </Text>
              <Text style={[styles.statLabel, { color: C.textMuted }]}>Body Fat</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: C.card, shadowColor: C.shadow }]}>
              <Text style={styles.statIcon}>📈</Text>
              <Text style={[
                styles.statValue,
                {
                  color: weightChange !== null
                    ? (weightChange < 0 ? C.success : weightChange > 0 ? C.danger : C.textMuted)
                    : C.textMuted,
                },
              ]}>
                {weightChange !== null ? `${weightChange > 0 ? '+' : ''}${weightChange} kg` : '—'}
              </Text>
              <Text style={[styles.statLabel, { color: C.textMuted }]}>Since Last Log</Text>
            </View>
          </View>
        ) : null}

        {/* BMI Card */}
        {bmiValue ? (
          <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
            <Text style={[styles.sectionTitle, { color: C.text, marginBottom: 10 }]}>BMI Calculator</Text>
            <View style={[styles.bmiCard, { backgroundColor: C.card, shadowColor: C.shadow }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.bmiValue, { color: bmiCat.color }]}>{bmiValue}</Text>
                <Text style={[styles.bmiLabel, { color: C.text }]}>BMI</Text>
              </View>
              <View style={[styles.bmiCategory, { backgroundColor: `${bmiCat.color}22` }]}>
                <Text style={[styles.bmiCategoryText, { color: bmiCat.color }]}>{bmiCat.label}</Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Achievement Badges */}
        {logs.length > 0 ? <AchievementBadges logs={logs} C={C} /> : null}

        {logs.filter((l) => l.weight).length >= 2 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: C.text }]}>Weight History</Text>
            <WeightChart logs={logs} C={C} />
          </View>
        ) : null}

        {latest && (latest.chest || latest.waist || latest.arms) ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: C.text }]}>Latest Measurements</Text>
            <View style={[styles.measureCard, { backgroundColor: C.card, shadowColor: C.shadow }]}>
              {latest.chest ? <MeasureRow label="Chest" value={latest.chest} C={C} /> : null}
              {latest.waist ? <MeasureRow label="Waist" value={latest.waist} C={C} /> : null}
              {latest.hips ? <MeasureRow label="Hips" value={latest.hips} C={C} /> : null}
              {latest.thighs ? <MeasureRow label="Thighs" value={latest.thighs} C={C} /> : null}
              {latest.arms ? <MeasureRow label="Arms" value={latest.arms} C={C} /> : null}
              {latest.muscle_mass ? <MeasureRow label="Muscle Mass" value={latest.muscle_mass} C={C} /> : null}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>History ({logs.length} entries)</Text>
          {logs.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📊</Text>
              <Text style={[styles.emptyTitle, { color: C.text }]}>No progress logged yet</Text>
              <Text style={[styles.emptyText, { color: C.textSub }]}>Start tracking to see your journey</Text>
              <TouchableOpacity
                style={[styles.logBtn, { backgroundColor: C.warning }]}
                onPress={() => setShowModal(true)}
              >
                <Text style={styles.logBtnText}>Log Progress</Text>
              </TouchableOpacity>
            </View>
          ) : (
            logs.map((log) => (
              <View
                key={log.id}
                style={[styles.logCard, { backgroundColor: C.card, shadowColor: C.shadow }]}
              >
                <View style={styles.logHeader}>
                  <Text style={[styles.logDate, { color: C.textSub }]}>{formatDate(log.created_at)}</Text>
                  {log.weight ? (
                    <Text style={[styles.logWeight, { color: C.warning }]}>{log.weight} kg</Text>
                  ) : null}
                </View>
                <View style={styles.logTags}>
                  {log.body_fat_percentage ? (
                    <Text style={[styles.logTag, { backgroundColor: C.warningBg, color: C.warning }]}>
                      🔥 {log.body_fat_percentage}% fat
                    </Text>
                  ) : null}
                  {log.muscle_mass ? (
                    <Text style={[styles.logTag, { backgroundColor: C.warningBg, color: C.warning }]}>
                      💪 {log.muscle_mass} kg muscle
                    </Text>
                  ) : null}
                  {log.chest ? (
                    <Text style={[styles.logTag, { backgroundColor: C.warningBg, color: C.warning }]}>
                      📏 chest {log.chest}cm
                    </Text>
                  ) : null}
                  {log.waist ? (
                    <Text style={[styles.logTag, { backgroundColor: C.warningBg, color: C.warning }]}>
                      📏 waist {log.waist}cm
                    </Text>
                  ) : null}
                  {log.arms ? (
                    <Text style={[styles.logTag, { backgroundColor: C.warningBg, color: C.warning }]}>
                      📏 arms {log.arms}cm
                    </Text>
                  ) : null}
                </View>
                {log.notes ? <Text style={[styles.logNotes, { color: C.textSub }]}>{log.notes}</Text> : null}
                <View style={[styles.actions, { borderTopColor: C.divider }]}>
                  <TouchableOpacity
                    style={[styles.editBtn, { backgroundColor: C.primaryBg }]}
                    onPress={() => openEdit(log)}
                  >
                    <Text style={[styles.editBtnText, { color: C.primary }]}>✏️ Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.deleteBtn, { backgroundColor: C.dangerBg }]}
                    onPress={() => handleDelete(log)}
                  >
                    <Text style={[styles.deleteBtnText, { color: C.danger }]}>🗑️ Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Log Progress Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView
            style={[styles.modal, { backgroundColor: C.surface }]}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: C.text }]}>📊 Log Progress</Text>
              <TouchableOpacity onPress={() => { setShowModal(false); setForm(EMPTY_FORM); }}>
                <Text style={[styles.closeBtn, { color: C.textSub }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.toggle, { backgroundColor: C.surfaceAlt }]}>
              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  logMode === 'quick' && [styles.toggleBtnActive, { backgroundColor: C.surface, shadowColor: C.shadow }],
                ]}
                onPress={() => setLogMode('quick')}
              >
                <Text style={[
                  styles.toggleBtnText,
                  { color: C.textMuted },
                  logMode === 'quick' && { color: C.warning },
                ]}>⚡ Quick</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  logMode === 'full' && [styles.toggleBtnActive, { backgroundColor: C.surface, shadowColor: C.shadow }],
                ]}
                onPress={() => setLogMode('full')}
              >
                <Text style={[
                  styles.toggleBtnText,
                  { color: C.textMuted },
                  logMode === 'full' && { color: C.warning },
                ]}>📋 Full</Text>
              </TouchableOpacity>
            </View>

            <ProgressForm form={form} setForm={setForm} mode={logMode} latest={latest} C={C} />

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: C.warning }, saving && { opacity: 0.7 }]}
              onPress={handleLog}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Progress</Text>}
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Progress Modal */}
      <Modal visible={showEditModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView
            style={[styles.modal, { backgroundColor: C.surface }]}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: C.text }]}>✏️ Edit Progress</Text>
              <TouchableOpacity onPress={() => { setShowEditModal(false); setEditLog(null); }}>
                <Text style={[styles.closeBtn, { color: C.textSub }]}>✕</Text>
              </TouchableOpacity>
            </View>
            <ProgressForm form={editForm} setForm={setEditForm} mode="full" C={C} />
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: C.warning }, saving && { opacity: 0.7 }]}
              onPress={handleEdit}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const ProgressForm = ({ form, setForm, mode, latest, C }) => {
  const set = (key) => (v) => setForm((p) => ({ ...p, [key]: v }));

  const hint = (field) => {
    if (!latest || latest[field] == null) return '';
    return `Last: ${latest[field]}`;
  };

  return (
    <>
      <Text style={[styles.sectionLabel, { color: C.textMuted }]}>How are you feeling?</Text>
      <View style={styles.moodRow}>
        {MOODS.map((m) => (
          <TouchableOpacity
            key={m.label}
            style={[
              styles.moodChip,
              { borderColor: C.border, backgroundColor: C.surfaceAlt },
              form.mood === m.label && { borderColor: C.warning, backgroundColor: C.warningBg },
            ]}
            onPress={() => setForm((p) => ({ ...p, mood: p.mood === m.label ? '' : m.label }))}
          >
            <Text style={styles.moodEmoji}>{m.emoji}</Text>
            <Text style={[
              styles.moodLabel,
              { color: C.textMuted },
              form.mood === m.label && { color: C.warning },
            ]}>{m.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.sectionLabel, { color: C.textMuted }]}>Weight</Text>
      <FormRow
        label="Weight (kg)" placeholder="e.g. 72.5" hint={hint('weight')}
        value={form.weight} onChangeText={set('weight')} C={C}
      />

      {mode === 'full' && (
        <>
          <Text style={[styles.sectionLabel, { color: C.textMuted }]}>Body Composition</Text>
          <FormRow label="Body Fat (%)" placeholder="e.g. 18" hint={hint('body_fat_percentage')}
            value={form.body_fat_percentage} onChangeText={set('body_fat_percentage')} C={C} />
          <FormRow label="Muscle Mass (kg)" placeholder="e.g. 55" hint={hint('muscle_mass')}
            value={form.muscle_mass} onChangeText={set('muscle_mass')} C={C} />

          <Text style={[styles.sectionLabel, { color: C.textMuted }]}>Measurements (cm)</Text>
          <FormRow label="Chest" placeholder="e.g. 100" hint={hint('chest')}
            value={form.chest} onChangeText={set('chest')} C={C} />
          <FormRow label="Waist" placeholder="e.g. 80" hint={hint('waist')}
            value={form.waist} onChangeText={set('waist')} C={C} />
          <FormRow label="Hips" placeholder="e.g. 95" hint={hint('hips')}
            value={form.hips} onChangeText={set('hips')} C={C} />
          <FormRow label="Thighs" placeholder="e.g. 55" hint={hint('thighs')}
            value={form.thighs} onChangeText={set('thighs')} C={C} />
          <FormRow label="Arms" placeholder="e.g. 35" hint={hint('arms')}
            value={form.arms} onChangeText={set('arms')} C={C} />
        </>
      )}

      <Text style={[styles.label, { marginTop: 16, color: C.text }]}>Notes (optional)</Text>
      <TextInput
        style={[styles.input, { height: 70, backgroundColor: C.inputBg, borderColor: C.inputBorder, color: C.text }]}
        multiline
        value={form.notes}
        placeholder="Any observations..."
        placeholderTextColor={C.textMuted}
        onChangeText={set('notes')}
      />
    </>
  );
};

const MeasureRow = ({ label, value, C }) => (
  <View style={[styles.measureRow, { borderBottomColor: C.divider }]}>
    <Text style={[styles.measureLabel, { color: C.textSub }]}>{label}</Text>
    <Text style={[styles.measureValue, { color: C.text }]}>{value} cm</Text>
  </View>
);

const FormRow = ({ label, placeholder, hint, value, onChangeText, C }) => (
  <View style={styles.formRow}>
    <View style={styles.formRowHeader}>
      <Text style={[styles.label, { color: C.text }]}>{label}</Text>
      {hint ? <Text style={[styles.hint, { color: C.textMuted }]}>{hint}</Text> : null}
    </View>
    <TextInput
      style={[styles.input, { backgroundColor: C.inputBg, borderColor: C.inputBorder, color: C.text }]}
      keyboardType="decimal-pad"
      placeholder={placeholder}
      placeholderTextColor={C.textMuted}
      value={value}
      onChangeText={onChangeText}
    />
  </View>
);

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold' },
  logBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  logBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 12, gap: 8, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statValue: { fontSize: 15, fontWeight: '700', marginBottom: 2, textAlign: 'center' },
  statLabel: { fontSize: 10, textAlign: 'center' },
  bmiCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 16, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  bmiValue: { fontSize: 32, fontWeight: '800' },
  bmiLabel: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  bmiCategory: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  bmiCategoryText: { fontSize: 14, fontWeight: '700' },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  measureCard: { borderRadius: 14, paddingHorizontal: 16, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  measureRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1 },
  measureLabel: { fontSize: 14 },
  measureValue: { fontSize: 14, fontWeight: '600' },
  empty: { alignItems: 'center', padding: 40, gap: 10 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold' },
  emptyText: { fontSize: 14, textAlign: 'center' },
  logCard: { borderRadius: 12, padding: 14, marginBottom: 10, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  logDate: { fontSize: 13, fontWeight: '500' },
  logWeight: { fontSize: 18, fontWeight: '700' },
  logTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  logTag: { fontSize: 12, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  logNotes: { fontSize: 13, marginTop: 8, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12, borderTopWidth: 1, paddingTop: 10 },
  editBtn: { flex: 1, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  editBtnText: { fontSize: 13, fontWeight: '600' },
  deleteBtn: { flex: 1, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  deleteBtnText: { fontSize: 13, fontWeight: '600' },
  modal: { flex: 1, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 10 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  closeBtn: { fontSize: 20 },
  toggle: { flexDirection: 'row', borderRadius: 12, padding: 4, marginBottom: 20 },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  toggleBtnActive: { shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  toggleBtnText: { fontSize: 14, fontWeight: '600' },
  sectionLabel: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 20, marginBottom: 10 },
  moodRow: { flexDirection: 'row', gap: 8 },
  moodChip: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, borderWidth: 1.5 },
  moodEmoji: { fontSize: 22, marginBottom: 2 },
  moodLabel: { fontSize: 11, fontWeight: '600' },
  formRow: { marginBottom: 2 },
  formRowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 6 },
  label: { fontWeight: '600', fontSize: 14 },
  hint: { fontSize: 12 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15 },
  saveBtn: { borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

export default ProgressScreen;
