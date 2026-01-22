"""Template engine for generating teacher responses."""
import yaml
import os
from typing import Dict, Optional


class TemplateEngine:
    """Deterministic template-based response generator."""
    
    def __init__(self, templates_path: str = "templates/response_templates.yaml"):
        """Initialize with templates file."""
        self.templates_path = templates_path
        self.templates = self._load_templates()
        self.keyword_map = self._build_keyword_map()
    
    def _load_templates(self) -> Dict:
        """Load templates from YAML file."""
        try:
            with open(self.templates_path, 'r', encoding='utf-8') as f:
                return yaml.safe_load(f)
        except FileNotFoundError:
            # Fallback templates if file doesn't exist
            return self._get_default_templates()
    
    def _get_default_templates(self) -> Dict:
        """Default templates for immediate use."""
        return {
            "subtraction-borrowing": {
                "advice": (
                    "Try this 3-step pebble activity:\n"
                    "1. Use 10 pebbles in groups. Show 13-7 concretely.\n"
                    "2. When borrowing, physically move 1 group of 10 to ones place.\n"
                    "3. Practice with zero: 40-7 requires 'opening' the 4 tens."
                ),
                "materials": "pebbles, place-value chart",
                "demo_video": "subtraction-borrowing.mp4",
                "duration": "15 min"
            },
            "fractions-conceptual": {
                "advice": (
                    "Build fraction understanding:\n"
                    "1. Use paper folding: fold paper into halves, quarters.\n"
                    "2. Draw and shade: 'Show me 3/4 of this rectangle'\n"
                    "3. Compare fractions using same-size circles."
                ),
                "materials": "paper, colored pencils",
                "demo_video": "fractions-basics.mp4",
                "duration": "20 min"
            },
            "multiplication-tables": {
                "advice": (
                    "Make times tables stick:\n"
                    "1. Use skip counting songs (2s, 5s, 10s)\n"
                    "2. Array method: draw 3 rows of 4 dots\n"
                    "3. Daily 5-minute practice with flashcards"
                ),
                "materials": "flashcards, grid paper",
                "demo_video": "multiplication-basics.mp4",
                "duration": "10 min"
            },
            "classroom-management": {
                "advice": (
                    "Improve classroom flow:\n"
                    "1. Start with clear signal (clap pattern) for attention\n"
                    "2. Use transition songs between activities\n"
                    "3. Assign classroom helpers (materials, attendance)"
                ),
                "materials": "none needed",
                "demo_video": "classroom-management.mp4",
                "duration": "ongoing"
            },
            "parent-engagement": {
                "advice": (
                    "Bring parents into learning:\n"
                    "1. Send weekly 2-sentence SMS with home activity\n"
                    "2. Monthly community meeting with student demo\n"
                    "3. Create simple home learning kit (cards, number line)"
                ),
                "materials": "SMS, learning kit template",
                "demo_video": "parent-engagement.mp4",
                "duration": "weekly"
            },
            "reading-fluency": {
                "advice": (
                    "Build reading fluency:\n"
                    "1. Daily 10-min paired reading (stronger with weaker)\n"
                    "2. Use leveled readers at 95% accuracy level\n"
                    "3. Track words per minute weekly"
                ),
                "materials": "leveled readers, tracking sheet",
                "demo_video": "reading-fluency.mp4",
                "duration": "10 min daily"
            },
            "absenteeism": {
                "advice": (
                    "Address attendance:\n"
                    "1. Home visit to understand barriers (work, transport)\n"
                    "2. Celebrate 100% attendance monthly\n"
                    "3. Connect family with block resource person"
                ),
                "materials": "attendance register",
                "demo_video": "attendance-strategies.mp4",
                "duration": "ongoing"
            },
            "assessment-formative": {
                "advice": (
                    "Use quick formative checks:\n"
                    "1. Exit ticket: 1 question on today's lesson\n"
                    "2. Thumbs up/down for understanding\n"
                    "3. Mini whiteboard responses (whole class)"
                ),
                "materials": "exit slips, mini whiteboards",
                "demo_video": "formative-assessment.mp4",
                "duration": "5 min"
            },
            "differentiation": {
                "advice": (
                    "Differentiate instruction:\n"
                    "1. Group by readiness: 3 levels for same activity\n"
                    "2. Use station rotation (teacher, peer, independent)\n"
                    "3. Provide choice: students pick from 2-3 activities"
                ),
                "materials": "leveled materials, station cards",
                "demo_video": "differentiation.mp4",
                "duration": "plan 20 min"
            },
            "general": {
                "advice": (
                    "Thank you for reaching out! Here are general tips:\n"
                    "1. Break down the challenge into small steps\n"
                    "2. Use concrete materials when possible\n"
                    "3. Connect with your CRP for classroom visit support"
                ),
                "materials": "varies",
                "demo_video": "general-support.mp4",
                "duration": "varies"
            }
        }
    
    def _build_keyword_map(self) -> Dict:
        """Build keyword to topic mapping for intent detection."""
        return {
            "subtract": "subtraction-borrowing",
            "borrow": "subtraction-borrowing",
            "tens place": "subtraction-borrowing",
            "zero": "subtraction-borrowing",
            "fraction": "fractions-conceptual",
            "half": "fractions-conceptual",
            "quarter": "fractions-conceptual",
            "multiply": "multiplication-tables",
            "times table": "multiplication-tables",
            "multiplication": "multiplication-tables",
            "discipline": "classroom-management",
            "noisy": "classroom-management",
            "attention": "classroom-management",
            "management": "classroom-management",
            "parent": "parent-engagement",
            "home": "parent-engagement",
            "family": "parent-engagement",
            "read": "reading-fluency",
            "reading": "reading-fluency",
            "fluency": "reading-fluency",
            "absent": "absenteeism",
            "attendance": "absenteeism",
            "missing": "absenteeism",
            "assess": "assessment-formative",
            "test": "assessment-formative",
            "check understanding": "assessment-formative",
            "different level": "differentiation",
            "mixed ability": "differentiation",
            "slow learner": "differentiation",
        }
    
    def detect_topic(self, text: str, provided_topic: Optional[str] = None) -> str:
        """
        Detect topic from text using keyword matching.
        
        Args:
            text: Teacher's query text
            provided_topic: Explicitly provided topic (overrides detection)
        
        Returns:
            Topic tag string
        """
        if provided_topic and provided_topic in self.templates:
            return provided_topic
        
        # Lowercase for matching
        text_lower = text.lower()
        
        # Check keywords
        for keyword, topic in self.keyword_map.items():
            if keyword in text_lower:
                return topic
        
        # Default fallback
        return "general"
    
    def generate_response(self, topic: str, cluster: str = "") -> Dict:
        """
        Generate templated response for topic.
        
        Args:
            topic: Topic tag
            cluster: Cluster name (for personalization)
        
        Returns:
            Dict with advice, materials, demo_link, duration
        """
        template = self.templates.get(topic, self.templates.get("general"))
        
        return {
            "advice": template["advice"],
            "materials": template.get("materials", "varies"),
            "demo_link": f"/media/{template.get('demo_video', 'general.mp4')}",
            "duration": template.get("duration", "varies")
        }
    
    def get_all_topics(self) -> list:
        """Get list of all available topics."""
        return list(self.templates.keys())