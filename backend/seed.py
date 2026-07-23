import logging
import hashlib
from database import SessionLocal, engine, Base
from models import Course, Expert, User, Institution, Specialization, Subject, StudentRegistration, CertificateIssue, PaymentConfig
from datetime import datetime, timezone, timedelta

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
        db.query(CertificateIssue).delete()
        db.query(StudentRegistration).delete()
        db.query(Subject).delete()
        db.query(Specialization).delete()
        db.query(Institution).delete()
        db.query(User).delete()
        db.query(Course).delete()
        db.query(Expert).delete()
        db.query(PaymentConfig).delete()
        
        # 0. Seed Users
        logger.info("Seeding users...")
        admin_pwd = hashlib.sha256("admin123".encode()).hexdigest()
        reviewer_pwd = hashlib.sha256("reviewer123".encode()).hexdigest()
        expert_pwd = hashlib.sha256("expert123".encode()).hexdigest()
        learner_pwd = hashlib.sha256("learner123".encode()).hexdigest()
        users = [
            User(
                email="admin@skillforge.com",
                name="Admin User",
                hashed_password=admin_pwd,
                role="admin",
                is_active=True
            ),
            User(
                email="reviewer@skillforge.com",
                name="Reviewer User",
                hashed_password=reviewer_pwd,
                role="reviewer",
                is_active=True
            ),
            User(
                email="expert@skillforge.com",
                name="Expert User",
                hashed_password=expert_pwd,
                role="expert",
                is_active=True
            ),
            User(
                email="learner@skillforge.com",
                name="Alex Learner",
                hashed_password=learner_pwd,
                role="learner",
                is_active=True
            )
        ]
        db.add_all(users)
        
        # 1. Seed Experts
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
        db.commit()

        # 2. Seed Courses
        logger.info("Seeding courses...")
        courses = [
            Course(
                title="AI-Driven Systems Programming in Rust",
                description="Harness Rust's safety and speed alongside AI-generated optimization models. Ideal for building backend services and compilers.",
                hours=40,
                is_ai_generated=True,
                is_expert_validated=True
            ),
            Course(
                title="PostgreSQL Advanced Optimization & Architecture",
                description="Master database sharding, connection pooling, complex query analysis, and schema tuning for hyper-scale PostgreSQL databases.",
                hours=32,
                is_ai_generated=False,
                is_expert_validated=True
            ),
            Course(
                title="Neural Networks & Transformers from Scratch",
                description="Build modern GPT models, learn attention mechanisms, backpropagation calculus, and train text classification networks from first principles.",
                hours=48,
                is_ai_generated=True,
                is_expert_validated=True
            ),
            Course(
                title="Microservices Architecture with Python & FastAPI",
                description="Design resilient, distributed RESTful and gRPC microservices. Set up OAuth2, Docker orchestration, and Redis cache clusters.",
                hours=28,
                is_ai_generated=True,
                is_expert_validated=True
            ),
            Course(
                title="Next.js 15 & React Server Components Deep Dive",
                description="Understand how server-side rendering, static site generation, and streaming UI work under the hood. Implement beautiful UX interfaces.",
                hours=36,
                is_ai_generated=False,
                is_expert_validated=True
            ),
            Course(
                title="Kubernetes Operators and Cloud Native DevOps",
                description="Build custom Kubernetes controllers using Go and SDK. Master GitOps deployments with ArgoCD and custom autoscaling rules.",
                hours=30,
                is_ai_generated=True,
                is_expert_validated=True
            )
        ]
        db.add_all(courses)
        db.commit()

        # 4. Seed Institutions
        logger.info("Seeding institutions...")
        institutions = [
            Institution(name="Stanford University", code="STANFORD", address="Stanford, CA", contact_email="admin@stanford.edu"),
            Institution(name="MIT", code="MIT", address="Cambridge, MA", contact_email="admin@mit.edu"),
            Institution(name="Indian Institute of Technology Delhi", code="IITD", address="New Delhi, India", contact_email="contact@iitd.ac.in")
        ]
        db.add_all(institutions)

        # 5. Seed Specializations & Subjects
        logger.info("Seeding specializations and subjects...")
        spec1 = Specialization(name="AI & Machine Learning", code="AIML", description="Advanced Artificial Intelligence and Deep Learning curriculum")
        spec2 = Specialization(name="Cloud Native DevOps", code="DEVOPS", description="Distributed Systems & Cloud Orchestration")
        db.add_all([spec1, spec2])
        db.commit()

        subj1 = Subject(specialization_id=spec1.id, name="Federated Learning & Edge AI", code="AIML-301", semester_tier="District")
        subj2 = Subject(specialization_id=spec1.id, name="Generative AI Systems Architecture", code="AIML-401", semester_tier="State")
        db.add_all([subj1, subj2])

        # 7. Seed Certificate Issues
        logger.info("Seeding review center certificate issues...")
        issues = [
            CertificateIssue(
                learner_name="Alex Learner",
                learner_email="learner@skillforge.com",
                course_name="Advanced Neural Networks with PyTorch & Lightning",
                issue_description="Certificate name has incorrect spelling on PDF generated export.",
                status="open"
            )
        ]
        db.add_all(issues)

        # 8. Seed Specializations, Subjects & Learner Registration
        logger.info("Seeding Specialization, Subjects & Student Registration...")
        spec = Specialization(
            name="Artificial Intelligence & Autonomous Systems",
            code="AI-AS-2026",
            description="Full-stack AI, systems programming, and autonomous engineering specialization.",
            is_active=True
        )
        db.add(spec)
        db.commit()
        db.refresh(spec)

        subjects = [
            Subject(
                specialization_id=spec.id,
                name="Artificial Intelligence & Machine Learning Core",
                code="AI-401",
                description="Foundational and advanced neural architectures, deep reinforcement learning, and production PyTorch systems.",
                semester_tier="District",
                ai_mock_exams_enabled=True
            ),
            Subject(
                specialization_id=spec.id,
                name="Distributed Cloud Architecture & Kubernetes",
                code="CS-502",
                description="Enterprise microservices design, high-availability cluster orchestration, and service mesh networking.",
                semester_tier="State",
                ai_mock_exams_enabled=True
            ),
            Subject(
                specialization_id=spec.id,
                name="Autonomous Systems & Advanced Robotics",
                code="ROB-601",
                description="National Level capstone covering real-time sensor fusion, ROS2 architecture, and autonomous navigation.",
                semester_tier="National",
                ai_mock_exams_enabled=True
            )
        ]
        db.add_all(subjects)

        learner_u = db.query(User).filter(User.email == "learner@skillforge.com").first()
        inst_u = db.query(Institution).first()
        if learner_u and inst_u:
            reg = StudentRegistration(
                user_id=learner_u.id,
                institution_id=inst_u.id,
                specialization_id=spec.id,
                registration_number="SF-2026-001",
                batch_name="2026-A",
                access_status="active",
                current_tier="District"
            )
            db.add(reg)

        # 9. Seed Payment Configs
        logger.info("Seeding Payment Configs...")
        payment_configs = [
            PaymentConfig(
                tier_name="State",
                base_amount=1500.0,
                gst_rate=0.18,
                gst_amount=270.0,
                total_amount=1770.0,
                currency="INR",
                required_score=50.0
            ),
            PaymentConfig(
                tier_name="National",
                base_amount=2000.0,
                gst_rate=0.18,
                gst_amount=360.0,
                total_amount=2360.0,
                currency="INR",
                required_score=60.0
            )
        ]
        db.add_all(payment_configs)

        db.commit()
        logger.info("Successfully seeded database with sample data!")
    except Exception as e:
        db.rollback()
        logger.error(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()

