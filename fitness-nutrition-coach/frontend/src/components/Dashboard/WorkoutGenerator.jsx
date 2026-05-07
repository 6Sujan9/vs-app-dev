import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { generateWorkout, fetchWorkouts } from '../../store/workoutSlice';
import { getErrorMessage } from '../../services/api';
import '../styles/generators.css';

/**
 * Workout Generator Component
 * AI-powered workout plan generation
 */
const WorkoutGenerator = ({ onClose }) => {
  const dispatch = useDispatch();
  const { profile } = useSelector((state) => state.user);
  const { loading, error } = useSelector((state) => state.workout);

  const [formData, setFormData] = useState({
    goal: 'muscle_gain',
    duration: 4,
    frequency: 4,
    equipment: ['dumbbells', 'barbell'],
    intensity: 'moderate',
    specificRequirements: '',
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

  const handleEquipmentChange = (e) => {
    const { value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      equipment: checked ? [...prev.equipment, value] : prev.equipment.filter((eq) => eq !== value),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      goal: formData.goal,
      duration_weeks: parseInt(formData.duration),
      frequency_per_week: parseInt(formData.frequency),
      equipment: formData.equipment,
      intensity: formData.intensity,
      specific_requirements: formData.specificRequirements,
    };

    try {
      const result = await dispatch(generateWorkout(payload));
      if (result.payload) {
        // Refresh workouts list
        dispatch(fetchWorkouts({ limit: 10 }));
        onClose();
      }
    } catch (error) {
      setGenerationError(getErrorMessage(error));
    }
  };

  return (
    <div className="generator-card">
      <h3>Generate Workout Plan</h3>

      <form onSubmit={handleSubmit} className="generator-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="goal">Fitness Goal</label>
            <select id="goal" name="goal" value={formData.goal} onChange={handleChange}>
              <option value="muscle_gain">Muscle Gain</option>
              <option value="weight_loss">Weight Loss</option>
              <option value="endurance">Endurance</option>
              <option value="strength">Strength</option>
              <option value="flexibility">Flexibility</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="duration">Duration (weeks)</label>
            <select id="duration" name="duration" value={formData.duration} onChange={handleChange}>
              <option value="2">2 weeks</option>
              <option value="4">4 weeks</option>
              <option value="6">6 weeks</option>
              <option value="8">8 weeks</option>
              <option value="12">12 weeks</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="frequency">Sessions per Week</label>
            <select id="frequency" name="frequency" value={formData.frequency} onChange={handleChange}>
              <option value="2">2x per week</option>
              <option value="3">3x per week</option>
              <option value="4">4x per week</option>
              <option value="5">5x per week</option>
              <option value="6">6x per week</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="intensity">Intensity</label>
            <select id="intensity" name="intensity" value={formData.intensity} onChange={handleChange}>
              <option value="light">Light</option>
              <option value="moderate">Moderate</option>
              <option value="high">High</option>
              <option value="very_high">Very High</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Available Equipment</label>
          <div className="checkbox-group">
            {['dumbbells', 'barbell', 'kettlebell', 'resistance_bands', 'machine', 'bodyweight'].map((eq) => (
              <label key={eq} className="checkbox-label">
                <input
                  type="checkbox"
                  value={eq}
                  checked={formData.equipment.includes(eq)}
                  onChange={handleEquipmentChange}
                />
                {eq.charAt(0).toUpperCase() + eq.slice(1).replace('_', ' ')}
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="requirements">Specific Requirements (optional)</label>
          <textarea
            id="requirements"
            name="specificRequirements"
            value={formData.specificRequirements}
            onChange={handleChange}
            placeholder="E.g., Focus on lower body, avoid high-impact exercises..."
            rows="3"
          />
        </div>

        {generationError && <div className="alert alert-error">{generationError}</div>}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Generating Workout...' : 'Generate Workout'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default WorkoutGenerator;
