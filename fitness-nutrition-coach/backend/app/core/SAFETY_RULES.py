"""
Example Safety Rules Database

This file contains example validation rules and safety parameters
for the AI Fitness Coach system.
"""

# VALIDATION RULES
# ================

VALIDATION_RULES = {
    'workout_generation': {
        'age': {
            'min': 13,
            'max': 120,
            'warning': 'Age outside normal range',
            'dangerous': False
        },
        'weight_kg': {
            'min': 30,
            'max': 300,
            'warning': 'Extreme weight detected',
            'dangerous': True
        },
        'height_m': {
            'min': 1.0,
            'max': 2.5,
            'warning': 'Height outside normal range',
            'dangerous': False
        },
        'bmi': {
            'min': 13,
            'max': 60,
            'warning': 'Extreme BMI detected',
            'dangerous': True,
            'note': 'Outside safe exercise range'
        },
        'frequency_days_per_week': {
            'min': 1,
            'max': 7,
            'warning': 'Invalid frequency',
            'dangerous': False
        },
        'duration_weeks': {
            'min': 1,
            'max': 52,
            'warning': 'Program duration outside range',
            'dangerous': False
        },
        'intensity': {
            'valid_values': ['beginner', 'intermediate', 'advanced', 'expert'],
            'restrictions': {
                'beginner': {
                    'max_frequency': 4,
                    'max_duration': 12,
                    'equipment': 'minimal'
                },
                'expert': {
                    'min_age': 18,
                    'requires_medical_clearance': ['heart_disease', 'high_blood_pressure']
                }
            }
        }
    },
    'nutrition_generation': {
        'daily_calories': {
            'min': 1200,
            'max': 5000,
            'warning': 'Calorie target outside safe range',
            'dangerous_low': 900,
            'dangerous_high': 6000
        },
        'meals_per_day': {
            'min': 1,
            'max': 6,
            'warning': 'Unusual meal frequency',
            'dangerous': False
        },
        'duration_days': {
            'min': 1,
            'max': 365,
            'warning': 'Program duration outside typical range',
            'dangerous': False
        },
        'diet_type': {
            'valid_values': [
                'balanced', 'low_carb', 'high_protein', 
                'vegetarian', 'vegan', 'keto', 'mediterranean'
            ],
            'caution': {
                'keto': 'Requires medical supervision for extended periods',
                'very_low_calorie': 'Requires medical supervision'
            }
        }
    }
}


# MEDICAL CONDITIONS WITH SAFETY FLAGS
# ====================================

MEDICAL_CONDITIONS = {
    'cardiovascular': {
        'heart_disease': {
            'risk_level': 'high',
            'requires_medical_clearance': True,
            'warning': 'Heart disease requires medical supervision for exercise',
            'exercise_restrictions': [
                'Avoid high-intensity intervals',
                'Monitor heart rate',
                'Regular medical check-ups required'
            ],
            'nutrition_restrictions': [
                'Limit sodium',
                'Limit saturated fats',
                'Consult cardiologist'
            ]
        },
        'high_blood_pressure': {
            'risk_level': 'medium',
            'requires_medical_clearance': False,
            'warning': 'High blood pressure affects exercise tolerance',
            'exercise_restrictions': [
                'Avoid heavy lifting',
                'Moderate intensity recommended',
                'Monitor blood pressure'
            ]
        }
    },
    'metabolic': {
        'diabetes': {
            'risk_level': 'medium',
            'requires_medical_clearance': True,
            'warning': 'Diabetes affects exercise and nutrition planning',
            'exercise_restrictions': [
                'Monitor blood sugar before/after exercise',
                'Adjust carbohydrate intake',
                'Avoid exercising at peak medication times'
            ],
            'nutrition_restrictions': [
                'Carbohydrate counting required',
                'Consistent meal timing',
                'Sugar monitoring'
            ]
        }
    },
    'skeletal': {
        'osteoporosis': {
            'risk_level': 'medium',
            'requires_medical_clearance': False,
            'warning': 'Osteoporosis requires modified exercises',
            'exercise_restrictions': [
                'Avoid high-impact activities',
                'Focus on weight-bearing exercises',
                'No heavy loads'
            ]
        },
        'arthritis': {
            'risk_level': 'medium',
            'requires_medical_clearance': False,
            'warning': 'Arthritis requires joint-friendly exercises',
            'exercise_restrictions': [
                'Low-impact preferred',
                'Avoid repetitive stress',
                'Flexibility work important'
            ]
        }
    },
    'pregnancy': {
        'pregnancy': {
            'risk_level': 'high',
            'requires_medical_clearance': True,
            'warning': 'Pregnant individuals require specialized fitness guidance',
            'exercise_restrictions': [
                'Avoid contact sports',
                'No lying flat after first trimester',
                'Keep heart rate moderate',
                'Stay hydrated'
            ],
            'nutrition_restrictions': [
                'Increased caloric needs',
                'Prenatal vitamins required',
                'Certain foods to avoid',
                'Regular nutrition counseling'
            ]
        }
    }
}


