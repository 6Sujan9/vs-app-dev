import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Modal, TextInput,
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
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    goal: 'weight_loss',
    avoided_foods: '',
    diet_type: 'balanced',
    daily_calories: '2000',
    meals_per_day: '3',
    duration_days: '28',
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
      await nutritionAPI.generateMealPlan({
        goal: form.goal,
        avoided_foods: avoided,
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
    setEditName(plan.name);
    setEditDesc(plan.description || '');
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }
    setSaving(true);
    try {
      await nutritionAPI.updateMealPlan(editTarget.id, {
        name: editName.trim(),
        description: editDesc.trim(),
      });
      setEditTarget(null);
      fetchPlans();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
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
                        <Text key={j} style={styles.foodItem}>• {food}</Text>
                      ))}
                      {meal.notes ? <Text style={styles.mealNotes}>{meal.notes}</Text> : null}
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.actions}>
                <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(plan)}>
                  <Text style={styles.editBtnText}>✏️ Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(plan)}>
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
            <Text style={styles.modalTitle}>Edit Meal Plan</Text>
            <TouchableOpacity onPress={() => setEditTarget(null)}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.label}>Name</Text>
          <TextInput style={styles.input} value={editName}
            onChangeText={setEditName} placeholder="Plan name" />
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

          <Text style={styles.label}>Foods to Avoid (comma separated)</Text>
          <TextInput style={styles.input} value={form.avoided_foods}
            onChangeText={(v) => setForm((p) => ({ ...p, avoided_foods: v }))}
            placeholder="peanuts, dairy, gluten..." />

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
  generateBtn: { backgroundColor: '#34C759', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, flexDirection: 'row', alignItems: 'center' },
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
  label: { fontWeight: '600', color: '#1a1a2e', marginBottom: 8, marginTop: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#f8f9fa' },
  chipActive: { backgroundColor: '#34C759', borderColor: '#34C759' },
  chipText: { fontSize: 13, color: '#666' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 15, backgroundColor: '#fafafa', marginBottom: 4 },
});

export default NutritionScreen;
