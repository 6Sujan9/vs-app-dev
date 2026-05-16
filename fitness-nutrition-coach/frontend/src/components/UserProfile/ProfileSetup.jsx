import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserProfile } from '../../store/userSlice';
import CustomSelect from '../CustomSelect';
import '../styles/forms.css';

/**
 * Profile Setup Component
 * Initial user profile configuration
 */
const ProfileSetup = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.user);

  const [formData, setFormData] = useState({
    age: '',
    weight: '',
    height: '',
    gender: 'male',
    fitnessLevel: 'beginner',
    goals: [],
    dietaryRestrictions: [],
    medicalConditions: '',
  });

  const [validationErrors, setValidationErrors] = useState({});

  const fitnessLevels = ['beginner', 'intermediate', 'advanced'];
  const goalOptions = [
    { value: 'weight_loss', label: 'Weight Loss' },
    { value: 'muscle_gain', label: 'Muscle Gain' },
    { value: 'endurance', label: 'Endurance' },
    { value: 'flexibility', label: 'Flexibility' },
    { value: 'general_fitness', label: 'General Fitness' },
  ];
  const dietaryOptions = [
    { value: 'vegetarian', label: 'Vegetarian' },
    { value: 'vegan', label: 'Vegan' },
    { value: 'gluten_free', label: 'Gluten Free' },
    { value: 'lactose_free', label: 'Lactose Free' },
    { value: 'nut_allergy', label: 'Nut Allergy' },
  ];

  const validateForm = () => {
    const errors = {};

    if (!formData.age || formData.age < 13 || formData.age > 120) {
      errors.age = 'Please enter a valid age (13-120)';
    }

    if (!formData.weight || formData.weight < 30 || formData.weight > 500) {
      errors.weight = 'Please enter a valid weight';
    }

    if (!formData.height || formData.height < 50 || formData.height > 250) {
      errors.height = 'Please enter a valid height (in cm)';
    }

    if (formData.goals.length === 0) {
      errors.goals = 'Please select at least one goal';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleCheckboxChange = (name, value) => {
    setFormData((prev) => {
      const currentArray = prev[name];
      if (currentArray.includes(value)) {
        return {
          ...prev,
          [name]: currentArray.filter((item) => item !== value),
        };
      } else {
        return {
          ...prev,
          [name]: [...currentArray, value],
        };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const payload = {
      age: parseInt(formData.age),
      weight: parseFloat(formData.weight),
      height: parseInt(formData.height),
      gender: formData.gender,
      fitness_level: formData.fitnessLevel,
      goals: formData.goals,
      dietary_restrictions: formData.dietaryRestrictions,
      // backend expects List[str] — split the textarea on commas/newlines
      medical_conditions: formData.medicalConditions
        ? formData.medicalConditions.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean)
        : [],
    };

    try {
      const result = await dispatch(updateUserProfile(payload));
      if (result.meta?.requestStatus === 'fulfilled') {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Profile setup error:', error);
    }
  };

  return (
    <div className="form-container">
      <div className="form-card">
        <h1>Complete Your Profile</h1>
        <p className="form-subtitle">Help us understand your fitness journey</p>

        <form onSubmit={handleSubmit} className="profile-form">
          {/* Basic Info */}
          <div className="form-section">
            <h2>Basic Information</h2>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="age">Age</label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  min="13"
                  max="120"
                  className={validationErrors.age ? 'input-error' : ''}
                />
                {validationErrors.age && <span className="error-text">{validationErrors.age}</span>}
              </div>

              <div className="form-group">
                <label>Gender</label>
                <CustomSelect name="gender" value={formData.gender} onChange={handleChange}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </CustomSelect>
              </div>
            </div>

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
                  min="30"
                  max="500"
                  className={validationErrors.weight ? 'input-error' : ''}
                />
                {validationErrors.weight && <span className="error-text">{validationErrors.weight}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="height">Height (cm)</label>
                <input
                  type="number"
                  id="height"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  min="50"
                  max="250"
                  className={validationErrors.height ? 'input-error' : ''}
                />
                {validationErrors.height && <span className="error-text">{validationErrors.height}</span>}
              </div>
            </div>
          </div>

          {/* Fitness Info */}
          <div className="form-section">
            <h2>Fitness Information</h2>

            <div className="form-group">
              <label>Current Fitness Level</label>
              <CustomSelect name="fitnessLevel" value={formData.fitnessLevel} onChange={handleChange}>
                {fitnessLevels.map((level) => (
                  <option key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </option>
                ))}
              </CustomSelect>
            </div>

            <div className="form-group">
              <label>Fitness Goals (select at least one)</label>
              <div className="checkbox-group">
                {goalOptions.map((goal) => (
                  <label key={goal.value} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.goals.includes(goal.value)}
                      onChange={() => handleCheckboxChange('goals', goal.value)}
                    />
                    {goal.label}
                  </label>
                ))}
              </div>
              {validationErrors.goals && <span className="error-text">{validationErrors.goals}</span>}
            </div>
          </div>

          {/* Dietary & Medical Info */}
          <div className="form-section">
            <h2>Dietary & Medical Information</h2>

            <div className="form-group">
              <label>Dietary Restrictions</label>
              <div className="checkbox-group">
                {dietaryOptions.map((option) => (
                  <label key={option.value} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.dietaryRestrictions.includes(option.value)}
                      onChange={() => handleCheckboxChange('dietaryRestrictions', option.value)}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="medicalConditions">Medical Conditions (optional)</label>
              <textarea
                id="medicalConditions"
                name="medicalConditions"
                value={formData.medicalConditions}
                onChange={handleChange}
                placeholder="List any injuries, allergies, or conditions we should know about"
                rows="3"
              />
            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Saving Profile...' : 'Complete Setup'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetup;
