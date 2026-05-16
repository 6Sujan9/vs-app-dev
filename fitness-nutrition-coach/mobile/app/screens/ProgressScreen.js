import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Modal, TextInput,
} from 'react-native';
import { progressAPI } from '../utils/api';

const EMPTY_FORM = {
  weight: '', body_fat_percentage: '', muscle_mass: '',
  chest: '', waist: '', hips: '', thighs: '', arms: '', notes: '',
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
  if (form.notes.trim()) p.notes = form.notes.trim();
  return p;
};

const logToForm = (log) => ({
  weight: log.weight != null ? String(log.weight) : '',
  body_fat_percentage: log.body_fat_percentage != null ? String(log.body_fat_percentage) : '',
  muscle_mass: log.muscle_mass != null ? String(log.muscle_mass) : '',
  chest: log.chest != null ? String(log.chest) : '',
  waist: log.waist != null ? String(log.waist) : '',
  hips: log.hips != null ? String(log.hips) : '',
  thighs: log.thighs != null ? String(log.thighs) : '',
  arms: log.arms != null ? String(log.arms) : '',
  notes: log.notes || '',
});

const ProgressScreen = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  // Edit state
  const [editLog, setEditLog] = useState(null); // the log being edited
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState(EMPTY_FORM);

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

  const handleLog = async () => {
    const hasAnyValue = Object.entries(form).some(
      ([key, val]) => key !== 'notes' && val !== ''
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
    const hasAnyValue = Object.entries(editForm).some(
      ([key, val]) => key !== 'notes' && val !== ''
    );
    if (!hasAnyValue) {
      Alert.alert('Required', 'Please enter at least one measurement.');
      return;
    }
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
    const dateLabel = formatDate(log.created_at);
    Alert.alert(
      'Delete Entry',
      `Delete the progress log from ${dateLabel}?`,
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
  const earliest = logs[logs.length - 1];
  const weightChange = latest?.weight && earliest?.weight && logs.length > 1
    ? (latest.weight - earliest.weight).toFixed(1)
    : null;

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#FF9500" />;

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Progress</Text>
          <TouchableOpacity style={styles.logBtn} onPress={() => setShowModal(true)}>
            <Text style={styles.logBtnText}>+ Log</Text>
          </TouchableOpacity>
        </View>

        {/* Summary cards */}
        {latest ? (
          <View style={styles.statsRow}>
            <StatCard label="Current Weight" value={latest.weight ? `${latest.weight} kg` : '—'} icon="⚖️" />
            <StatCard label="Body Fat" value={latest.body_fat_percentage ? `${latest.body_fat_percentage}%` : '—'} icon="📊" />
            <StatCard
              label="Weight Change"
              value={weightChange !== null ? `${weightChange > 0 ? '+' : ''}${weightChange} kg` : '—'}
              icon="📈"
              valueColor={weightChange < 0 ? '#34C759' : weightChange > 0 ? '#ff3b30' : '#999'}
            />
          </View>
        ) : null}

        {/* Measurements from latest */}
        {latest && (latest.chest || latest.waist || latest.arms) ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Latest Measurements</Text>
            <View style={styles.measureCard}>
              {latest.chest ? <MeasureRow label="Chest" value={latest.chest} /> : null}
              {latest.waist ? <MeasureRow label="Waist" value={latest.waist} /> : null}
              {latest.hips ? <MeasureRow label="Hips" value={latest.hips} /> : null}
              {latest.thighs ? <MeasureRow label="Thighs" value={latest.thighs} /> : null}
              {latest.arms ? <MeasureRow label="Arms" value={latest.arms} /> : null}
              {latest.muscle_mass ? <MeasureRow label="Muscle Mass" value={latest.muscle_mass} /> : null}
            </View>
          </View>
        ) : null}

        {/* History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>History ({logs.length} entries)</Text>

          {logs.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📊</Text>
              <Text style={styles.emptyTitle}>No progress logged yet</Text>
              <Text style={styles.emptyText}>Start tracking to see your journey</Text>
              <TouchableOpacity style={styles.logBtn} onPress={() => setShowModal(true)}>
                <Text style={styles.logBtnText}>Log Progress</Text>
              </TouchableOpacity>
            </View>
          ) : (
            logs.map((log) => (
              <View key={log.id} style={styles.logCard}>
                <View style={styles.logHeader}>
                  <Text style={styles.logDate}>{formatDate(log.created_at)}</Text>
                  {log.weight ? <Text style={styles.logWeight}>{log.weight} kg</Text> : null}
                </View>
                <View style={styles.logTags}>
                  {log.body_fat_percentage ? (
                    <Text style={styles.logTag}>🔥 {log.body_fat_percentage}% fat</Text>
                  ) : null}
                  {log.muscle_mass ? (
                    <Text style={styles.logTag}>💪 {log.muscle_mass} kg muscle</Text>
                  ) : null}
                  {log.chest ? <Text style={styles.logTag}>📏 chest {log.chest}cm</Text> : null}
                  {log.waist ? <Text style={styles.logTag}>📏 waist {log.waist}cm</Text> : null}
                  {log.arms ? <Text style={styles.logTag}>📏 arms {log.arms}cm</Text> : null}
                </View>
                {log.notes ? <Text style={styles.logNotes}>{log.notes}</Text> : null}

                {/* Edit / Delete actions */}
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(log)}>
                    <Text style={styles.editBtnText}>✏️ Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(log)}>
                    <Text style={styles.deleteBtnText}>🗑️ Delete</Text>
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
        <ScrollView style={styles.modal} keyboardShouldPersistTaps="handled">
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>📊 Log Progress</Text>
            <TouchableOpacity onPress={() => { setShowModal(false); setForm(EMPTY_FORM); }}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <ProgressForm form={form} setForm={setForm} />

          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.7 }]}
            onPress={handleLog} disabled={saving}>
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.saveBtnText}>Save Progress</Text>}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </Modal>

      {/* Edit Progress Modal */}
      <Modal visible={showEditModal} animationType="slide" presentationStyle="pageSheet">
        <ScrollView style={styles.modal} keyboardShouldPersistTaps="handled">
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>✏️ Edit Progress</Text>
            <TouchableOpacity onPress={() => { setShowEditModal(false); setEditLog(null); }}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <ProgressForm form={editForm} setForm={setEditForm} />

          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.7 }]}
            onPress={handleEdit} disabled={saving}>
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.saveBtnText}>Save Changes</Text>}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </Modal>
    </View>
  );
};

