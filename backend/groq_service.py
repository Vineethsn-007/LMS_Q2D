import os
import logging
from openai import OpenAI

logger = logging.getLogger(__name__)

groq_api_key = os.environ.get("GROQ_API_KEY")

try:
    if groq_api_key:
        client = OpenAI(
            api_key=groq_api_key,
            base_url="https://api.groq.com/openai/v1",
        )
    else:
        logger.warning("GROQ_API_KEY is not set. AI Assistant will use fallback responses.")
        client = None
except Exception as e:
    logger.error(f"Failed to initialize Groq client: {e}")
    client = None

def generate_quiz(context, count=5):
    if not client:
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

    formatted_messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Context:\n{context}"}
    ]

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=formatted_messages,
            temperature=0.3,
            max_tokens=2048,
            response_format={"type": "json_object"}
        )
        content = response.choices[0].message.content
        import json
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
        logger.error(f"Error generating quiz: {e}")
        return [
            {
                "question": "Could not generate questions due to an error.",
                "options": ["Error", "B", "C", "D"],
                "answer": 0
            }
        ]
