"""
Safety Module - Input Validation and Output Filtering

Ensures the AI Fitness Coach provides safe fitness and nutrition advice
by validating user inputs and filtering unsafe AI responses.
"""

import re
import logging
from typing import Dict, List, Tuple, Optional, Any
from enum import Enum
from dataclasses import dataclass

logger = logging.getLogger(__name__)


class SafetyLevel(str, Enum):
    """Safety severity levels."""
    SAFE = "safe"
    WARNING = "warning"
    UNSAFE = "unsafe"
    DANGEROUS = "dangerous"


@dataclass
class ValidationResult:
    """Result of safety validation."""
    is_safe: bool
    level: SafetyLevel
    message: str
    violations: List[str]
    requires_disclaimer: bool


@dataclass
class FilterResult:
    """Result of safety filtering."""
    is_safe: bool
    level: SafetyLevel
    filtered_response: str
    removed_content: List[str]
    safety_note: Optional[str]


class InputValidator:
    """Validates user inputs for safety concerns."""
    
    # Medical conditions that require extra care
    RISKY_CONDITIONS = {
        'heart_disease': {'risk_level': 'high', 'warning': 'Heart conditions require medical supervision'},
        'pregnancy': {'risk_level': 'high', 'warning': 'Pregnant individuals need specialized guidance'},
        'diabetes': {'risk_level': 'medium', 'warning': 'Diabetes affects exercise recommendations'},
        'arthritis': {'risk_level': 'medium', 'warning': 'Joint conditions require modified exercises'},
        'osteoporosis': {'risk_level': 'medium', 'warning': 'Bone density issues affect exercise safety'},
        'high_blood_pressure': {'risk_level': 'medium', 'warning': 'Blood pressure affects exercise limits'},
    }
    
    # Unsafe age ranges
    MIN_SAFE_AGE = 13  # Minimum recommended age for fitness tracking
    MAX_SAFE_AGE = 120  # Reasonable maximum age
    
    # Unsafe weight ranges (BMI-based safety)
    MIN_SAFE_BMI = 13  # Dangerously low
    MAX_SAFE_BMI = 60  # Dangerously high
    
    # Unsafe exercise frequencies
    MIN_SAFE_FREQUENCY = 1  # At least 1 day per week
    MAX_SAFE_FREQUENCY = 7  # At most 7 days per week
    
    # Unsafe duration ranges (weeks)
    MIN_SAFE_DURATION = 1  # At least 1 week
    MAX_SAFE_DURATION = 52  # Maximum 1 year recommended
    
    # Unsafe calorie ranges (daily)
    MIN_SAFE_CALORIES = 1200  # Minimum recommended daily calories
    MAX_SAFE_CALORIES = 5000  # Maximum reasonable daily calories
    
    # Forbidden fitness terms (red flags)
    FORBIDDEN_TERMS = [
        'starvation',
        'crash diet',
        'detox',
        'cleanse',
        'extreme',
        'dangerous',
        'without medical',
        'forbidden',
        'banned substances',
        'steroid',
        'unregulated supplement',
    ]
    
    def validate_workout_request(self, request: Dict[str, Any]) -> ValidationResult:
        """
        Validate workout generation request.
        
        Args:
            request: Workout request parameters
            
        Returns:
            ValidationResult with safety assessment
        """
        violations = []
        requires_disclaimer = False
        
        # Check age
        if 'age' in request:
            age = request.get('age')
            if not (self.MIN_SAFE_AGE <= age <= self.MAX_SAFE_AGE):
                violations.append(
                    f"Age {age} is outside safe range ({self.MIN_SAFE_AGE}-{self.MAX_SAFE_AGE})"
                )
        
        # Check BMI if height/weight provided
        if 'weight' in request and 'height' in request:
            bmi = self._calculate_bmi(request['weight'], request['height'])
            if not (self.MIN_SAFE_BMI <= bmi <= self.MAX_SAFE_BMI):
                violations.append(
                    f"BMI {bmi:.1f} is outside safe range. Please consult a healthcare provider."
                )
        
        # Check exercise frequency
        if 'frequency' in request:
            freq = request.get('frequency')
            if not (self.MIN_SAFE_FREQUENCY <= freq <= self.MAX_SAFE_FREQUENCY):
                violations.append(
                    f"Exercise frequency {freq} days/week is outside safe range (1-7)"
                )
        
        # Check duration
        if 'duration_weeks' in request:
            duration = request.get('duration_weeks')
            if not (self.MIN_SAFE_DURATION <= duration <= self.MAX_SAFE_DURATION):
                violations.append(
                    f"Duration {duration} weeks is outside safe range (1-52)"
                )
        
        # Check medical conditions
        if 'medical_conditions' in request:
            conditions = request.get('medical_conditions', [])
            for condition in conditions:
                if condition.lower() in self.RISKY_CONDITIONS:
                    requires_disclaimer = True
                    violations.append(
                        self.RISKY_CONDITIONS[condition.lower()]['warning']
                    )
        
        # Check fitness level is reasonable
        valid_levels = ['beginner', 'intermediate', 'advanced', 'expert']
        if 'fitness_level' in request:
            level = request.get('fitness_level', '').lower()
            if level not in valid_levels:
                violations.append(
                    f"Fitness level must be one of: {', '.join(valid_levels)}"
                )
        
        # Check for forbidden terms in requirements
        if 'specific_requirements' in request:
            reqs = request.get('specific_requirements', '').lower()
            for term in self.FORBIDDEN_TERMS:
                if term in reqs:
                    violations.append(
                        f"Request contains unsafe term: '{term}'"
                    )
        
        # Determine safety level
        if violations:
            is_safe = False
            if any('extreme' in v or 'dangerous' in v or 'medical' in v.lower() 
                   for v in violations):
                level = SafetyLevel.DANGEROUS
            else:
                level = SafetyLevel.WARNING
        else:
            is_safe = True
            level = SafetyLevel.SAFE
        
        message = (
            "Request is safe to process" if is_safe 
            else "Request contains safety concerns that require attention"
        )
        
        return ValidationResult(
            is_safe=is_safe or level == SafetyLevel.WARNING,
            level=level,
            message=message,
            violations=violations,
            requires_disclaimer=requires_disclaimer or not is_safe
        )
    
    def validate_nutrition_request(self, request: Dict[str, Any]) -> ValidationResult:
        """
        Validate nutrition plan request.
        
        Args:
            request: Nutrition request parameters
            
        Returns:
            ValidationResult with safety assessment
        """
        violations = []
        requires_disclaimer = False
        
        # Check daily calories
        if 'daily_calories' in request:
            calories = request.get('daily_calories')
            if not (self.MIN_SAFE_CALORIES <= calories <= self.MAX_SAFE_CALORIES):
                violations.append(
                    f"Daily calories {calories} is outside safe range "
                    f"({self.MIN_SAFE_CALORIES}-{self.MAX_SAFE_CALORIES})"
                )
        
        # Check meals per day (1-6 is reasonable)
        if 'meals_per_day' in request:
            meals = request.get('meals_per_day')
            if not (1 <= meals <= 6):
                violations.append(
                    f"Meals per day {meals} is outside safe range (1-6)"
                )
        
        # Check duration
        if 'duration_days' in request:
            days = request.get('duration_days')
            max_days = 365  # 1 year max
            if not (1 <= days <= max_days):
                violations.append(
                    f"Duration {days} days is outside safe range (1-365)"
                )
        
        # Check diet type
        valid_diets = [
            'balanced', 'low_carb', 'high_protein', 'vegetarian', 
            'vegan', 'keto', 'mediterranean'
        ]
        if 'diet_type' in request:
            diet = request.get('diet_type', '').lower()
            if diet not in valid_diets:
                violations.append(
                    f"Diet type must be one of: {', '.join(valid_diets)}"
                )
        
        # Check for forbidden terms
        if 'specific_requirements' in request:
            reqs = request.get('specific_requirements', '').lower()
            for term in self.FORBIDDEN_TERMS:
                if term in reqs:
                    violations.append(
                        f"Request contains unsafe term: '{term}'"
                    )
        
        # Check for allergies/restrictions exist
        if 'avoided_foods' in request:
            avoided = request.get('avoided_foods', [])
            if len(avoided) > 10:
                violations.append(
                    "Too many avoided foods listed. Please consult a nutritionist."
                )
        
        # Check medical conditions
        if 'medical_conditions' in request:
            conditions = request.get('medical_conditions', [])
            for condition in conditions:
                if condition.lower() in self.RISKY_CONDITIONS:
                    requires_disclaimer = True
                    violations.append(
                        self.RISKY_CONDITIONS[condition.lower()]['warning']
                    )
        
        # Determine safety level
        if violations:
            is_safe = False
            level = (SafetyLevel.DANGEROUS 
                    if any('extreme' in v or 'medical' in v.lower() 
                           for v in violations)
                    else SafetyLevel.WARNING)
        else:
            is_safe = True
            level = SafetyLevel.SAFE
        
        message = (
            "Request is safe to process" if is_safe 
            else "Request contains safety concerns that require attention"
        )
        
        return ValidationResult(
            is_safe=is_safe or level == SafetyLevel.WARNING,
            level=level,
            message=message,
            violations=violations,
            requires_disclaimer=requires_disclaimer or not is_safe
        )
    
    @staticmethod
    def _calculate_bmi(weight_kg: float, height_m: float) -> float:
        """Calculate BMI from weight (kg) and height (m)."""
        if height_m <= 0:
            return 0
        return weight_kg / (height_m ** 2)