# FORBIDDEN TERMS AND PHRASES
# ===========================

FORBIDDEN_TERMS = [
    # Dangerous dietary approaches
    'starvation', 'crash diet', 'extreme diet', 'dangerous diet',
    'detox', 'cleanse', 'juice cleanse', 'toxin removal',
    'eating disorder', 'anorexia', 'bulimia',
    
    # Unqualified medical claims
    'guarantee cure', 'will cure', 'completely heal',
    'instead of doctor', 'replace medical treatment', 'don\'t need doctor',
    'instant results', 'overnight transformation',
    
    # Dangerous substances
    'banned substance', 'steroid', 'anabolic', 'HGH', 'insulin',
    'unregulated supplement', 'black market', 'unlicensed drug',
    
    # Dangerous practices
    'extreme exercise', 'over-training without rest',
    'dehydration technique', 'dangerous weight loss',
    'high-risk exercise without supervision',
]


# UNSAFE CLAIMS PATTERNS
# ======================

UNSAFE_PATTERNS = [
    # Cure/treat/prevent claims
    (r'guarantee.*cure', 'Unqualified medical claim'),
    (r'100%\s+effective', 'Overstated efficacy'),
    (r'will.*completely.*heal', 'False cure claim'),
    (r'instantly\s+lose\s+\d+\s+pounds', 'Unrealistic weight loss'),
    (r'overnight\s+\w+', 'Unrealistic timeline'),
    
    # Contradiction of medical advice
    (r'no.*side.*effect', 'Potentially false claim'),
    (r'instead\s+of\s+\w+.*medicine', 'Dangerous medical contradiction'),
    (r'without.*medical.*supervision', 'Unsafe recommendation'),
    (r'anyone\s+can\s+safely', 'Overgeneralization'),
    (r'don.*need.*doctor', 'Dangerous medical contradiction'),
]


# AGE-SPECIFIC GUIDELINES
# =======================

AGE_GUIDELINES = {
    'child': {
        'age_range': (5, 12),
        'exercise_type': 'Play-based, varied activities',
        'max_intensity': 'moderate',
        'max_frequency': '5 days/week',
        'medical_clearance_required': False,
        'special_considerations': [
            'Growth plate protection',
            'Avoid heavy weights',
            'Focus on fun and skill development',
            'Parent supervision required'
        ]
    },
    'teen': {
        'age_range': (13, 17),
        'exercise_type': 'Sport-based, strength training with supervision',
        'max_intensity': 'vigorous',
        'max_frequency': '6 days/week',
        'medical_clearance_required': False,
        'special_considerations': [
            'Still developing - avoid extreme intensity',
            'Proper form essential',
            'Strength training OK with supervision',
            'Mental health important'
        ]
    },
    'young_adult': {
        'age_range': (18, 35),
        'exercise_type': 'All types with proper progression',
        'max_intensity': 'vigorous',
        'max_frequency': '7 days/week (mixed intensity)',
        'medical_clearance_required': False,
        'special_considerations': [
            'Peak physical performance',
            'Build strong foundation',
            'Injury prevention important'
        ]
    },
    'adult': {
        'age_range': (36, 55),
        'exercise_type': 'Balanced strength and cardio',
        'max_intensity': 'vigorous with modification',
        'max_frequency': '6 days/week',
        'medical_clearance_required': False,
        'special_considerations': [
            'Recovery time increases',
            'Injury prevention critical',
            'Regular health screening',
            'Prevent age-related decline'
        ]
    },
    'senior': {
        'age_range': (56, 75),
        'exercise_type': 'Balance, strength, flexibility emphasis',
        'max_intensity': 'moderate',
        'max_frequency': '5 days/week',
        'medical_clearance_required': True,
        'special_considerations': [
            'Fall prevention important',
            'Joint protection required',
            'Cardiovascular monitoring',
            'Flexibility and balance emphasized'
        ]
    },
    'elderly': {
        'age_range': (76, 120),
        'exercise_type': 'Low-impact, supervised programs',
        'max_intensity': 'low to moderate',
        'max_frequency': '3-5 days/week',
        'medical_clearance_required': True,
        'special_considerations': [
            'Physician supervised',
            'Fall prevention critical',
            'Mobility preservation',
            'Quality of life focus',
            'Regular health monitoring'
        ]
    }
}


# CALORIE INTAKE GUIDELINES
# =========================

