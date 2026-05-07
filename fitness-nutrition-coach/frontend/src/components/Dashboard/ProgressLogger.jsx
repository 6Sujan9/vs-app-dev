import React, { useState } from 'react';
import { progressAPI, getErrorMessage } from '../../services/api';
import '../styles/generators.css';

/**
 * Progress Logger Component
 * Log fitness progress including weight, measurements, and metrics
 */
const ProgressLogger = ({ onClose }) => {
  const [formData, setFormData] = useState({
    weight: '',
    bodyFat: '',
    muscleMass: '',
    measurements: {
      chest: '',
      waist: '',
      hips: '',
      thighs: '',
      arms: '',
    },
    exercisesCompleted: '',
    mealsLogged: '',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  const handleMeasurementChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      measurements: {
        ...prev.measurements,
        [name]: value,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const payload = {
      date: new Date().toISOString().split('T')[0],
      weight: formData.weight ? parseFloat(formData.weight) : null,
      exercises_completed: formData.exercisesCompleted ? parseInt(formData.exercisesCompleted) : 0,
      meals_logged: formData.mealsLogged ? parseInt(formData.mealsLogged) : 0,
      notes: formData.notes,
      metrics: {
        body_fat: formData.bodyFat ? parseFloat(formData.bodyFat) : null,
        muscle_mass: formData.muscleMass ? parseFloat(formData.muscleMass) : null,
        measurements: {
          chest: formData.measurements.chest ? parseFloat(formData.measurements.chest) : null,
          waist: formData.measurements.waist ? parseFloat(formData.measurements.waist) : null,
          hips: formData.measurements.hips ? parseFloat(formData.measurements.hips) : null,
          thighs: formData.measurements.thighs ? parseFloat(formData.measurements.thighs) : null,
          arms: formData.measurements.arms ? parseFloat(formData.measurements.arms) : null,
        },
      },
    };

    try {
      await progressAPI.logProgress(payload);
      setSuccess(true);
      setFormData({
        weight: '',
        bodyFat: '',
        muscleMass: '',
        measurements: {
          chest: '',
          waist: '',
          hips: '',
          thighs: '',
          arms: '',
        },
        exercisesCompleted: '',
        mealsLogged: '',
        notes: '',
      });

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="generator-card">
      <h3>Log Progress</h3>

      <form onSubmit={handleSubmit} className="generator-form">
        {/* Weight & Body Metrics */}
        <div className="form-section">
          <h4>Weight & Body Metrics</h4>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="weight">Weight (kg)</label>
              <input
                type="number"
                id="weight"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                step="0.1"
                placeholder="Your current weight"
              />
            </div>

            <div className="form-group">
              <label htmlFor="bodyFat">Body Fat %</label>
              <input
                type="number"
                id="bodyFat"
                name="bodyFat"
                value={formData.bodyFat}
                onChange={handleChange}
                step="0.1"
                placeholder="Estimated body fat %"
              />
            </div>

            <div className="form-group">
              <label htmlFor="muscleMass">Muscle Mass (kg)</label>
              <input
                type="number"
                id="muscleMass"
                name="muscleMass"
                value={formData.muscleMass}
                onChange={handleChange}
                step="0.1"
                placeholder="Lean muscle mass"
              />
            </div>
          </div>
        </div>

        {/* Measurements */}
        <div className="form-section">
          <h4>Body Measurements (cm)</h4>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="chest">Chest</label>
              <input
                type="number"
                id="chest"
                name="chest"
                value={formData.measurements.chest}
                onChange={handleMeasurementChange}
                step="0.1"
              />
            </div>

            <div className="form-group">
              <label htmlFor="waist">Waist</label>
              <input
                type="number"
                id="waist"
                name="waist"
                value={formData.measurements.waist}
                onChange={handleMeasurementChange}
                step="0.1"
              />
            </div>

            <div className="form-group">
              <label htmlFor="hips">Hips</label>
              <input
                type="number"
                id="hips"
                name="hips"
                value={formData.measurements.hips}
                onChange={handleMeasurementChange}
                step="0.1"
              />
            </div>

            <div className="form-group">
              <label htmlFor="thighs">Thighs</label>
              <input
                type="number"
                id="thighs"
                name="thighs"
                value={formData.measurements.thighs}
                onChange={handleMeasurementChange}
                step="0.1"
              />
            </div>

            <div className="form-group">
              <label htmlFor="arms">Arms</label>
              <input
                type="number"
                id="arms"
                name="arms"
                value={formData.measurements.arms}
                onChange={handleMeasurementChange}
                step="0.1"
              />
            </div>
          </div>
        </div>

        {/* Activity */}
        <div className="form-section">
          <h4>Activity Today</h4>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="exercisesCompleted">Exercises Completed</label>
              <input
                type="number"
                id="exercisesCompleted"
                name="exercisesCompleted"
                value={formData.exercisesCompleted}
                onChange={handleChange}
                min="0"
                placeholder="Number of exercises done today"
              />
            </div>

            <div className="form-group">
              <label htmlFor="mealsLogged">Meals Logged</label>
              <input
                type="number"
                id="mealsLogged"
                name="mealsLogged"
                value={formData.mealsLogged}
                onChange={handleChange}
                min="0"
                max="6"
                placeholder="Number of meals logged"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="form-group">
          <label htmlFor="notes">Notes (optional)</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="How did you feel? Any observations or concerns?"
            rows="3"
          />
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">✓ Progress logged successfully!</div>}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : 'Log Progress'}
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
