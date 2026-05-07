/**
 * End-to-End Integration Example Component
 * Demonstrates complete workflow: Frontend → Backend → RAG → Bedrock → Database
 */

import React, { useState } from 'react';
import axios from 'axios';

const IntegrationExample = () => {
  // ==================== STATE MANAGEMENT ====================
  
  const [loading, setLoading] = useState(false);
  const [requestId, setRequestId] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [processingTimeline, setProcessingTimeline] = useState([]);
  const [workoutForm, setWorkoutForm] = useState({
    goal: 'muscle_gain',
    duration_weeks: 12,
    frequency: 4,
    equipment: ['dumbbell', 'barbell'],
    intensity: 'high',
    specific_requirements: 'No leg exercises due to knee pain'
  });
  
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  
  // ==================== STEP 1: FORM HANDLING ====================
  
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setWorkoutForm(prev => ({
      ...prev,
      [name]: name === 'duration_weeks' || name === 'frequency' 
        ? parseInt(value) 
        : value
    }));
  };
  
  const handleEquipmentChange = (e) => {
    const { value, checked } = e.target;
    setWorkoutForm(prev => ({
      ...prev,
      equipment: checked 
        ? [...prev.equipment, value]
        : prev.equipment.filter(eq => eq !== value)
    }));
  };
  
  // ==================== STEP 2-6: CALL INTEGRATION ENDPOINT ====================
  
  const generateWorkout = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setProcessingTimeline([]);
    
    try {
      // Add timeline event
      const startTime = Date.now();
      addTimelineEvent('Request initiated');
      
      // Get JWT token from localStorage
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Not authenticated. Please login first.');
      }
      
      addTimelineEvent('Sending request to backend');
      
      // STEP 1: Send request to backend
      // Backend receives and authenticates
      const response = await axios.post(
        `${API_URL}/api/v1/integration/workout/generate`,
        workoutForm,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000 // 60 second timeout for long-running request
        }
      );
      
      addTimelineEvent('Received response from backend');
      
      const data = response.data;
      
      // Display results
      setRequestId(data.request_id);
      setResult(data);
      
      // Show timeline
      if (data.metadata?.status_timeline) {
        displayTimeline(data.metadata.status_timeline, startTime);
      }
      
      addTimelineEvent(
        `Success! Generated ${data.workout?.name || 'workout'}`,
        'success'
      );
      
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message;
      setError(errorMessage);
      addTimelineEvent(`Error: ${errorMessage}`, 'error');
      console.error('Integration error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // ==================== TIMELINE & PROGRESS TRACKING ====================
  
  const addTimelineEvent = (message, type = 'info') => {
    setProcessingTimeline(prev => [
      ...prev,
      {
        timestamp: new Date().toLocaleTimeString(),
        message,
        type
      }
    ]);
  };
  
  const displayTimeline = (statusTimeline, startTime) => {
    const events = Object.entries(statusTimeline).map(([status, info]) => {
      const duration = info.duration_ms || 0;
      return {
        timestamp: new Date().toLocaleTimeString(),
        message: `${status.replace(/_/g, ' ').toUpperCase()}: ${duration.toFixed(0)}ms`,
        type: 'backend'
      };
    });
    
    setProcessingTimeline(prev => [...prev, ...events]);
  };
  
  // ==================== RENDER ====================
  
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>🚀 End-to-End Integration Example</h1>
        <p style={styles.subtitle}>
          Complete workflow: Frontend → Backend → RAG → Bedrock → Database
        </p>
      </div>
      
      {/* ==================== FORM SECTION ==================== */}
      <div style={styles.section}>
        <h2>📝 Workout Generation Request</h2>
        <div style={styles.formGroup}>
          <label>Goal</label>
          <select 
            name="goal" 
            value={workoutForm.goal} 
            onChange={handleFormChange}
            style={styles.input}
          >
            <option value="muscle_gain">Muscle Gain</option>
            <option value="fat_loss">Fat Loss</option>
            <option value="strength">Strength</option>
            <option value="endurance">Endurance</option>
            <option value="flexibility">Flexibility</option>
          </select>
        </div>
        
        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label>Duration (weeks)</label>
            <input 
              type="number" 
              name="duration_weeks" 
              value={workoutForm.duration_weeks} 
              onChange={handleFormChange}
              min="1"
              max="52"
              style={styles.input}
            />
          </div>
          
          <div style={styles.formGroup}>
            <label>Frequency (sessions/week)</label>
            <input 
              type="number" 
              name="frequency" 
              value={workoutForm.frequency} 
              onChange={handleFormChange}
              min="1"
              max="7"
              style={styles.input}
            />
          </div>
          
          <div style={styles.formGroup}>
            <label>Intensity</label>
            <select 
              name="intensity" 
              value={workoutForm.intensity} 
              onChange={handleFormChange}
              style={styles.input}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
        
        <div style={styles.formGroup}>
          <label>Equipment</label>
          <div style={styles.checkboxGroup}>
            {['dumbbell', 'barbell', 'bench', 'treadmill', 'cable_machine'].map(eq => (
              <label key={eq} style={styles.checkbox}>
                <input
                  type="checkbox"
                  value={eq}
                  checked={workoutForm.equipment.includes(eq)}
                  onChange={handleEquipmentChange}
                />
                {eq.replace('_', ' ').toUpperCase()}
              </label>
            ))}
          </div>
        </div>
        
        <div style={styles.formGroup}>
          <label>Special Requirements</label>
          <textarea 
            name="specific_requirements" 
            value={workoutForm.specific_requirements} 
            onChange={handleFormChange}
            style={styles.textarea}
            placeholder="e.g., No leg exercises due to knee pain"
          />
        </div>
        
        <button 
          onClick={generateWorkout} 
          disabled={loading}
          style={{
            ...styles.button,
            opacity: loading ? 0.6 : 1,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '⏳ Generating...' : '✨ Generate Workout Plan'}
        </button>
      </div>
      
      {/* ==================== PROCESSING TIMELINE ==================== */}
      {processingTimeline.length > 0 && (
        <div style={styles.section}>
          <h2>⏱️ Processing Timeline</h2>
          <div style={styles.timeline}>
            {processingTimeline.map((event, idx) => (
              <div 
                key={idx} 
                style={{
                  ...styles.timelineEvent,
                  backgroundColor: 
                    event.type === 'error' ? '#fee' :
                    event.type === 'success' ? '#efe' :
                    event.type === 'backend' ? '#eef' :
                    '#f9f9f9'
                }}
              >
                <span style={styles.timelineTime}>{event.timestamp}</span>
                <span style={styles.timelineMessage}>{event.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* ==================== ERROR DISPLAY ==================== */}
      {error && (
        <div style={styles.errorSection}>
          <h2>❌ Error</h2>
          <p style={styles.errorMessage}>{error}</p>
        </div>
      )}
      
      {/* ==================== RESULTS SECTION ==================== */}
      {result && result.success && (
        <div style={styles.section}>
          <h2>✅ Generation Successful</h2>
          
          {/* Request ID */}
          <div style={styles.infoBox}>
            <strong>Request ID:</strong>
            <code style={styles.code}>{requestId}</code>
          </div>
          
          {/* Metadata */}
          {result.metadata && (
            <div style={styles.metadataGrid}>
              <div style={styles.metadataCard}>
                <h3>📊 RAG Retrieval</h3>
                <p style={styles.metadataValue}>
                  {result.metadata.rag_documents} documents retrieved
                </p>
              </div>
              
              <div style={styles.metadataCard}>
                <h3>💾 Token Usage</h3>
                <p style={styles.metadataValue}>
                  {result.metadata.tokens_used} tokens
                </p>
              </div>
              
              <div style={styles.metadataCard}>
                <h3>⚡ Processing Time</h3>
                <p style={styles.metadataValue}>
                  {result.metadata.processing_time_ms.toFixed(0)}ms
                </p>
              </div>
            </div>
          )}
          
          {/* Workout Details */}
          {result.workout && (
            <div style={styles.resultCard}>
              <h3>{result.workout.name}</h3>
              <p>{result.workout.description}</p>
              
              <div style={styles.detailsGrid}>
                <div>
                  <strong>Goal:</strong> {result.workout.goal}
                </div>
                <div>
                  <strong>Duration:</strong> {result.workout.duration_weeks} weeks
                </div>
                <div>
                  <strong>Frequency:</strong> {result.workout.frequency} sessions/week
                </div>
                <div>
                  <strong>Intensity:</strong> {result.workout.intensity}
                </div>
                <div>
                  <strong>Equipment:</strong> {result.workout.equipment.join(', ')}
                </div>
                <div>
                  <strong>Model:</strong> {result.workout.ai_model}
                </div>
              </div>
              
              {/* Exercises */}
              {result.workout.exercises && result.workout.exercises.length > 0 && (
                <div style={styles.exercisesSection}>
                  <h4>💪 Exercises</h4>
                  <div style={styles.exercisesList}>
                    {result.workout.exercises.slice(0, 5).map((ex, idx) => (
                      <div key={idx} style={styles.exerciseItem}>
                        <span style={styles.exerciseName}>
                          {ex.name || `Exercise ${idx + 1}`}
                        </span>
                        {ex.sets && ex.reps && (
                          <span style={styles.exerciseDetails}>
                            {ex.sets} sets × {ex.reps} reps
                          </span>
                        )}
                      </div>
                    ))}
                    {result.workout.exercises.length > 5 && (
                      <p style={styles.moreExercises}>
                        + {result.workout.exercises.length - 5} more exercises
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {/* RAG Sources */}
              {result.workout.rag_sources && result.workout.rag_sources.length > 0 && (
                <div style={styles.sourcesSection}>
                  <h4>📚 RAG Sources (Citations)</h4>
                  <div style={styles.sourcesList}>
                    {result.workout.rag_sources.map((source, idx) => (
                      <div key={idx} style={styles.sourceItem}>
                        <a href={source.source} target="_blank" rel="noopener noreferrer">
                          {source.source || `Source ${idx + 1}`}
                        </a>
                        <span style={styles.sourceScore}>
                          Relevance: {(source.score * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* ==================== WORKFLOW DOCUMENTATION ==================== */}
      <div style={styles.section}>
        <h2>📖 Complete Workflow</h2>
        <div style={styles.workflowSteps}>
          <WorkflowStep
            number={1}
            title="Frontend sends request"
            description="React component collects form data and sends POST request with JWT token"
          />
          <WorkflowStep
            number={2}
            title="Backend authenticates"
            description="Validates JWT token and extracts user profile from database"
          />
          <WorkflowStep
            number={3}
            title="Retrieve context (RAG)"
            description="Searches S3 bucket and Bedrock Knowledge Base for relevant fitness documents"
          />
          <WorkflowStep
            number={4}
            title="Call Bedrock AI"
            description="Sends prompt with user profile + RAG context to Claude 3 for generation"
          />
          <WorkflowStep
            number={5}
            title="Store in database"
            description="Saves generated plan to PostgreSQL with all metadata and citations"
          />
          <WorkflowStep
            number={6}
            title="Return response"
            description="Sends result to frontend with request ID, metadata, and timeline"
          />
        </div>
      </div>
      
      {/* ==================== ERROR HANDLING GUIDE ==================== */}
      <div style={styles.section}>
        <h2>🛡️ Error Handling</h2>
        <div style={styles.errorGuideGrid}>
          <ErrorGuide
            status="401 Unauthorized"
            cause="Missing or invalid JWT token"
            solution="Login again and ensure token is in localStorage"
          />
          <ErrorGuide
            status="400 Bad Request"
            cause="Invalid request parameters (invalid goal, range, etc)"
            solution="Check form validation and parameter ranges"
          />
          <ErrorGuide
            status="500 Server Error"
            cause="Backend processing failed (Bedrock, database, etc)"
            solution="Check server logs, verify AWS credentials, try again"
          />
          <ErrorGuide
            status="504 Timeout"
            cause="Request exceeded 60-second timeout"
            solution="Use async processing for long-running requests"
          />
        </div>
      </div>
    </div>
  );
};

// ==================== HELPER COMPONENTS ====================

const WorkflowStep = ({ number, title, description }) => (
  <div style={styles.workflowStep}>
    <div style={styles.stepNumber}>{number}</div>
    <div style={styles.stepContent}>
      <h4>{title}</h4>
      <p>{description}</p>
    </div>
  </div>
);

const ErrorGuide = ({ status, cause, solution }) => (
  <div style={styles.errorGuideItem}>
    <h4 style={styles.errorStatus}>{status}</h4>
    <p><strong>Cause:</strong> {cause}</p>
    <p><strong>Solution:</strong> {solution}</p>
  </div>
);

// ==================== STYLING ====================

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    backgroundColor: '#f8fafc',
    minHeight: '100vh'
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px',
    paddingBottom: '20px',
    borderBottom: '2px solid #6366f1'
  },
  subtitle: {
    color: '#666',
    fontSize: '16px',
    margin: '10px 0 0 0'
  },
  section: {
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  formGroup: {
    marginBottom: '16px'
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '16px'
  },
  input: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontFamily: 'inherit',
    fontSize: '14px'
  },
  textarea: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontFamily: 'inherit',
    fontSize: '14px',
    minHeight: '100px',
    resize: 'vertical'
  },
  checkboxGroup: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '12px',
    marginTop: '8px'
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer'
  },
  button: {
    backgroundColor: '#6366f1',
    color: '#fff',
    padding: '12px 24px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '16px',
    transition: 'background-color 0.3s'
  },
  timeline: {
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    overflow: 'hidden'
  },
  timelineEvent: {
    padding: '12px 16px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    gap: '16px',
    alignItems: 'center'
  },
  timelineTime: {
    fontWeight: '600',
    color: '#6366f1',
    minWidth: '120px'
  },
  timelineMessage: {
    flex: 1,
    color: '#333'
  },
  errorSection: {
    backgroundColor: '#fee',
    border: '1px solid #fcc',
    borderRadius: '6px',
    padding: '16px',
    marginBottom: '24px'
  },
  errorMessage: {
    color: '#c33',
    margin: '8px 0 0 0'
  },
  infoBox: {
    backgroundColor: '#f0f4ff',
    border: '1px solid #d0deff',
    borderRadius: '6px',
    padding: '12px 16px',
    marginBottom: '16px'
  },
  code: {
    display: 'block',
    fontFamily: 'monospace',
    backgroundColor: '#fff',
    padding: '8px',
    borderRadius: '4px',
    marginTop: '8px',
    color: '#666'
  },
  metadataGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
  },
  metadataCard: {
    backgroundColor: '#f0f4ff',
    border: '1px solid #d0deff',
    borderRadius: '6px',
    padding: '16px'
  },
  metadataValue: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#6366f1',
    margin: '8px 0 0 0'
  },
  resultCard: {
    backgroundColor: '#f9f9f9',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    padding: '16px',
    marginBottom: '16px'
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #e2e8f0'
  },
  exercisesSection: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #e2e8f0'
  },
  exercisesList: {
    display: 'grid',
    gap: '8px',
    marginTop: '8px'
  },
  exerciseItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    backgroundColor: '#f0f4ff',
    borderRadius: '4px'
  },
  exerciseName: {
    fontWeight: '500',
    color: '#333'
  },
  exerciseDetails: {
    fontSize: '12px',
    color: '#666'
  },
  moreExercises: {
    color: '#999',
    fontStyle: 'italic',
    margin: '8px 0 0 0'
  },
  sourcesSection: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #e2e8f0'
  },
  sourcesList: {
    display: 'grid',
    gap: '8px',
    marginTop: '8px'
  },
  sourceItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px'
  },
  sourceScore: {
    fontSize: '12px',
    color: '#999'
  },
  workflowSteps: {
    display: 'grid',
    gap: '16px'
  },
  workflowStep: {
    display: 'flex',
    gap: '16px',
    padding: '16px',
    backgroundColor: '#f0f4ff',
    borderRadius: '6px',
    borderLeft: '4px solid #6366f1'
  },
  stepNumber: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    backgroundColor: '#6366f1',
    color: '#fff',
    borderRadius: '50%',
    fontWeight: '600',
    flexShrink: 0
  },
  stepContent: {
    flex: 1
  },
  errorGuideGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px'
  },
  errorGuideItem: {
    padding: '16px',
    backgroundColor: '#fef3c7',
    border: '1px solid #fcd34d',
    borderRadius: '6px'
  },
  errorStatus: {
    color: '#92400e',
    margin: '0 0 8px 0'
  }
};

export default IntegrationExample;
