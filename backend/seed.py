import logging
from database import SessionLocal, engine, Base
from models import Course, Expert, Stat, User

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def seed_db():
    # Create tables
    logger.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Clear existing data to avoid duplicates
        logger.info("Cleaning up existing records...")
        db.query(User).delete()
        db.query(Course).delete()
        db.query(Expert).delete()
        db.query(Stat).delete()
        
        # 1. Seed Stats
        logger.info("Seeding statistics...")
        stats = [
            Stat(key="active_learners", value="50K+", label="Active Learners"),
            Stat(key="expert_courses", value="2,400+", label="Expert-Approved Courses"),
            Stat(key="domain_experts", value="500+", label="Domain Experts")
        ]
        db.add_all(stats)
        
        # 2. Seed Experts
        logger.info("Seeding domain experts...")
        experts = [
            Expert(
                name="Dr. Aris Thorne",
                role="Ex-Google Brain Scientist",
                bio="Specializes in deep neural networks and automated curriculum design. Helps SkillForge build adaptive learning paths.",
                avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
                courses_validated_count=18
            ),
            Expert(
                name="Sarah Jenkins",
                role="PostgreSQL Core Contributor",
                bio="Database architect with 15+ years experience. Validates database curricula, query performance, and indexing paths.",
                avatar_url="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
                courses_validated_count=12
            ),
            Expert(
                name="Marcus Vance",
                role="Principal Architect at CloudScale",
                bio="DevOps pioneer and cloud native systems specialist. Validates site reliability and system design curricula.",
                avatar_url="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150",
                courses_validated_count=15
            )
        ]
        db.add_all(experts)
        db.commit() # Commit experts so we can reference them if needed, or just insert them.

        # 3. Seed Courses
        logger.info("Seeding courses...")
        courses = [
            Course(
                title="AI-Driven Systems Programming in Rust",
                description="Harness Rust's safety and speed alongside AI-generated optimization models. Ideal for building backend services and compilers.",
                category="AI & Machine Learning",
                rating=4.9,
                students_count=12450,
                hours=40,
                is_ai_generated=True,
                is_expert_validated=True,
                image_url="https://images.unsplash.com/photo-1607799279861-4dd421887fb3?auto=format&fit=crop&q=80&w=400"
            ),
            Course(
                title="PostgreSQL Advanced Optimization & Architecture",
                description="Master database sharding, connection pooling, complex query analysis, and schema tuning for hyper-scale PostgreSQL databases.",
                category="Data Science & Databases",
                rating=4.8,
                students_count=8900,
                hours=32,
                is_ai_generated=False,
                is_expert_validated=True,
                image_url="https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&q=80&w=400"
            ),
            Course(
                title="Neural Networks & Transformers from Scratch",
                description="Build modern GPT models, learn attention mechanisms, backpropagation calculus, and train text classification networks from first principles.",
                category="AI & Machine Learning",
                rating=4.95,
                students_count=15300,
                hours=48,
                is_ai_generated=True,
                is_expert_validated=True,
                image_url="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400"
            ),
            Course(
                title="Microservices Architecture with Python & FastAPI",
                description="Design resilient, distributed RESTful and gRPC microservices. Set up OAuth2, Docker orchestration, and Redis cache clusters.",
                category="Software Engineering",
                rating=4.75,
                students_count=18200,
                hours=28,
                is_ai_generated=True,
                is_expert_validated=True,
                image_url="https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=400"
            ),
            Course(
                title="Next.js 15 & React Server Components Deep Dive",
                description="Understand how server-side rendering, static site generation, and streaming UI work under the hood. Implement beautiful UX interfaces.",
                category="Software Engineering",
                rating=4.85,
                students_count=21400,
                hours=36,
                is_ai_generated=False,
                is_expert_validated=True,
                image_url="https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=400"
            ),
            Course(
                title="Kubernetes Operators and Cloud Native DevOps",
                description="Build custom Kubernetes controllers using Go and SDK. Master GitOps deployments with ArgoCD and custom autoscaling rules.",
                category="Product & DevOps",
                rating=4.7,
                students_count=6700,
                hours=30,
                is_ai_generated=True,
                is_expert_validated=True,
                image_url="https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?auto=format&fit=crop&q=80&w=400"
            )
        ]
        db.add_all(courses)
        
        # 4. Seed Reviewer User
        logger.info("Seeding reviewer user...")
        import hashlib
        hashed_pwd = hashlib.sha256("reviewer123".encode()).hexdigest()
        reviewer = User(
            email="reviewer@skillforge.com",
            name="SkillForge Reviewer",
            hashed_password=hashed_pwd,
            role="reviewer",
            is_active=True
        )
        db.add(reviewer)
        
        db.commit()
        logger.info("Successfully seeded database with sample data!")
    except Exception as e:
        db.rollback()
        logger.error(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