class OutputFilter:
    """Filters unsafe content from AI-generated responses."""
    
    # Dangerous exercise combinations
    DANGEROUS_COMBINATIONS = [
        ('heavy weight', 'no warm-up'),
        ('high intensity', 'no rest'),
        ('extreme calorie deficit', 'heavy exercise'),
        ('fasting', 'intense training'),
    ]
    
    # Unsafe claim patterns
    UNSAFE_PATTERNS = [
        r'guarantee.*cure.*disease',
        r'100%\s+effective',
        r'instantly\s+lose\s+\d+\s+pounds',
        r'no.*side.*effect',
        r'replace.*medicine',
        r'instead.*doctor',
        r'without.*supervision',
        r'anyone\s+can\s+safely',
        r'no\s+need\s+for\s+\w+',
    ]
    
    # Terms that must be qualified
    MUST_QUALIFY = [
        'cure',
        'treat',
        'prevent',
        'disease',
        'medical',
        'condition',
        'syndrome',
        'disorder',
    ]
    
    def filter_response(self, response: str, context: Dict[str, Any]) -> FilterResult:
        """
        Filter AI response for unsafe content.
        
        Args:
            response: AI-generated response
            context: Request context (age, conditions, etc.)
            
        Returns:
            FilterResult with filtered response and safety notes
        """
        violations = []
        removed_content = []
        filtered_response = response
        
        # Check for unsafe patterns
        for pattern in self.UNSAFE_PATTERNS:
            matches = re.finditer(pattern, response, re.IGNORECASE)
            for match in matches:
                violations.append(f"Unsafe claim: {match.group()}")
                removed_content.append(match.group())
                filtered_response = filtered_response.replace(match.group(), '')
        
        # Check for unqualified medical claims
        for term in self.MUST_QUALIFY:
            # Find sentences with these terms but without qualifiers
            pattern = rf'(?<!["\'])\b{term}\b[^.!?]*[.!?]'
            matches = re.finditer(pattern, response, re.IGNORECASE)
            
            for match in matches:
                sentence = match.group()
                # Check if properly qualified
                qualifiers = ['may', 'might', 'can', 'could', 'consult', 'doctor', 'professional']
                if not any(q in sentence.lower() for q in qualifiers):
                    violations.append(f"Unqualified medical claim: {sentence[:50]}...")
                    removed_content.append(sentence)
                    filtered_response = filtered_response.replace(sentence, '')
        
        # Check for dangerous combinations mentioned
        response_lower = response.lower()
        for combo in self.DANGEROUS_COMBINATIONS:
            if all(term in response_lower for term in combo):
                violations.append(
                    f"Dangerous combination mentioned: {' + '.join(combo)}"
                )
        
        # Determine safety level
        if violations:
            is_safe = False
            level = SafetyLevel.WARNING
            safety_note = (
                "⚠️  MEDICAL DISCLAIMER: This advice should not replace "
                "professional medical consultation. Please consult a healthcare "
                "provider before starting any new fitness or nutrition program."
            )
        else:
            is_safe = True
            level = SafetyLevel.SAFE
            safety_note = None
        
        return FilterResult(
            is_safe=is_safe,
            level=level,
            filtered_response=filtered_response.strip(),
            removed_content=removed_content,
            safety_note=safety_note
        )
    
    def add_disclaimers(self, response: str, context: Dict[str, Any]) -> str:
        """
        Add appropriate disclaimers to response based on context.
        
        Args:
            response: AI-generated response
            context: Request context
            
        Returns:
            Response with disclaimers added
        """
        disclaimers = []
        
        # Basic medical disclaimer (always)
        disclaimers.append(
            "⚠️  MEDICAL DISCLAIMER: This information is for educational purposes only. "
            "Always consult a healthcare professional before starting any fitness or "
            "nutrition program."
        )
        
        # Age-based disclaimer
        age = context.get('age')
        if age and age < 18:
            disclaimers.append(
                "👤 MINOR DISCLAIMER: This plan should be adapted for your age. "
                "Please work with a coach or parent."
            )
        elif age and age > 65:
            disclaimers.append(
                "👴 SENIOR DISCLAIMER: This plan may need adaptation for your age group. "
                "Consult a doctor before starting."
            )
        
        # Medical condition disclaimer
        conditions = context.get('medical_conditions', [])
        if conditions:
            disclaimers.append(
                f"🏥 CONDITION DISCLAIMER: You reported {len(conditions)} medical condition(s). "
                "This plan must be reviewed by your healthcare provider."
            )
        
        # Intensity disclaimer
        intensity = context.get('intensity', '').lower()
        if intensity == 'advanced' or intensity == 'expert':
            disclaimers.append(
                "⚡ INTENSITY DISCLAIMER: This is a high-intensity program. "
                "Start slowly and listen to your body."
            )
        
        # Calorie deficit disclaimer
        calories = context.get('daily_calories')
        if calories and calories < 1500:
            disclaimers.append(
                "🍽️  LOW CALORIE DISCLAIMER: This is a low-calorie plan. "
                "Monitor your energy levels and stop if feeling unwell."
            )
        
        return f"{response}\n\n{''.join([f'\\n{d}' for d in disclaimers])}"


