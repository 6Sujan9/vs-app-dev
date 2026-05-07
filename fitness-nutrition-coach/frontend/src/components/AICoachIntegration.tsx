"""
React Component: AI Coach Integration Demo
Shows complete request-response flow with error handling and metrics
"""

import React, { useState, useCallback } from 'react';
import { WorkoutAPI, NutritionAPI, ChatAPI, DashboardAPI } from '../services/api';

// ============================================================================
// Types
// ============================================================================

interface ProcessingMetrics {
  processingTime: number;
  tokensUsed: number;
  costEstimate: string;
  documentsRetrieved: number;
  requestId: string;
}

interface RequestState {
  loading: boolean;
  error: string | null;
  metrics: ProcessingMetrics | null;
}

// ============================================================================
// Component
// ============================================================================

export const AICoachIntegration: React.FC = () => {
  // State for workout generation
  const [workoutState, setWorkoutState] = useState<RequestState>({
    loading: false,
    error: null,
    metrics: null,
  });
  const [workoutPlan, setWorkoutPlan] = useState(null);

  // State for nutrition generation
  const [nutritionState, setNutritionState] = useState<RequestState>({
    loading: false,
    error: null,
    metrics: null,
  });
  const [mealPlan, setMealPlan] = useState(null);

  // State for chat
  const [chatState, setChatState] = useState<RequestState>({
    loading: false,
    error: null,
    metrics: null,
  });
  const [chatResponse, setChatResponse] = useState(null);
  const [chatInput, setChatInput] = useState('');

  // State for dashboard
  const [dashboardState, setDashboardState] = useState<RequestState>({
    loading: false,
    error: null,
    metrics: null,
  });
  const [dashboard, setDashboard] = useState(null);

  // ============================================================================
  // Workout Generation Handler
  // ============================================================================

  const handleGenerateWorkout = useCallback(async () => {
    setWorkoutState({ loading: true, error: null, metrics: null });
    
    try {
      console.log('=== WORKOUT GENERATION FLOW STARTED ===');
      console.log('Step 1: Frontend sends request');
      
      const result = await WorkoutAPI.generateWorkout({
        goal: 'muscle_gain',
        duration_weeks: 12,
        frequency: 4,
        intensity: 'high',
        equipment: ['dumbbells', 'barbell'],
      });

      console.log('Step 2-5: Backend processed (RAG retrieval, Bedrock call, DB storage)');
      console.log('Response metrics:', result.metrics);

      setWorkoutPlan(result.plan);
      setWorkoutState({
        loading: false,
        error: null,
        metrics: {
          processingTime: result.metrics?.processing_time_seconds || 0,
          tokensUsed: result.metrics?.tokens_used || 0,
          costEstimate: result.metrics?.cost_estimate || '$0.00',
          documentsRetrieved: result.citations?.length || 0,
          requestId: result.requestId,
        },
      });
    } catch (error: any) {
      console.error('Workout generation error:', error.message);
      setWorkoutState({
        loading: false,
        error: error.message,
        metrics: null,
      });
    }
  }, []);

  // ============================================================================
  // Nutrition Generation Handler
  // ============================================================================

  const handleGenerateNutrition = useCallback(async () => {
    setNutritionState({ loading: true, error: null, metrics: null });
    
    try {
      console.log('=== NUTRITION GENERATION FLOW STARTED ===');
      
      const result = await NutritionAPI.generateNutritionPlan({
        goal: 'muscle_gain',
        diet_type: 'high_protein',
        duration_days: 30,
        meals_per_day: 4,
        daily_calories: 3000,
      });

      setMealPlan(result.plan);
      setNutritionState({
        loading: false,
        error: null,
        metrics: {
          processingTime: result.metrics?.processing_time_seconds || 0,
          tokensUsed: result.metrics?.tokens_used || 0,
          costEstimate: result.metrics?.cost_estimate || '$0.00',
          documentsRetrieved: result.citations?.length || 0,
          requestId: result.requestId,
        },
      });
    } catch (error: any) {
      console.error('Nutrition generation error:', error.message);
      setNutritionState({
        loading: false,
        error: error.message,
        metrics: null,
      });
    }
  }, []);

  // ============================================================================
  // Chat Handler
  // ============================================================================

  const handleSendChat = useCallback(async () => {
    if (!chatInput.trim()) return;

    setChatState({ loading: true, error: null, metrics: null });
    
    try {
      console.log('=== CHAT FLOW STARTED ===');
      
      const result = await ChatAPI.sendMessage({
        message: chatInput,
        message_type: 'general',
      });

      setChatResponse(result.message);
      setChatInput('');
      setChatState({
        loading: false,
        error: null,
        metrics: {
          processingTime: result.metrics?.processing_time_seconds || 0,
          tokensUsed: result.metrics?.tokens_used || 0,
          costEstimate: result.metrics?.cost_estimate || '$0.00',
          documentsRetrieved: result.citations?.length || 0,
          requestId: result.requestId,
        },
      });
    } catch (error: any) {
      console.error('Chat error:', error.message);
      setChatState({
        loading: false,
        error: error.message,
        metrics: null,
      });
    }
  }, [chatInput]);

  // ============================================================================
  // Dashboard Handler
  // ============================================================================

  const handleLoadDashboard = useCallback(async () => {
    setDashboardState({ loading: true, error: null, metrics: null });
    
    try {
      console.log('=== DASHBOARD LOAD STARTED ===');
      
      const result = await DashboardAPI.getDashboard();

      setDashboard(result.dashboard);
      setDashboardState({
        loading: false,
        error: null,
        metrics: {
          processingTime: result.metrics?.processing_time_seconds || 0,
          tokensUsed: 0,
          costEstimate: '$0.00',
          documentsRetrieved: 0,
          requestId: 'dashboard',
        },
      });
    } catch (error: any) {
      console.error('Dashboard error:', error.message);
      setDashboardState({
        loading: false,
        error: error.message,
        metrics: null,
      });
    }
  }, []);

  // ============================================================================
  // Metrics Display Component
  // ============================================================================

  const MetricsDisplay: React.FC<{ metrics: ProcessingMetrics | null; loading: boolean; error: string | null }> = ({
    metrics,
    loading,
    error,
  }) => {
    if (loading) {
      return <div className="metrics-loading">Processing... Please wait</div>;
    }

    if (error) {
      return <div className="metrics-error">Error: {error}</div>;
    }

    if (!metrics) {
      return null;
    }

    return (
      <div className="metrics-card">
        <h4>Processing Metrics</h4>
        <div className="metric-item">
          <span className="label">Request ID:</span>
          <span className="value">{metrics.requestId}</span>
        </div>
        <div className="metric-item">
          <span className="label">Processing Time:</span>
          <span className="value">{metrics.processingTime.toFixed(2)}s</span>
        </div>
        <div className="metric-item">
          <span className="label">Tokens Used:</span>
          <span className="value">{metrics.tokensUsed}</span>
        </div>
        <div className="metric-item">
          <span className="label">Cost Estimate:</span>
          <span className="value">{metrics.costEstimate}</span>
        </div>
        <div className="metric-item">
          <span className="label">Documents Retrieved:</span>
          <span className="value">{metrics.documentsRetrieved}</span>
        </div>
      </div>
    );
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="ai-coach-integration">
      <h1>AI Fitness Coach - Integration Demo</h1>
      <p className="subtitle">Complete request-response workflow with RAG and Bedrock</p>

      {/* ======== Workflow Diagram ======== */}
      <div className="workflow-diagram">
        <h2>Request-Response Flow</h2>
        <div className="flow-steps">
          <div className="step">Frontend</div>
          <div className="arrow">→</div>
          <div className="step">Backend</div>
          <div className="arrow">→</div>
          <div className="step">S3/RAG</div>
          <div className="arrow">→</div>
          <div className="step">Bedrock</div>
          <div className="arrow">→</div>
          <div className="step">Database</div>
          <div className="arrow">→</div>
          <div className="step">Response</div>
        </div>
      </div>

      {/* ======== Workout Generation Section ======== */}
      <section className="feature-section">
        <h2>Workout Generation</h2>
        <p>Generate personalized workout plan using RAG-enhanced Bedrock AI</p>
        
        <button
          onClick={handleGenerateWorkout}
          disabled={workoutState.loading}
          className="primary-button"
        >
          {workoutState.loading ? 'Generating...' : 'Generate Workout Plan'}
        </button>

        <MetricsDisplay
          metrics={workoutState.metrics}
          loading={workoutState.loading}
          error={workoutState.error}
        />

        {workoutPlan && (
          <div className="result-card">
            <h3>{workoutPlan.plan_name}</h3>
            <p><strong>Goal:</strong> {workoutPlan.goal}</p>
            <p><strong>Duration:</strong> {workoutPlan.duration_weeks} weeks</p>
            <p><strong>Frequency:</strong> {workoutPlan.frequency}x per week</p>
            <pre>{JSON.stringify(workoutPlan.workout, null, 2)}</pre>
          </div>
        )}
      </section>

      {/* ======== Nutrition Generation Section ======== */}
      <section className="feature-section">
        <h2>Nutrition Plan Generation</h2>
        <p>Generate personalized meal plan using RAG-enhanced Bedrock AI</p>
        
        <button
          onClick={handleGenerateNutrition}
          disabled={nutritionState.loading}
          className="primary-button"
        >
          {nutritionState.loading ? 'Generating...' : 'Generate Meal Plan'}
        </button>

        <MetricsDisplay
          metrics={nutritionState.metrics}
          loading={nutritionState.loading}
          error={nutritionState.error}
        />

        {mealPlan && (
          <div className="result-card">
            <h3>{mealPlan.plan_name}</h3>
            <p><strong>Goal:</strong> {mealPlan.goal}</p>
            <p><strong>Diet Type:</strong> {mealPlan.diet_type}</p>
            <p><strong>Daily Calories:</strong> {mealPlan.daily_calories}</p>
            <pre>{JSON.stringify(mealPlan.meal_plan, null, 2)}</pre>
          </div>
        )}
      </section>

      {/* ======== Chat Section ======== */}
      <section className="feature-section">
        <h2>AI Coaching Chat</h2>
        <p>Chat with AI coach using RAG-enhanced responses</p>
        
        <div className="chat-input-group">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendChat()}
            placeholder="Ask your AI coach a question..."
            disabled={chatState.loading}
          />
          <button
            onClick={handleSendChat}
            disabled={chatState.loading || !chatInput.trim()}
            className="primary-button"
          >
            {chatState.loading ? 'Responding...' : 'Send'}
          </button>
        </div>

        <MetricsDisplay
          metrics={chatState.metrics}
          loading={chatState.loading}
          error={chatState.error}
        />

        {chatResponse && (
          <div className="result-card">
            <h3>Coach Response</h3>
            <p className="response-text">{chatResponse.response}</p>
            <small>Message ID: {chatResponse.message_id}</small>
          </div>
        )}
      </section>

      {/* ======== Dashboard Section ======== */}
      <section className="feature-section">
        <h2>Dashboard & Insights</h2>
        <p>View complete dashboard with personalized insights</p>
        
        <button
          onClick={handleLoadDashboard}
          disabled={dashboardState.loading}
          className="primary-button"
        >
          {dashboardState.loading ? 'Loading...' : 'Load Dashboard'}
        </button>

        <MetricsDisplay
          metrics={dashboardState.metrics}
          loading={dashboardState.loading}
          error={dashboardState.error}
        />

        {dashboard && (
          <div className="result-card">
            <h3>Dashboard Data</h3>
            <pre>{JSON.stringify(dashboard, null, 2)}</pre>
          </div>
        )}
      </section>
    </div>
  );
};

