import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWorkouts, deleteWorkout } from '../../store/workoutSlice';
import { fetchMealPlans, deleteMealPlan } from '../../store/nutritionSlice';
import { fetchUserMetrics, fetchUserProfile } from '../../store/userSlice';
import WorkoutGenerator from './WorkoutGenerator';
import NutritionGenerator from './NutritionGenerator';
import ProgressLogger from './ProgressLogger';
import { progressAPI } from '../../services/api';
import '../styles/dashboard.css';

/* ─── Workout Detail Modal ─────────────────────────────────────── */
const WorkoutModal = ({ workout, onClose }) => {
  if (!workout) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{workout.name}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <p className="modal-desc">{workout.description}</p>
        <div className="workout-meta" style={{ marginBottom: '1.5rem' }}>
          <span>📅 {workout.duration_weeks} weeks</span>
          <span>💪 {workout.intensity}</span>
          <span>🔁 {workout.frequency}x / week</span>
          <span>🛠 {(workout.equipment || []).join(', ') || 'None'}</span>
        </div>

        <h3 style={{ marginBottom: '1rem' }}>
          Exercises ({workout.exercises?.length || 0})
        </h3>

        {workout.exercises && workout.exercises.length > 0 ? (
          <div className="exercise-list">
            {workout.exercises.map((ex, i) => (
              <div key={i} className="exercise-item">
                <div className="exercise-name">{i + 1}. {ex.name}</div>
                <div className="exercise-details">
                  <span>{ex.sets} sets</span>
                  <span>{ex.reps} reps</span>
                  {ex.rest_seconds && <span>{ex.rest_seconds}s rest</span>}
                  {ex.duration_minutes && <span>{ex.duration_minutes} min</span>}
                </div>
                {ex.notes && <p className="exercise-notes">{ex.notes}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-light)' }}>No exercises listed for this plan.</p>
        )}

        <button className="btn btn-primary" style={{ marginTop: '1.5rem', width: '100%' }} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

/* ─── Meal Plan Detail Modal ───────────────────────────────────── */
const MealPlanModal = ({ plan, onClose }) => {
  if (!plan) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{plan.name}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <p className="modal-desc">{plan.description}</p>
        <div className="nutrition-meta" style={{ marginBottom: '1rem' }}>
          <span>🔥 {plan.daily_calories} cal/day</span>
          <span>📅 {plan.duration_days} days</span>
          <span>🥗 {plan.meals_per_day} meals/day</span>
          <span>🥑 {plan.diet_type}</span>
        </div>

        {(plan.protein_grams || plan.carbs_grams || plan.fats_grams) ? (
          <div className="macros-display" style={{ marginBottom: '1.5rem' }}>
            <span><strong>{plan.protein_grams}g</strong><br />Protein</span>
            <span><strong>{plan.carbs_grams}g</strong><br />Carbs</span>
            <span><strong>{plan.fats_grams}g</strong><br />Fats</span>
          </div>
        ) : null}

        <h3 style={{ marginBottom: '1rem' }}>Meals ({plan.meals?.length || 0})</h3>

        {plan.meals && plan.meals.length > 0 ? (
          <div className="exercise-list">
            {plan.meals.map((meal, i) => (
              <div key={i} className="exercise-item">
                <div className="exercise-name">{meal.name}</div>
                <div className="exercise-details">
                  {meal.calories && <span>{meal.calories} cal</span>}
                  {meal.protein_grams && <span>P: {meal.protein_grams}g</span>}
                  {meal.carbs_grams && <span>C: {meal.carbs_grams}g</span>}
                  {meal.fats_grams && <span>F: {meal.fats_grams}g</span>}
                </div>
                {meal.foods && meal.foods.length > 0 && (
                  <p className="exercise-notes">
                    {Array.isArray(meal.foods) ? meal.foods.join(', ') : meal.foods}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-light)' }}>No meal details available.</p>
        )}

        <button className="btn btn-primary" style={{ marginTop: '1.5rem', width: '100%' }} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

/* ─── Main Dashboard ───────────────────────────────────────────── */
const Dashboard = () => {
  const dispatch = useDispatch();
  const { profile } = useSelector((state) => state.user);
  const { workouts } = useSelector((state) => state.workout);
  const { mealPlans } = useSelector((state) => state.nutrition);

  const [activeTab, setActiveTab] = useState('overview');
  const [showWorkoutGenerator, setShowWorkoutGenerator] = useState(false);
  const [showNutritionGenerator, setShowNutritionGenerator] = useState(false);
  const [showProgressLogger, setShowProgressLogger] = useState(false);

  const [viewWorkout, setViewWorkout] = useState(null);
  const [viewMealPlan, setViewMealPlan] = useState(null);
  const [editWorkout, setEditWorkout] = useState(null);
  const [editMealPlan, setEditMealPlan] = useState(null);

  const [progressLogs, setProgressLogs] = useState([]);
  const [progressAnalytics, setProgressAnalytics] = useState(null);
  const [progressLoading, setProgressLoading] = useState(false);
  const [editProgressLog, setEditProgressLog] = useState(null);

  useEffect(() => {
    dispatch(fetchUserProfile());
    dispatch(fetchWorkouts({ limit: 10 }));
    dispatch(fetchMealPlans({ limit: 10 }));
    dispatch(fetchUserMetrics());
  }, [dispatch]);

  const fetchProgress = async () => {
    setProgressLoading(true);
    try {
      const [logsRes, analyticsRes] = await Promise.all([
        progressAPI.getProgress({ days: 90, limit: 50 }),
        progressAPI.getAnalytics({ days: 90 }),
      ]);
      setProgressLogs(logsRes.data.logs || []);
      setProgressAnalytics(analyticsRes.data);
    } catch {
      // silently fail — empty state shown
    } finally {
      setProgressLoading(false);
    }
  };

  const handleDeleteWorkout = (workout) => {
    if (window.confirm(`Delete "${workout.name}"? This cannot be undone.`)) {
      dispatch(deleteWorkout(workout.id));
    }
  };

  const handleDeleteMealPlan = (plan) => {
    if (window.confirm(`Delete "${plan.name}"? This cannot be undone.`)) {
      dispatch(deleteMealPlan(plan.id));
    }
  };

  const handleDeleteProgressLog = async (log) => {
    const dateStr = new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (window.confirm(`Delete progress entry from ${dateStr}? This cannot be undone.`)) {
      try {
        await progressAPI.deleteProgressEntry(log.id);
        fetchProgress();
      } catch {
        // silently fail
      }
    }
  };

  return (
    <div className="dashboard-container">
      {/* Detail modals */}
      <WorkoutModal workout={viewWorkout} onClose={() => setViewWorkout(null)} />
      <MealPlanModal plan={viewMealPlan} onClose={() => setViewMealPlan(null)} />

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

      {/* Tabs */}
      <div className="dashboard-tabs">
        {['overview', 'workouts', 'nutrition', 'progress'].map((tab) => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => { setActiveTab(tab); if (tab === 'progress') fetchProgress(); }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="dashboard-content">

        {/* ── Overview ── */}
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
                      {workouts[0].duration_weeks} weeks · {workouts[0].intensity} · {workouts[0].exercises?.length || 0} exercises
                    </p>
                    <button className="btn btn-secondary" onClick={() => setViewWorkout(workouts[0])}>
                      View Details
                    </button>
                  </div>
                ) : (
                  <div className="card empty">
                    <p>No workout plans yet</p>
                    <button className="btn btn-primary" onClick={() => { setActiveTab('workouts'); setShowWorkoutGenerator(true); }}>
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
                    <button className="btn btn-secondary" onClick={() => setViewMealPlan(mealPlans[0])}>
                      View Details
                    </button>
                  </div>
                ) : (
                  <div className="card empty">
                    <p>No meal plans yet</p>
                    <button className="btn btn-primary" onClick={() => { setActiveTab('nutrition'); setShowNutritionGenerator(true); }}>
                      Create Meal Plan
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Workouts ── */}
        {activeTab === 'workouts' && (
          <div className="tab-content">
            <div className="section-header">
              <h2>My Workouts</h2>
              <button className="btn btn-primary" onClick={() => setShowWorkoutGenerator(!showWorkoutGenerator)}>
                {showWorkoutGenerator ? '✕ Hide' : '+ New Workout'}
              </button>
            </div>

            {showWorkoutGenerator && (
              <WorkoutGenerator
                editWorkout={editWorkout}
                onClose={() => { setShowWorkoutGenerator(false); setEditWorkout(null); dispatch(fetchWorkouts({ limit: 10 })); }}
              />
            )}

            {workouts && workouts.length > 0 ? (
              <div className="workouts-list">
                {workouts.map((workout) => (
                  <div key={workout.id} className="workout-card">
                    <h3>{workout.name}</h3>
                    <p>{workout.description}</p>
                    <div className="workout-meta">
                      <span>📅 {workout.duration_weeks} weeks</span>
                      <span>💪 {workout.intensity}</span>
                      <span>🔁 {workout.frequency}x/week</span>
                      <span>🏋️ {workout.exercises?.length || 0} exercises</span>
                    </div>
                    <div className="card-actions">
                      <button className="btn btn-secondary" onClick={() => setViewWorkout(workout)}>View</button>
                      <button className="btn btn-secondary" onClick={() => { setEditWorkout(workout); setShowWorkoutGenerator(true); window.scrollTo(0, 0); }}>Edit</button>
                      <button className="btn btn-danger" onClick={() => handleDeleteWorkout(workout)}>Delete</button>
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

        {/* ── Nutrition ── */}
        {activeTab === 'nutrition' && (
          <div className="tab-content">
            <div className="section-header">
              <h2>My Meal Plans</h2>
              <button className="btn btn-primary" onClick={() => setShowNutritionGenerator(!showNutritionGenerator)}>
                {showNutritionGenerator ? '✕ Hide' : '+ New Meal Plan'}
              </button>
            </div>

            {showNutritionGenerator && (
              <NutritionGenerator
                editPlan={editMealPlan}
                onClose={() => { setShowNutritionGenerator(false); setEditMealPlan(null); dispatch(fetchMealPlans({ limit: 10 })); }}
              />
            )}

            {mealPlans && mealPlans.length > 0 ? (
              <div className="meal-plans-list">
                {mealPlans.map((plan) => (
                  <div key={plan.id} className="meal-plan-card">
                    <h3>{plan.name}</h3>
                    <p>{plan.description}</p>
                    <div className="nutrition-meta">
                      <span>🔥 {plan.daily_calories} cal/day</span>
                      <span>🥗 {plan.meals?.length || 0} meals</span>
                      <span>📅 {plan.duration_days} days</span>
                    </div>
                    {(plan.protein_grams || plan.carbs_grams || plan.fats_grams) && (
                      <div className="macros-display">
                        <span>Protein: {plan.protein_grams}g</span>
                        <span>Carbs: {plan.carbs_grams}g</span>
                        <span>Fats: {plan.fats_grams}g</span>
                      </div>
                    )}
                    <div className="card-actions">
                      <button className="btn btn-secondary" onClick={() => setViewMealPlan(plan)}>View</button>
                      <button className="btn btn-secondary" onClick={() => { setEditMealPlan(plan); setShowNutritionGenerator(true); window.scrollTo(0, 0); }}>Edit</button>
                      <button className="btn btn-danger" onClick={() => handleDeleteMealPlan(plan)}>Delete</button>
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

        {/* ── Progress ── */}
        {activeTab === 'progress' && (
          <div className="tab-content">
            <div className="section-header">
              <h2>Progress Tracking</h2>
              <button className="btn btn-primary" onClick={() => {
                setShowProgressLogger(!showProgressLogger);
                setEditProgressLog(null);
                if (!showProgressLogger) fetchProgress();
              }}>
                {showProgressLogger ? '✕ Hide' : '+ Log Progress'}
              </button>
            </div>

            {showProgressLogger && (
              <ProgressLogger
                editLog={editProgressLog}
                onClose={() => { setShowProgressLogger(false); setEditProgressLog(null); fetchProgress(); }}
              />
            )}

            {/* Analytics summary */}
            {progressAnalytics && progressAnalytics.total_logs > 0 && (
              <div className="progress-analytics">
                <div className="analytics-card">
                  <span className="analytics-icon">📊</span>
                  <h4>{progressAnalytics.total_logs}</h4>
                  <p>Total Entries</p>
                </div>
                <div className="analytics-card">
                  <span className="analytics-icon">⚖️</span>
                  <h4>{progressAnalytics.latest_weight ? `${progressAnalytics.latest_weight} kg` : '--'}</h4>
                  <p>Latest Weight</p>
                </div>
                <div className="analytics-card">
                  <span className="analytics-icon">{progressAnalytics.weight_change > 0 ? '📈' : progressAnalytics.weight_change < 0 ? '📉' : '➡️'}</span>
                  <h4 style={{ color: progressAnalytics.weight_change < 0 ? '#22c55e' : progressAnalytics.weight_change > 0 ? '#ef4444' : 'inherit' }}>
                    {progressAnalytics.weight_change != null
                      ? `${progressAnalytics.weight_change > 0 ? '+' : ''}${progressAnalytics.weight_change.toFixed(1)} kg`
                      : '--'}
                  </h4>
                  <p>Weight Change</p>
                </div>
                <div className="analytics-card">
                  <span className="analytics-icon">💪</span>
                  <h4>{progressAnalytics.avg_exercises_per_log?.toFixed(1) || '--'}</h4>
                  <p>Avg Exercises/Log</p>
                </div>
              </div>
            )}

            {/* Log history */}
            <div className="progress-section">
              {progressLoading ? (
                <p className="text-muted" style={{ textAlign: 'center', padding: '2rem' }}>Loading...</p>
              ) : progressLogs.length > 0 ? (
                <>
                  <h3 style={{ marginBottom: '1rem' }}>History (last 90 days)</h3>
                  <div className="progress-history">
                    {progressLogs.map((log) => (
                      <div key={log.id} className="progress-entry">
                        <div className="progress-entry-date">
                          {new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="progress-entry-stats">
                          {log.weight && <span className="progress-stat">⚖️ {log.weight} kg</span>}
                          {log.body_fat_percentage && <span className="progress-stat">🔥 {log.body_fat_percentage}% fat</span>}
                          {log.muscle_mass && <span className="progress-stat">💪 {log.muscle_mass} kg muscle</span>}
                          {log.chest && <span className="progress-stat">📐 chest {log.chest} cm</span>}
                          {log.waist && <span className="progress-stat">📐 waist {log.waist} cm</span>}
                          {log.arms && <span className="progress-stat">📐 arms {log.arms} cm</span>}
                          {log.exercises_completed > 0 && <span className="progress-stat">🏋️ {log.exercises_completed} exercises</span>}
                          {log.meals_logged > 0 && <span className="progress-stat">🥗 {log.meals_logged} meals</span>}
                        </div>
                        {log.notes && <p className="progress-entry-notes">{log.notes}</p>}
                        <div className="card-actions" style={{ marginTop: '0.75rem' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ fontSize: '0.85rem', padding: '0.35rem 0.85rem' }}
                            onClick={() => { setEditProgressLog(log); setShowProgressLogger(true); window.scrollTo(0, 0); }}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-danger"
                            style={{ fontSize: '0.85rem', padding: '0.35rem 0.85rem' }}
                            onClick={() => handleDeleteProgressLog(log)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                  <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>📈</p>
                  <h3>No progress logged yet</h3>
                  <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
                    Start tracking your weight, measurements, and activity to see your journey here.
                  </p>
                  <button className="btn btn-primary" onClick={() => { setShowProgressLogger(true); fetchProgress(); }}>
                    + Log Your First Entry
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