const ProgressForm = ({ form, setForm }) => {
  const set = (key) => (v) => setForm((p) => ({ ...p, [key]: v }));
  return (
    <>
      <Text style={styles.modalSectionLabel}>Body Composition</Text>
      <FormRow label="Weight (kg)" placeholder="e.g. 72.5" value={form.weight} onChangeText={set('weight')} />
      <FormRow label="Body Fat (%)" placeholder="e.g. 18" value={form.body_fat_percentage} onChangeText={set('body_fat_percentage')} />
      <FormRow label="Muscle Mass (kg)" placeholder="e.g. 55" value={form.muscle_mass} onChangeText={set('muscle_mass')} />

      <Text style={styles.modalSectionLabel}>Measurements (cm)</Text>
      <FormRow label="Chest" placeholder="e.g. 100" value={form.chest} onChangeText={set('chest')} />
      <FormRow label="Waist" placeholder="e.g. 80" value={form.waist} onChangeText={set('waist')} />
      <FormRow label="Hips" placeholder="e.g. 95" value={form.hips} onChangeText={set('hips')} />
      <FormRow label="Thighs" placeholder="e.g. 55" value={form.thighs} onChangeText={set('thighs')} />
      <FormRow label="Arms" placeholder="e.g. 35" value={form.arms} onChangeText={set('arms')} />

      <Text style={styles.label}>Notes (optional)</Text>
      <TextInput
        style={[styles.input, { height: 80 }]}
        multiline value={form.notes}
        placeholder="How are you feeling? Any observations..."
        placeholderTextColor="#aaa"
        onChangeText={set('notes')}
      />
    </>
  );
};

const StatCard = ({ label, value, icon, valueColor }) => (
  <View style={styles.statCard}>
    <Text style={styles.statIcon}>{icon}</Text>
    <Text style={[styles.statValue, valueColor ? { color: valueColor } : {}]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const MeasureRow = ({ label, value }) => (
  <View style={styles.measureRow}>
    <Text style={styles.measureLabel}>{label}</Text>
    <Text style={styles.measureValue}>{value} cm</Text>
  </View>
);

const FormRow = ({ label, placeholder, value, onChangeText }) => (
  <>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={styles.input}
      keyboardType="decimal-pad"
      placeholder={placeholder}
      placeholderTextColor="#aaa"
      value={value}
      onChangeText={onChangeText}
    />
  </>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1a1a2e' },
  logBtn: { backgroundColor: '#FF9500', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  logBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 12, gap: 8, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statValue: { fontSize: 15, fontWeight: '700', color: '#1a1a2e', marginBottom: 2, textAlign: 'center' },
  statLabel: { fontSize: 10, color: '#888', textAlign: 'center' },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 10 },
  measureCard: { backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  measureRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f4f4f4' },
  measureLabel: { fontSize: 14, color: '#666' },
  measureValue: { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  empty: { alignItems: 'center', padding: 40, gap: 10 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e' },
  emptyText: { fontSize: 14, color: '#666', textAlign: 'center' },
  logCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  logDate: { fontSize: 13, color: '#888', fontWeight: '500' },
  logWeight: { fontSize: 18, fontWeight: '700', color: '#FF9500' },
  logTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  logTag: { backgroundColor: '#fff8ee', color: '#FF9500', fontSize: 12, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  logNotes: { fontSize: 13, color: '#666', marginTop: 8, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12, borderTopWidth: 1, borderTopColor: '#f4f4f4', paddingTop: 10 },
  editBtn: { flex: 1, backgroundColor: '#f0f4ff', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  editBtnText: { color: '#007AFF', fontSize: 13, fontWeight: '600' },
  deleteBtn: { flex: 1, backgroundColor: '#fff0f0', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  deleteBtnText: { color: '#ff3b30', fontSize: 13, fontWeight: '600' },
  modal: { flex: 1, padding: 20, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, marginTop: 10 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a1a2e' },
  closeBtn: { fontSize: 20, color: '#666' },
  modalSectionLabel: { fontSize: 14, fontWeight: '700', color: '#888', marginTop: 20, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  label: { fontWeight: '600', color: '#1a1a2e', marginBottom: 6, marginTop: 12, fontSize: 14 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 15, backgroundColor: '#fafafa', color: '#1a1a2e', marginBottom: 2 },
  saveBtn: { backgroundColor: '#FF9500', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

export default ProgressScreen;
