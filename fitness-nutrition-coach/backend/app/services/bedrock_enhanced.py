"""Enhanced Bedrock service with RAG integration for AI response generation."""

import json
import boto3
import logging
from typing import Optional, List, Dict, Any, Tuple
from app.core.config import settings
from app.services.rag_retrieval import FitnessDocumentRetriever

logger = logging.getLogger(__name__)


class EnhancedBedrockService:
    """Enhanced service for Amazon Bedrock integration with RAG."""

    def __init__(self):
        """Initialize Bedrock and RAG clients."""
        self.bedrock_client = boto3.client(
            "bedrock-runtime",
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        )
        
        self.rag_retriever = FitnessDocumentRetriever()
        self.model_id = settings.BEDROCK_MODEL_ID

    def generate_workout_with_rag(
        self,
        user_profile: dict,
        goal: str,
        duration_weeks: int,
        frequency: int,
        equipment: List[str],
        intensity: str,
        specific_requirements: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Generate a personalized workout plan using RAG.
        
        Flow:
        1. Retrieve relevant workout documents from knowledge base
        2. Build prompt with user profile and retrieved context
        3. Call Bedrock Claude model
        4. Parse and return response with citations
        
        Args:
            user_profile: User profile data
            goal: Workout goal
            duration_weeks: Duration in weeks
            frequency: Sessions per week
            equipment: Available equipment
            intensity: Workout intensity
            specific_requirements: Any specific requirements
            
        Returns:
            Dict with generated workout, citations, and metadata
        """
        try:
            # Step 1: Retrieve relevant documents
            documents, citations = self.rag_retriever.retrieve_workout_documents(
                goal=goal,
                equipment=equipment,
                intensity=intensity,
            )
            
            # Step 2: Format context
            context = self.rag_retriever.format_context_for_prompt(documents)
            
            # Step 3: Build prompt
            prompt = self._build_workout_prompt(
                user_profile=user_profile,
                goal=goal,
                duration_weeks=duration_weeks,
                frequency=frequency,
                equipment=equipment,
                intensity=intensity,
                specific_requirements=specific_requirements,
                rag_context=context,
            )
            
            logger.info(f"Generated workout prompt with {len(documents)} documents")
            
            # Step 4: Call Bedrock
            response_text = self._call_bedrock(prompt)
            
            # Step 5: Parse response
            workout_data = self._parse_json_response(response_text, "workout")
            
            return {
                "success": True,
                "workout": workout_data,
                "bedrock_response": response_text,
                "rag_documents": len(documents),
                "citations": citations,
                "tokens_estimated": self._estimate_tokens(prompt + response_text),
            }
            
        except Exception as e:
            logger.error(f"Error generating workout with RAG: {e}")
            return {
                "success": False,
                "error": str(e),
                "workout": None,
                "bedrock_response": None,
                "rag_documents": 0,
                "citations": [],
            }

    def generate_nutrition_with_rag(
        self,
        user_profile: dict,
        goal: str,
        duration_days: int,
        meals_per_day: int,
        daily_calories: int,
        diet_type: str,
        preferred_foods: Optional[List[str]] = None,
        avoided_foods: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Generate a personalized meal plan using RAG.
        
        Flow:
        1. Retrieve relevant nutrition documents
        2. Build prompt with user profile and retrieved context
        3. Call Bedrock Claude model
        4. Parse and return response with citations
        
        Args:
            user_profile: User profile data
            goal: Nutrition goal
            duration_days: Duration in days
            meals_per_day: Meals per day
            daily_calories: Target daily calories
            diet_type: Type of diet
            preferred_foods: List of preferred foods
            avoided_foods: List of foods to avoid
            
        Returns:
            Dict with generated meal plan, citations, and metadata
        """
        try:
            # Step 1: Retrieve relevant documents
            documents, citations = self.rag_retriever.retrieve_nutrition_documents(
                diet_type=diet_type,
                goal=goal,
                dietary_restrictions=user_profile.get("dietary_restrictions", []),
            )
            
            # Step 2: Format context
            context = self.rag_retriever.format_context_for_prompt(documents)
            
            # Step 3: Build prompt
            prompt = self._build_nutrition_prompt(
                user_profile=user_profile,
                goal=goal,
                duration_days=duration_days,
                meals_per_day=meals_per_day,
                daily_calories=daily_calories,
                diet_type=diet_type,
                preferred_foods=preferred_foods,
                avoided_foods=avoided_foods,
                rag_context=context,
            )
            
            logger.info(f"Generated nutrition prompt with {len(documents)} documents")
            
            # Step 4: Call Bedrock
            response_text = self._call_bedrock(prompt)
            
            # Step 5: Parse response
            meal_data = self._parse_json_response(response_text, "nutrition")
            
            return {
                "success": True,
                "meal_plan": meal_data,
                "bedrock_response": response_text,
                "rag_documents": len(documents),
                "citations": citations,
                "tokens_estimated": self._estimate_tokens(prompt + response_text),
            }
            
        except Exception as e:
            logger.error(f"Error generating nutrition with RAG: {e}")
            return {
                "success": False,
                "error": str(e),
                "meal_plan": None,
                "bedrock_response": None,
                "rag_documents": 0,
                "citations": [],
            }

    def chat_with_coach_rag(
        self,
        user_message: str,
        user_profile: dict,
        conversation_history: Optional[List[Dict]] = None,
    ) -> Dict[str, Any]:
        """
        Chat with AI fitness coach using RAG.
        
        Flow:
        1. Retrieve relevant health/fitness documents based on user message
        2. Build prompt with conversation history and context
        3. Call Bedrock Claude model
        4. Return response with citations
        
        Args:
            user_message: User's message
            user_profile: User profile data
            conversation_history: Previous messages
            
        Returns:
            Dict with AI response, citations, and metadata
        """
        try:
            # Step 1: Retrieve relevant documents
            documents, citations = self.rag_retriever.retrieve_health_documents(
                query=user_message,
                medical_conditions=user_profile.get("medical_conditions", []),
            )
            
            # Step 2: Format context
            context = self.rag_retriever.format_context_for_prompt(documents)
            
            # Step 3: Build prompt
            prompt = self._build_chat_prompt(
                user_message=user_message,
                user_profile=user_profile,
                rag_context=context,
                conversation_history=conversation_history,
            )
            
            logger.info(f"Generated chat prompt with {len(documents)} documents")
            
            # Step 4: Call Bedrock
            response_text = self._call_bedrock(prompt)
            
            return {
                "success": True,
                "ai_response": response_text,
                "rag_documents": len(documents),
                "citations": citations,
                "tokens_estimated": self._estimate_tokens(prompt + response_text),
            }
            
        except Exception as e:
            logger.error(f"Error in chat with RAG: {e}")
            return {
                "success": False,
                "error": str(e),
                "ai_response": None,
                "rag_documents": 0,
                "citations": [],
            }

    def _call_bedrock(self, prompt: str, max_tokens: int = 2000) -> str:
        """
        Call Bedrock Claude API with optimized parameters.
        
        Args:
            prompt: Prompt for the model
            max_tokens: Maximum tokens in response
            
        Returns:
            Model response text
        """
        try:
            logger.info(f"Calling Bedrock model: {self.model_id}")
            
            response = self.bedrock_client.invoke_model(
                modelId=self.model_id,
                body=json.dumps({
                    "anthropic_version": "bedrock-2023-06-01",
                    "max_tokens": max_tokens,
                    "temperature": 0.7,  # Balanced creativity
                    "messages": [
                        {
                            "role": "user",
                            "content": prompt,
                        }
                    ],
                }),
            )
            
            response_body = json.loads(response["body"].read())
            text = response_body.get("content", [{}])[0].get("text", "")
            
            logger.info("Successfully received response from Bedrock")
            return text
            
        except Exception as e:
            logger.error(f"Bedrock API error: {e}")
            raise

    def _build_workout_prompt(
        self,
        user_profile: dict,
        goal: str,
        duration_weeks: int,
        frequency: int,
        equipment: List[str],
        intensity: str,
        specific_requirements: Optional[str],
        rag_context: str,
    ) -> str:
        """Build optimized workout generation prompt."""
        prompt = f"""You are an expert fitness coach specializing in personalized workout plans.

KNOWLEDGE BASE CONTEXT:
{rag_context}

---

USER PROFILE:
- Age: {user_profile.get('age', 'Unknown')} years
- Weight: {user_profile.get('weight', 'Unknown')} kg
- Height: {user_profile.get('height', 'Unknown')} cm
- Fitness Level: {user_profile.get('fitness_level', 'Intermediate')}
- Medical Conditions: {', '.join(user_profile.get('medical_conditions', [])) or 'None'}
- Goals: {', '.join(user_profile.get('goals', [])) or 'General fitness'}

WORKOUT REQUIREMENTS:
- Primary Goal: {goal.replace('_', ' ').title()}
- Duration: {duration_weeks} weeks
- Frequency: {frequency} sessions per week
- Available Equipment: {', '.join(equipment) if equipment else 'Bodyweight only'}
- Intensity Level: {intensity.title()}
- Special Requirements: {specific_requirements or 'None'}

TASK:
Create a detailed, personalized {goal.replace('_', ' ')} workout plan that:
1. Is appropriate for the user's fitness level and medical history
2. Uses only the available equipment
3. Matches the specified intensity level
4. Can be completed in {duration_weeks} weeks at {frequency} sessions/week
5. Progressively challenges the user
6. Includes warm-up and cool-down recommendations
7. Mentions safety precautions relevant to the medical conditions

RESPONSE FORMAT:
Provide the workout plan as JSON with this structure:
{{
    "name": "Descriptive plan name",
    "description": "Brief overview of the plan",
    "warm_up": {{
        "exercises": ["exercise 1", "exercise 2"],
        "duration_minutes": 5
    }},
    "exercises": [
        {{
            "name": "Exercise name",
            "sets": 3,
            "reps": "10-12",
            "rest_seconds": 60,
            "notes": "Form tips or modifications",
            "equipment_needed": ["dumbbell"],
            "difficulty": "Intermediate"
        }}
    ],
    "cool_down": {{
        "exercises": ["stretch 1", "stretch 2"],
        "duration_minutes": 5
    }},
    "weekly_schedule": {{
        "monday": "Upper body focus",
        "wednesday": "Lower body focus",
        "friday": "Full body focus"
    }},
    "progression_tips": "How to increase difficulty over weeks",
    "safety_notes": "Important considerations based on medical history"
}}

Ensure all recommendations are safe and appropriate for the user's profile."""
        return prompt

    def _build_nutrition_prompt(
        self,
        user_profile: dict,
        goal: str,
        duration_days: int,
        meals_per_day: int,
        daily_calories: int,
        diet_type: str,
        preferred_foods: Optional[List[str]],
        avoided_foods: Optional[List[str]],
        rag_context: str,
    ) -> str:
        """Build optimized nutrition generation prompt."""
        prompt = f"""You are an expert nutritionist specializing in personalized meal plans.

KNOWLEDGE BASE CONTEXT:
{rag_context}

---

USER PROFILE:
- Age: {user_profile.get('age', 'Unknown')} years
- Weight: {user_profile.get('weight', 'Unknown')} kg
- Fitness Level: {user_profile.get('fitness_level', 'Unknown')}
- Dietary Restrictions: {', '.join(user_profile.get('dietary_restrictions', [])) or 'None'}
- Medical Conditions: {', '.join(user_profile.get('medical_conditions', [])) or 'None'}

MEAL PLAN REQUIREMENTS:
- Goal: {goal.replace('_', ' ').title()}
- Duration: {duration_days} days
- Meals per Day: {meals_per_day}
- Daily Calorie Target: {daily_calories} calories
- Diet Type: {diet_type.title()}
- Preferred Foods: {', '.join(preferred_foods) if preferred_foods else 'No preference'}
- Foods to Avoid: {', '.join(avoided_foods) if avoided_foods else 'None'}

TASK:
Create a detailed meal plan that:
1. Respects all dietary restrictions
2. Accommodates all medical conditions
3. Meets the daily calorie target
4. Includes only preferred foods
5. Excludes all foods to avoid
6. Is sustainable and balanced
7. Provides variety throughout the duration

RESPONSE FORMAT:
Provide the meal plan as JSON with this structure:
{{
    "name": "Descriptive plan name",
    "description": "Brief overview",
    "daily_totals": {{
        "calories": {daily_calories},
        "protein_grams": 150,
        "carbs_grams": 200,
        "fats_grams": 65,
        "fiber_grams": 30
    }},
    "macros": {{
        "protein_percentage": 30,
        "carbs_percentage": 45,
        "fats_percentage": 25
    }},
    "meals": [
        {{
            "meal_type": "Breakfast",
            "time": "7:00 AM",
            "foods": [
                {{
                    "name": "Food name",
                    "quantity": "150g",
                    "calories": 200,
                    "protein_grams": 15,
                    "carbs_grams": 20,
                    "fats_grams": 5,
                    "prep_notes": "How to prepare"
                }}
            ],
            "total_calories": 500
        }}
    ],
    "shopping_list": ["Ingredient 1", "Ingredient 2"],
    "preparation_tips": "Meal prep suggestions",
    "hydration_notes": "Water intake recommendations",
    "supplements": "Optional supplements to consider",
    "dietary_notes": "Important notes about the plan"
}}

Ensure all meals are practical, delicious, and meet nutritional requirements."""
        return prompt

    def _build_chat_prompt(
        self,
        user_message: str,
        user_profile: dict,
        rag_context: str,
        conversation_history: Optional[List[Dict]],
    ) -> str:
        """Build optimized chat prompt."""
        history_section = ""
        if conversation_history:
            history_section = "\nRECENT CONVERSATION HISTORY:\n"
            for msg in conversation_history[-5:]:  # Last 5 messages
                history_section += f"User: {msg.get('user_message', '')}\n"
                history_section += f"Coach: {msg.get('ai_response', '')}\n\n"
        
        prompt = f"""You are an experienced AI Fitness and Nutrition Coach. Your role is to:
- Provide personalized, evidence-based fitness and nutrition guidance
- Be encouraging and motivating
- Respect medical limitations and dietary restrictions
- Give specific, actionable advice
- Reference the knowledge base when providing recommendations

KNOWLEDGE BASE CONTEXT:
{rag_context}

---

USER PROFILE:
- Age: {user_profile.get('age', 'Unknown')} years
- Weight: {user_profile.get('weight', 'Unknown')} kg
- Fitness Level: {user_profile.get('fitness_level', 'Unknown')}
- Goals: {', '.join(user_profile.get('goals', [])) or 'Not specified'}
- Medical Conditions: {', '.join(user_profile.get('medical_conditions', [])) or 'None'}
- Dietary Restrictions: {', '.join(user_profile.get('dietary_restrictions', [])) or 'None'}
{history_section}

USER MESSAGE: {user_message}

RESPONSE GUIDELINES:
1. Address the user's question directly and specifically
2. Provide personalized advice based on their profile
3. Reference relevant research or guidelines from the knowledge base
4. Give actionable steps they can take
5. Be encouraging and supportive
6. Mention safety considerations if relevant
7. Suggest related topics they might find helpful

Please provide a helpful, personalized response."""
        return prompt

    def _parse_json_response(self, response: str, response_type: str = "generic") -> dict:
        """
        Parse JSON from Bedrock response.
        
        Args:
            response: Response text from Bedrock
            response_type: Type of response (workout, nutrition, etc.)
            
        Returns:
            Parsed JSON dict or fallback dict
        """
        try:
            import re
            # Try to find JSON block in response
            json_match = re.search(r'\{[\s\S]*\}', response)
            if json_match:
                json_str = json_match.group()
                parsed = json.loads(json_str)
                logger.info(f"Successfully parsed {response_type} response")
                return parsed
        except Exception as e:
            logger.warning(f"Failed to parse JSON response: {e}")
        
        # Return fallback structure based on type
        if response_type == "workout":
            return {
                "name": "Workout Plan",
                "description": response,
                "exercises": [],
            }
        elif response_type == "nutrition":
            return {
                "name": "Meal Plan",
                "description": response,
                "meals": [],
            }
        else:
            return {"response": response}

    def _estimate_tokens(self, text: str) -> int:
        """Estimate tokens used (rough approximation)."""
        # Claude uses roughly 1 token per 4 characters
        return len(text) // 4
