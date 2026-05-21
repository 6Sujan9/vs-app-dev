"""AI service for Bedrock integration and RAG retrieval."""

import json
import re
import boto3
from typing import Optional, List, Dict, Any
from app.core.config import settings


_NOVA_MICRO = "amazon.nova-micro-v1:0"


class BedrockService:
    """Service for Amazon Bedrock integration."""

    def __init__(self):
        """Initialize Bedrock clients."""
        self.client = boto3.client(
            "bedrock-runtime",
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        )
        self.kb_client = boto3.client(
            "bedrock-agent-runtime",
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        )

    def chat_with_coach(
        self,
        user_message: str,
        user_profile: Optional[dict] = None,
        conversation_history: Optional[List[Dict]] = None,
    ) -> Dict[str, Any]:
        """Chat with AI fitness coach, using Knowledge Base when available."""
        # Try Knowledge Base first
        if settings.BEDROCK_KNOWLEDGE_BASE_ID:
            try:
                response = self.kb_client.retrieve_and_generate(
                    input={"text": user_message},
                    retrieveAndGenerateConfiguration={
                        "type": "KNOWLEDGE_BASE",
                        "knowledgeBaseConfiguration": {
                            "knowledgeBaseId": settings.BEDROCK_KNOWLEDGE_BASE_ID,
                            "modelArn": f"arn:aws:bedrock:{settings.AWS_REGION}::foundation-model/{settings.BEDROCK_MODEL_ID}",
                            "generationConfiguration": {
                                "promptTemplate": {
                                    "textPromptTemplate": (
                                        "You are a fitness and nutrition coach. "
                                        "Only answer questions about fitness, exercise, nutrition, diet, and health. "
                                        "If the question is unrelated to these topics, reply with exactly: "
                                        "'I can only help with fitness and nutrition questions.' "
                                        "Do not explain or elaborate.\n\n"
                                        "$search_results$\n\nUser: $query$"
                                    )
                                }
                            },
                        },
                    },
                )
                ai_response = response["output"]["text"]
                return {
                    "ai_response": ai_response,
                    "rag_context": [],
                    "model": settings.BEDROCK_MODEL_ID,
                    "tokens_used": len(ai_response) // 4,
                }
            except Exception as e:
                print(f"Bedrock KB unavailable, falling back to direct model: {e}")

        # Fallback: call model directly
        prompt = self._build_chat_prompt(user_message, user_profile or {}, [], conversation_history)
        ai_response = self._call_bedrock(prompt)
        return {
            "ai_response": ai_response,
            "rag_context": [],
            "model": settings.BEDROCK_MODEL_ID,
            "tokens_used": self._estimate_tokens(prompt + ai_response),
        }

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
        """Generate a workout plan using Bedrock."""
        rag_context = self._retrieve_rag_documents(
            query=f"workout plan for {goal} training {intensity} intensity",
            limit=3,
        )

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

        response = self._call_nova(prompt)

        try:
            workout_data = self._parse_workout_response(response)
        except Exception as e:
            print(f"Workout parse error: {e}\nRaw response: {response[:500]}")
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
        """Generate a meal plan using Bedrock."""
        rag_context = self._retrieve_rag_documents(
            query=f"{diet_type} meal plan for {goal} {daily_calories} calories",
            limit=3,
        )

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

        response = self._call_nova(prompt)

        try:
            meal_data = self._parse_nutrition_response(response)
        except Exception as e:
            print(f"Nutrition parse error: {e}\nRaw response: {response[:500]}")
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

    def _retrieve_rag_documents(self, query: str, limit: int = 3) -> List[str]:
        """Retrieve relevant documents from knowledge base."""
        if not settings.BEDROCK_KNOWLEDGE_BASE_ID:
            return []

        try:
            response = self.kb_client.retrieve(
                knowledgeBaseId=settings.BEDROCK_KNOWLEDGE_BASE_ID,
                retrievalQuery={"text": query},
                retrievalConfiguration={
                    "vectorSearchConfiguration": {"numberOfResults": limit},
                },
            )
            return [
                result.get("content", {}).get("text", "")
                for result in response.get("retrievalResults", [])
            ]
        except Exception as e:
            print(f"RAG retrieval error: {e}")
            return []

    def _call_nova(self, prompt: str, max_tokens: int = 2000) -> str:
        """Call Nova Micro model — raises on failure so callers see the real error."""
        body = json.dumps({
            "messages": [{"role": "user", "content": [{"text": prompt}]}],
            "inferenceConfig": {"maxTokens": max_tokens},
        })
        response = self.client.invoke_model(modelId=_NOVA_MICRO, body=body)
        response_body = json.loads(response["body"].read())
        return response_body["output"]["message"]["content"][0]["text"]

    def _call_bedrock(self, prompt: str) -> str:
        """Call Bedrock model API (used for chat fallback)."""
        try:
            model_id = settings.BEDROCK_MODEL_ID
            if "nova" in model_id:
                body = json.dumps({
                    "messages": [{"role": "user", "content": [{"text": prompt}]}],
                    "inferenceConfig": {"maxTokens": 2000},
                })
            else:
                body = json.dumps({
                    "anthropic_version": "bedrock-2023-06-01",
                    "max_tokens": 2000,
                    "messages": [{"role": "user", "content": prompt}],
                })
            response = self.client.invoke_model(modelId=model_id, body=body)
            response_body = json.loads(response["body"].read())
            if "nova" in model_id:
                return response_body.get("output", {}).get("message", {}).get("content", [{}])[0].get("text", "")
            return response_body.get("content", [{}])[0].get("text", "")
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

        return f"""
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

Please provide a detailed workout plan in JSON format:
{{
    "name": "Plan Name",
    "description": "Brief description",
    "exercises": [
        {{
            "name": "Exercise Name",
            "sets": 3,
            "reps": 10,
            "duration_minutes": null,
            "rest_seconds": 60,
            "notes": "Any tips"
        }}
    ]
}}
"""

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

        return f"""
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

Please provide a meal plan in JSON format:
{{
    "name": "Plan Name",
    "description": "Brief description",
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
"""

    def _build_chat_prompt(
        self,
        user_message: str,
        user_profile: dict,
        rag_context: List[str],
        conversation_history: Optional[List[Dict]] = None,
    ) -> str:
        """Build chat prompt."""
        context_text = "\n".join(rag_context) if rag_context else ""
        history_text = ""
        if conversation_history:
            for msg in conversation_history[-5:]:
                history_text += f"\nUser: {msg.get('user_message', '')}\nAssistant: {msg.get('ai_response', '')}"

        return f"""You are a fitness and nutrition coach. Only answer questions about fitness, exercise, nutrition, diet, and health.
If the question is unrelated to these topics, reply with exactly: "I can only help with fitness and nutrition questions." Do not explain or elaborate.

USER PROFILE:
- Age: {user_profile.get('age', 'Unknown')}
- Weight: {user_profile.get('weight', 'Unknown')} kg
- Fitness Level: {user_profile.get('fitness_level', 'Unknown')}
- Goals: {', '.join(user_profile.get('goals', []) or ['Not specified'])}
{f'CONVERSATION HISTORY:{history_text}' if history_text else ''}
{f'KNOWLEDGE BASE CONTEXT:{chr(10)}{context_text}' if context_text else ''}
USER MESSAGE: {user_message}

Provide concise, personalized advice. Keep responses short and to the point."""

    def _parse_workout_response(self, response: str) -> dict:
        """Parse workout response from Bedrock."""
        cleaned = re.sub(r'```(?:json)?\s*', '', response).strip()
        json_match = re.search(r'\{.*\}', cleaned, re.DOTALL)
        if json_match:
            data = json.loads(json_match.group())
            # Handle wrapped structures
            if 'workout_plan' in data:
                data = data['workout_plan']
            elif 'workout' in data and isinstance(data['workout'], dict):
                data = data['workout']
            # Normalize exercises list
            exercises = data.get('exercises', [])
            normalized = []
            for ex in exercises:
                if isinstance(ex, dict):
                    normalized.append({
                        'name': ex.get('name', 'Exercise'),
                        'sets': ex.get('sets'),
                        'reps': ex.get('reps'),
                        'duration_minutes': ex.get('duration_minutes'),
                        'rest_seconds': ex.get('rest_seconds'),
                        'notes': ex.get('notes') or ex.get('instructions') or ex.get('description') or '',
                    })
            data['exercises'] = normalized
            return data
        return {
            "name": "Generated Workout",
            "description": "Your workout plan has been generated.",
            "exercises": [],
        }

    def _parse_nutrition_response(self, response: str) -> dict:
        """Parse nutrition response from Bedrock."""
        cleaned = re.sub(r'```(?:json)?\s*', '', response).strip()
        json_match = re.search(r'\{.*\}', cleaned, re.DOTALL)
        if json_match:
            data = json.loads(json_match.group())
            if 'meal_plan' in data:
                data = data['meal_plan']
            elif 'plan' in data and isinstance(data['plan'], dict):
                data = data['plan']
            # Normalize meals list
            meals = data.get('meals', [])
            normalized = []
            for meal in meals:
                if isinstance(meal, dict):
                    foods = meal.get('foods', meal.get('ingredients', meal.get('items', [])))
                    if isinstance(foods, str):
                        foods = [f.strip() for f in foods.split(',')]
                    normalized.append({
                        'name': meal.get('name', 'Meal'),
                        'calories': meal.get('calories'),
                        'protein_grams': meal.get('protein_grams', meal.get('protein', 0)),
                        'carbs_grams': meal.get('carbs_grams', meal.get('carbs', 0)),
                        'fats_grams': meal.get('fats_grams', meal.get('fats', 0)),
                        'foods': foods,
                        'time': meal.get('time', ''),
                        'notes': meal.get('notes', ''),
                    })
            data['meals'] = normalized
            return data
        return {
            "name": "Generated Meal Plan",
            "description": "Your meal plan has been generated.",
            "meals": [],
        }

    def _estimate_tokens(self, text: str) -> int:
        """Estimate tokens (rough approximation: ~4 chars per token)."""
        return len(text) // 4
