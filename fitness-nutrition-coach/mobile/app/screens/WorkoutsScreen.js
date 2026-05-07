import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';

const WorkoutsScreen = () => {
  const workouts = [
    { id: 1, name: 'Upper Body Strength', duration: '45 min', difficulty: 'Intermediate' },
    { id: 2, name: 'Lower Body Focus', duration: '50 min', difficulty: 'Advanced' },
    { id: 3, name: 'Full Body HIIT', duration: '30 min', difficulty: 'High' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Your Workout Plans</Text>
      </View>

      {workouts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No workouts yet</Text>
          <Text style={styles.emptySubtext}>Generate a personalized workout plan in your profile</Text>
        </View>
      ) : (
        workouts.map((workout) => (
          <TouchableOpacity key={workout.id} style={styles.workoutCard}>
            <View style={styles.workoutHeader}>
              <Text style={styles.workoutTitle}>{workout.name}</Text>
              <Text style={[styles.difficulty, { color: getDifficultyColor(workout.difficulty) }]}>
                {workout.difficulty}
              </Text>
            </View>
            <Text style={styles.workoutDuration}>⏱️ {workout.duration}</Text>
            <TouchableOpacity style={styles.startButton}>
              <Text style={styles.startButtonText}>Start Workout</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
};

const getDifficultyColor = (difficulty) => {
  switch (difficulty) {
    case 'Beginner':
      return '#34C759';
    case 'Intermediate':
      return '#FF9500';
    case 'Advanced':
    case 'High':
      return '#FF3B30';
    default:
      return '#666';
  }
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
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 16,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
  },
  workoutCard: {
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
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  difficulty: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
  },
  workoutDuration: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  startButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default WorkoutsScreen;