// ============================================================================
// Styles (CSS-in-JS Alternative)
// ============================================================================

export const styles = `
  .ai-coach-integration {
    max-width: 1200px;
    margin: 0 auto;
    padding: 40px 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  }

  .ai-coach-integration h1 {
    color: #333;
    margin-bottom: 10px;
  }

  .subtitle {
    color: #666;
    font-size: 16px;
    margin-bottom: 40px;
  }

  .workflow-diagram {
    background: #f5f5f5;
    padding: 30px;
    border-radius: 8px;
    margin-bottom: 40px;
  }

  .flow-steps {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .flow-steps .step {
    background: #4CAF50;
    color: white;
    padding: 15px 20px;
    border-radius: 6px;
    font-weight: bold;
    text-align: center;
    min-width: 100px;
  }

  .flow-steps .arrow {
    color: #666;
    font-size: 20px;
    font-weight: bold;
  }

  .feature-section {
    background: white;
    border: 1px solid #e0e0e0;
    padding: 30px;
    margin-bottom: 30px;
    border-radius: 8px;
  }

  .feature-section h2 {
    color: #333;
    margin-top: 0;
    margin-bottom: 10px;
  }

  .feature-section p {
    color: #666;
    margin-bottom: 20px;
  }

  .primary-button {
    background: #4CAF50;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 16px;
    font-weight: bold;
    transition: background 0.3s;
  }

  .primary-button:hover:not(:disabled) {
    background: #45a049;
  }

  .primary-button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  .metrics-card {
    background: #f9f9f9;
    border-left: 4px solid #4CAF50;
    padding: 20px;
    margin: 20px 0;
    border-radius: 4px;
  }

  .metrics-card h4 {
    margin-top: 0;
    color: #333;
  }

  .metric-item {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid #eee;
  }

  .metric-item:last-child {
    border-bottom: none;
  }

  .metric-item .label {
    font-weight: bold;
    color: #555;
  }

  .metric-item .value {
    color: #4CAF50;
    font-family: monospace;
  }

  .metrics-loading {
    background: #e3f2fd;
    padding: 20px;
    border-radius: 4px;
    color: #1565c0;
    margin: 20px 0;
  }

  .metrics-error {
    background: #ffebee;
    padding: 20px;
    border-radius: 4px;
    color: #c62828;
    margin: 20px 0;
  }

  .result-card {
    background: #f5f5f5;
    padding: 20px;
    border-radius: 6px;
    margin-top: 20px;
  }

  .result-card h3 {
    margin-top: 0;
    color: #333;
  }

  .result-card p {
    color: #666;
    margin: 10px 0;
  }

  .response-text {
    font-size: 16px;
    line-height: 1.6;
    color: #333;
  }

  .result-card pre {
    background: #333;
    color: #0f0;
    padding: 15px;
    border-radius: 4px;
    overflow-x: auto;
    font-size: 12px;
  }

  .chat-input-group {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
  }

  .chat-input-group input {
    flex: 1;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 16px;
  }

  .chat-input-group button {
    min-width: 120px;
  }

  @media (max-width: 768px) {
    .flow-steps {
      flex-direction: column;
      gap: 15px;
    }

    .flow-steps .arrow {
      transform: rotate(90deg);
    }

    .chat-input-group {
      flex-direction: column;
    }

    .chat-input-group button {
      width: 100%;
    }
  }
`;

export default AICoachIntegration;
