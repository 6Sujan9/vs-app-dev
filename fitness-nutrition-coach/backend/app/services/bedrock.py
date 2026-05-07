"""AI service for Bedrock integration and RAG retrieval."""

import json
import boto3
from typing import Optional, List, Dict, Any
from app.core.config import settings


class BedrockService:
    """Service for Amazon Bedrock integration."""

    def __init__(self):
        """Initialize Bedrock client."""
        self.client = boto3.client(
            "bedrock-runtime",
            region_name=settings.AWS_REGION,
        )
        self.kb_client = boto3.client(
            "bedrock-agent-runtime",
            region_name=settings.AWS_REGION,
        )

    def generate_workout(
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
        Generate a workout plan using Bedrock.
        
        Args:
            user_profile: User profile data
            goal: Workout goal
            duration_weeks: Duration in weeks
            frequency: Sessions per week
            equipment: Available equipment
            intensity: Workout intensity
            specific_requirements: Any specific requirements
            
        Returns:
            Dict with generated workout and metadata
        """
        # Retrieve relevant documents from knowledge base
        rag_context = self._retrieve_rag_documents(
            query=f"workout plan for {goal} training {intensity} intensity",
            limit=3
        )
        
        # Build prompt
        prompt = self._build_workout_prompt(
            user_profile=user_profile,
            goal=goal,
            duration_weeks=duration_weeks,
            frequency=frequency,
            equipment=equipment,
            intensity=intensity,
            specific_requirements=specific_requirements,
            rag_context=rag_context,
        )
        
        # Call Bedrock
        response = self._call_bedrock(prompt)
        
        # Parse response
        try:
            workout_data = self._parse_workout_response(response)
        except:
            workout_data = {
                "name": f"{goal.replace('_', ' ').title()} Plan",
                "description": response,
                "exercises": [],
            }
        
        return {
            "workout": workout_data,
            "bedrock_response": response,
            "rag_documents": rag_context,
            "tokens_used": self._estimate_tokens(prompt + response),
        }

    def generate_meal_plan(
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
        Generate a meal plan using Bedrock.
        
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
            Dict with generated meal plan and metadata
        """
        # Retrieve relevant documents
        rag_context = self._retrieve_rag_documents(
            query=f"{diet_type} meal plan for {goal} {daily_calories} calories",
            limit=3
        )
        
        # Build prompt
        prompt = self._build_nutrition_prompt(
            user_profile=user_profile,
            goal=goal,
            duration_days=duration_days,
            meals_per_day=meals_per_day,
            daily_calories=daily_calories,
            diet_type=diet_type,
            preferred_foods=preferred_foods,
            avoided_foods=avoided_foods,
            rag_context=rag_context,
        )
        
        # Call Bedrock
        response = self._call_bedrock(prompt)
        
        # Parse response
        try:
            meal_data = self._parse_nutrition_response(response)
        except:
            meal_data = {
                "name": f"{diet_type.title()} Meal Plan",
                "description": response,
                "meals": [],
            }
        
        return {
            "meal_plan": meal_data,
            "bedrock_response": response,
            "rag_documents": rag_context,
            "tokens_used": self._estimate_tokens(prompt + response),
        }

    def chat_with_coach(
        self,
        user_message: str,
        user_profile: dict,
        conversation_history: Optional[List[Dict]] = None,
    ) -> Dict[str, Any]:
        """
        Chat with AI fitness coach.
        
        Args:
            user_message: User's message
            user_profile: User profile data
            conversation_history: Previous messages
            
        Returns:
            Dict with AI response and metadata
        """
        # Retrieve relevant documents
        rag_context = self._retrieve_rag_documents(
            query=user_message,
            limit=3
        )
        
        # Build prompt
        prompt = self._build_chat_prompt(
            user_message=user_message,
            user_profile=user_profile,
            rag_context=rag_context,
            conversation_history=conversation_history,
        )
        
        # Call Bedrock
        response = self._call_bedrock(prompt)
        
        return {
            "ai_response": response,
            "rag_context": rag_context,
            "tokens_used": self._estimate_tokens(prompt + response),
        }

    def _retrieve_rag_documents(
        self,
        query: str,
        limit: int = 3,
    ) -> List[str]:
        """
        Retrieve relevant documents from knowledge base.
        
        Args:
            query: Search query
            limit: Max documents to return
            
        Returns:
            List of relevant document excerpts
        """
        if not settings.BEDROCK_KNOWLEDGE_BASE_ID:
            return []
        
        try:
            response = self.kb_client.retrieve(
                knowledgeBaseId=settings.BEDROCK_KNOWLEDGE_BASE_ID,
                retrievalConfiguration={
                    "vectorSearchConfiguration": {
                        "numberOfResults": limit,
                    }
                },
                text=query,
            )
            
            documents = []
            for result in response.get("retrievalResults", []):
                documents.append(result.get("content", ""))
            
            return documents
        except Exception as e:
            print(f"RAG retrieval error: {e}")
            return []

    def _call_bedrock(self, prompt: str) -> str:
        """
        Call Bedrock API.
        
        Args:
            prompt: Prompt for the model
            
        Returns:
            Model response text
        """
        try:
            response = self.client.invoke_model(
                modelId=settings.BEDROCK_MODEL_ID,
                body=json.dumps({
                    "anthropic_version": "bedrock-2023-06-01",
                    "max_tokens": 2000,
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
            return text
        except Exception as e:
            print(f"Bedrock error: {e}")
            return "Unable to generate content at this time."

    def _build_workout_prompt(
        self,
        user_profile: dict,
        goal: str,
        duration_weeks: int,
        frequency: int,
        equipment: List[str],
        intensity: str,
        specific_requirements: Optional[str],
        rag_context: List[str],
    ) -> str:
        """Build workout generation prompt."""
        context_text = "\n".join(rag_context) if rag_context else "No context available"
        
        prompt = f"""
Based on the following fitness knowledge base and user profile, create a personalized {goal.replace('_', ' ')} workout plan.

USER PROFILE:
- Age: {user_profile.get('age', 'Unknown')}
- Weight: {user_profile.get('weight', 'Unknown')} kg
- Height: {user_profile.get('height', 'Unknown')} cm
- Fitness Level: {user_profile.get('fitness_level', 'Unknown')}
- Medical Conditions: {', '.join(user_profile.get('medical_conditions', [])) or 'None'}

REQUIREMENTS:
- Duration: {duration_weeks} weeks
- Frequency: {frequency} sessions per week
- Available Equipment: {', '.join(equipment)}
- Intensity Level: {intensity}
- Special Requirements: {specific_requirements or 'None'}

KNOWLEDGE BASE CONTEXT:
{context_text}

Please provide a detailed workout plan in JSON format with the following structure:
{{
    "name": "Plan Name",
    "description": "Brief description",
    "exercises": [
        {{
            "name": "Exercise Name",
            "sets": 3,
            "reps": 10,
            "duration_minutes": 30,
            "rest_seconds": 60,
            "notes": "Any tips"
        }}
    ]
}}

Ensure all exercises match the available equipment and user fitness level.
"""
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
        rag_context: List[str],
    ) -> str:
        """Build nutrition generation prompt."""
        context_text = "\n".join(rag_context) if rag_context else "No context available"
        
        prompt = f"""
Based on the following nutrition knowledge base and user profile, create a personalized meal plan.

USER PROFILE:
- Age: {user_profile.get('age', 'Unknown')}
- Weight: {user_profile.get('weight', 'Unknown')} kg
- Fitness Level: {user_profile.get('fitness_level', 'Unknown')}
- Dietary Restrictions: {', '.join(user_profile.get('dietary_restrictions', [])) or 'None'}
- Medical Conditions: {', '.join(user_profile.get('medical_conditions', [])) or 'None'}

REQUIREMENTS:
- Goal: {goal}
- Duration: {duration_days} days
- Meals per Day: {meals_per_day}
- Daily Calories: {daily_calories}
- Diet Type: {diet_type}
- Preferred Foods: {', '.join(preferred_foods or ['None specified'])}
- Foods to Avoid: {', '.join(avoided_foods or ['None specified'])}

KNOWLEDGE BASE CONTEXT:
{context_text}

Please provide a meal plan in JSON format with the following structure:
{{
    "name": "Plan Name",
    "description": "Brief description",
    "protein_grams": 150,
    "carbs_grams": 200,
    "fats_grams": 65,
    "meals": [
        {{
            "name": "Meal Name",
            "foods": ["Food 1", "Food 2"],
            "calories": 500,
            "protein_grams": 25,
            "carbs_grams": 60,
            "fats_grams": 15
        }}
    ]
}}

Ensure the plan respects all dietary restrictions and preferences.
"""
        return prompt

    def _build_chat_prompt(
        self,
        user_message: str,
        user_profile: dict,
        rag_context: List[str],
        conversation_history: Optional[List[Dict]],
    ) -> str:
        """Build chat prompt."""
        context_text = "\n".join(rag_context) if rag_context else "No context available"
        
        history_text = ""
        if conversation_history:
            for msg in conversation_history[-5:]:  # Last 5 messages for context
                history_text += f"\nUser: {msg.get('user_message', '')}\nAssistant: {msg.get('ai_response', '')}"
        
        prompt = f"""
You are an AI Fitness and Nutrition Coach. Help the user with their fitness and nutrition goals.

USER PROFILE:
- Age: {user_profile.get('age', 'Unknown')}
- Weight: {user_profile.get('weight', 'Unknown')} kg
- Fitness Level: {user_profile.get('fitness_level', 'Unknown')}
- Goals: {', '.join(user_profile.get('goals', []) or ['Not specified'])}

CONVERSATION HISTORY:{history_text}

KNOWLEDGE BASE CONTEXT:
{context_text}

USER MESSAGE: {user_message}

Please provide helpful, personalized advice based on their profile and the knowledge base. Be encouraging and specific.
"""
        return prompt

    def _parse_workout_response(self, response: str) -> dict:
        """Parse workout response from Bedrock."""
        # Try to extract JSON from response
        import re
        json_match = re.search(r'\{.*\}', response, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
        return {"description": response}

    def _parse_nutrition_response(self, response: str) -> dict:
        """Parse nutrition response from Bedrock."""
        # Try to extract JSON from response
        import re
        json_match = re.search(r'\{.*\}', response, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
        return {"description": response}

    def _estimate_tokens(self, text: str) -> int:
        """Estimate tokens used (rough approximation)."""
        # Rough estimate: ~4 characters per token
        return len(text) // 4
