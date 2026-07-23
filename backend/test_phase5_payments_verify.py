import datetime
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base
import models
import schemas
from services.payment_service import get_tier_pricing, create_order_for_tier, process_successful_payment

@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()
    
    # Seed default configs
    session.add_all([
        models.PaymentConfig(
            tier_name="State",
            base_amount=1500.0,
            gst_rate=0.18,
            gst_amount=270.0,
            total_amount=1770.0,
            currency="INR",
            required_score=50.0
        ),
        models.PaymentConfig(
            tier_name="National",
            base_amount=2000.0,
            gst_rate=0.18,
            gst_amount=360.0,
            total_amount=2360.0,
            currency="INR",
            required_score=60.0
        )
    ])
    session.commit()
    yield session
    session.close()

def test_dynamic_pricing_retrieval(db_session):
    pricing = get_tier_pricing(db_session)
    assert pricing["State"]["total_amount"] == 1770.0
    assert pricing["National"]["total_amount"] == 2360.0

def test_dynamic_pricing_admin_update(db_session):
    # Admin updates State base_amount to 2000.0 -> total should be 2360.0
    cfg = db_session.query(models.PaymentConfig).filter(models.PaymentConfig.tier_name == "State").first()
    cfg.base_amount = 2000.0
    cfg.gst_amount = 360.0
    cfg.total_amount = 2360.0
    cfg.required_score = 55.0
    db_session.commit()

    pricing = get_tier_pricing(db_session)
    assert pricing["State"]["base_amount"] == 2000.0
    assert pricing["State"]["total_amount"] == 2360.0
    assert pricing["State"]["required_district_score"] == 55.0

def test_create_order_uses_dynamic_pricing(db_session):
    # Setup custom pricing: State = 1800 base + 324 gst = 2124 total
    cfg = db_session.query(models.PaymentConfig).filter(models.PaymentConfig.tier_name == "State").first()
    cfg.base_amount = 1800.0
    cfg.gst_amount = 324.0
    cfg.total_amount = 2124.0
    db_session.commit()

    user = models.User(id=101, email="testuser@skillforge.com", name="Test User", hashed_password="pwd")
    reg = models.StudentRegistration(
        id=501,
        user_id=101,
        institution_id=1,
        specialization_id=1,
        current_tier="District",
        district_score=65.0,
        access_state="pending_payment"
    )
    db_session.add_all([user, reg])
    db_session.commit()

    order = create_order_for_tier(db_session, user_id=101, registration_id=501, target_tier="State")
    assert order.amount == 1800.0
    assert order.gst_amount == 324.0
    assert order.total_amount == 2124.0
    assert order.status == "created"

def test_process_successful_payment_dynamic(db_session):
    # Setup custom pricing: State = 1800 + 324 = 2124
    cfg = db_session.query(models.PaymentConfig).filter(models.PaymentConfig.tier_name == "State").first()
    cfg.base_amount = 1800.0
    cfg.gst_amount = 324.0
    cfg.total_amount = 2124.0
    db_session.commit()

    user = models.User(id=102, email="test2@skillforge.com", name="Test 2", hashed_password="pwd")
    reg = models.StudentRegistration(
        id=502,
        user_id=102,
        institution_id=1,
        specialization_id=1,
        current_tier="District",
        district_score=60.0,
        access_state="pending_payment",
        payment_required=True
    )
    db_session.add_all([user, reg])
    db_session.commit()

    order = create_order_for_tier(db_session, user_id=102, registration_id=502, target_tier="State")
    now = datetime.datetime.now(datetime.timezone.utc)
    res = process_successful_payment(
        db_session,
        registration_id=502,
        target_tier="State",
        gateway_order_id=order.gateway_order_id,
        gateway_payment_id="pay_dyn_test",
        now=now
    )
    assert res["status"] == "success"
    assert res["new_tier"] == "State"
    assert reg.total_paid_amount == 2124.0
