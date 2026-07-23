import os
import json
import logging
from openai import OpenAI
import models
from database import SessionLocal

logger = logging.getLogger(__name__)

# Initialize OpenAI client. It expects OPENAI_API_KEY environment variable.
try:
    openai_client = OpenAI()
except Exception as e:
    logger.error(f"Failed to initialize OpenAI client: {e}")
    openai_client = None

# Initialize Groq client
try:
    groq_client = OpenAI(
        api_key=os.environ.get("GROQ_API_KEY"),
        base_url="https://api.groq.com/openai/v1",
    )
except Exception as e:
    logger.error(f"Failed to initialize Groq client: {e}")
    groq_client = None

def generate_quiz(context, count=5):
    if not groq_client:
        return [
            {
                "question": f"What is the main topic of this section? (Placeholder {i+1})",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "answer": 0
            } for i in range(count)
        ]

    system_prompt = f"""You are a quiz generation assistant.
Based on the provided context, generate exactly {count} multiple-choice questions.
Return ONLY valid JSON in the form of an object containing a 'questions' array.
Each question object must have:
- "question": string
- "options": list of exactly 4 strings
- "answer": integer (0 to 3) representing the index of the correct option.
Do NOT include any markdown formatting or extra text outside the JSON."""

    try:
        response = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Context:\n{context}"}
            ],
            temperature=0.3,
            max_tokens=4500,
            response_format={"type": "json_object"}
        )
        content = response.choices[0].message.content
        
        # Handle potential markdown blocks
        if "```" in content:
            parts = content.split("```")
            if len(parts) > 1:
                content = parts[1]
                if content.startswith("json"):
                    content = content[4:]
                    
        data = json.loads(content)
        if isinstance(data, dict) and "questions" in data:
            return data["questions"]
        elif isinstance(data, list):
            return data
        return []
    except Exception as e:
        logger.error(f"Error generating quiz via OpenAI: {e}")
        return [
            {
                "question": f"Could not generate questions due to an error: {str(e)}",
                "options": ["Error", "B", "C", "D"],
                "answer": 0
            }
        ]

def generate_topic_assessment(topic: str, difficulty: str = "Intermediate", count: int = 10):
    """Generate a comprehensive 10-question assessment on any topic (technical, aptitude, math, logic) using AI with rich fallback."""
    if groq_client:
        system_prompt = f"""You are an expert assessment and problem generator across ALL disciplines (Technical, Quantitative Aptitude, Logical Reasoning, Mathematics, Verbal Ability, Business, Science, etc.).
Generate exactly {count} multiple-choice test questions or practical problems to evaluate a learner on the topic: "{topic}" at "{difficulty}" difficulty level.
If the topic is Quantitative Aptitude, Math, Logical Reasoning, or analytical, generate actual numerical problems, word problems, logic puzzles, or equations with 4 numerical/logical options and step-by-step mathematical calculations in the explanation!
Return ONLY valid JSON in the form of an object containing a 'questions' array.
Each question object MUST have:
- "question": string (the problem or test question)
- "options": list of exactly 4 strings (the potential answers)
- "answer": integer (0 to 3) representing the index of the correct option
- "explanation": string (a detailed step-by-step solution and explanation of why the correct option is right)
Do NOT include any markdown formatting or extra text outside the JSON."""

        try:
            response = groq_client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Generate a {count}-question {difficulty} assessment problem set on: {topic}"}
                ],
                temperature=0.3,
                max_tokens=4500,
                response_format={"type": "json_object"}
            )
            content = response.choices[0].message.content
            if "```" in content:
                parts = content.split("```")
                if len(parts) > 1:
                    content = parts[1]
                    if content.startswith("json"):
                        content = content[4:]
            data = json.loads(content)
            if isinstance(data, dict) and "questions" in data and len(data["questions"]) > 0:
                return data["questions"][:count]
            elif isinstance(data, list) and len(data) > 0:
                return data[:count]
        except Exception as e:
            logger.error(f"Groq API assessment generation error for {topic}: {e}")

    # Return None so that the caller can fallback to Database Question Bank
    return None
