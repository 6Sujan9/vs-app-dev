import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { generateWorkout, fetchWorkouts, deleteWorkout } from '../../store/workoutSlice';
import { getErrorMessage } from '../../services/api';
import CustomSelect from '../CustomSelect';
import '../styles/generators.css';

const WorkoutGenerator = ({ onClose, editWorkout }) => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.workout);
  const isEditing = !!editWorkout;

  const [formData, setFormData] = useState({
    goal: editWorkout?.goal || 'muscle_gain',
    duration: editWorkout?.duration_weeks || 4,
    frequency: editWorkout?.frequency || 4,
    equipment: editWorkout?.equipment || ['dumbbells', 'barbell'],
    intensity: editWorkout?.intensity || 'moderate',
    specificRequirements: '',
  });

  const [generationError, setGenerationError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setGenerationError(null);
  };

  const handleEquipmentChange = (e) => {
    const { value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      equipment: checked
        ? [...prev.equipment, value]
        : prev.equipment.filter((eq) => eq !== value),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      goal: formData.goal,
      duration_weeks: parseInt(formData.duration),
      frequency: parseInt(formData.frequency),
      equipment: formData.equipment,
      intensity: formData.intensity,
      specific_requirements: formData.specificRequirements,
    };

    try {
      const result = await dispatch(generateWorkout(payload));
      if (result.meta?.requestStatus === 'fulfilled') {
        // If editing, delete the old plan after new one is created
        if (isEditing) {
          await dispatch(deleteWorkout(editWorkout.id));
        }
        dispatch(fetchWorkouts({ limit: 10 }));
        onClose();
      } else {
        setGenerationError(result.payload || 'Failed to generate workout');
      }
    } catch (err) {
      setGenerationError(getErrorMessage(err));
    }
  };

  return (
    <div className="generator-card">
      <h3>{isEditing ? `Edit: ${editWorkout.name}` : 'Generate Workout Plan'}</h3>
      {isEditing && (
        <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginBottom: '1rem' }}>
          Adjust the settings below and click Regenerate. A new AI plan will be created and the old one removed.
        </p>
      )}

      <form onSubmit={handleSubmit} className="generator-form">
        <div className="form-row">
          <div className="form-group">
            <label>Fitness Goal</label>
            <CustomSelect name="goal" value={formData.goal} onChange={handleChange}>
              <option value="muscle_gain">Muscle Gain</option>
              <option value="weight_loss">Weight Loss</option>
              <option value="endurance">Endurance</option>
              <option value="strength">Strength</option>
              <option value="flexibility">Flexibility</option>
            </CustomSelect>
          </div>

          <div className="form-group">
            <label>Duration (weeks)</label>
            <CustomSelect name="duration" value={String(formData.duration)} onChange={handleChange}>
              <option value="2">2 weeks</option>
              <option value="4">4 weeks</option>
              <option value="6">6 weeks</option>
              <option value="8">8 weeks</option>
              <option value="12">12 weeks</option>
            </CustomSelect>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Sessions per Week</label>
            <CustomSelect name="frequency" value={String(formData.frequency)} onChange={handleChange}>
              <option value="2">2x per week</option>
              <option value="3">3x per week</option>
              <option value="4">4x per week</option>
              <option value="5">5x per week</option>
              <option value="6">6x per week</option>
            </CustomSelect>
          </div>

          <div className="form-group">
            <label>Intensity</label>
            <CustomSelect name="intensity" value={formData.intensity} onChange={handleChange}>
              <option value="light">Light</option>
              <option value="moderate">Moderate</option>
              <option value="high">High</option>
              <option value="very_high">Very High</option>
            </CustomSelect>
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
            {loading
              ? isEditing ? 'Regenerating...' : 'Generating Workout...'
              : isEditing ? 'Regenerate Workout' : 'Generate Workout'}
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