class RAGSafetyEnhancer:
    """Uses RAG system to enhance safety by providing evidence-based guidance."""
    
    def enhance_with_evidence(
        self,
        ai_response: str,
        rag_documents: List[Dict[str, Any]]
    ) -> Tuple[str, List[str]]:
        """
        Enhance response with evidence from trusted sources (RAG).
        
        Args:
            ai_response: Original AI response
            rag_documents: Retrieved documents from RAG
            
        Returns:
            Tuple of (enhanced_response, evidence_citations)
        """
        citations = []
        enhanced_response = ai_response
        
        if rag_documents:
            # Add evidence-based note
            evidence_note = (
                "\n\n📚 Based on the following evidence-based sources:\n"
            )
            
            for i, doc in enumerate(rag_documents[:3], 1):  # Top 3 sources
                source = doc.get('source', 'Unknown')
                relevance = doc.get('score', 0)
                
                if relevance > 0.7:  # High confidence
                    evidence_note += f"\n{i}. {source} (Relevance: {relevance*100:.1f}%)"
                    citations.append(source)
            
            enhanced_response += evidence_note
        else:
            # No RAG documents - add disclaimer
            enhanced_response += (
                "\n\n⚠️  NOTE: This response is generated without access to "
                "specific evidence-based sources. Please verify with healthcare "
                "professionals."
            )
        
        return enhanced_response, citations
    
    def validate_against_sources(
        self,
        claim: str,
        rag_documents: List[Dict[str, Any]]
    ) -> Tuple[bool, Optional[str]]:
        """
        Check if an AI claim is supported by RAG documents.
        
        Args:
            claim: Text claim to validate
            rag_documents: Retrieved documents
            
        Returns:
            Tuple of (is_supported, conflicting_info)
        """
        if not rag_documents:
            return False, "No sources available to validate claim"
        
        # Simple keyword matching (in production, use semantic similarity)
        claim_keywords = set(claim.lower().split())
        
        for doc in rag_documents:
            doc_text = doc.get('content', '').lower()
            doc_keywords = set(doc_text.split())
            
            # Check for keyword overlap
            overlap = claim_keywords & doc_keywords
            if len(overlap) / len(claim_keywords) > 0.5:  # >50% overlap
                return True, None
        
        return False, "Claim not supported by available sources"


# Convenience functions
def validate_workout_request(request: Dict[str, Any]) -> ValidationResult:
    """Validate a workout request."""
    validator = InputValidator()
    return validator.validate_workout_request(request)


def validate_nutrition_request(request: Dict[str, Any]) -> ValidationResult:
    """Validate a nutrition request."""
    validator = InputValidator()
    return validator.validate_nutrition_request(request)


def filter_ai_response(response: str, context: Dict[str, Any]) -> FilterResult:
    """Filter AI response for safety."""
    filter_obj = OutputFilter()
    return filter_obj.filter_response(response, context)


def add_disclaimers(response: str, context: Dict[str, Any]) -> str:
    """Add disclaimers to response."""
    filter_obj = OutputFilter()
    return filter_obj.add_disclaimers(response, context)
