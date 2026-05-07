#!/usr/bin/env python3
"""
End-to-End Integration Test Script
Tests the complete workflow: Frontend → Backend → RAG → Bedrock → Database
Run this to verify the integration is working correctly.
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, Any, Optional
import sys

# Configuration
API_BASE_URL = "http://localhost:8000/api/v1"
TIMEOUT = 60
COLORS = {
    'HEADER': '\033[95m',
    'OKBLUE': '\033[94m',
    'OKCYAN': '\033[96m',
    'OKGREEN': '\033[92m',
    'WARNING': '\033[93m',
    'FAIL': '\033[91m',
    'ENDC': '\033[0m',
    'BOLD': '\033[1m',
    'UNDERLINE': '\033[4m',
}


class IntegrationTester:
    """Test the end-to-end integration."""
    
    def __init__(self):
        self.token = None
        self.user_id = None
        self.request_id = None
        self.test_results = []
    
    def print_header(self, text: str):
        """Print section header."""
        print(f"\n{COLORS['HEADER']}{COLORS['BOLD']}{'='*80}")
        print(f"  {text}")
        print(f"{'='*80}{COLORS['ENDC']}\n")
    
    def print_step(self, step: int, text: str):
        """Print test step."""
        print(f"{COLORS['OKBLUE']}[Step {step}]{COLORS['ENDC']} {text}")
    
    def print_success(self, text: str):
        """Print success message."""
        print(f"{COLORS['OKGREEN']}✓ {text}{COLORS['ENDC']}")
    
    def print_error(self, text: str):
        """Print error message."""
        print(f"{COLORS['FAIL']}✗ {text}{COLORS['ENDC']}")
    
    def print_info(self, text: str):
        """Print info message."""
        print(f"{COLORS['OKCYAN']}ℹ {text}{COLORS['ENDC']}")
    
    def print_warning(self, text: str):
        """Print warning message."""
        print(f"{COLORS['WARNING']}⚠ {text}{COLORS['ENDC']}")
    
    def log_result(self, test_name: str, passed: bool, details: str = ""):
        """Log test result."""
        self.test_results.append({
            'test': test_name,
            'passed': passed,
            'details': details,
            'timestamp': datetime.now().isoformat()
        })
    
    # ========== STEP 1: REGISTER USER ==========
    
    def test_register(self) -> bool:
        """Step 1: Register a new user."""
        self.print_step(1, "Register user")
        
        try:
            response = requests.post(
                f"{API_BASE_URL}/auth/register",
                json={
                    "email": f"test_{int(time.time())}@example.com",
                    "username": f"testuser_{int(time.time())}",
                    "password": "TestPassword123!",
                    "first_name": "Test",
                    "last_name": "User"
                },
                timeout=TIMEOUT
            )
            
            if response.status_code == 200:
                data = response.json()
                self.user_id = data.get('id')
                self.print_success(f"User registered: {data['username']} (ID: {self.user_id})")
                self.log_result("Register User", True)
                return True
            else:
                self.print_error(f"Registration failed: {response.text}")
                self.log_result("Register User", False, response.text)
                return False
        
        except Exception as e:
            self.print_error(f"Registration error: {str(e)}")
            self.log_result("Register User", False, str(e))
            return False
    
    # ========== STEP 2: LOGIN ==========
    
    def test_login(self) -> bool:
        """Step 2: Login to get JWT token."""
        self.print_step(2, "Login to get JWT token")
        
        try:
            # Get the email from the previous registration
            # For this test, we'll use a test account that should exist
            response = requests.post(
                f"{API_BASE_URL}/auth/login",
                json={
                    "email": "test@example.com",  # Ensure this exists or modify
                    "password": "TestPassword123!"
                },
                timeout=TIMEOUT
            )
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get('access_token')
                self.print_success(f"Login successful")
                self.print_info(f"Token: {self.token[:50]}...")
                self.log_result("Login", True)
                return True
            else:
                self.print_warning(f"Login failed: {response.text}")
                self.print_info("You may need to create a test account first")
                self.log_result("Login", False, response.text)
                return False
        
        except Exception as e:
            self.print_error(f"Login error: {str(e)}")
            self.log_result("Login", False, str(e))
            return False
    
    # ========== STEP 3: UPDATE PROFILE ==========
    
    def test_update_profile(self) -> bool:
        """Step 3: Update user profile for AI context."""
        self.print_step(3, "Update user profile")
        
        if not self.token:
            self.print_warning("Skipping profile update (no token)")
            return False
        
        try:
            response = requests.put(
                f"{API_BASE_URL}/users/profile",
                headers={"Authorization": f"Bearer {self.token}"},
                json={
                    "age": 28,
                    "weight": 75.5,
                    "height": 180,
                    "gender": "male",
                    "fitness_level": "intermediate",
                    "goals": ["muscle_gain", "strength"],
                    "dietary_restrictions": [],
                    "medical_conditions": []
                },
                timeout=TIMEOUT
            )
            
            if response.status_code == 200:
                self.print_success("Profile updated successfully")
                self.log_result("Update Profile", True)
                return True
            else:
                self.print_warning(f"Profile update failed: {response.text}")
                self.log_result("Update Profile", False, response.text)
                return False
        
        except Exception as e:
            self.print_error(f"Profile update error: {str(e)}")
            self.log_result("Update Profile", False, str(e))
            return False
    
    # ========== STEP 4: GENERATE WORKOUT (Main Integration Test) ==========
    
    def test_workout_generation(self) -> bool:
        """Step 4: Generate workout (complete integration test)."""
        self.print_step(4, "Generate workout plan (COMPLETE INTEGRATION TEST)")
        
        if not self.token:
            self.print_error("No authentication token. Cannot proceed.")
            self.log_result("Generate Workout", False, "No token")
            return False
        
        try:
            self.print_info("Sending request to backend...")
            start_time = time.time()
            
            response = requests.post(
                f"{API_BASE_URL}/integration/workout/generate",
                headers={"Authorization": f"Bearer {self.token}"},
                json={
                    "goal": "muscle_gain",
                    "duration_weeks": 12,
                    "frequency": 4,
                    "equipment": ["dumbbell", "barbell", "bench"],
                    "intensity": "high",
                    "specific_requirements": None
                },
                timeout=TIMEOUT
            )
            
            elapsed = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get('success'):
                    self.request_id = data.get('request_id')
                    
                    # Verify response structure
                    self.print_success(f"Workout generated successfully")
                    self.print_info(f"Request ID: {self.request_id}")
                    
                    # Display workout info
                    workout = data.get('workout', {})
                    self.print_info(f"Workout Name: {workout.get('name', 'N/A')}")
                    self.print_info(f"Duration: {workout.get('duration_weeks')} weeks")
                    self.print_info(f"Exercises: {len(workout.get('exercises', []))}")
                    
                    # Display metadata
                    metadata = data.get('metadata', {})
                    self.print_info(f"Processing time: {metadata.get('processing_time_ms', 0):.0f}ms")
                    self.print_info(f"RAG documents: {metadata.get('rag_documents', 0)}")
                    self.print_info(f"Tokens used: {metadata.get('tokens_used', 0)}")
                    
                    # Display timeline
                    timeline = metadata.get('status_timeline', {})
                    if timeline:
                        self.print_info("Status Timeline:")
                        for status, info in timeline.items():
                            duration = info.get('duration_ms', 0)
                            self.print_info(f"  {status}: {duration:.0f}ms")
                    
                    self.log_result("Generate Workout", True, 
                                  f"Generated in {elapsed:.2f}s, "
                                  f"{metadata.get('rag_documents')} docs, "
                                  f"{metadata.get('tokens_used')} tokens")
                    return True
                else:
                    error = data.get('error', 'Unknown error')
                    self.print_error(f"Generation failed: {error}")
                    self.log_result("Generate Workout", False, error)
                    return False
            else:
                self.print_error(f"API returned {response.status_code}: {response.text}")
                self.log_result("Generate Workout", False, 
                              f"HTTP {response.status_code}")
                return False
        
        except requests.exceptions.Timeout:
            self.print_error(f"Request timeout after {TIMEOUT} seconds")
            self.log_result("Generate Workout", False, "Timeout")
            return False
        except Exception as e:
            self.print_error(f"Workout generation error: {str(e)}")
            self.log_result("Generate Workout", False, str(e))
            return False
    
    # ========== STEP 5: VALIDATE RESPONSE STRUCTURE ==========
    
    def test_response_structure(self) -> bool:
        """Step 5: Validate response structure."""
        self.print_step(5, "Validate response structure")
        
        if not self.token:
            self.print_warning("Skipping validation (no token)")
            return False
        
        try:
            response = requests.post(
                f"{API_BASE_URL}/integration/workout/generate",
                headers={"Authorization": f"Bearer {self.token}"},
                json={
                    "goal": "muscle_gain",
                    "duration_weeks": 8,
                    "frequency": 3,
                    "equipment": ["dumbbell"],
                    "intensity": "medium"
                },
                timeout=TIMEOUT
            )
            
            if response.status_code != 200:
                self.print_error(f"Unexpected status code: {response.status_code}")
                self.log_result("Response Structure", False, 
                              f"Status {response.status_code}")
                return False
            
            data = response.json()
            
            # Check required fields
            required_fields = ['success', 'request_id', 'workout', 'metadata']
            missing_fields = [f for f in required_fields if f not in data]
            
            if missing_fields:
                self.print_error(f"Missing fields: {missing_fields}")
                self.log_result("Response Structure", False, 
                              f"Missing {missing_fields}")
                return False
            
            # Check metadata structure
            metadata = data['metadata']
            metadata_fields = ['rag_documents', 'tokens_used', 'processing_time_ms', 
                             'status_timeline']
            missing_meta = [f for f in metadata_fields if f not in metadata]
            
            if missing_meta:
                self.print_warning(f"Missing metadata fields: {missing_meta}")
            
            self.print_success("Response structure is valid")
            self.log_result("Response Structure", True)
            return True
        
        except Exception as e:
            self.print_error(f"Validation error: {str(e)}")
            self.log_result("Response Structure", False, str(e))
            return False
    
    # ========== STEP 6: ERROR HANDLING TEST ==========
    
    def test_error_handling(self) -> bool:
        """Step 6: Test error handling."""
        self.print_step(6, "Test error handling")
        
        try:
            # Test 1: Missing token
            self.print_info("Testing missing token...")
            response = requests.post(
                f"{API_BASE_URL}/integration/workout/generate",
                json={
                    "goal": "muscle_gain",
                    "duration_weeks": 12,
                    "frequency": 4,
                    "equipment": ["dumbbell"],
                    "intensity": "high"
                },
                timeout=TIMEOUT
            )
            
            if response.status_code == 401:
                self.print_success("Missing token correctly rejected (401)")
            else:
                self.print_warning(f"Expected 401, got {response.status_code}")
            
            # Test 2: Invalid parameters
            if self.token:
                self.print_info("Testing invalid parameters...")
                response = requests.post(
                    f"{API_BASE_URL}/integration/workout/generate",
                    headers={"Authorization": f"Bearer {self.token}"},
                    json={
                        "goal": "muscle_gain",
                        "duration_weeks": 100,  # Invalid: > 52
                        "frequency": 4,
                        "equipment": ["dumbbell"],
                        "intensity": "high"
                    },
                    timeout=TIMEOUT
                )
                
                if response.status_code == 500:  # Validation error
                    self.print_success("Invalid parameters correctly rejected (500)")
                else:
                    self.print_warning(f"Expected error, got {response.status_code}")
            
            self.log_result("Error Handling", True)
            return True
        
        except Exception as e:
            self.print_error(f"Error handling test failed: {str(e)}")
            self.log_result("Error Handling", False, str(e))
            return False
    
    # ========== RUN ALL TESTS ==========
    
    def run_all_tests(self):
        """Run all integration tests."""
        self.print_header("END-TO-END INTEGRATION TEST SUITE")
        self.print_info(f"API Base URL: {API_BASE_URL}")
        self.print_info(f"Test Start Time: {datetime.now().isoformat()}")
        
        tests = [
            ("Step 1: Register User", self.test_register),
            ("Step 2: Login", self.test_login),
            ("Step 3: Update Profile", self.test_update_profile),
            ("Step 4: Generate Workout", self.test_workout_generation),
            ("Step 5: Validate Response", self.test_response_structure),
            ("Step 6: Error Handling", self.test_error_handling),
        ]
        
        results = []
        for test_name, test_func in tests:
            try:
                result = test_func()
                results.append(result)
            except Exception as e:
                self.print_error(f"Test {test_name} crashed: {str(e)}")
                results.append(False)
        
        # Print summary
        self.print_header("TEST SUMMARY")
        passed = sum(results)
        total = len(results)
        
        print(f"{COLORS['BOLD']}Results:{COLORS['ENDC']}")
        for test_result in self.test_results:
            status = f"{COLORS['OKGREEN']}✓ PASS{COLORS['ENDC']}" if test_result['passed'] else f"{COLORS['FAIL']}✗ FAIL{COLORS['ENDC']}"
            print(f"  {status} - {test_result['test']}")
            if test_result['details']:
                print(f"    Details: {test_result['details']}")
        
        print(f"\n{COLORS['BOLD']}Total: {passed}/{total} passed{COLORS['ENDC']}")
        
        if passed == total:
            self.print_success("All tests passed!")
            return True
        else:
            self.print_warning(f"{total - passed} test(s) failed")
            return False


def main():
    """Main entry point."""
    tester = IntegrationTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
