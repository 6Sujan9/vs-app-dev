import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';

const NutritionScreen = () => {
  const meals = [
    { id: 1, name: 'Breakfast', time: '7:00 AM', calories: 450 },
    { id: 2, name: 'Snack', time: '10:00 AM', calories: 200 },
    { id: 3, name: 'Lunch', time: '1:00 PM', calories: 650 },
    { id: 4, name: 'Snack', time: '4:00 PM', calories: 250 },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Today's Meals</Text>
        <Text style={styles.calorieInfo}>Daily Goal: 2100 cal</Text>
      </View>

      <View style={styles.progressCard}>
        <Text style={styles.progressTitle}>Calorie Progress</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '65%' }]} />
        </View>
        <Text style={styles.progressText}>1365 / 2100 calories</Text>
      </View>

      {meals.map((meal) => (
        <View key={meal.id} style={styles.mealCard}>
          <View style={styles.mealHeader}>
            <View>
              <Text style={styles.mealName}>{meal.name}</Text>
              <Text style={styles.mealTime}>{meal.time}</Text>
            </View>
            <Text style={styles.mealCalories}>{meal.calories} cal</Text>
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.addButton}>
        <Text style={styles.addButtonText}>+ Log Meal</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: {
    paddingVertical: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  calorieInfo: {
    fontSize: 14,
    color: '#666',
  },
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34C759',
  },
  progressText: {
    fontSize: 14,
    color: '#666',
  },
  mealCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  mealTime: {
    fontSize: 14,
    color: '#666',
  },
  mealCalories: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  addButton: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 40,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default NutritionScreen;
