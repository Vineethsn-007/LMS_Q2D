import os
import logging
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status, Request, Header, Query
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from auth import get_current_user, verifySubAdminOrAdmin
from services.payment_service import (
    create_order_for_tier,
    verify_razorpay_signature,
    process_successful_payment,
    get_tier_pricing as fetch_tier_pricing,
    TIER_PRICING
)

router = APIRouter()
logger = logging.getLogger("payments_router")

@router.get("/pricing")
def get_tier_pricing(db: Session = Depends(get_db)):
    """ Returns dynamic INR pricing breakdown including 18% GST for frontend checkout. """
    return fetch_tier_pricing(db)

@router.get("/history")
def get_payment_history(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """ Fetch the payment history for the current user """
    records = db.query(models.PaymentRecord).filter(
        models.PaymentRecord.user_id == current_user.id
    ).order_by(models.PaymentRecord.created_at.desc()).all()
    return records

@router.get("/admin/pricing", response_model=Dict[str, Any])
def get_admin_tier_pricing(
    current_user: models.User = Depends(verifySubAdminOrAdmin),
    db: Session = Depends(get_db)
):
    """ Admin endpoint to fetch current pricing breakdown from DB / defaults """
    return fetch_tier_pricing(db)

@router.put("/admin/pricing/{tier_name}", response_model=schemas.PaymentConfigResponse)
def update_tier_pricing(
    tier_name: str,
    update_data: schemas.PaymentConfigUpdate,
    current_user: models.User = Depends(verifySubAdminOrAdmin),
    db: Session = Depends(get_db)
):
    """ Admin endpoint to update dynamic pricing and required score for a tier """
    if tier_name not in ["State", "National"]:
        raise HTTPException(status_code=400, detail="Invalid tier name. Must be 'State' or 'National'.")
    
    config = db.query(models.PaymentConfig).filter(models.PaymentConfig.tier_name == tier_name).first()
    if not config:
        config = models.PaymentConfig(tier_name=tier_name)
        db.add(config)
    
    base = float(update_data.base_amount)
    gst_rate = float(update_data.gst_rate or 0.18)
    gst_amt = round(base * gst_rate, 2)
    total_amt = round(base + gst_amt, 2)
    
    config.base_amount = base
    config.gst_rate = gst_rate
    config.gst_amount = gst_amt
    config.total_amount = total_amt
    config.required_score = float(update_data.required_score)
    
    db.commit()
    db.refresh(config)
    return config

@router.get("/admin/history", response_model=List[schemas.AdminPaymentHistoryItem])
def get_admin_payment_history(
    status_filter: Optional[str] = Query(None, alias="status"),
    tier_filter: Optional[str] = Query(None, alias="tier"),
    user_id_filter: Optional[int] = Query(None, alias="user_id"),
    current_user: models.User = Depends(verifySubAdminOrAdmin),
    db: Session = Depends(get_db)
):
    """ Admin endpoint to fetch system-wide payment history with user details """
    query = db.query(models.PaymentRecord, models.User).join(
        models.User, models.PaymentRecord.user_id == models.User.id
    )
    if status_filter:
        query = query.filter(models.PaymentRecord.status == status_filter)
    if tier_filter:
        query = query.filter(models.PaymentRecord.target_tier == tier_filter)
    if user_id_filter:
        query = query.filter(models.PaymentRecord.user_id == user_id_filter)
        
    records = query.order_by(models.PaymentRecord.created_at.desc()).all()
    results = []
    for pr, usr in records:
        item = schemas.AdminPaymentHistoryItem.model_validate(pr)
        item.user_name = usr.name
        item.user_email = usr.email
        results.append(item)
    return results

@router.post("/create-order", response_model=schemas.PaymentOrderResponse)
def create_payment_order(
    order_in: schemas.PaymentOrderCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Creates an order/payment intent for Razorpay checkout with full GST breakdown.
    """
    try:
        payment_record = create_order_for_tier(
            db=db,
            user_id=current_user.id,
            registration_id=order_in.registration_id,
            target_tier=order_in.target_tier
        )
        return {
            "order_id": payment_record.gateway_order_id,
            "amount": payment_record.total_amount,
            "currency": payment_record.currency,
            "target_tier": payment_record.target_tier,
            "key_id": os.getenv("RAZORPAY_KEY_ID", "rzp_test_TDQGFCm2xKMtfk")
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/verify")
def verify_payment(
    verification: schemas.PaymentVerification,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Synchronously verifies Razorpay HMAC signature and processes level unlock.
    """
    is_valid = verify_razorpay_signature(
        order_id=verification.order_id,
        payment_id=verification.payment_id,
        signature=verification.signature
    )
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid payment signature verification.")

    try:
        result = process_successful_payment(
            db=db,
            registration_id=verification.registration_id,
            target_tier=verification.target_tier,
            gateway_order_id=verification.order_id,
            gateway_payment_id=verification.payment_id
        )
        return {
            "message": "Payment verified successfully, level unlocked.",
            **result
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/webhook")
async def razorpay_async_webhook(
    request: Request,
    db: Session = Depends(get_db),
    x_razorpay_signature: str = Header(None, alias="X-Razorpay-Signature")
):
    """
    Asynchronous webhook handler for Razorpay payment confirmations.
    """
    payload_json = await request.json()
    event = payload_json.get("event")
    logger.info(f"Received Razorpay async webhook event: {event}")

    if event in ("order.paid", "payment.captured"):
        payload_data = payload_json.get("payload", {})
        payment_entity = payload_data.get("payment", {}).get("entity", {})
        order_id = payment_entity.get("order_id") or payload_json.get("order_id")
        payment_id = payment_entity.get("id") or payload_json.get("payment_id")
        registration_id = payload_json.get("registration_id")
        target_tier = payload_json.get("target_tier")

        # If webhook has order_id, locate PaymentRecord
        payment_record = None
        if order_id:
            payment_record = db.query(models.PaymentRecord).filter(
                models.PaymentRecord.gateway_order_id == order_id
            ).first()

        if payment_record:
            registration_id = payment_record.registration_id
            target_tier = payment_record.target_tier

        if not registration_id or not target_tier:
            logger.warning("Webhook missing registration_id or target_tier mapping.")
            return {"status": "ignored", "reason": "missing registration mapping"}

        result = process_successful_payment(
            db=db,
            registration_id=registration_id,
            target_tier=target_tier,
            gateway_order_id=order_id,
            gateway_payment_id=payment_id
        )
        return {"status": "success", "processed": result}

    return {"status": "ignored", "event": event}
