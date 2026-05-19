import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { nutritionAPI } from '../utils/api';

const GOALS = ['weight_loss', 'muscle_gain', 'maintenance', 'endurance', 'general_health'];
const DIET_TYPES = ['balanced', 'vegetarian', 'vegan', 'keto', 'paleo', 'mediterranean'];

const NutritionScreen = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '', description: '', goal: 'weight_loss', diet_type: 'balanced',
    daily_calories: '2000', meals_per_day: '3', duration_days: '28',
    preferred_foods: '', avoided_foods: '',
  });
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [form, setForm] = useState({
    goal: 'weight_loss', avoided_foods: '', preferred_foods: '',
    diet_type: 'balanced', daily_calories: '2000', meals_per_day: '3', duration_days: '28',
  });

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      const data = await nutritionAPI.getMealPlans({ limit: 10 });
      setPlans(data.plans || []);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const avoided = form.avoided_foods.split(',').map((r) => r.trim()).filter(Boolean);
      const preferred = form.preferred_foods.split(',').map((r) => r.trim()).filter(Boolean);
      await nutritionAPI.generateMealPlan({
        goal: form.goal,
        avoided_foods: avoided,
        preferred_foods: preferred,
        diet_type: form.diet_type,
        daily_calories: parseInt(form.daily_calories) || 2000,
        meals_per_day: parseInt(form.meals_per_day) || 3,
        duration_days: parseInt(form.duration_days) || 28,
      });
      setShowGenerator(false);
      fetchPlans();
    } catch (err) {
      Alert.alert('Generation Failed', err.message);
    } finally {
      setGenerating(false);
    }
  };

  const openEdit = (plan) => {
    setEditTarget(plan);
    setEditForm({
      name: plan.name,
      description: plan.description || '',
      goal: plan.goal || 'weight_loss',
      diet_type: plan.diet_type || 'balanced',
      daily_calories: String(plan.daily_calories || 2000),
      meals_per_day: String(plan.meals_per_day || 3),
      duration_days: String(plan.duration_days || 28),
      preferred_foods: '',
      avoided_foods: '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editForm.name.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }
    setSaving(true);
    try {
      await nutritionAPI.updateMealPlan(editTarget.id, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
      });
      setEditTarget(null);
      fetchPlans();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = async (planId, form) => {
    setRegenerating(true);
    try {
      await nutritionAPI.generateMealPlan({
        goal: form.goal,
        diet_type: form.diet_type,
        daily_calories: parseInt(form.daily_calories) || 2000,
        meals_per_day: parseInt(form.meals_per_day) || 3,
        duration_days: parseInt(form.duration_days) || 28,
        preferred_foods: form.preferred_foods.split(',').map((r) => r.trim()).filter(Boolean),
        avoided_foods: form.avoided_foods.split(',').map((r) => r.trim()).filter(Boolean),
      });
      await nutritionAPI.deleteMealPlan(planId);
      setEditTarget(null);
      fetchPlans();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setRegenerating(false);
    }
  };

  const confirmRegenerate = () => {
    const planId = editTarget.id;
    const snapshot = { ...editForm };
    Alert.alert(
      'Regenerate Meal Plan',
      'This will replace the current meals with new AI-generated content.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Regenerate', style: 'destructive', onPress: () => handleRegenerate(planId, snapshot) },
      ]
    );
  };

  const handleDelete = (plan) => {
    Alert.alert('Delete Plan', `Delete "${plan.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await nutritionAPI.deleteMealPlan(plan.id);
          fetchPlans();
        } catch (err) {
          Alert.alert('Error', err.message);
        }
      }},
    ]);
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#34C759" />;

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Meal Plans</Text>
          <TouchableOpacity style={styles.generateBtn} onPress={() => setShowGenerator(true)}>
            <Text style={styles.generateBtnText}>+ AI Generate</Text>
          </TouchableOpacity>
        </View>

        {plans.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🥗</Text>
            <Text style={styles.emptyTitle}>No meal plans yet</Text>
            <Text style={styles.emptyText}>Use AI to generate a personalized nutrition plan</Text>
            <TouchableOpacity style={styles.generateBtn} onPress={() => setShowGenerator(true)}>
              <Text style={styles.generateBtnText}>Generate Meal Plan</Text>
            </TouchableOpacity>
          </View>
        ) : (
          plans.map((plan) => (
            <View key={plan.id} style={styles.card}>
              <TouchableOpacity onPress={() => setExpanded(expanded === plan.id ? null : plan.id)}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{plan.name}</Text>
                  <Text style={styles.chevron}>{expanded === plan.id ? '▲' : '▼'}</Text>
                </View>
                <View style={styles.meta}>
                  <Text style={styles.metaTag}>🎯 {(plan.goal || '').replace(/_/g, ' ')}</Text>
                  {plan.daily_calories ? <Text style={styles.metaTag}>🔥 {plan.daily_calories} cal</Text> : null}
                  <Text style={styles.metaTag}>🍽️ {plan.meals_per_day || 3}x/day</Text>
                  <Text style={styles.metaTag}>📅 {plan.duration_days}d</Text>
                </View>
                {plan.description ? (
                  <Text style={styles.description}>{plan.description}</Text>
                ) : null}
                {(plan.protein_grams || plan.carbs_grams || plan.fats_grams) ? (
                  <View style={styles.macros}>
                    <Text style={styles.macro}>🥩 {Math.round(plan.protein_grams)}g protein</Text>
                    <Text style={styles.macro}>🍚 {Math.round(plan.carbs_grams)}g carbs</Text>
                    <Text style={styles.macro}>🥑 {Math.round(plan.fats_grams)}g fats</Text>
                  </View>
                ) : null}
              </TouchableOpacity>

              {expanded === plan.id && (
                <View style={styles.meals}>
                  <Text style={styles.mealsTitle}>Daily Meals</Text>
                  {(plan.meals || []).map((meal, i) => (
                    <View key={i} style={styles.meal}>
                      <View style={styles.mealHeader}>
                        <Text style={styles.mealName}>{meal.name}</Text>
                        {meal.calories ? (
                          <Text style={styles.mealCal}>{meal.calories} cal</Text>
                        ) : null}
                      </View>
                      {meal.time ? <Text style={styles.mealTime}>{meal.time}</Text> : null}
                      {(meal.foods || []).map((food, j) => (
                        typeof food === 'string'
                          ? <Text key={j} style={styles.foodItem}>• {food}</Text>
                          : food?.name ? <Text key={j} style={styles.foodItem}>• {food.name}</Text> : null
                      ))}
                      {meal.notes ? <Text style={styles.mealNotes}>{meal.notes}</Text> : null}
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.actions}>
                <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(plan)}>
                  <Text style={styles.editBtnText}>✏️ Edit / Regenerate</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(plan)}>
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
            <Text style={styles.modalTitle}>Edit Meal Plan</Text>
            <TouchableOpacity onPress={() => setEditTarget(null)}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Name</Text>
          <TextInput style={styles.input} value={editForm.name}
            onChangeText={(v) => setEditForm((p) => ({ ...p, name: v }))} placeholder="Plan name" />

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

          <Text style={styles.label}>Diet Type</Text>
          <View style={styles.chips}>
            {DIET_TYPES.map((d) => (
              <TouchableOpacity key={d} style={[styles.chip, editForm.diet_type === d && styles.chipActive]}
                onPress={() => setEditForm((p) => ({ ...p, diet_type: d }))}>
                <Text style={[styles.chipText, editForm.diet_type === d && styles.chipTextActive]}>
                  {d}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Daily Calories Target</Text>
          <TextInput style={styles.input} value={editForm.daily_calories} keyboardType="numeric"
            onChangeText={(v) => setEditForm((p) => ({ ...p, daily_calories: v }))} />

          <Text style={styles.label}>Meals per Day</Text>
          <TextInput style={styles.input} value={editForm.meals_per_day} keyboardType="numeric"
            onChangeText={(v) => setEditForm((p) => ({ ...p, meals_per_day: v }))} />

          <Text style={styles.label}>Duration (days)</Text>
          <TextInput style={styles.input} value={editForm.duration_days} keyboardType="numeric"
            onChangeText={(v) => setEditForm((p) => ({ ...p, duration_days: v }))} />

          <Text style={styles.label}>Preferred Foods (optional)</Text>
          <TextInput style={styles.input} value={editForm.preferred_foods}
            onChangeText={(v) => setEditForm((p) => ({ ...p, preferred_foods: v }))}
            placeholder="e.g. chicken, rice, eggs..."
            placeholderTextColor="#aaa" />

          <Text style={styles.label}>Foods to Avoid (optional)</Text>
          <TextInput style={styles.input} value={editForm.avoided_foods}
            onChangeText={(v) => setEditForm((p) => ({ ...p, avoided_foods: v }))}
            placeholder="e.g. peanuts, dairy, gluten..."
            placeholderTextColor="#aaa" />

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
            <Text style={styles.modalTitle}>🤖 AI Nutrition Generator</Text>
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

          <Text style={styles.label}>Diet Type</Text>
          <View style={styles.chips}>
            {DIET_TYPES.map((d) => (
              <TouchableOpacity key={d} style={[styles.chip, form.diet_type === d && styles.chipActive]}
                onPress={() => setForm((p) => ({ ...p, diet_type: d }))}>
                <Text style={[styles.chipText, form.diet_type === d && styles.chipTextActive]}>
                  {d}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Daily Calories Target</Text>
          <TextInput style={styles.input} value={form.daily_calories} keyboardType="numeric"
            onChangeText={(v) => setForm((p) => ({ ...p, daily_calories: v }))} />

          <Text style={styles.label}>Meals per Day</Text>
          <TextInput style={styles.input} value={form.meals_per_day} keyboardType="numeric"
            onChangeText={(v) => setForm((p) => ({ ...p, meals_per_day: v }))} />

          <Text style={styles.label}>Duration (days)</Text>
          <TextInput style={styles.input} value={form.duration_days} keyboardType="numeric"
            onChangeText={(v) => setForm((p) => ({ ...p, duration_days: v }))} />

          <Text style={styles.label}>Preferred Foods (optional)</Text>
          <TextInput style={styles.input} value={form.preferred_foods}
            onChangeText={(v) => setForm((p) => ({ ...p, preferred_foods: v }))}
            placeholder="e.g. chicken, rice, eggs..."
            placeholderTextColor="#aaa" />

          <Text style={styles.label}>Foods to Avoid (optional)</Text>
          <TextInput style={styles.input} value={form.avoided_foods}
            onChangeText={(v) => setForm((p) => ({ ...p, avoided_foods: v }))}
            placeholder="e.g. peanuts, dairy, gluten..."
            placeholderTextColor="#aaa" />

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
  generateBtn: { backgroundColor: '#34C759', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  generateBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  empty: { alignItems: 'center', padding: 40, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a2e' },
  emptyText: { fontSize: 14, color: '#666', textAlign: 'center' },
  card: { backgroundColor: '#fff', margin: 12, borderRadius: 12, padding: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a1a2e', flex: 1 },
  chevron: { color: '#34C759', fontSize: 12 },
  description: { fontSize: 13, color: '#666', marginTop: 6, fontStyle: 'italic' },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  metaTag: { backgroundColor: '#f0fff4', color: '#34C759', fontSize: 12, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  macros: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  macro: { fontSize: 12, color: '#555', backgroundColor: '#fff8e1', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  meals: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 12 },
  mealsTitle: { fontWeight: 'bold', color: '#1a1a2e', marginBottom: 8 },
  meal: { backgroundColor: '#f8f9fa', borderRadius: 8, padding: 10, marginBottom: 6 },
  mealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  mealName: { fontWeight: '600', color: '#1a1a2e' },
  mealCal: { fontSize: 12, color: '#34C759', fontWeight: '600' },
  mealTime: { fontSize: 12, color: '#999', marginBottom: 4 },
  foodItem: { fontSize: 13, color: '#444', marginTop: 2 },
  mealNotes: { fontSize: 12, color: '#666', marginTop: 4, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  editBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderWidth: 1, borderColor: '#34C759', borderRadius: 8 },
  editBtnText: { color: '#34C759', fontWeight: '600', fontSize: 13 },
  deleteBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderWidth: 1, borderColor: '#ff3b30', borderRadius: 8 },
  deleteBtnText: { color: '#ff3b30', fontWeight: '600', fontSize: 13 },
  modal: { flex: 1, padding: 20, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 10 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a1a2e' },
  closeBtn: { fontSize: 20, color: '#666' },
  saveBtn: { backgroundColor: '#34C759', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  divider: { height: 1, backgroundColor: '#e0e0e0', marginVertical: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 4 },
  regenBtn: { backgroundColor: '#FF9500', paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginTop: 20 },
  regenBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  label: { fontWeight: '600', color: '#1a1a2e', marginBottom: 8, marginTop: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#f8f9fa' },
  chipActive: { backgroundColor: '#34C759', borderColor: '#34C759' },
  chipText: { fontSize: 13, color: '#666' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 15, backgroundColor: '#fafafa', marginBottom: 4 },
});

export default NutritionScreen;
