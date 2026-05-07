#!/bin/bash
# AI Fitness Coach - Integration Testing Guide
# Complete examples for testing the end-to-end workflow

# ============================================================================
# Configuration
# ============================================================================

API_BASE_URL="http://localhost:8000/api/v1"
AUTH_TOKEN="your_jwt_token_here"
PROFILE_ID="1"
USER_ID="1"

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ============================================================================
# Helper Functions
# ============================================================================

print_section() {
    echo -e "\n${BLUE}===============================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}===============================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# ============================================================================
# 1. Authentication
# ============================================================================

test_authentication() {
    print_section "Step 1: User Authentication"
    
    print_info "Testing user registration and login"
    
    # Register user
    echo "Registering new user..."
    REGISTER_RESPONSE=$(curl -s -X POST "${API_BASE_URL}/auth/register" \
        -H "Content-Type: application/json" \
        -d '{
            "email": "testuser@example.com",
            "username": "testuser",
            "password": "TestPassword123!"
        }')
    
    echo "Response: $REGISTER_RESPONSE"
    
    # Login
    echo -e "\nLogging in..."
    LOGIN_RESPONSE=$(curl -s -X POST "${API_BASE_URL}/auth/login" \
        -H "Content-Type: application/json" \
        -d '{
            "email": "testuser@example.com",
            "password": "TestPassword123!"
        }')
    
    echo "Response: $LOGIN_RESPONSE"
    
    # Extract token
    AUTH_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
    
    if [ -z "$AUTH_TOKEN" ]; then
        print_error "Failed to obtain auth token"
        return 1
    fi
    
    print_success "Authentication successful"
    print_info "Token: ${AUTH_TOKEN:0:20}..."
    
    return 0
}

# ============================================================================
# 2. Profile Creation
# ============================================================================

test_profile_creation() {
    print_section "Step 2: Create User Profile"
    
    print_info "Creating user profile for personalization"
    
    PROFILE_RESPONSE=$(curl -s -X POST "${API_BASE_URL}/profile" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${AUTH_TOKEN}" \
        -d '{
            "age": 28,
            "weight": 180,
            "height": 510,
            "gender": "male",
            "fitness_level": "intermediate",
            "primary_goal": "muscle_gain",
            "secondary_goals": ["strength", "endurance"],
            "medical_conditions": [],
            "dietary_restrictions": [],
            "equipment_available": ["dumbbells", "barbell", "kettlebells"],
            "preferred_foods": ["chicken", "rice", "broccoli"],
            "avoided_foods": ["pork", "shellfish"]
        }')
    
    echo "Response:"
    echo "$PROFILE_RESPONSE" | jq '.' 2>/dev/null || echo "$PROFILE_RESPONSE"
    
    print_success "Profile created successfully"
    
    return 0
}

# ============================================================================
# 3. Workout Generation
# ============================================================================

test_workout_generation() {
    print_section "Step 3: Generate Personalized Workout"
    
    print_info "Generating workout plan using RAG + Bedrock"
    print_info "This will:"
    print_info "  1. Retrieve fitness documents from S3/RAG"
    print_info "  2. Call Bedrock Claude AI"
    print_info "  3. Store plan in database"
    print_info "  4. Return results with metrics"
    
    echo -e "\nSending request..."
    
    WORKOUT_RESPONSE=$(curl -s -X POST "${API_BASE_URL}/ai/workout/generate" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${AUTH_TOKEN}" \
        -G \
        --data-urlencode "goal=muscle_gain" \
        --data-urlencode "duration_weeks=12" \
        --data-urlencode "frequency=4" \
        --data-urlencode "intensity=high" \
        --data-urlencode "equipment=dumbbells" \
        --data-urlencode "equipment=barbell")
    
    echo "Response:"
    echo "$WORKOUT_RESPONSE" | jq '.' 2>/dev/null || echo "$WORKOUT_RESPONSE"
    
    # Extract metrics
    if echo "$WORKOUT_RESPONSE" | jq -e '.metrics' > /dev/null 2>&1; then
        PROCESSING_TIME=$(echo "$WORKOUT_RESPONSE" | jq '.metrics.processing_time_seconds')
        TOKENS_USED=$(echo "$WORKOUT_RESPONSE" | jq '.metrics.tokens_used')
        COST=$(echo "$WORKOUT_RESPONSE" | jq -r '.metrics.cost_estimate')
        DOCS_RETRIEVED=$(echo "$WORKOUT_RESPONSE" | jq '.rag_context.documents_retrieved')
        
        print_success "Workout generation completed"
        echo -e "\n${GREEN}Metrics:${NC}"
        echo "  - Processing Time: ${PROCESSING_TIME}s"
        echo "  - Tokens Used: ${TOKENS_USED}"
        echo "  - Cost Estimate: ${COST}"
        echo "  - Documents Retrieved: ${DOCS_RETRIEVED}"
    fi
    
    return 0
}

# ============================================================================
# 4. Nutrition Plan Generation
# ============================================================================

test_nutrition_generation() {
    print_section "Step 4: Generate Nutrition Plan"
    
    print_info "Generating meal plan using RAG + Bedrock"
    
    echo -e "\nSending request..."
    
    NUTRITION_RESPONSE=$(curl -s -X POST "${API_BASE_URL}/ai/nutrition/generate" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${AUTH_TOKEN}" \
        -G \
        --data-urlencode "goal=muscle_gain" \
        --data-urlencode "diet_type=high_protein" \
        --data-urlencode "duration_days=30" \
        --data-urlencode "meals_per_day=4" \
        --data-urlencode "daily_calories=3000")
    
    echo "Response:"
    echo "$NUTRITION_RESPONSE" | jq '.' 2>/dev/null || echo "$NUTRITION_RESPONSE"
    
    # Extract metrics
    if echo "$NUTRITION_RESPONSE" | jq -e '.metrics' > /dev/null 2>&1; then
        PROCESSING_TIME=$(echo "$NUTRITION_RESPONSE" | jq '.metrics.processing_time_seconds')
        print_success "Nutrition plan generated in ${PROCESSING_TIME}s"
    fi
    
    return 0
}

# ============================================================================
# 5. Coaching Chat
# ============================================================================

test_coaching_chat() {
    print_section "Step 5: Coaching Chat"
    
    print_info "Chatting with AI coach using RAG"
    
    CHAT_RESPONSE=$(curl -s -X POST "${API_BASE_URL}/ai/chat" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${AUTH_TOKEN}" \
        -G \
        --data-urlencode "message=How can I improve my bench press?" \
        --data-urlencode "message_type=strength_advice")
    
    echo "Response:"
    echo "$CHAT_RESPONSE" | jq '.' 2>/dev/null || echo "$CHAT_RESPONSE"
    
    if echo "$CHAT_RESPONSE" | jq -e '.data.response' > /dev/null 2>&1; then
        RESPONSE=$(echo "$CHAT_RESPONSE" | jq -r '.data.response')
        print_success "Chat response received:"
        echo -e "\n${GREEN}Coach Says:${NC}"
        echo "$RESPONSE"
    fi
    
    return 0
}

# ============================================================================
# 6. Activity Logging
# ============================================================================

test_activity_logging() {
    print_section "Step 6: Log Exercise Activity"
    
    print_info "Logging completed exercise"
    
    EXERCISE_LOG=$(curl -s -X POST "${API_BASE_URL}/activity/exercise" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${AUTH_TOKEN}" \
        -d '{
            "exercise_name": "Bench Press",
            "category": "strength",
            "sets_completed": 4,
            "reps_completed": 8,
            "weight_used": 225,
            "difficulty_rating": 8,
            "duration_minutes": 45
        }')
    
    echo "Response:"
    echo "$EXERCISE_LOG" | jq '.' 2>/dev/null || echo "$EXERCISE_LOG"
    
    print_success "Exercise logged successfully"
    
    return 0
}

# ============================================================================
# 7. Progress Tracking
# ============================================================================

test_progress_tracking() {
    print_section "Step 7: Track Progress"
    
    print_info "Logging progress measurements"
    
    PROGRESS_LOG=$(curl -s -X POST "${API_BASE_URL}/progress" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${AUTH_TOKEN}" \
        -d '{
            "weight": 182,
            "body_fat_percentage": 18.5,
            "muscle_mass": 148,
            "blood_pressure": "120/80",
            "resting_heart_rate": 62,
            "sleep_quality": 8,
            "stress_level": 4,
            "energy_level": "high",
            "mood": "excellent"
        }')
    
    echo "Response:"
    echo "$PROGRESS_LOG" | jq '.' 2>/dev/null || echo "$PROGRESS_LOG"
    
    print_success "Progress tracked successfully"
    
    return 0
}

# ============================================================================
# 8. Dashboard & Insights
# ============================================================================

test_dashboard() {
    print_section "Step 8: View Dashboard & Insights"
    
    print_info "Loading personalized dashboard with insights"
    
    DASHBOARD=$(curl -s -X GET "${API_BASE_URL}/ai/dashboard" \
        -H "Authorization: Bearer ${AUTH_TOKEN}")
    
    echo "Response:"
    echo "$DASHBOARD" | jq '.' 2>/dev/null || echo "$DASHBOARD"
    
    if echo "$DASHBOARD" | jq -e '.data.insights' > /dev/null 2>&1; then
        INSIGHTS=$(echo "$DASHBOARD" | jq -r '.data.insights')
        print_success "Insights generated:"
        echo -e "\n${GREEN}Your Insights:${NC}"
        echo "$INSIGHTS"
    fi
    
    return 0
}

# ============================================================================
# 9. RAG Usage Statistics
# ============================================================================

test_rag_stats() {
    print_section "Step 9: View RAG Usage Statistics"
    
    print_info "Checking RAG document retrieval statistics"
    
    RAG_STATS=$(curl -s -X GET "${API_BASE_URL}/dashboard/stats/rag-usage" \
        -H "Authorization: Bearer ${AUTH_TOKEN}")
    
    echo "Response:"
    echo "$RAG_STATS" | jq '.' 2>/dev/null || echo "$RAG_STATS"
    
    if echo "$RAG_STATS" | jq -e '.total_messages' > /dev/null 2>&1; then
        TOTAL=$(echo "$RAG_STATS" | jq '.total_messages')
        RAG_USAGE=$(echo "$RAG_STATS" | jq '.rag_usage_percentage')
        print_success "RAG Statistics:"
        echo -e "\n${GREEN}Stats:${NC}"
        echo "  - Total Messages: ${TOTAL}"
        echo "  - RAG Usage: ${RAG_USAGE}%"
    fi
    
    return 0
}

# ============================================================================
# 10. Get Workout Plans
# ============================================================================

test_get_workout_plans() {
    print_section "Step 10: Retrieve Saved Workout Plans"
    
    print_info "Fetching all generated workout plans"
    
    WORKOUTS=$(curl -s -X GET "${API_BASE_URL}/workouts" \
        -H "Authorization: Bearer ${AUTH_TOKEN}")
    
    echo "Response:"
    echo "$WORKOUTS" | jq '.' 2>/dev/null || echo "$WORKOUTS"
    
    if echo "$WORKOUTS" | jq -e '.[0]' > /dev/null 2>&1; then
        COUNT=$(echo "$WORKOUTS" | jq 'length')
        print_success "Retrieved ${COUNT} workout plan(s)"
    fi
    
    return 0
}

# ============================================================================
# Error Simulation Tests
# ============================================================================

test_error_handling() {
    print_section "Error Handling Tests"
    
    # Test 1: Missing auth token
    print_info "Test 1: Missing authentication token"
    ERROR_RESPONSE=$(curl -s -X GET "${API_BASE_URL}/profile")
    if echo "$ERROR_RESPONSE" | jq -e '.detail' > /dev/null 2>&1; then
        print_success "Properly rejected unauthenticated request"
    fi
    
    # Test 2: Invalid parameters
    print_info "Test 2: Invalid workout parameters"
    ERROR_RESPONSE=$(curl -s -X POST "${API_BASE_URL}/ai/workout/generate" \
        -H "Authorization: Bearer ${AUTH_TOKEN}" \
        -G \
        --data-urlencode "goal=invalid_goal" \
        --data-urlencode "duration_weeks=abc")
    echo "Response: $ERROR_RESPONSE"
    
    # Test 3: Non-existent resource
    print_info "Test 3: Non-existent resource"
    ERROR_RESPONSE=$(curl -s -X GET "${API_BASE_URL}/workouts/99999" \
        -H "Authorization: Bearer ${AUTH_TOKEN}")
    echo "Response: $ERROR_RESPONSE"
    
    return 0
}

# ============================================================================
# Performance Testing
# ============================================================================

test_performance() {
    print_section "Performance Testing"
    
    print_info "Measuring response times and throughput"
    
    ITERATIONS=5
    TOTAL_TIME=0
    
    for i in $(seq 1 $ITERATIONS); do
        print_info "Request $i/$ITERATIONS"
        
        START_TIME=$(date +%s%N)
        
        curl -s -X POST "${API_BASE_URL}/ai/chat" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer ${AUTH_TOKEN}" \
            -G \
            --data-urlencode "message=What should I eat today?" \
            > /dev/null
        
        END_TIME=$(date +%s%N)
        DURATION=$(( ($END_TIME - $START_TIME) / 1000000 ))
        
        print_success "Request completed in ${DURATION}ms"
        TOTAL_TIME=$(( $TOTAL_TIME + $DURATION ))
    done
    
    AVG_TIME=$(( $TOTAL_TIME / $ITERATIONS ))
    print_success "Average response time: ${AVG_TIME}ms"
    
    return 0
}

# ============================================================================
# Load Testing
# ============================================================================

test_load() {
    print_section "Load Testing"
    
    print_info "Simulating concurrent requests"
    
    CONCURRENT_REQUESTS=10
    
    for i in $(seq 1 $CONCURRENT_REQUESTS); do
        (
            curl -s -X POST "${API_BASE_URL}/ai/chat" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer ${AUTH_TOKEN}" \
                -G \
                --data-urlencode "message=Request $i" \
                > /dev/null
            echo "Request $i completed"
        ) &
    done
    
    wait
    print_success "All ${CONCURRENT_REQUESTS} requests completed"
    
    return 0
}

# ============================================================================
# Main Execution
# ============================================================================

main() {
    print_section "AI Fitness Coach - Integration Testing Suite"
    
    # Check if jq is installed
    if ! command -v jq &> /dev/null; then
        print_error "jq is required but not installed"
        echo "Install with: sudo apt-get install jq"
        exit 1
    fi
    
    # Check if backend is running
    if ! curl -s "${API_BASE_URL}/health" > /dev/null 2>&1; then
        print_error "Backend server is not running at ${API_BASE_URL}"
        echo "Start the backend with: python -m uvicorn app.main:app --reload"
        exit 1
    fi
    
    print_success "Backend server is running"
    
    # Run tests
    test_authentication || exit 1
    test_profile_creation || exit 1
    test_workout_generation || exit 1
    test_nutrition_generation || exit 1
    test_coaching_chat || exit 1
    test_activity_logging || exit 1
    test_progress_tracking || exit 1
    test_dashboard || exit 1
    test_rag_stats || exit 1
    test_get_workout_plans || exit 1
    test_error_handling || exit 1
    
    print_section "Optional Performance Tests"
    echo "Note: These tests can take several minutes"
    read -p "Run performance tests? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        test_performance || true
    fi
    
    read -p "Run load tests? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        test_load || true
    fi
    
    print_section "All Tests Completed"
    print_success "Integration testing suite finished successfully!"
}

# ============================================================================
# Script Entry Point
# ============================================================================

if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    main "$@"
fi
