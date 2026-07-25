import os
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from sqlalchemy.orm import Session
from database import SessionLocal
import models
from services.email_templates import (
    get_onboarding_template,
    get_announcement_template,
    get_ticket_update_template,
    get_subadmin_onboarding_template,
    get_exam_credential_template,
    get_exam_reminder_template,
    get_payment_receipt_template,
    get_certificate_issued_template,
)

logger = logging.getLogger(__name__)

class MailerService:
    @classmethod
    def _record_email_log(
        cls,
        recipient: str,
        template_type: str,
        subject: str,
        status: str,
        error_message: Optional[str] = None,
        db: Optional[Session] = None,
    ):
        session = None
        should_close = False
        try:
            if db is not None and getattr(db, 'is_active', True):
                session = db
            else:
                session = SessionLocal()
                should_close = True

            log_entry = models.EmailLog(
                recipient=recipient,
                template_type=template_type,
                subject=subject,
                status=status,
                error_message=error_message,
            )
            session.add(log_entry)
            session.commit()
        except Exception as e:
            logger.error(f"Failed to record EmailLog for {recipient}: {e}")
            if session:
                try:
                    session.rollback()
                except Exception:
                    pass
        finally:
            if should_close and session:
                try:
                    session.close()
                except Exception:
                    pass

    @classmethod
    def send_email(
        cls,
        recipient: str,
        subject: str,
        text_body: str,
        html_body: str,
        template_type: str,
        db: Optional[Session] = None,
    ) -> bool:
        smtp_host = os.getenv("SMTP_HOST", "")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        smtp_user = os.getenv("SMTP_USER", "")
        smtp_password = os.getenv("SMTP_PASSWORD", "")
        smtp_from_env = os.getenv("SMTP_FROM_EMAIL", "")
        demo_override = os.getenv("DEMO_EMAIL_OVERRIDE", "")

        # Gmail (and most SMTP providers) require From == authenticated user.
        # If SMTP_FROM_EMAIL is set to a different address (e.g. a vanity alias)
        # the send will fail silently. Fall back to SMTP_USER when they differ
        # and we're on a standard gmail/smtp setup.
        if smtp_user and smtp_from_env and smtp_from_env != smtp_user:
            logger.warning(
                f"SMTP_FROM_EMAIL ({smtp_from_env}) differs from SMTP_USER ({smtp_user}). "
                "Gmail requires these to match — using SMTP_USER as From address."
            )
            smtp_from = smtp_user
        else:
            smtp_from = smtp_from_env or smtp_user or "noreply@skillforge.edu"

        original_recipient = recipient
        if demo_override:
            recipient = demo_override
            subject = f"[Diverted from {original_recipient}] {subject}"

        # Dev / Console Fallback Mode
        if not smtp_host:
            logger.info("=== DEV MOCK EMAIL OUTPUT ===")
            logger.info(f"To: {recipient}")
            logger.info(f"Template Type: {template_type}")
            logger.info(f"Subject: {subject}")
            logger.info(f"Body:\n{text_body}")
            logger.info("=============================")
            cls._record_email_log(
                recipient=recipient,
                template_type=template_type,
                subject=subject,
                status="mocked",
                db=db,
            )
            return True

        # SMTP Sending
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = smtp_from
            msg["To"] = recipient

            part1 = MIMEText(text_body, "plain")
            part2 = MIMEText(html_body, "html")
            msg.attach(part1)
            msg.attach(part2)

            with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
                server.starttls()
                if smtp_user and smtp_password:
                    server.login(smtp_user, smtp_password)
                server.sendmail(smtp_from, recipient, msg.as_string())

            cls._record_email_log(
                recipient=recipient,
                template_type=template_type,
                subject=subject,
                status="sent",
                db=db,
            )
            return True
        except Exception as e:
            logger.error(f"SMTP send failed for {recipient}: {e}")
            cls._record_email_log(
                recipient=recipient,
                template_type=template_type,
                subject=subject,
                status="failed",
                error_message=str(e),
                db=db,
            )
            return False

    @classmethod
    def _get_portal_url(cls) -> str:
        default_fe = "https://skillforge-frontend-r6va.onrender.com" if (os.getenv("RENDER") or os.getenv("RENDER_EXTERNAL_URL") or os.getenv("PORT")) else "http://localhost:3000"
        return (os.getenv("FRONTEND_URL") or os.getenv("PORTAL_URL") or default_fe).rstrip("/")

    @classmethod
    def send_onboarding_email(
        cls, email: str, name: str, temp_password: str, db: Optional[Session] = None
    ) -> bool:
        """
        Sends onboarding email with temporary credentials and first login instructions.
        """
        portal_url = cls._get_portal_url()
        payload = get_onboarding_template(name, email, temp_password, portal_url)
        return cls.send_email(
            recipient=email,
            subject=payload["subject"],
            text_body=payload["text_body"],
            html_body=payload["html_body"],
            template_type=payload["template_type"],
            db=db,
        )

    @classmethod
    def send_announcement_email(
        cls, email: str, name: str, title: str, content: str, db: Optional[Session] = None
    ) -> bool:
        portal_url = cls._get_portal_url()
        payload = get_announcement_template(name, title, content, portal_url)
        return cls.send_email(
            recipient=email,
            subject=payload["subject"],
            text_body=payload["text_body"],
            html_body=payload["html_body"],
            template_type=payload["template_type"],
            db=db,
        )

    @classmethod
    def send_ticket_update_email(
        cls, email: str, name: str, ticket_number: str, subject_text: str, update_body: str, db: Optional[Session] = None
    ) -> bool:
        portal_url = cls._get_portal_url()
        payload = get_ticket_update_template(name, ticket_number, subject_text, update_body, portal_url)
        return cls.send_email(
            recipient=email,
            subject=payload["subject"],
            text_body=payload["text_body"],
            html_body=payload["html_body"],
            template_type=payload["template_type"],
            db=db,
        )

    @classmethod
    def send_subadmin_onboarding_email(
        cls, email: str, name: str, temp_password: str, assigned_institutions_text: str, privileges_text: str, db: Optional[Session] = None
    ) -> bool:
        portal_url = cls._get_portal_url()
        payload = get_subadmin_onboarding_template(
            name, email, temp_password, assigned_institutions_text, privileges_text, portal_url
        )
        return cls.send_email(
            recipient=email,
            subject=payload["subject"],
            text_body=payload["text_body"],
            html_body=payload["html_body"],
            template_type=payload["template_type"],
            db=db,
        )

    @classmethod
    def send_exam_credential_email(
        cls, email: str, name: str, temp_user_id: str, temp_password: str, assessment_link: str, slot_time_str: str, db: Optional[Session] = None
    ) -> bool:
        portal_url = cls._get_portal_url()
        payload = get_exam_credential_template(
            name=name, temp_user_id=temp_user_id, temp_password=temp_password, assessment_link=assessment_link, slot_time_str=slot_time_str, portal_url=portal_url
        )
        return cls.send_email(
            recipient=email,
            subject=payload["subject"],
            text_body=payload["text_body"],
            html_body=payload["html_body"],
            template_type=payload["template_type"],
            db=db,
        )

    @classmethod
    def send_exam_reminder_email(
        cls, email: str, name: str, level: str, booking_ref: str, assessment_link: str, temp_user_id: str, db: Optional[Session] = None
    ) -> bool:
        portal_url = cls._get_portal_url()
        payload = get_exam_reminder_template(
            name=name, level=level, booking_ref=booking_ref, assessment_link=assessment_link, temp_user_id=temp_user_id, portal_url=portal_url
        )
        return cls.send_email(
            recipient=email,
            subject=payload["subject"],
            text_body=payload["text_body"],
            html_body=payload["html_body"],
            template_type=payload["template_type"],
            db=db,
        )

    @classmethod
    def send_payment_receipt_email(
        cls, email: str, name: str, target_tier: str, amount: float, transaction_id: str, db: Optional[Session] = None
    ) -> bool:
        portal_url = cls._get_portal_url()
        payload = get_payment_receipt_template(
            name=name, target_tier=target_tier, amount=amount, transaction_id=transaction_id, portal_url=portal_url
        )
        return cls.send_email(
            recipient=email,
            subject=payload["subject"],
            text_body=payload["text_body"],
            html_body=payload["html_body"],
            template_type=payload["template_type"],
            db=db,
        )

    @classmethod
    def send_certificate_issued_email(
        cls, email: str, name: str, course_name: str, cert_id: str, cert_url: str, db: Optional[Session] = None
    ) -> bool:
        portal_url = cls._get_portal_url()
        payload = get_certificate_issued_template(
            name=name, course_name=course_name, cert_id=cert_id, cert_url=cert_url, portal_url=portal_url
        )
        return cls.send_email(
            recipient=email,
            subject=payload["subject"],
            text_body=payload["text_body"],
            html_body=payload["html_body"],
            template_type=payload["template_type"],
            db=db,
        )


