import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Modal, TextInput, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { nutritionAPI } from '../utils/api';
import { useTheme } from '../context/ThemeContext';

const GOALS = ['weight_loss', 'muscle_gain', 'maintenance', 'endurance', 'general_health'];
const DIET_TYPES = ['balanced', 'vegetarian', 'vegan', 'keto', 'paleo', 'mediterranean'];

const MEAL_TYPE_COLORS = {
  breakfast: '#FFB347',
  lunch: '#43D787',
  dinner: '#7C73FF',
  snack: '#FF6584',
};
const getMealColor = (name) => {
  const lower = (name || '').toLowerCase();
  if (lower.includes('breakfast')) return MEAL_TYPE_COLORS.breakfast;
  if (lower.includes('lunch')) return MEAL_TYPE_COLORS.lunch;
  if (lower.includes('dinner')) return MEAL_TYPE_COLORS.dinner;
  if (lower.includes('snack')) return MEAL_TYPE_COLORS.snack;
  return '#6C63FF';
};

const CalorieRing = ({ consumed, target, C }) => {
  const pct = target > 0 ? Math.min(consumed / target, 1) : 0;
  return (
    <View style={{
      width: 80,
      height: 80,
      borderRadius: 40,
      borderWidth: 6,
      borderColor: C.primary,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.primaryBg,
    }}>
      <Text style={{ fontSize: 14, fontWeight: '700', color: C.text }}>{Math.round(pct * 100)}%</Text>
      <Text style={{ fontSize: 9, color: C.textMuted }}>calories</Text>
    </View>
  );
};

const AnimatedMacroBar = ({ label, grams, color, C }) => {
  const widthAnim = useRef(new Animated.Value(0)).current;
  const pct = Math.min((grams || 0) / 3, 100);

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: pct,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [grams]);

  if (!grams) return null;

  const animWidth = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{ fontSize: 12, color: C.textSub, fontWeight: '600' }}>{label}</Text>
        <Text style={{ fontSize: 12, color: C.textMuted }}>{Math.round(grams)}g</Text>
      </View>
      <View style={{ height: 7, backgroundColor: C.surfaceAlt, borderRadius: 4, overflow: 'hidden' }}>
        <Animated.View style={{ height: 7, width: animWidth, backgroundColor: color, borderRadius: 4 }} />
      </View>
    </View>
  );
};

