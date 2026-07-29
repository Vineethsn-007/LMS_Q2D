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

    # Rich fallback generator for backend if AI or Question Bank is unavailable
    topic_lower = (topic or "").lower()
    if any(k in topic_lower for k in ['aptitude', 'quant', 'math', 'speed', 'distance', 'train', 'work', 'percentage', 'ratio', 'number', 'algebra']):
      return [
        {
          "question": "Question 1: A train 150 meters long is running at a speed of 60 km/hr. In how much time will it pass a person running at 6 km/hr in the opposite direction?",
          "options": ["8.0 seconds", "8.18 seconds", "9.50 seconds", "10.2 seconds"],
          "answer": 1,
          "explanation": "Relative speed = 60 + 6 = 66 km/hr = 66 * (5/18) m/s = 18.33 m/s. Time = Distance / Speed = 150 / 18.33 = 8.18 seconds."
        },
        {
          "question": "Question 2: Person A can finish a project in 12 days and Person B in 15 days. If they work together for 4 days, what fraction of work is left?",
          "options": ["3/5", "2/5", "1/5", "4/5"],
          "answer": 1,
          "explanation": "A's 1-day work = 1/12, B's 1-day work = 1/15. Together in 1 day = 1/12 + 1/15 = 3/20. In 4 days = 4 * (3/20) = 3/5. Remaining = 1 - 3/5 = 2/5."
        },
        {
          "question": "Question 3: Two cards are drawn together from a deck of 52 cards. What is the probability that both cards drawn are Kings?",
          "options": ["1/221", "2/221", "1/13", "1/17"],
          "answer": 0,
          "explanation": "Total ways = 52C2 = 1326. Ways to pick 2 Kings = 4C2 = 6. Probability = 6 / 1326 = 1 / 221."
        },
        {
          "question": "Question 4: If an item's price increases by 20% and then decreases by 20%, what is the net percentage change in final price?",
          "options": ["0% (No change)", "4% decrease", "4% increase", "2% decrease"],
          "answer": 1,
          "explanation": "Initial = 100 -> +20% = 120 -> -20% of 120 = 96. Net change = 100 - 96 = 4% decrease."
        },
        {
          "question": "Question 5: What is the next number in the sequence: 2, 6, 12, 20, 30, 42, ...?",
          "options": ["54", "56", "60", "64"],
          "answer": 1,
          "explanation": "Differences are +4, +6, +8, +10, +12. Next difference is +14, so 42 + 14 = 56."
        },
        {
          "question": "Question 6: A bag contains 6 red, 4 blue, and 5 green balls. If one ball is drawn at random, what is the probability it is NOT green?",
          "options": ["2/3", "1/3", "3/5", "4/5"],
          "answer": 0,
          "explanation": "Total balls = 15. Non-green (red + blue) = 10. Probability = 10/15 = 2/3."
        },
        {
          "question": "Question 7: If 15 workers build a 35m wall in 6 days, how many days will 25 workers take for a 50m wall?",
          "options": ["5.00 days", "5.14 days", "6.00 days", "4.50 days"],
          "answer": 1,
          "explanation": "(M1 * D1)/W1 = (M2 * D2)/W2 -> (15 * 6)/35 = (25 * D2)/50 -> D2 = 180 / 35 = 5.14 days."
        },
        {
          "question": "Question 8: An item bought for $400 is sold at 25% profit. What would be the profit percentage if sold for $550?",
          "options": ["35.0%", "37.5%", "40.0%", "42.5%"],
          "answer": 1,
          "explanation": "Cost Price = $400. SP = $550 -> Profit = $150. Profit % = (150/400)*100 = 37.5%."
        },
        {
          "question": "Question 9: Out of 60 students, 35 like Math, 30 like Science, and 10 like neither. How many students like both?",
          "options": ["10", "15", "20", "25"],
          "answer": 1,
          "explanation": "Students liking at least one = 50. n(M U S) = n(M) + n(S) - n(M ∩ S) -> 50 = 35 + 30 - X -> X = 15."
        },
        {
          "question": "Question 10: What principal amount will earn $120 in simple interest over 2 years at an annual interest rate of 6%?",
          "options": ["$800", "$1,000", "$1,200", "$1,500"],
          "answer": 1,
          "explanation": "SI = (P * R * T) / 100 -> 120 = (P * 6 * 2) / 100 -> P = 12000 / 12 = $1,000."
        }
      ][:count]

    return [
      {
        "question": f"Question 1: In {topic}, which architectural pattern decouples producers and consumers using asynchronous messaging?",
        "options": [
          "Event-Driven Architecture (Publish-Subscribe)",
          "Monolithic Synchronous Procedure Calls",
          "Hardcoded Direct Memory Pointers",
          "Polling Loop Architecture"
        ],
        "answer": 0,
        "explanation": f"{topic} systems utilize event-driven pub-sub queues to ensure loose coupling, asynchronous resilience, and independent scalability."
      },
      {
        "question": f"Question 2: What is the primary purpose of implementing a Circuit Breaker pattern in {topic}?",
        "options": [
          "Prevents cascading failures by failing fast when a remote dependency is overloaded or unresponsive.",
          "Encrypts network payloads with 512-bit RSA public key pairs.",
          "Deletes temporary cache records every 60 seconds.",
          "Forces database queries to bypass indexed columns."
        ],
        "answer": 0,
        "explanation": "Circuit breakers intercept failing remote requests, preventing application thread pool exhaustion during downstream outages."
      },
      {
        "question": f"Question 3: In system design for {topic}, what does the CAP Theorem state about distributed data stores?",
        "options": [
          "A system can guarantee at most two of Consistency, Availability, and Partition Tolerance simultaneously.",
          "CPU utilization, Memory usage, and Network bandwidth are always equal.",
          "All API endpoints must complete responses within 100 milliseconds.",
          "Database backup tables must be stored across three separate continents."
        ],
        "answer": 0,
        "explanation": "CAP Theorem proves that under a network partition, a distributed system must trade off between strict consistency and high availability."
      },
      {
        "question": f"Question 4: Which caching strategy updates the cache and underlying database simultaneously in write operations?",
        "options": [
          "Write-Through Caching",
          "Cache-Aside (Lazy Loading)",
          "Write-Behind (Write-Back)",
          "Refresh-Ahead Caching"
        ],
        "answer": 0,
        "explanation": "Write-Through caching writes data to the cache and database synchronously, guaranteeing consistency at the cost of write latency."
      },
      {
        "question": f"Question 5: What is database sharding and why is it applied to large scale {topic} data architectures?",
        "options": [
          "Horizontal partitioning of database rows across multiple independent physical database instances.",
          "Compressing table data into ZIP archives on cloud object storage.",
          "Creating duplicate copies of secondary indexes on single SSD drives.",
          "Converting relational SQL tables into static CSV text files."
        ],
        "answer": 0,
        "explanation": "Sharding splits large database datasets horizontally across separate nodes to scale read/write throughput beyond single server limits."
      },
      {
        "question": f"Question 6: How does horizontal scaling (scaling out) differ from vertical scaling (scaling up)?",
        "options": [
          "Horizontal scaling adds more machine instances; vertical scaling adds CPU/RAM resources to an existing single machine.",
          "Horizontal scaling increases network cable thickness; vertical scaling upgrades disk firmware.",
          "Horizontal scaling applies to databases only; vertical scaling applies to frontends only.",
          "Horizontal scaling reduces server count; vertical scaling doubles machine count."
        ],
        "answer": 0,
        "explanation": "Horizontal scaling adds new nodes to a distributed pool, whereas vertical scaling upgrades the specs of an existing server."
      },
      {
        "question": f"Question 7: What role does a Reverse Proxy (e.g. NGINX) play in modern {topic} infrastructures?",
        "options": [
          "Handles SSL/TLS termination, load balancing, compression, and request routing in front of backend servers.",
          "Compiles client React code into browser executable binaries.",
          "Monitors developer git commits for syntax errors.",
          "Generates automated user passwords upon registration."
        ],
        "answer": 0,
        "explanation": "Reverse proxies sit in front of application servers to handle SSL termination, load distribution, security filtering, and static caching."
      },
      {
        "question": f"Question 8: In API architecture, what is Rate Limiting used for?",
        "options": [
          "Protects backend services from denial-of-service attacks and resource exhaustion by capping request volume per client.",
          "Slows down database query execution to conserve electricity.",
          "Restricts user login attempts to daytime office hours only.",
          "Truncates long text strings in JSON API responses."
        ],
        "answer": 0,
        "explanation": "Rate limiting throttles incoming requests per IP/user to prevent system overload and ensure fair resource distribution."
      },
      {
        "question": f"Question 9: What is the main benefit of immutable infrastructure deployments in {topic}?",
        "options": [
          "Servers are replaced with clean new images rather than modified in-place, eliminating configuration drift.",
          "Server IP addresses never change for the entire lifecycle of the company.",
          "Database passwords are hardcoded into compiled C libraries.",
          "Source code files are locked against edits by software engineers."
        ],
        "answer": 0,
        "explanation": "Immutable infrastructure deploys pre-tested, immutable container/VM images, making environments completely deterministic and reproducible."
      },
      {
        "question": f"Question 10: Which metric represents the 99th percentile (p99) latency of an application endpoint?",
        "options": [
          "The maximum response time experienced by 99% of requests (only 1% of requests were slower).",
          "The average response time calculated across 99 total web servers.",
          "The percentage of HTTP requests that resulted in 200 OK status codes.",
          "The time taken to run unit tests 99 times in CI pipelines."
        ],
        "answer": 0,
        "explanation": "p99 latency indicates the threshold under which 99% of requests complete, capturing tail latency experienced by worst-case requests."
      }
    ][:count]
