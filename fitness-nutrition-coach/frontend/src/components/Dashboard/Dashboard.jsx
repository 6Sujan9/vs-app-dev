import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWorkouts } from '../../store/workoutSlice';
import { fetchMealPlans } from '../../store/nutritionSlice';
import { fetchUserMetrics, fetchUserProfile } from '../../store/userSlice';
import WorkoutGenerator from './WorkoutGenerator';
import NutritionGenerator from './NutritionGenerator';
import ProgressLogger from './ProgressLogger';
import '../styles/dashboard.css';

/**
 * Dashboard Component
 * Main hub showing workouts, nutrition plans, and progress
 */
const Dashboard = () => {
  const dispatch = useDispatch();
  const { profile, loading: userLoading } = useSelector((state) => state.user);
  const { workouts, loading: workoutLoading } = useSelector((state) => state.workout);
  const { mealPlans, loading: nutritionLoading } = useSelector((state) => state.nutrition);

  const [activeTab, setActiveTab] = useState('overview');
  const [showWorkoutGenerator, setShowWorkoutGenerator] = useState(false);
  const [showNutritionGenerator, setShowNutritionGenerator] = useState(false);
  const [showProgressLogger, setShowProgressLogger] = useState(false);

  useEffect(() => {
    // DEBUG: Verify token exists when dashboard loads
    const token = localStorage.getItem('access_token');
    console.log('🔷 Dashboard mounted - checking auth token');
    console.log('🔷 Token in localStorage:', token ? `${token.substring(0, 20)}...` : 'MISSING!');
    if (!token) {
      console.error('🔴 CRITICAL: No access_token in localStorage! User should not be on dashboard!');
    }
    
    // Fetch initial data - these run independently
    console.log('🔷 Dashboard: Fetching user data...');
    dispatch(fetchUserProfile());
    dispatch(fetchWorkouts({ limit: 5 }));
    dispatch(fetchMealPlans({ limit: 5 }));
    dispatch(fetchUserMetrics());
  }, [dispatch]);

  // Only wait for critical data; don't block on optional data
  // Dashboard should render even if some data fails to load
  const isLoading = false; // Remove blocking on data loads

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading your dashboard...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>Welcome, {profile?.first_name}!</h1>
          <p className="dashboard-subtitle">Your personalized fitness dashboard</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-icon">⚖️</span>
          <h3>{profile?.weight || '--'}</h3>
          <p>Current Weight (kg)</p>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📏</span>
          <h3>{profile?.height || '--'}</h3>
          <p>Height (cm)</p>
        </div>
        <div className="stat-card">
          <span className="stat-icon">💪</span>
          <h3>{workouts?.length || 0}</h3>
          <p>Active Workouts</p>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🍎</span>
          <h3>{mealPlans?.length || 0}</h3>
          <p>Meal Plans</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="dashboard-tabs">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'workouts' ? 'active' : ''}`}
          onClick={() => setActiveTab('workouts')}
        >
          Workouts
        </button>
        <button
          className={`tab-btn ${activeTab === 'nutrition' ? 'active' : ''}`}
          onClick={() => setActiveTab('nutrition')}
        >
          Nutrition
        </button>
        <button
          className={`tab-btn ${activeTab === 'progress' ? 'active' : ''}`}
          onClick={() => setActiveTab('progress')}
        >
          Progress
        </button>
      </div>

      {/* Tab Content */}
      <div className="dashboard-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="tab-content">
            <div className="content-row">
              <div className="section">
                <h2>Latest Workout</h2>
                {workouts && workouts.length > 0 ? (
                  <div className="card">
                    <h3>{workouts[0].name}</h3>
                    <p>{workouts[0].description}</p>
                    <p className="text-muted">
                      Duration: {workouts[0].duration_weeks} weeks | Level: {workouts[0].intensity}
                    </p>
                    <button className="btn btn-secondary">View Details</button>
                  </div>
                ) : (
                  <div className="card empty">
                    <p>No workout plans yet</p>
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setActiveTab('workouts');
                        setShowWorkoutGenerator(true);
                      }}
                    >
                      Create Workout
                    </button>
                  </div>
                )}
              </div>

              <div className="section">
                <h2>Latest Meal Plan</h2>
                {mealPlans && mealPlans.length > 0 ? (
                  <div className="card">
                    <h3>{mealPlans[0].name}</h3>
                    <p>{mealPlans[0].description}</p>
                    <p className="text-muted">Daily Calories: {mealPlans[0].daily_calories}</p>
                    <button className="btn btn-secondary">View Details</button>
                  </div>
                ) : (
                  <div className="card empty">
                    <p>No meal plans yet</p>
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setActiveTab('nutrition');
                        setShowNutritionGenerator(true);
                      }}
                    >
                      Create Meal Plan
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Workouts Tab */}
        {activeTab === 'workouts' && (
          <div className="tab-content">
            <div className="section-header">
              <h2>My Workouts</h2>
              <button className="btn btn-primary" onClick={() => setShowWorkoutGenerator(!showWorkoutGenerator)}>
                {showWorkoutGenerator ? '✕ Hide' : '+ New Workout'}
              </button>
            </div>

            {showWorkoutGenerator && <WorkoutGenerator onClose={() => setShowWorkoutGenerator(false)} />}

            {workouts && workouts.length > 0 ? (
              <div className="workouts-list">
                {workouts.map((workout) => (
                  <div key={workout.id} className="workout-card">
                    <h3>{workout.name}</h3>
                    <p>{workout.description}</p>
                    <div className="workout-meta">
                      <span>📅 {workout.duration_weeks} weeks</span>
                      <span>💪 {workout.intensity}</span>
                      <span>🏋️ {workout.exercises?.length || 0} exercises</span>
                    </div>
                    <div className="card-actions">
                      <button className="btn btn-secondary">View</button>
                      <button className="btn btn-secondary">Edit</button>
                      <button className="btn btn-danger">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No workouts yet. Create your first workout plan!</p>
              </div>
            )}
          </div>
        )}

        {/* Nutrition Tab */}
        {activeTab === 'nutrition' && (
          <div className="tab-content">
            <div className="section-header">
              <h2>My Meal Plans</h2>
              <button className="btn btn-primary" onClick={() => setShowNutritionGenerator(!showNutritionGenerator)}>
                {showNutritionGenerator ? '✕ Hide' : '+ New Meal Plan'}
              </button>
            </div>

            {showNutritionGenerator && <NutritionGenerator onClose={() => setShowNutritionGenerator(false)} />}

            {mealPlans && mealPlans.length > 0 ? (
              <div className="meal-plans-list">
                {mealPlans.map((plan) => (
                  <div key={plan.id} className="meal-plan-card">
                    <h3>{plan.plan_name}</h3>
                    <p>{plan.description}</p>
                    <div className="nutrition-meta">
                      <span>🔥 {plan.daily_calories} calories/day</span>
                      <span>🥗 {plan.meals?.length || 0} meals</span>
                    </div>
                    <div className="macros-display">
                      {plan.macros && (
                        <>
                          <span>Protein: {plan.macros.proteins}g</span>
                          <span>Carbs: {plan.macros.carbs}g</span>
                          <span>Fats: {plan.macros.fats}g</span>
                        </>
                      )}
                    </div>
                    <div className="card-actions">
                      <button className="btn btn-secondary">View</button>
                      <button className="btn btn-secondary">Edit</button>
                      <button className="btn btn-danger">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No meal plans yet. Create your first meal plan!</p>
              </div>
            )}
          </div>
        )}

        {/* Progress Tab */}
        {activeTab === 'progress' && (
          <div className="tab-content">
            <div className="section-header">
              <h2>Progress Tracking</h2>
              <button className="btn btn-primary" onClick={() => setShowProgressLogger(!showProgressLogger)}>
                {showProgressLogger ? '✕ Hide' : '+ Log Progress'}
              </button>
            </div>

            {showProgressLogger && <ProgressLogger onClose={() => setShowProgressLogger(false)} />}

            <div className="progress-section">
              <p className="text-muted">Track your fitness journey with regular weight, measurements, and metrics</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
