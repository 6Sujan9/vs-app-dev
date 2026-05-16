import React, { useState } from 'react';
import { progressAPI, getErrorMessage } from '../../services/api';
import '../styles/generators.css';

const ProgressLogger = ({ onClose, editLog }) => {
  const isEditing = !!editLog;

  const [formData, setFormData] = useState({
    weight: editLog?.weight ?? '',
    body_fat_percentage: editLog?.body_fat_percentage ?? '',
    muscle_mass: editLog?.muscle_mass ?? '',
    chest: editLog?.chest ?? '',
    waist: editLog?.waist ?? '',
    hips: editLog?.hips ?? '',
    thighs: editLog?.thighs ?? '',
    arms: editLog?.arms ?? '',
    exercises_completed: editLog?.exercises_completed ?? '',
    meals_logged: editLog?.meals_logged ?? '',
    notes: editLog?.notes ?? '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const num = (v) => (v !== '' && v != null ? parseFloat(v) : null);
  const int = (v) => (v !== '' && v != null ? parseInt(v) : null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      weight: num(formData.weight),
      body_fat_percentage: num(formData.body_fat_percentage),
      muscle_mass: num(formData.muscle_mass),
      chest: num(formData.chest),
      waist: num(formData.waist),
      hips: num(formData.hips),
      thighs: num(formData.thighs),
      arms: num(formData.arms),
      exercises_completed: int(formData.exercises_completed),
      meals_logged: int(formData.meals_logged),
      notes: formData.notes || null,
    };

    try {
      // If editing: delete old entry then create new one
      if (isEditing) {
        await progressAPI.deleteProgressEntry(editLog.id);
      }
      await progressAPI.logProgress(payload);
      setSuccess(true);
      setTimeout(() => onClose(), 1000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="generator-card">
      <h3>{isEditing ? 'Edit Progress Entry' : 'Log Today\'s Progress'}</h3>
      {isEditing && (
        <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginBottom: '1rem' }}>
          Update the values below. The old entry will be replaced with your changes.
        </p>
      )}

      <form onSubmit={handleSubmit} className="generator-form">
        {/* Body Metrics */}
        <div className="form-section">
          <h4>Body Metrics</h4>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="weight">Weight (kg)</label>
              <input type="number" id="weight" name="weight" value={formData.weight}
                onChange={handleChange} step="0.1" min="0" placeholder="e.g. 75.5" />
            </div>
            <div className="form-group">
              <label htmlFor="body_fat_percentage">Body Fat %</label>
              <input type="number" id="body_fat_percentage" name="body_fat_percentage"
                value={formData.body_fat_percentage} onChange={handleChange}
                step="0.1" min="0" max="70" placeholder="e.g. 18.5" />
            </div>
            <div className="form-group">
              <label htmlFor="muscle_mass">Muscle Mass (kg)</label>
              <input type="number" id="muscle_mass" name="muscle_mass"
                value={formData.muscle_mass} onChange={handleChange}
                step="0.1" min="0" placeholder="e.g. 55" />
            </div>
          </div>
        </div>

        {/* Measurements */}
        <div className="form-section">
          <h4>Measurements (cm)</h4>
          <div className="form-row">
            {['chest', 'waist', 'hips', 'thighs', 'arms'].map((field) => (
              <div className="form-group" key={field}>
                <label htmlFor={field}>{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                <input type="number" id={field} name={field}
                  value={formData[field]} onChange={handleChange}
                  step="0.1" min="0" placeholder="cm" />
              </div>
            ))}
          </div>
        </div>

        {/* Activity */}
        <div className="form-section">
          <h4>Activity</h4>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="exercises_completed">Exercises Done</label>
              <input type="number" id="exercises_completed" name="exercises_completed"
                value={formData.exercises_completed} onChange={handleChange} min="0" placeholder="0" />
            </div>
            <div className="form-group">
              <label htmlFor="meals_logged">Meals Logged</label>
              <input type="number" id="meals_logged" name="meals_logged"
                value={formData.meals_logged} onChange={handleChange} min="0" max="10" placeholder="0" />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="form-group">
          <label htmlFor="notes">Notes (optional)</label>
          <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange}
            placeholder="How did you feel? Any observations..." rows="2" />
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{isEditing ? 'Entry updated!' : 'Progress saved!'}</div>}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : isEditing ? 'Update Entry' : 'Save Progress'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProgressLogger;