const NutritionScreen = () => {
  const { theme } = useTheme();
  const C = theme.colors;

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

  const handleRegenerate = async (planId, regenForm) => {
    setRegenerating(true);
    try {
      await nutritionAPI.generateMealPlan({
        goal: regenForm.goal,
        diet_type: regenForm.diet_type,
        daily_calories: parseInt(regenForm.daily_calories) || 2000,
        meals_per_day: parseInt(regenForm.meals_per_day) || 3,
        duration_days: parseInt(regenForm.duration_days) || 28,
        preferred_foods: regenForm.preferred_foods.split(',').map((r) => r.trim()).filter(Boolean),
        avoided_foods: regenForm.avoided_foods.split(',').map((r) => r.trim()).filter(Boolean),
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
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await nutritionAPI.deleteMealPlan(plan.id);
            fetchPlans();
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

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={[styles.title, { color: C.text }]}>Meal Plans</Text>
          <TouchableOpacity
            style={[styles.generateBtn, { backgroundColor: C.success }]}
            onPress={() => setShowGenerator(true)}
          >
            <Text style={styles.generateBtnText}>+ AI Generate</Text>
          </TouchableOpacity>
        </View>

        {plans.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🥗</Text>
            <Text style={[styles.emptyTitle, { color: C.text }]}>No meal plans yet</Text>
            <Text style={[styles.emptyText, { color: C.textSub }]}>Use AI to generate a personalized nutrition plan</Text>
            <TouchableOpacity
              style={[styles.generateBtn, { backgroundColor: C.success }]}
              onPress={() => setShowGenerator(true)}
            >
              <Text style={styles.generateBtnText}>Generate Meal Plan</Text>
            </TouchableOpacity>
          </View>
        ) : (
          plans.map((plan) => (
            <View
              key={plan.id}
              style={[styles.card, { backgroundColor: C.card, shadowColor: C.shadow }]}
            >
              <TouchableOpacity onPress={() => setExpanded(expanded === plan.id ? null : plan.id)}>
                {/* Header row with calorie ring */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: C.text }]}>{plan.name}</Text>
                    <View style={styles.meta}>
                      <Text style={[styles.metaTag, { backgroundColor: C.successBg, color: C.success }]}>
                        🎯 {(plan.goal || '').replace(/_/g, ' ')}
                      </Text>
                      {plan.daily_calories ? (
                        <Text style={[styles.metaTag, { backgroundColor: C.successBg, color: C.success }]}>
                          🔥 {plan.daily_calories} cal
                        </Text>
                      ) : null}
                      <Text style={[styles.metaTag, { backgroundColor: C.successBg, color: C.success }]}>
                        🍽️ {plan.meals_per_day || 3}x/day
                      </Text>
                      <Text style={[styles.metaTag, { backgroundColor: C.successBg, color: C.success }]}>
                        📅 {plan.duration_days}d
                      </Text>
                    </View>
                  </View>
                  {plan.daily_calories ? (
                    <CalorieRing consumed={plan.daily_calories} target={plan.daily_calories} C={C} />
                  ) : null}
                </View>

                {plan.description ? (
                  <Text style={[styles.description, { color: C.textSub }]}>{plan.description}</Text>
                ) : null}

                {(plan.protein_grams || plan.carbs_grams || plan.fats_grams) ? (
                  <View style={[styles.macroSection, { borderTopColor: C.divider }]}>
                    <AnimatedMacroBar label="🥩 Protein" grams={plan.protein_grams} color="#FF6B6B" C={C} />
                    <AnimatedMacroBar label="🍚 Carbs" grams={plan.carbs_grams} color="#FFD93D" C={C} />
                    <AnimatedMacroBar label="🥑 Fats" grams={plan.fats_grams} color="#6BCB77" C={C} />
                  </View>
                ) : null}

                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 6 }}>
                  <Text style={[styles.chevron, { color: C.success }]}>{expanded === plan.id ? '▲' : '▼'}</Text>
                </View>
              </TouchableOpacity>

              {expanded === plan.id && (
                <View style={[styles.meals, { borderTopColor: C.divider }]}>
                  <Text style={[styles.mealsTitle, { color: C.text }]}>Daily Meals</Text>
                  {(plan.meals || []).map((meal, i) => {
                    const mealColor = getMealColor(meal.name);
                    return (
                      <View
                        key={i}
                        style={[
                          styles.meal,
                          {
                            backgroundColor: C.surfaceAlt,
                            borderLeftColor: mealColor,
                            borderLeftWidth: 3,
                          },
                        ]}
                      >
                        <View style={styles.mealHeader}>
                          <Text style={[styles.mealName, { color: C.text }]}>{meal.name}</Text>
                          {meal.calories ? (
                            <Text style={[styles.mealCal, { color: mealColor }]}>{meal.calories} cal</Text>
                          ) : null}
                        </View>
                        {meal.time ? <Text style={[styles.mealTime, { color: C.textMuted }]}>{meal.time}</Text> : null}
                        {(meal.foods || []).map((food, j) =>
                          typeof food === 'string'
                            ? <Text key={j} style={[styles.foodItem, { color: C.textSub }]}>• {food}</Text>
                            : food?.name ? <Text key={j} style={[styles.foodItem, { color: C.textSub }]}>• {food.name}</Text> : null
                        )}
                        {meal.notes ? <Text style={[styles.mealNotes, { color: C.textMuted }]}>{meal.notes}</Text> : null}
                      </View>
                    );
                  })}
                </View>
              )}

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.editBtn, { borderColor: C.success }]}
                  onPress={() => openEdit(plan)}
                >
                  <Text style={[styles.editBtnText, { color: C.success }]}>✏️ Edit / Regenerate</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.deleteBtn, { borderColor: C.danger }]}
                  onPress={() => handleDelete(plan)}
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
              <Text style={[styles.modalTitle, { color: C.text }]}>Edit Meal Plan</Text>
              <TouchableOpacity onPress={() => setEditTarget(null)}>
                <Text style={[styles.closeBtn, { color: C.textSub }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: C.text }]}>Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: C.inputBg, borderColor: C.inputBorder, color: C.text }]}
              value={editForm.name}
              onChangeText={(v) => setEditForm((p) => ({ ...p, name: v }))}
              placeholder="Plan name"
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
              style={[styles.saveBtn, { marginTop: 16, backgroundColor: C.success }]}
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
                    editForm.goal === g && { backgroundColor: C.success, borderColor: C.success },
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

            <Text style={[styles.label, { color: C.text }]}>Diet Type</Text>
            <View style={styles.chips}>
              {DIET_TYPES.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.chip,
                    { borderColor: C.border, backgroundColor: C.surfaceAlt },
                    editForm.diet_type === d && { backgroundColor: C.success, borderColor: C.success },
                  ]}
                  onPress={() => setEditForm((p) => ({ ...p, diet_type: d }))}
                >
                  <Text style={[
                    styles.chipText,
                    { color: C.textSub },
                    editForm.diet_type === d && styles.chipTextActive,
                  ]}>
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: C.text }]}>Daily Calories Target</Text>
            <TextInput
              style={[styles.input, { backgroundColor: C.inputBg, borderColor: C.inputBorder, color: C.text }]}
              value={editForm.daily_calories}
              keyboardType="numeric"
              onChangeText={(v) => setEditForm((p) => ({ ...p, daily_calories: v }))}
              placeholderTextColor={C.textMuted}
            />

            <Text style={[styles.label, { color: C.text }]}>Meals per Day</Text>
            <TextInput
              style={[styles.input, { backgroundColor: C.inputBg, borderColor: C.inputBorder, color: C.text }]}
              value={editForm.meals_per_day}
              keyboardType="numeric"
              onChangeText={(v) => setEditForm((p) => ({ ...p, meals_per_day: v }))}
              placeholderTextColor={C.textMuted}
            />

            <Text style={[styles.label, { color: C.text }]}>Duration (days)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: C.inputBg, borderColor: C.inputBorder, color: C.text }]}
              value={editForm.duration_days}
              keyboardType="numeric"
              onChangeText={(v) => setEditForm((p) => ({ ...p, duration_days: v }))}
              placeholderTextColor={C.textMuted}
            />

            <Text style={[styles.label, { color: C.text }]}>Preferred Foods (optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: C.inputBg, borderColor: C.inputBorder, color: C.text }]}
              value={editForm.preferred_foods}
              onChangeText={(v) => setEditForm((p) => ({ ...p, preferred_foods: v }))}
              placeholder="e.g. chicken, rice, eggs..."
              placeholderTextColor={C.textMuted}
            />

            <Text style={[styles.label, { color: C.text }]}>Foods to Avoid (optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: C.inputBg, borderColor: C.inputBorder, color: C.text }]}
              value={editForm.avoided_foods}
              onChangeText={(v) => setEditForm((p) => ({ ...p, avoided_foods: v }))}
              placeholder="e.g. peanuts, dairy, gluten..."
              placeholderTextColor={C.textMuted}
            />

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
              <Text style={[styles.modalTitle, { color: C.text }]}>🤖 AI Nutrition Generator</Text>
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
                    form.goal === g && { backgroundColor: C.success, borderColor: C.success },
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

            <Text style={[styles.label, { color: C.text }]}>Diet Type</Text>
            <View style={styles.chips}>
              {DIET_TYPES.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.chip,
                    { borderColor: C.border, backgroundColor: C.surfaceAlt },
                    form.diet_type === d && { backgroundColor: C.success, borderColor: C.success },
                  ]}
                  onPress={() => setForm((p) => ({ ...p, diet_type: d }))}
                >
                  <Text style={[
                    styles.chipText,
                    { color: C.textSub },
                    form.diet_type === d && styles.chipTextActive,
                  ]}>
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: C.text }]}>Daily Calories Target</Text>
            <TextInput
              style={[styles.input, { backgroundColor: C.inputBg, borderColor: C.inputBorder, color: C.text }]}
              value={form.daily_calories}
              keyboardType="numeric"
              onChangeText={(v) => setForm((p) => ({ ...p, daily_calories: v }))}
              placeholderTextColor={C.textMuted}
            />

            <Text style={[styles.label, { color: C.text }]}>Meals per Day</Text>
            <TextInput
              style={[styles.input, { backgroundColor: C.inputBg, borderColor: C.inputBorder, color: C.text }]}
              value={form.meals_per_day}
              keyboardType="numeric"
              onChangeText={(v) => setForm((p) => ({ ...p, meals_per_day: v }))}
              placeholderTextColor={C.textMuted}
            />

            <Text style={[styles.label, { color: C.text }]}>Duration (days)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: C.inputBg, borderColor: C.inputBorder, color: C.text }]}
              value={form.duration_days}
              keyboardType="numeric"
              onChangeText={(v) => setForm((p) => ({ ...p, duration_days: v }))}
              placeholderTextColor={C.textMuted}
            />

            <Text style={[styles.label, { color: C.text }]}>Preferred Foods (optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: C.inputBg, borderColor: C.inputBorder, color: C.text }]}
              value={form.preferred_foods}
              onChangeText={(v) => setForm((p) => ({ ...p, preferred_foods: v }))}
              placeholder="e.g. chicken, rice, eggs..."
              placeholderTextColor={C.textMuted}
            />

            <Text style={[styles.label, { color: C.text }]}>Foods to Avoid (optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: C.inputBg, borderColor: C.inputBorder, color: C.text }]}
              value={form.avoided_foods}
              onChangeText={(v) => setForm((p) => ({ ...p, avoided_foods: v }))}
              placeholder="e.g. peanuts, dairy, gluten..."
              placeholderTextColor={C.textMuted}
            />

            <TouchableOpacity
              style={[styles.generateBtn, { marginBottom: 40, backgroundColor: C.success }]}
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
  cardTitle: { fontSize: 16, fontWeight: 'bold', flex: 1, marginBottom: 6 },
  chevron: { fontSize: 12 },
  description: { fontSize: 13, marginTop: 6, fontStyle: 'italic' },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  metaTag: { fontSize: 12, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  macroSection: { marginTop: 10, paddingTop: 8, borderTopWidth: 1 },
  meals: { marginTop: 12, borderTopWidth: 1, paddingTop: 12 },
  mealsTitle: { fontWeight: 'bold', marginBottom: 8 },
  meal: { borderRadius: 8, padding: 10, marginBottom: 6 },
  mealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  mealName: { fontWeight: '600' },
  mealCal: { fontSize: 12, fontWeight: '600' },
  mealTime: { fontSize: 12, marginBottom: 4 },
  foodItem: { fontSize: 13, marginTop: 2 },
  mealNotes: { fontSize: 12, marginTop: 4, fontStyle: 'italic' },
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
  regenBtn: { paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginTop: 20 },
  regenBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  label: { fontWeight: '600', marginBottom: 8, marginTop: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13 },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 4 },
});

export default NutritionScreen;
