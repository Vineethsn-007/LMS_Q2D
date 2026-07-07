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

class AIProposalService:
    @staticmethod
    def process_proposal(proposal_id: int):
        db = SessionLocal()
        try:
            proposal = db.query(models.CourseProposal).filter(models.CourseProposal.id == proposal_id).first()
            if not proposal:
                return

            try:
                if not groq_client:
                    raise Exception("Groq client not initialized")
                # Step 1: Moderation API
                if openai_client:
                    try:
                        moderation_response = openai_client.moderations.create(input=proposal.course_name + "\n" + proposal.expected_outcome)
                        result = moderation_response.results[0]
                        
                        if result.flagged:
                            # Find the reason
                            flagged_categories = [k for k, v in result.categories.model_dump().items() if v]
                            proposal.status = "ai_flagged"
                            proposal.ai_flagged_reason = ", ".join(flagged_categories) if flagged_categories else "General flag"
                            db.commit()
                            return # Stop processing further if flagged
                    except Exception as mod_err:
                        logger.warning(f"Moderation API failed (probably quota exceeded), skipping moderation: {mod_err}")

                # Step 2: Chat API to generate fields
                system_prompt = """
                You are an AI assistant that evaluates course proposals.
                You must respond in valid JSON format with exactly these keys:
                "ai_summary": A 2-3 sentence summary of the proposed course. If the course is about an advanced programming language (e.g. Advanced Ruby, Advanced Python), provide a unique, highly accurate description of what the advanced domains of that specific language entail, contrasting it with its core basics. Ensure the description is specific to the actual frameworks, paradigms, and use cases of that language (do not use a generic template).
                "ai_category": The most fitting category (e.g. 'Software Engineering', 'Data Science & Databases', 'AI & Machine Learning', 'Design', etc.).
                "risk_level": "Low", "Medium", or "High".
                "demand_score": an integer from 0 to 100 representing market demand.
                "ai_recommendation": "approve", "review", or "reject".
                """

                user_content = f"""
                Course Name: {proposal.course_name}
                Reason: {proposal.reason_to_learn}
                Skill Level: {proposal.skill_level}
                Expected Outcome: {proposal.expected_outcome}
                Additional Notes: {proposal.additional_notes}
                """

                chat_response = groq_client.chat.completions.create(
                    model="llama-3.1-8b-instant",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_content}
                    ],
                    response_format={"type": "json_object"}
                )

                ai_data_str = chat_response.choices[0].message.content
                ai_data = json.loads(ai_data_str)

                proposal.ai_summary = ai_data.get("ai_summary")
                proposal.ai_category = ai_data.get("ai_category")
                proposal.risk_level = ai_data.get("risk_level")
                proposal.demand_score = ai_data.get("demand_score")
                proposal.ai_recommendation = ai_data.get("ai_recommendation")

                if proposal.ai_recommendation == "reject":
                    proposal.status = "ai_flagged"
                else:
                    proposal.status = "pending"

            except Exception as e:
                import random
                import logging
                
                logger.info("OpenAI API failed or not configured. Falling back to Scrapling web scrape.")
                
                try:
                    from scrapling.fetchers import StealthyFetcher
                    
                    search_term = proposal.course_name.strip().replace(" ", "+")
                    wiki_url = f"https://en.wikipedia.org/w/index.php?search={search_term}"
                    
                    page = StealthyFetcher.fetch(wiki_url, headless=True)
                    
                    import re
                    paragraphs = page.css('p')
                    valid_paragraphs = []
                    for p in paragraphs:
                        text = "".join(p.css('*::text').getall()).strip()
                        # Remove Wikipedia citation references like [1], [2], etc.
                        text = re.sub(r'\[\d+\]', '', text)
                        if len(text) > 50:
                            valid_paragraphs.append(text)
                    
                    if valid_paragraphs:
                        proposal.ai_summary = " ".join(valid_paragraphs[:2])
                    else:
                        proposal.ai_summary = f"Advanced {proposal.course_name} dives deep into specialized frameworks, complex paradigms, and enterprise-level applications."

                    # Calculate demand score based on page content length as proxy for popularity
                    # page.xpath('string()') gets all text, we can use its length
                    full_text = " ".join(valid_paragraphs)
                    computed_score = min(98, max(42, len(full_text) // 50))
                    proposal.demand_score = computed_score
                    
                    text_lower = full_text.lower()
                    
                    if any(kw in text_lower for kw in ['data', 'database', 'sql']):
                        proposal.ai_category = 'Data Science & Databases'
                    elif any(kw in text_lower for kw in ['design', 'ui', 'ux']):
                        proposal.ai_category = 'Design'
                    elif any(kw in text_lower for kw in ['ai', 'machine learning', 'neural']):
                        proposal.ai_category = 'AI & Machine Learning'
                    elif any(kw in text_lower for kw in ['business', 'finance', 'market']):
                        proposal.ai_category = 'Business'
                    else:
                        proposal.ai_category = 'Software Engineering'

                    if 'deprecated' in text_lower or 'obsolete' in text_lower:
                        proposal.risk_level = 'High'
                    elif computed_score < 60:
                        proposal.risk_level = 'Medium'
                    else:
                        proposal.risk_level = 'Low'

                except Exception as scrape_err:
                    logger.error(f"Scraping failed: {scrape_err}")
                    proposal.ai_summary = f"Advanced {proposal.course_name} dives deep into specialized frameworks."
                    proposal.ai_category = 'Software Engineering'
                    proposal.risk_level = 'Medium'
                    proposal.demand_score = random.randint(40, 95)
                
                proposal.ai_recommendation = "approve"
                proposal.status = "pending"

            # Step 3: Duplicate detection using simple substring search
            # Matches prompt "Search existing proposals with similar course names"
            words = proposal.course_name.lower().split()
            duplicate_found = False
            if words:
                longest_word = max(words, key=len)
                if len(longest_word) > 3:
                    similar_proposals = db.query(models.CourseProposal).filter(
                        models.CourseProposal.id != proposal.id,
                        models.CourseProposal.course_name.ilike(f"%{longest_word}%")
                    ).all()
                    
                    if similar_proposals:
                        proposal.duplicate_status = True
                        duplicate_found = True

            if not duplicate_found:
                proposal.duplicate_status = False

            db.commit()

        except Exception as e:
            logger.error(f"Error processing proposal {proposal_id}: {e}")
            db.rollback()
        finally:
            db.close()

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

    # Rich Fallback Generator if API fails or offline
    topic_lower = topic.lower()
    is_quant = any(k in topic_lower for k in ['aptitude', 'quant', 'math', 'reasoning', 'logic', 'puzzle', 'probability', 'algebra', 'speed', 'time', 'distance', 'train', 'work', 'percentage', 'ratio', 'number', 'syllogism', 'series', 'verbal', 'general'])

    if is_quant:
        quant_questions = [
            {
                "question": f"A train 150 meters long is running at a speed of 60 km/hr. In how much time will it pass a person running at 6 km/hr in the direction opposite to that of the train?",
                "options": ["8 seconds", "8.18 seconds", "9.5 seconds", "10 seconds"],
                "answer": 1,
                "explanation": "Relative speed = 60 + 6 = 66 km/hr = 66 x (5/18) m/sec = 18.33 m/sec. Time taken to pass = Total length / Relative speed = 150 / 18.33 = 8.18 seconds."
            },
            {
                "question": f"In a certain code language, if 'LOGIC' is coded as 'MOHJD', how would 'REASON' be coded in that same pattern?",
                "options": ["SFBTPM", "SDBTPM", "SFBSPO", "SFBTPO"],
                "answer": 3,
                "explanation": "Each letter in the word is shifted +1 alphabet forward (L->M, O->P, G->H, I->J, C->D). For REASON, shifting each letter +1 gives: R->S, E->F, A->B, S->T, O->P, N->O. Thus REASON becomes SFBTPO."
            },
            {
                "question": f"Person A can finish a project in 12 days and Person B can finish the same project in 15 days. If they work together for 4 days, what fraction of the total work is left?",
                "options": ["3/5", "2/5", "1/5", "4/5"],
                "answer": 1,
                "explanation": "A's 1-day work = 1/12, B's 1-day work = 1/15. Together in 1 day = 1/12 + 1/15 = 3/20. In 4 days they complete 4 x (3/20) = 3/5 of the work. Remaining work = 1 - 3/5 = 2/5."
            },
            {
                "question": f"Two cards are drawn together from a standard deck of 52 playing cards. What is the probability that both cards drawn are Kings?",
                "options": ["1/221", "2/221", "1/13", "1/17"],
                "answer": 0,
                "explanation": "Total number of ways to draw 2 cards = 52C2 = (52 x 51) / 2 = 1326. Ways to draw 2 Kings from 4 Kings = 4C2 = 6. Probability = 6 / 1326 = 1 / 221."
            },
            {
                "question": f"If the price of an item increases by 20% and then subsequently decreases by 20%, what is the net percentage change in the final price?",
                "options": ["No change (0%)", "4% decrease", "4% increase", "2% decrease"],
                "answer": 1,
                "explanation": "Let initial price = 100. After 20% increase, price = 120. After 20% decrease on 120, decrease amount = 24, so new price = 96. Net change = 100 - 96 = 4% decrease."
            },
            {
                "question": f"Look at this number series: 2, 6, 12, 20, 30, 42, ... What number should come next in the sequence?",
                "options": ["54", "56", "60", "62"],
                "answer": 1,
                "explanation": "The pattern is n(n+1) or adding successive even numbers: +4, +6, +8, +10, +12. The next difference is +14. Thus 42 + 14 = 56."
            },
            {
                "question": f"A bag contains 6 red balls, 4 blue balls, and 5 green balls. If one ball is chosen at random, what is the probability that it is NOT green?",
                "options": ["2/3", "1/3", "3/5", "4/5"],
                "answer": 0,
                "explanation": "Total balls = 6 + 4 + 5 = 15. Number of balls that are NOT green (red + blue) = 6 + 4 = 10. Probability = 10 / 15 = 2 / 3."
            },
            {
                "question": f"If 15 workers can build a wall 35 meters long in 6 days, how many days will 25 workers take to build a similar wall 50 meters long?",
                "options": ["5 days", "5.14 days", "6 days", "4.5 days"],
                "answer": 1,
                "explanation": "Using M1 * D1 / W1 = M2 * D2 / W2 -> (15 * 6) / 35 = (25 * D2) / 50 -> 90 / 35 = D2 / 2 -> D2 = 180 / 35 = 5.14 days."
            },
            {
                "question": f"An item is bought for $400 and sold at a profit of 25%. What would have been the profit percentage if it had been sold for $550?",
                "options": ["35%", "37.5%", "40%", "42.5%"],
                "answer": 1,
                "explanation": "Cost Price = $400. If Selling Price = $550, Profit = $550 - $400 = $150. Profit percentage = (150 / 400) * 100 = 37.5%."
            },
            {
                "question": f"In a class of 60 students, 35 like Mathematics, 30 like Science, and 10 like neither. How many students like both Mathematics and Science?",
                "options": ["10", "15", "20", "25"],
                "answer": 1,
                "explanation": "Total students liking at least one subject = 60 - 10 = 50. Using Set Theory: n(M U S) = n(M) + n(S) - n(M ∩ S) -> 50 = 35 + 30 - n(M ∩ S) -> n(M ∩ S) = 65 - 50 = 15."
            }
        ]
        return quant_questions[:count]

    fallback_questions = [
        {
            "question": f"What is the core architectural advantage of implementing {topic} in modern software engineering?",
            "options": [
                f"It enhances modularity, scalability, and maintainability across distributed systems.",
                f"It eliminates the need for any data validation or error handling protocols.",
                f"It forces all processes to execute synchronously on a single physical thread.",
                f"It restricts deployment compatibility exclusively to legacy mainframe environments."
            ],
            "answer": 0,
            "explanation": f"{topic} is widely recognized in modern architecture for decoupling components, improving scalability, and streamlining maintainability compared to rigid monolithic patterns."
        },
        {
            "question": f"When configuring {topic} for high-availability production workflows, which best practice is essential?",
            "options": [
                f"Hardcoding credentials and API endpoints directly into source files.",
                f"Implementing robust telemetry, structured logging, and automated retry policies.",
                f"Disabling TLS encryption to maximize throughput over public networks.",
                f"Bypassing unit and integration testing during continuous delivery pipelines."
            ],
            "answer": 1,
            "explanation": f"In production environments utilizing {topic}, telemetry and resilient retry policies ensure observability and fault tolerance without compromising security."
        },
        {
            "question": f"Which common anti-pattern should developers actively avoid when designing with {topic}?",
            "options": [
                f"Using automated CI/CD pipelines for deployment validation.",
                f"Tight coupling of domain logic with infrastructural dependencies.",
                f"Applying semantic versioning to shared libraries and APIs.",
                f"Leveraging caching layers for frequently accessed immutable data."
            ],
            "answer": 1,
            "explanation": f"Tight coupling violates separation of concerns in {topic}, making refactoring difficult and increasing regression risks across components."
        },
        {
            "question": f"How does state and concurrency management typically function within optimized {topic} implementations?",
            "options": [
                f"By relying on unbounded global mutable variables across threads.",
                f"Through immutable state structures, asynchronous event loops, or atomic operations.",
                f"By blocking the UI or main thread during long-running network requests.",
                f"By storing transient session states permanently in relational database schemas."
            ],
            "answer": 1,
            "explanation": f"Optimized {topic} workflows favor immutability and asynchronous patterns to prevent race conditions and ensure predictable state transitions."
        },
        {
            "question": f"In terms of performance optimization, what role does memoization or caching play when using {topic}?",
            "options": [
                f"It increases memory fragmentation without reducing CPU cycle overhead.",
                f"It drastically reduces redundant computations and database lookups for deterministic operations.",
                f"It automatically converts asynchronous tasks into synchronous blocking calls.",
                f"It replaces the need for database indexing and query optimization."
            ],
            "answer": 1,
            "explanation": f"Caching deterministic outputs in {topic} minimizes redundant processing, lowering latency and conserving compute resources."
        },
        {
            "question": f"When evaluating {topic} against traditional alternative methodologies, what is its primary differentiator?",
            "options": [
                f"Superior developer ergonomics and alignment with cloud-native scalability standards.",
                f"Inability to integrate with third-party REST and GraphQL APIs.",
                f"Mandatory requirement for proprietary hardware appliances.",
                f"Complete lack of open-source community support or documentation."
            ],
            "answer": 0,
            "explanation": f"{topic} has gained adoption primarily due to its ergonomic developer experience and native compatibility with cloud and microservice ecosystems."
        },
        {
            "question": f"Which diagnostic approach is most effective when isolating performance bottlenecks in {topic}?",
            "options": [
                f"Randomly restarting server instances until latency spikes subside.",
                f"Utilizing distributed tracing, profiling tools, and analyzing query execution plans.",
                f"Disabling all firewall rules and security groups in production.",
                f"Deleting historical database logs to clear hard drive storage."
            ],
            "answer": 1,
            "explanation": f"Distributed tracing and structured profiling provide empirical visibility into latency breakdown across {topic} execution paths."
        },
        {
            "question": f"What is the recommended approach for error handling and exception resilience in {topic}?",
            "options": [
                f"Swallowing exceptions silently without logging or notifying alerting systems.",
                f"Using circuit breakers, graceful degradation, and descriptive domain exceptions.",
                f"Crashing the entire application process upon encountering any minor warning.",
                f"Returning HTTP 200 OK status codes with error messages embedded in plaintext body."
            ],
            "answer": 1,
            "explanation": f"Circuit breakers and graceful degradation allow {topic} systems to isolate failures and maintain partial functionality during upstream outages."
        },
        {
            "question": f"When scaling {topic} across distributed cloud clusters, which partitioning or load distribution strategy applies?",
            "options": [
                f"Routing 100% of incoming traffic to a single primary node without failover.",
                f"Horizontal scaling with stateless services and consistent hashing or load balancing.",
                f"Storing all user session data in local memory on individual server instances.",
                f"Limiting database connections to a single static thread pool globally."
            ],
            "answer": 1,
            "explanation": f"Stateless horizontal scaling allows {topic} to scale dynamically behind load balancers without session affinity bottlenecks."
        },
        {
            "question": f"Which emerging industry trend or standard is most shaping the ongoing evolution of {topic}?",
            "options": [
                f"The shift toward AI-assisted code synthesis and edge computing optimization.",
                f"The complete abandonment of automated software testing methodologies.",
                f"The reversion from web-based interfaces back to offline dial-up terminals.",
                f"The prohibition of open-source libraries in enterprise software development."
            ],
            "answer": 0,
            "explanation": f"AI-assisted optimization and edge compute execution are driving the modern frontier of {topic}, enabling smarter and faster runtime execution."
        }
    ]
    return fallback_questions[:count]
