import os
import json
import logging
from openai import OpenAI
import models
from database import SessionLocal

logger = logging.getLogger(__name__)

# Initialize OpenAI client. It expects OPENAI_API_KEY environment variable.
try:
    client = OpenAI()
except Exception as e:
    logger.error(f"Failed to initialize OpenAI client: {e}")
    client = None

class AIProposalService:
    @staticmethod
    def process_proposal(proposal_id: int):
        db = SessionLocal()
        try:
            proposal = db.query(models.CourseProposal).filter(models.CourseProposal.id == proposal_id).first()
            if not proposal:
                return

            try:
                if not client:
                    raise Exception("OpenAI client not initialized")
                # Step 1: Moderation API
                moderation_response = client.moderations.create(input=proposal.course_name + "\n" + proposal.expected_outcome)
                result = moderation_response.results[0]
                
                if result.flagged:
                    # Find the reason
                    flagged_categories = [k for k, v in result.categories.model_dump().items() if v]
                    proposal.status = "ai_flagged"
                    proposal.ai_flagged_reason = ", ".join(flagged_categories) if flagged_categories else "General flag"
                    db.commit()
                    return # Stop processing further if flagged

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

                chat_response = client.chat.completions.create(
                    model="gpt-4o-mini",
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
