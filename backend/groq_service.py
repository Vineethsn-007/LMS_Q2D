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

def generate_ai_response(messages, context=None):
    if not client:
        return "I'm currently offline (missing GROQ_API_KEY). Please configure my key so I can help you better!"

    system_prompt = """You are 'SkillForge AI', an expert mentor and learning assistant.
Your goal is to provide personalized recommendations, explain complex concepts clearly, and guide users to achieve their learning goals.
Act as an encouraging, knowledgeable instructor. Provide concise, accurate answers.

CRITICAL INSTRUCTIONS REGARDING COURSES:
1. If the user asks for course recommendations, or wants to learn a specific topic, ONLY recommend courses from the 'Available SkillForge Courses' provided in the Context below. Do NOT recommend external platforms or courses.
2. If the user asks for a course or topic that is NOT in the 'Available SkillForge Courses' list, politely inform them that it is not currently available on SkillForge, and encourage them to submit a Course Proposal in the system.
3. For any other questions (e.g., coding help, general knowledge, debugging), provide a normal, helpful, and accurate answer."""
    
    if context:
        system_prompt += f"\n\nCurrent Context: {context}"

    formatted_messages = [{"role": "system", "content": system_prompt}]
    
    for msg in messages:
        role = "assistant" if msg.role == "ai" else "user"
        formatted_messages.append({"role": role, "content": msg.content})

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=formatted_messages,
            temperature=0.7,
            max_tokens=1024
        )
        return response.choices[0].message.content
    except Exception as e:
        error_msg = str(e).lower()
        if '403' in error_msg or '401' in error_msg or 'authentication' in error_msg or 'forbidden' in error_msg:
            logger.error(f"Groq API Authentication Error: {e}")
            return "My API key seems to be invalid or expired. Please check the `GROQ_API_KEY` in the backend `.env` file!"
        
        logger.error(f"Error communicating with Groq API: {e}")
        return "I encountered an error while trying to process your request. Please try again later."
