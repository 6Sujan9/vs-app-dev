import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { generateMealPlan, fetchMealPlans } from '../../store/nutritionSlice';
import { getErrorMessage } from '../../services/api';
import '../styles/generators.css';

/**
 * Nutrition Generator Component
 * AI-powered meal plan generation
 */
const NutritionGenerator = ({ onClose }) => {
  const dispatch = useDispatch();
  const { profile } = useSelector((state) => state.user);
  const { loading, error } = useSelector((state) => state.nutrition);

  const [formData, setFormData] = useState({
    goal: 'balanced',
    duration: 4,
    mealsPerDay: 3,
    calorieTarget: 'maintenance',
    dietType: 'omnivore',
    preferredFoods: '',
    avoidFoods: '',
  });

  const [generationError, setGenerationError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setGenerationError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      goal: formData.goal,
      duration_days: parseInt(formData.duration) * 7,
      meals_per_day: parseInt(formData.mealsPerDay),
      calorie_target: formData.calorieTarget,
      diet_type: formData.dietType,
      preferred_foods: formData.preferredFoods.split(',').map((f) => f.trim()),
      foods_to_avoid: formData.avoidFoods.split(',').map((f) => f.trim()),
    };

    try {
      const result = await dispatch(generateMealPlan(payload));
      if (result.payload) {
        // Refresh meal plans list
        dispatch(fetchMealPlans({ limit: 10 }));
        onClose();
      }
    } catch (error) {
      setGenerationError(getErrorMessage(error));
    }
  };

  return (
    <div className="generator-card">
      <h3>Generate Meal Plan</h3>

      <form onSubmit={handleSubmit} className="generator-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="goal">Nutrition Goal</label>
            <select id="goal" name="goal" value={formData.goal} onChange={handleChange}>
              <option value="weight_loss">Weight Loss</option>
              <option value="muscle_gain">Muscle Gain</option>
              <option value="balanced">Balanced & Healthy</option>
              <option value="athletic_performance">Athletic Performance</option>
              <option value="energy_boost">Energy & Vitality</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="duration">Duration (weeks)</label>
            <select id="duration" name="duration" value={formData.duration} onChange={handleChange}>
              <option value="1">1 week</option>
              <option value="2">2 weeks</option>
              <option value="4">4 weeks</option>
              <option value="8">8 weeks</option>
              <option value="12">12 weeks</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="mealsPerDay">Meals per Day</label>
            <select id="mealsPerDay" name="mealsPerDay" value={formData.mealsPerDay} onChange={handleChange}>
              <option value="2">2 meals</option>
              <option value="3">3 meals</option>
              <option value="4">4 meals</option>
              <option value="5">5 meals</option>
              <option value="6">6 meals</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="calorieTarget">Calorie Target</label>
            <select id="calorieTarget" name="calorieTarget" value={formData.calorieTarget} onChange={handleChange}>
              <option value="deficit">Calorie Deficit (-500)</option>
              <option value="maintenance">Maintenance</option>
              <option value="surplus">Calorie Surplus (+500)</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="dietType">Diet Type</label>
          <select id="dietType" name="dietType" value={formData.dietType} onChange={handleChange}>
            <option value="omnivore">Omnivore</option>
            <option value="vegetarian">Vegetarian</option>
            <option value="vegan">Vegan</option>
            <option value="keto">Keto</option>
            <option value="paleo">Paleo</option>
            <option value="mediterranean">Mediterranean</option>
          </select>
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
            {loading ? 'Generating Meal Plan...' : 'Generate Meal Plan'}
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
