import os
import logging
import smtplib
import requests
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
        demo_override = os.getenv("DEMO_EMAIL_OVERRIDE", "")
        if demo_override:
            recipient = demo_override
            subject = f"[Diverted] {subject}"

        brevo_api_key = os.getenv("BREVO_API_KEY", "")
        resend_api_key = os.getenv("RESEND_API_KEY", "")
        sendgrid_api_key = os.getenv("SENDGRID_API_KEY", "")
        smtp_user = os.getenv("SMTP_USER", "")

        # ── 1. Brevo (formerly Sendinblue) ───────────────────────────────────
        # Free tier: 300 emails/day, sends to ANY recipient, no domain needed.
        # Uses HTTPS Port 443 → works on Render.
        if brevo_api_key:
            try:
                from_email = os.getenv("BREVO_FROM_EMAIL", smtp_user or "noreply@skillforge.edu")
                from_name = os.getenv("BREVO_FROM_NAME", "SkillForge LMS")
                resp = requests.post(
                    "https://api.brevo.com/v3/smtp/email",
                    headers={
                        "api-key": brevo_api_key,
                        "Content-Type": "application/json"
                    },
                    json={
                        "sender": {"name": from_name, "email": from_email},
                        "to": [{"email": recipient}],
                        "subject": subject,
                        "htmlContent": html_body,
                        "textContent": text_body
                    },
                    timeout=10
                )
                if resp.status_code in (200, 201):
                    cls._record_email_log(recipient, template_type, subject, "sent", db=db)
                    logger.info(f"Brevo: email sent to {recipient} (template: {template_type})")
                    return True
                else:
                    err_msg = f"Brevo API HTTP {resp.status_code}: {resp.text}"
                    logger.error(err_msg)
                    cls._record_email_log(recipient, template_type, subject, "failed", error_message=err_msg, db=db)
                    return False
            except Exception as e:
                logger.error(f"Brevo HTTP API error: {e}")

        # ── 2. Resend ─────────────────────────────────────────────────────────
        # Free tier requires a verified domain to send to anyone besides account email.
        if resend_api_key:
            try:
                from_email = os.getenv("RESEND_FROM_EMAIL", f"SkillForge LMS <{smtp_user or 'noreply@resend.dev'}>")
                resp = requests.post(
                    "https://api.resend.com/emails",
                    headers={
                        "Authorization": f"Bearer {resend_api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "from": from_email,
                        "to": [recipient],
                        "subject": subject,
                        "html": html_body,
                        "text": text_body
                    },
                    timeout=10
                )
                if resp.status_code in (200, 201):
                    cls._record_email_log(recipient, template_type, subject, "sent", db=db)
                    return True
                else:
                    err_msg = f"Resend API HTTP {resp.status_code}: {resp.text}"
                    logger.error(err_msg)
                    cls._record_email_log(recipient, template_type, subject, "failed", error_message=err_msg, db=db)
                    return False
            except Exception as e:
                logger.error(f"Resend HTTP API error: {e}")

        # ── 3. SendGrid ───────────────────────────────────────────────────────
        if sendgrid_api_key:
            try:
                from_email = os.getenv("SENDGRID_FROM_EMAIL", smtp_user or "noreply@skillforge.edu")
                resp = requests.post(
                    "https://api.sendgrid.com/v3/mail/send",
                    headers={
                        "Authorization": f"Bearer {sendgrid_api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "personalizations": [{"to": [{"email": recipient}]}],
                        "from": {"email": from_email},
                        "subject": subject,
                        "content": [
                            {"type": "text/plain", "value": text_body},
                            {"type": "text/html", "value": html_body}
                        ]
                    },
                    timeout=10
                )
                if resp.status_code in (200, 201, 202):
                    cls._record_email_log(recipient, template_type, subject, "sent", db=db)
                    return True
                else:
                    err_msg = f"SendGrid API HTTP {resp.status_code}: {resp.text}"
                    logger.error(err_msg)
                    cls._record_email_log(recipient, template_type, subject, "failed", error_message=err_msg, db=db)
                    return False
            except Exception as e:
                logger.error(f"SendGrid HTTP API error: {e}")

        # ── 4. SMTP Fallback (may be blocked on cloud hosts) ──────────────────
        smtp_host = os.getenv("SMTP_HOST", "")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        smtp_password = os.getenv("SMTP_PASSWORD", "")
        smtp_from_env = os.getenv("SMTP_FROM_EMAIL", "")
        smtp_from = smtp_user if (smtp_user and smtp_from_env and smtp_from_env != smtp_user) else (smtp_from_env or smtp_user or "noreply@skillforge.edu")

        if not smtp_host:
            logger.info(f"[DEV MOCK] To={recipient} Template={template_type} Subject={subject}")
            cls._record_email_log(recipient, template_type, subject, "mocked", db=db)
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

            sent = False
            last_err = None

            # Primary Attempt (Configured Port, e.g. 587 with STARTTLS or 465 with SSL)
            try:
                if smtp_port == 465:
                    with smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=10) as server:
                        if smtp_user and smtp_password:
                            server.login(smtp_user, smtp_password)
                        server.sendmail(smtp_from, recipient, msg.as_string())
                    sent = True
                else:
                    with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
                        server.starttls()
                        if smtp_user and smtp_password:
                            server.login(smtp_user, smtp_password)
                        server.sendmail(smtp_from, recipient, msg.as_string())
                    sent = True
            except Exception as e1:
                last_err = e1
                logger.warning(f"SMTP attempt on port {smtp_port} failed ({e1}). Retrying via SSL port 465...")
                # Secondary Fallback Attempt (Port 465 with SSL)
                if smtp_port != 465:
                    try:
                        with smtplib.SMTP_SSL(smtp_host, 465, timeout=10) as server:
                            if smtp_user and smtp_password:
                                server.login(smtp_user, smtp_password)
                            server.sendmail(smtp_from, recipient, msg.as_string())
                        sent = True
                    except Exception as e2:
                        last_err = f"Port {smtp_port}: {e1} | Port 465: {e2}"

            if sent:
                cls._record_email_log(
                    recipient=recipient,
                    template_type=template_type,
                    subject=subject,
                    status="sent",
                    db=db,
                )
                return True
            else:
                raise Exception(str(last_err))
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