CALORIE_GUIDELINES = {
    'very_low_calorie': {
        'range': (0, 1200),
        'risk_level': 'high',
        'requires_medical_supervision': True,
        'warning': 'Very low calorie intake requires medical supervision',
        'max_duration_days': 30,
        'considerations': [
            'Nutritional deficiency risk',
            'Metabolic slowdown',
            'Muscle loss risk',
            'Medical monitoring required'
        ]
    },
    'low_calorie': {
        'range': (1200, 1500),
        'risk_level': 'medium',
        'requires_medical_supervision': False,
        'warning': 'Low calorie intake - monitor energy levels',
        'considerations': [
            'Ensure nutrient density',
            'Monitor hunger signals',
            'Adequate protein intake',
            'Professional guidance recommended'
        ]
    },
    'moderate_calorie': {
        'range': (1500, 2500),
        'risk_level': 'low',
        'requires_medical_supervision': False,
        'considerations': [
            'Most sustainable',
            'Supports most lifestyles',
            'Balanced approach'
        ]
    },
    'high_calorie': {
        'range': (2500, 4000),
        'risk_level': 'low',
        'requires_medical_supervision': False,
        'considerations': [
            'Suitable for high activity levels',
            'Athletes and very active individuals',
            'Monitor composition changes'
        ]
    },
    'very_high_calorie': {
        'range': (4000, 5000),
        'risk_level': 'medium',
        'requires_medical_supervision': False,
        'warning': 'Very high calorie intake - verify with healthcare provider',
        'considerations': [
            'Only for extremely active individuals',
            'Professional guidance recommended',
            'Regular health monitoring'
        ]
    }
}


# EXERCISE INTENSITY GUIDELINES
# =============================

INTENSITY_GUIDELINES = {
    'beginner': {
        'max_duration_per_session': '45 minutes',
        'max_intensity': '60% max heart rate',
        'recovery_days_required': 1,
        'max_sessions_per_week': 4,
        'warm_up_required': True,
        'cool_down_required': True,
        'medical_clearance_required': False,
        'safety_notes': [
            'Focus on form over intensity',
            'Gradual progression only',
            'Listen to body signals',
            'Stay hydrated'
        ]
    },
    'intermediate': {
        'max_duration_per_session': '60 minutes',
        'max_intensity': '75% max heart rate',
        'recovery_days_required': 1,
        'max_sessions_per_week': 5,
        'warm_up_required': True,
        'cool_down_required': True,
        'safety_notes': [
            'Increase intensity gradually',
            'Proper form still essential',
            'Monitor for overtraining',
            'Adequate sleep required'
        ]
    },
    'advanced': {
        'max_duration_per_session': '90 minutes',
        'max_intensity': '85% max heart rate',
        'recovery_days_required': 1,
        'max_sessions_per_week': 6,
        'periodization_required': True,
        'medical_clearance_required': False,
        'safety_notes': [
            'Periodized training structure',
            'Professional coaching recommended',
            'Regular deload weeks',
            'Injury prevention protocols'
        ]
    },
    'expert': {
        'max_duration_per_session': '120 minutes',
        'max_intensity': '95% max heart rate',
        'recovery_days_required': 1,
        'max_sessions_per_week': 7,
        'periodization_required': True,
        'medical_clearance_required': True,
        'coaching_recommended': True,
        'safety_notes': [
            'Professional training program required',
            'Regular medical monitoring',
            'Advanced recovery protocols',
            'Injury management expertise required'
        ]
    }
}


# DISCLAIMER TEMPLATES
# ====================

DISCLAIMERS = {
    'general_medical': """
⚠️ MEDICAL DISCLAIMER
This information is for educational purposes only and should not be considered 
medical advice. Always consult with a qualified healthcare professional before 
starting any new fitness or nutrition program, especially if you have any 
pre-existing medical conditions.
    """,
    
    'high_intensity': """
⚡ HIGH INTENSITY DISCLAIMER
This program includes high-intensity exercises. Consult your doctor before 
starting, especially if you have any cardiovascular concerns. Listen to your 
body and stop if you experience pain or dizziness.
    """,
    
    'medical_condition': """
🏥 MEDICAL CONDITION DISCLAIMER
Based on your reported medical conditions, this program should be reviewed 
and approved by your healthcare provider before starting.
    """,
    
    'age_specific': """
👤 AGE-SPECIFIC DISCLAIMER
This program is designed for your age group but should still be personalized 
based on your individual fitness level and health status. Consult your doctor 
if you have concerns.
    """,
    
    'calorie_restricted': """
🍽️ LOW CALORIE DISCLAIMER
This is a calorie-restricted program. Monitor your energy levels and nutrient 
intake. Consult a nutritionist if you experience fatigue or nutrient deficiency 
symptoms.
    """,
    
    'pregnancy': """
🤰 PREGNANCY DISCLAIMER
Exercise during pregnancy should be approved by your OB/GYN. This program may 
need significant modifications based on your trimester and individual health 
status.
    """,
}


# EVIDENCE SOURCES FOR RAG
# =======================

TRUSTED_SOURCES = [
    'American Heart Association',
    'American College of Sports Medicine',
    'CDC Physical Activity Guidelines',
    'Mayo Clinic Health Information',
    'NIH National Institutes of Health',
    'WHO World Health Organization',
    'American Diabetes Association',
    'Academy of Nutrition and Dietetics',
]
