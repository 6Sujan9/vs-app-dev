import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { generateMealPlan, fetchMealPlans, deleteMealPlan } from '../../store/nutritionSlice';
import { getErrorMessage } from '../../services/api';
import CustomSelect from '../CustomSelect';
import '../styles/generators.css';

const calorieMap = {
  deficit: 1500,
  maintenance: 2000,
  surplus: 2500,
  custom: 2000,
};

// Reverse-map a calorie number to a label key
const calorieToKey = (cal) => {
  if (cal <= 1600) return 'deficit';
  if (cal <= 2200) return 'maintenance';
  if (cal <= 2700) return 'surplus';
  return 'custom';
};

const NutritionGenerator = ({ onClose, editPlan }) => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.nutrition);
  const isEditing = !!editPlan;

  const [formData, setFormData] = useState({
    goal: editPlan?.goal || 'balanced',
    duration: editPlan ? Math.round(editPlan.duration_days / 7) || 4 : 4,
    mealsPerDay: editPlan?.meals_per_day || 3,
    calorieTarget: editPlan ? calorieToKey(editPlan.daily_calories) : 'maintenance',
    dietType: editPlan?.diet_type || 'omnivore',
    preferredFoods: '',
    avoidFoods: '',
  });

  const [generationError, setGenerationError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setGenerationError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      goal: formData.goal,
      duration_days: parseInt(formData.duration) * 7,
      meals_per_day: parseInt(formData.mealsPerDay),
      daily_calories: calorieMap[formData.calorieTarget] ?? 2000,
      diet_type: formData.dietType,
      preferred_foods: formData.preferredFoods
        ? formData.preferredFoods.split(',').map((f) => f.trim()).filter(Boolean)
        : [],
      avoided_foods: formData.avoidFoods
        ? formData.avoidFoods.split(',').map((f) => f.trim()).filter(Boolean)
        : [],
    };

    try {
      const result = await dispatch(generateMealPlan(payload));
      if (result.meta?.requestStatus === 'fulfilled') {
        if (isEditing) {
          await dispatch(deleteMealPlan(editPlan.id));
        }
        dispatch(fetchMealPlans({ limit: 10 }));
        onClose();
      } else {
        setGenerationError(result.payload || 'Failed to generate meal plan');
      }
    } catch (err) {
      setGenerationError(getErrorMessage(err));
    }
  };

  return (
    <div className="generator-card">
      <h3>{isEditing ? `Edit: ${editPlan.name}` : 'Generate Meal Plan'}</h3>
      {isEditing && (
        <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginBottom: '1rem' }}>
          Adjust the settings below and click Regenerate. A new AI plan will be created and the old one removed.
        </p>
      )}

      <form onSubmit={handleSubmit} className="generator-form">
        <div className="form-row">
          <div className="form-group">
            <label>Nutrition Goal</label>
            <CustomSelect name="goal" value={formData.goal} onChange={handleChange}>
              <option value="weight_loss">Weight Loss</option>
              <option value="muscle_gain">Muscle Gain</option>
              <option value="balanced">Balanced &amp; Healthy</option>
              <option value="athletic_performance">Athletic Performance</option>
              <option value="energy_boost">Energy &amp; Vitality</option>
            </CustomSelect>
          </div>

          <div className="form-group">
            <label>Duration (weeks)</label>
            <CustomSelect name="duration" value={String(formData.duration)} onChange={handleChange}>
              <option value="1">1 week</option>
              <option value="2">2 weeks</option>
              <option value="4">4 weeks</option>
              <option value="8">8 weeks</option>
              <option value="12">12 weeks</option>
            </CustomSelect>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Meals per Day</label>
            <CustomSelect name="mealsPerDay" value={String(formData.mealsPerDay)} onChange={handleChange}>
              <option value="2">2 meals</option>
              <option value="3">3 meals</option>
              <option value="4">4 meals</option>
              <option value="5">5 meals</option>
              <option value="6">6 meals</option>
            </CustomSelect>
          </div>

          <div className="form-group">
            <label>Calorie Target</label>
            <CustomSelect name="calorieTarget" value={formData.calorieTarget} onChange={handleChange}>
              <option value="deficit">Calorie Deficit (~1500)</option>
              <option value="maintenance">Maintenance (~2000)</option>
              <option value="surplus">Calorie Surplus (~2500)</option>
              <option value="custom">Custom</option>
            </CustomSelect>
          </div>
        </div>

        <div className="form-group">
          <label>Diet Type</label>
          <CustomSelect name="dietType" value={formData.dietType} onChange={handleChange}>
            <option value="omnivore">Omnivore</option>
            <option value="vegetarian">Vegetarian</option>
            <option value="vegan">Vegan</option>
            <option value="keto">Keto</option>
            <option value="paleo">Paleo</option>
            <option value="mediterranean">Mediterranean</option>
          </CustomSelect>
        </div>

        <div className="form-group">
          <label htmlFor="preferredFoods">Preferred Foods (comma-separated, optional)</label>
          <textarea
            id="preferredFoods"
            name="preferredFoods"
            value={formData.preferredFoods}
            onChange={handleChange}
            placeholder="E.g., chicken, rice, broccoli, salmon..."
            rows="2"
          />
        </div>

        <div className="form-group">
          <label htmlFor="avoidFoods">Foods to Avoid (comma-separated, optional)</label>
          <textarea
            id="avoidFoods"
            name="avoidFoods"
            value={formData.avoidFoods}
            onChange={handleChange}
            placeholder="E.g., dairy, nuts, processed foods..."
            rows="2"
          />
        </div>

        {generationError && <div className="alert alert-error">{generationError}</div>}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading
              ? isEditing ? 'Regenerating...' : 'Generating Meal Plan...'
              : isEditing ? 'Regenerate Meal Plan' : 'Generate Meal Plan'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default NutritionGenerator;
