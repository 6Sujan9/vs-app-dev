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
        creds = {}
        if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
            creds = {
                "aws_access_key_id": settings.AWS_ACCESS_KEY_ID,
                "aws_secret_access_key": settings.AWS_SECRET_ACCESS_KEY,
            }
        self.client = boto3.client("bedrock-runtime", region_name=settings.AWS_REGION, **creds)
        self.kb_client = boto3.client("bedrock-agent-runtime", region_name=settings.AWS_REGION, **creds)

    # ------------------------------------------------------------------ #
    #  Public methods                                                       #
    # ------------------------------------------------------------------ #

    def chat_with_coach(
        self,
        user_message: str,
        user_profile: Optional[dict] = None,
        conversation_history: Optional[List[Dict]] = None,
    ) -> Dict[str, Any]:
        """Chat with AI fitness coach, using Knowledge Base when available."""
        if settings.BEDROCK_KNOWLEDGE_BASE_ID:
            try:
                response = self.kb_client.retrieve_and_generate(
                    input={"text": user_message},
                    retrieveAndGenerateConfiguration={
                        "type": "KNOWLEDGE_BASE",
                        "knowledgeBaseConfiguration": {
                            "knowledgeBaseId": settings.BEDROCK_KNOWLEDGE_BASE_ID,
                            "modelArn": f"arn:aws:bedrock:{settings.AWS_REGION}::foundation-model/{_NOVA_MICRO}",
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
                    "model": _NOVA_MICRO,
                    "tokens_used": len(ai_response) // 4,
                }
            except Exception as e:
                print(f"Bedrock KB unavailable, falling back to direct Nova Micro: {e}")

        # Fallback: call Nova Micro directly
        rag_context = self._retrieve_rag_documents(query=user_message, limit=2)
        prompt = self._build_chat_prompt(user_message, user_profile or {}, rag_context, conversation_history)
        try:
            ai_response = self._call_nova(prompt)
        except Exception as e:
            print(f"Nova Micro chat error: {e}")
            ai_response = "I'm having trouble connecting to the AI service. Please try again in a moment."
        return {
            "ai_response": ai_response,
            "rag_context": rag_context,
            "model": _NOVA_MICRO,
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
        """Generate a workout plan using RAG + Bedrock Nova Micro."""
        rag_context = self._retrieve_rag_documents(
            query=f"{goal} workout plan {intensity} intensity {' '.join(equipment)}",
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

        try:
            response = self._call_nova(prompt)
            workout_data = self._parse_workout_response(response, goal)
        except Exception as e:
            print(f"Workout generation error: {e}")
            response = ""
            workout_data = self._default_workout(goal)

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
        """Generate a meal plan using RAG + Bedrock Nova Micro."""
        rag_context = self._retrieve_rag_documents(
            query=f"{diet_type} meal plan {goal} {daily_calories} calories nutrition",
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

        try:
            response = self._call_nova(prompt)
            meal_data = self._parse_nutrition_response(response, goal, daily_calories, meals_per_day)
        except Exception as e:
            print(f"Meal plan generation error: {e}")
            response = ""
            meal_data = self._default_meal_plan(goal, daily_calories, meals_per_day, diet_type)

        return {
            "meal_plan": meal_data,
            "bedrock_response": response,
            "rag_documents": rag_context,
            "tokens_used": self._estimate_tokens(prompt + response),
        }

    # ------------------------------------------------------------------ #
    #  RAG retrieval                                                        #
    # ------------------------------------------------------------------ #

    def _retrieve_rag_documents(self, query: str, limit: int = 3) -> List[str]:
        """Retrieve relevant documents from Bedrock Knowledge Base."""
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

    # ------------------------------------------------------------------ #
    #  Bedrock callers                                                      #
    # ------------------------------------------------------------------ #

    def _call_nova(self, prompt: str, max_tokens: int = 2000) -> str:
        """Call Nova Micro — raises on failure so the caller sees the real error."""
        body = json.dumps({
            "messages": [{"role": "user", "content": [{"text": prompt}]}],
            "inferenceConfig": {"maxTokens": max_tokens},
        })
        response = self.client.invoke_model(modelId=_NOVA_MICRO, body=body)
        response_body = json.loads(response["body"].read())
        return response_body["output"]["message"]["content"][0]["text"]

    def _call_bedrock(self, prompt: str) -> str:
        """Call configured Bedrock model (used for chat fallback)."""
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

    # ------------------------------------------------------------------ #
    #  Prompt builders                                                      #
    # ------------------------------------------------------------------ #

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
        context_section = ""
        if rag_context:
            context_section = "KNOWLEDGE BASE CONTEXT (use this to inform the exercises):\n"
            context_section += "\n---\n".join(rag_context) + "\n\n"

        return (
            "You are a fitness coach AI. "
            "Respond with ONLY valid JSON. No markdown. No explanation. No text before or after the JSON.\n\n"
            f"{context_section}"
            "USER PROFILE:\n"
            f"- Age: {user_profile.get('age', 'Unknown')}\n"
            f"- Weight: {user_profile.get('weight', 'Unknown')} kg\n"
            f"- Height: {user_profile.get('height', 'Unknown')} cm\n"
            f"- Fitness Level: {user_profile.get('fitness_level', 'intermediate')}\n"
            f"- Medical Conditions: {', '.join(user_profile.get('medical_conditions', [])) or 'None'}\n\n"
            "PLAN REQUIREMENTS:\n"
            f"- Goal: {goal.replace('_', ' ')}\n"
            f"- Duration: {duration_weeks} weeks\n"
            f"- Frequency: {frequency} sessions per week\n"
            f"- Equipment: {', '.join(equipment) or 'bodyweight only'}\n"
            f"- Intensity: {intensity}\n"
            f"- Special Requirements: {specific_requirements or 'None'}\n\n"
            "Generate a workout plan with 6-8 exercises. "
            "Return ONLY this JSON structure (start with { and end with }):\n"
            '{"name": "Plan Name", "description": "One sentence description", '
            '"exercises": [{"name": "Exercise Name", "sets": 3, "reps": 12, "rest_seconds": 60, "notes": "Form tip"}]}'
        )

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
        context_section = ""
        if rag_context:
            context_section = "KNOWLEDGE BASE CONTEXT (use this to inform the meals):\n"
            context_section += "\n---\n".join(rag_context) + "\n\n"

        return (
            "You are a nutrition coach AI. "
            "Respond with ONLY valid JSON. No markdown. No explanation. No text before or after the JSON.\n\n"
            f"{context_section}"
            "USER PROFILE:\n"
            f"- Age: {user_profile.get('age', 'Unknown')}\n"
            f"- Weight: {user_profile.get('weight', 'Unknown')} kg\n"
            f"- Fitness Level: {user_profile.get('fitness_level', 'Unknown')}\n"
            f"- Dietary Restrictions: {', '.join(user_profile.get('dietary_restrictions', [])) or 'None'}\n"
            f"- Medical Conditions: {', '.join(user_profile.get('medical_conditions', [])) or 'None'}\n\n"
            "PLAN REQUIREMENTS:\n"
            f"- Goal: {goal}\n"
            f"- Duration: {duration_days} days\n"
            f"- Meals per Day: {meals_per_day}\n"
            f"- Daily Calories: {daily_calories}\n"
            f"- Diet Type: {diet_type}\n"
            f"- Preferred Foods: {', '.join(preferred_foods or ['None specified'])}\n"
            f"- Foods to Avoid: {', '.join(avoided_foods or ['None specified'])}\n\n"
            f"Generate a meal plan with exactly {meals_per_day} meals totalling ~{daily_calories} calories per day. "
            "Return ONLY this JSON structure (start with { and end with }):\n"
            '{"name": "Plan Name", "description": "One sentence description", '
            '"meals": [{"name": "Meal Name", "foods": ["Food 1", "Food 2"], '
            '"calories": 500, "protein_grams": 30, "carbs_grams": 50, "fats_grams": 15, "notes": "Tip"}]}'
        )

    def _build_chat_prompt(
        self,
        user_message: str,
        user_profile: dict,
        rag_context: List[str],
        conversation_history: Optional[List[Dict]] = None,
    ) -> str:
        context_text = "\n".join(rag_context) if rag_context else ""
        history_text = ""
        if conversation_history:
            for msg in conversation_history[-5:]:
                history_text += f"\nUser: {msg.get('user_message', '')}\nAssistant: {msg.get('ai_response', '')}"

        return (
            "You are a fitness and nutrition coach. Only answer questions about fitness, exercise, nutrition, diet, and health. "
            'If the question is unrelated to these topics, reply with exactly: "I can only help with fitness and nutrition questions." '
            "Do not explain or elaborate.\n\n"
            "USER PROFILE:\n"
            f"- Age: {user_profile.get('age', 'Unknown')}\n"
            f"- Weight: {user_profile.get('weight', 'Unknown')} kg\n"
            f"- Fitness Level: {user_profile.get('fitness_level', 'Unknown')}\n"
            f"- Goals: {', '.join(user_profile.get('goals', []) or ['Not specified'])}\n"
            + (f"CONVERSATION HISTORY:{history_text}\n" if history_text else "")
            + (f"KNOWLEDGE BASE CONTEXT:\n{context_text}\n" if context_text else "")
            + f"USER MESSAGE: {user_message}\n\n"
            "Provide concise, personalized advice. Keep responses short and to the point."
        )

    # ------------------------------------------------------------------ #
    #  Response parsers                                                     #
    # ------------------------------------------------------------------ #

    def _parse_workout_response(self, response: str, goal: str = "") -> dict:
        """Parse JSON from Bedrock workout response."""
        # Strip markdown fences if present
        cleaned = re.sub(r'```(?:json)?\s*|```', '', response).strip()

        json_match = re.search(r'\{.*\}', cleaned, re.DOTALL)
        if json_match:
            try:
                data = json.loads(json_match.group())
                # Unwrap nested structures
                if 'workout_plan' in data:
                    data = data['workout_plan']
                elif 'workout' in data and isinstance(data['workout'], dict):
                    data = data['workout']

                exercises = data.get('exercises', [])
                normalized = []
                for ex in exercises:
                    if isinstance(ex, dict):
                        normalized.append({
                            'name': ex.get('name', 'Exercise'),
                            'sets': ex.get('sets'),
                            'reps': ex.get('reps'),
                            'duration_minutes': ex.get('duration_minutes'),
                            'rest_seconds': ex.get('rest_seconds', 60),
                            'notes': ex.get('notes') or ex.get('instructions') or ex.get('description') or '',
                        })
                data['exercises'] = normalized if normalized else self._default_workout(goal)['exercises']
                return data
            except json.JSONDecodeError as e:
                print(f"JSON decode error: {e}\nCleaned response: {cleaned[:300]}")

        # JSON not found or invalid — return a real default
        return self._default_workout(goal)

    def _parse_nutrition_response(
        self, response: str, goal: str = "", daily_calories: int = 2000, meals_per_day: int = 3
    ) -> dict:
        """Parse JSON from Bedrock nutrition response."""
        cleaned = re.sub(r'```(?:json)?\s*|```', '', response).strip()

        json_match = re.search(r'\{.*\}', cleaned, re.DOTALL)
        if json_match:
            try:
                data = json.loads(json_match.group())
                if 'meal_plan' in data:
                    data = data['meal_plan']
                elif 'plan' in data and isinstance(data['plan'], dict):
                    data = data['plan']

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
                data['meals'] = normalized if normalized else self._default_meal_plan(
                    goal, daily_calories, meals_per_day
                )['meals']
                return data
            except json.JSONDecodeError as e:
                print(f"JSON decode error: {e}\nCleaned response: {cleaned[:300]}")

        return self._default_meal_plan(goal, daily_calories, meals_per_day)

    # ------------------------------------------------------------------ #
    #  Default fallbacks (returned when Bedrock/parse fails)               #
    # ------------------------------------------------------------------ #

    def _default_workout(self, goal: str = "") -> dict:
        """Return a sensible default workout when generation fails."""
        goal_label = goal.replace('_', ' ').title() if goal else "General Fitness"
        return {
            "name": f"{goal_label} Workout Plan",
            "description": f"A balanced {goal_label.lower()} program designed to build strength and endurance.",
            "exercises": [
                {"name": "Push-ups", "sets": 3, "reps": 12, "rest_seconds": 60, "notes": "Keep core tight"},
                {"name": "Bodyweight Squats", "sets": 3, "reps": 15, "rest_seconds": 60, "notes": "Feet shoulder-width apart"},
                {"name": "Plank Hold", "sets": 3, "reps": None, "duration_minutes": 1, "rest_seconds": 45, "notes": "Breathe steadily"},
                {"name": "Lunges", "sets": 3, "reps": 12, "rest_seconds": 60, "notes": "Alternate legs"},
                {"name": "Mountain Climbers", "sets": 3, "reps": 20, "rest_seconds": 45, "notes": "Keep hips level"},
                {"name": "Dumbbell Rows", "sets": 3, "reps": 10, "rest_seconds": 60, "notes": "Squeeze shoulder blade at top"},
            ],
        }

    def _default_meal_plan(
        self,
        goal: str = "",
        daily_calories: int = 2000,
        meals_per_day: int = 3,
        diet_type: str = "balanced",
    ) -> dict:
        """Return a sensible default meal plan when generation fails."""
        cal_per_meal = daily_calories // meals_per_day
        goal_label = goal.replace('_', ' ').title() if goal else "Balanced"
        meals = [
            {
                "name": "Breakfast",
                "foods": ["Oatmeal", "Banana", "Greek yogurt", "Almonds"],
                "calories": cal_per_meal,
                "protein_grams": 20, "carbs_grams": 55, "fats_grams": 10,
                "notes": "High-fibre start to the day",
            },
            {
                "name": "Lunch",
                "foods": ["Grilled chicken breast", "Brown rice", "Steamed broccoli", "Olive oil"],
                "calories": cal_per_meal,
                "protein_grams": 40, "carbs_grams": 50, "fats_grams": 12,
                "notes": "Lean protein with complex carbs",
            },
            {
                "name": "Dinner",
                "foods": ["Salmon fillet", "Sweet potato", "Mixed greens", "Avocado"],
                "calories": cal_per_meal,
                "protein_grams": 35, "carbs_grams": 40, "fats_grams": 18,
                "notes": "Omega-3 rich evening meal",
            },
        ]
        return {
            "name": f"{goal_label} Meal Plan",
            "description": f"A {diet_type} meal plan targeting {daily_calories} calories per day.",
            "meals": meals[:meals_per_day],
        }

    # ------------------------------------------------------------------ #
    #  Utilities                                                            #
    # ------------------------------------------------------------------ #

    def _estimate_tokens(self, text: str) -> int:
        return len(text) // 4
