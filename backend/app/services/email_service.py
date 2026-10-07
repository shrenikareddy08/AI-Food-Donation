import asyncio
import html
import logging
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from sqlalchemy import select

from app.core.config import settings
from app.db.postgres import AsyncSessionLocal
from app.models.email_log import EmailNotification
from app.models.user import User

logger = logging.getLogger("mealbridge.email")


class EmailService:
    """
    Decoupled Email Service Abstraction for MealBridge AI.
    Handles HTML formatting, SMTP delivery, console logging for local dev,
    and persistent database logging into email_notifications.
    """

    def __init__(self):
        self.smtp_host = getattr(settings, "SMTP_HOST", "smtp.gmail.com")
        self.smtp_port = int(getattr(settings, "SMTP_PORT", 465))
        self.smtp_user = getattr(settings, "SMTP_USERNAME", "") or getattr(settings, "SMTP_USER", "")
        self.smtp_password = getattr(settings, "SMTP_PASSWORD", "")
        self.from_email = getattr(settings, "SMTP_FROM_EMAIL", "") or getattr(settings, "FROM_EMAIL", "no-reply@mealbridge.org")
        self.from_name = getattr(settings, "SMTP_FROM_NAME", "MealBridge")
        self.frontend_url = str(getattr(settings, "FRONTEND_URL", "http://localhost:5173")).rstrip("/")
        self.enabled = bool(self.smtp_user and self.smtp_password)

    async def _log_to_database(
        self,
        recipient_email: str,
        subject: str,
        body: str,
        event_type: str,
        status: str = "SENT",
        user_id: int | None = None
    ):
        """Asynchronously records sent email in the PostgreSQL email_notifications table."""
        try:
            async with AsyncSessionLocal() as session:
                if user_id is None:
                    # Look up user_id by email
                    res = await session.execute(
                        select(User.user_id).where(User.email == recipient_email)
                    )
                    user_id = res.scalar_one_or_none()

                log_entry = EmailNotification(
                    user_id=user_id,
                    recipient_email=recipient_email,
                    subject=subject,
                    body=body,
                    event_type=event_type,
                    status=status
                )
                session.add(log_entry)
                await session.commit()
        except Exception as e:
            logger.warning(f"Could not persist email notification to database: {e}")

    def _send_smtp(self, recipient_email: str, subject: str, html_body: str, text_body: str) -> bool:
        """Synchronous SMTP transport called via executor."""
        if not self.enabled:
            # Fallback for development / test environment: log cleanly to console without credentials or OTP
            print(
                f"\n========================================================"
                f"\n[MEALBRIDGE EMAIL DISPATCH — SMTP UNCONFIGURED]"
                f"\nTo: {recipient_email}"
                f"\nSubject: {subject}"
                f"\n========================================================\n",
                flush=True
            )
            logger.info(
                f"[EMAIL CONSOLE DISPATCH]\n"
                f"To: {recipient_email}\n"
                f"Subject: {subject}\n"
                f"----------------------------------------"
            )
            return True

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            from_addr = self.from_email or self.smtp_user
            msg["From"] = f"{self.from_name} <{from_addr}>" if self.from_name else from_addr
            msg["To"] = recipient_email

            msg.attach(MIMEText(text_body, "plain"))
            msg.attach(MIMEText(html_body, "html"))

            if self.smtp_port == 465:
                ssl_context = ssl.create_default_context()
                with smtplib.SMTP_SSL(self.smtp_host, self.smtp_port, context=ssl_context, timeout=15) as server:
                    server.login(self.smtp_user, self.smtp_password)
                    server.send_message(msg)
            else:
                with smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=15) as server:
                    server.ehlo()
                    server.starttls()
                    server.ehlo()
                    server.login(self.smtp_user, self.smtp_password)
                    server.send_message(msg)

            logger.info(f"Successfully delivered email via SMTP ({self.smtp_host}:{self.smtp_port}) to {recipient_email}")
            return True
        except smtplib.SMTPAuthenticationError as e:
            error_detail = e.smtp_error.decode(errors="ignore") if isinstance(e.smtp_error, bytes) else str(e.smtp_error)
            err_msg = f"SMTPAuthenticationError: {e.smtp_code} - {error_detail}"
            logger.error(f"Failed to authenticate with SMTP server for {recipient_email}: {err_msg}")
            print(
                f"\n========================================================"
                f"\n[MEALBRIDGE EMAIL DISPATCH — SMTP FAILED, DEV CONSOLE FALLBACK]"
                f"\nTo: {recipient_email}"
                f"\nSubject: {subject}"
                f"\nError: {err_msg}"
                f"\nNote: Gmail requires a 16-character App Password (https://myaccount.google.com/apppasswords)"
                f"\n========================================================\n",
                flush=True
            )
            return True
        except smtplib.SMTPServerDisconnected as e:
            err_msg = f"SMTPServerDisconnected: Connection closed by SMTP server ({self.smtp_host}:{self.smtp_port})"
            logger.error(f"SMTP connection severed for {recipient_email}: {err_msg}")
            print(
                f"\n========================================================"
                f"\n[MEALBRIDGE EMAIL DISPATCH — SMTP FAILED, DEV CONSOLE FALLBACK]"
                f"\nTo: {recipient_email}"
                f"\nSubject: {subject}"
                f"\nError: {err_msg}"
                f"\nNote: Gmail abruptly closes the socket when credentials fail authentication (requires a 16-character App Password from https://myaccount.google.com/apppasswords)"
                f"\n========================================================\n",
                flush=True
            )
            return True
        except Exception as e:
            err_msg = f"{type(e).__name__}: {str(e)[:120]}"
            logger.error(f"Failed to deliver SMTP email to {recipient_email}: {err_msg}")
            print(
                f"\n========================================================"
                f"\n[MEALBRIDGE EMAIL DISPATCH — SMTP FAILED, DEV CONSOLE FALLBACK]"
                f"\nTo: {recipient_email}"
                f"\nSubject: {subject}"
                f"\nError: {err_msg}"
                f"\n========================================================\n",
                flush=True
            )
            return True

    async def send_email(
        self,
        recipient_email: str,
        subject: str,
        html_body: str,
        text_body: str,
        event_type: str,
        user_id: int | None = None
    ) -> bool:
        """Asynchronously dispatches an email without blocking the HTTP request thread."""
        loop = asyncio.get_running_loop()
        success = await loop.run_in_executor(
            None,
            self._send_smtp,
            recipient_email,
            subject,
            html_body,
            text_body
        )
        status = "SENT" if success else "FAILED"
        await self._log_to_database(
            recipient_email=recipient_email,
            subject=subject,
            body=text_body,
            event_type=event_type,
            status=status,
            user_id=user_id
        )
        return success

    # =========================================================================
    # High-Level Domain Templates
    # =========================================================================

    async def send_otp_email(self, email: str, otp: str, purpose: str = "REGISTER"):
        subject = "MealBridge — Email Verification / OTP"
        text_body = (
            f"MealBridge\n"
            f"Email Verification / OTP\n\n"
            f"Your MealBridge verification OTP is: {otp}\n\n"
            f"This OTP expires in 5 minutes.\n"
        )
        html_body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; color: #1e293b;">
            <h2 style="color: #16a34a; margin-top: 0; margin-bottom: 4px;">MealBridge</h2>
            <h3 style="color: #475569; margin-top: 0; font-size: 16px; font-weight: normal;">Email Verification / OTP</h3>
            <p style="margin-top: 20px;">Your MealBridge verification OTP is:</p>
            <div style="background-color: #f0fdf4; border: 1px dashed #16a34a; font-size: 28px; font-weight: bold; letter-spacing: 6px; text-align: center; padding: 14px; margin: 20px 0; color: #15803d;">
                {otp}
            </div>
            <p style="color: #64748b; font-size: 13px;">This OTP expires in 5 minutes.</p>
        </div>
        """
        return await self.send_email(email, subject, html_body, text_body, "OTP_VERIFICATION")

    async def send_donation_created(self, email: str, donor_name: str, food_name: str, quantity: str, unit: str):
        subject = f"Donation Registered: {food_name} ({quantity} {unit})"
        text_body = (
            f"Hello {donor_name},\n\n"
            f"Thank you for your generous contribution. Your surplus food donation '{food_name}' "
            f"({quantity} {unit}) has been registered and is now visible to nearby verified NGOs.\n\n"
            f"You will receive an update as soon as an NGO claims your donation.\n\n"
            f"— The MealBridge AI Team"
        )
        html_body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #16a34a;">MealBridge AI Donation Created</h2>
            <p>Dear <strong>{donor_name}</strong>,</p>
            <p>Your surplus food donation <strong>{food_name}</strong> ({quantity} {unit}) was registered successfully.</p>
            <p style="color: #475569;">Our automated matching engine is currently notifying verified charities in your vicinity.</p>
        </div>
        """
        return await self.send_email(email, subject, html_body, text_body, "DONATION_CREATED")

    async def send_ngo_match_found(self, email: str, ngo_name: str, food_name: str, quantity: str, unit: str, match_score: float):
        subject = f"New Food Match: {food_name} ({match_score}% Match)"
        text_body = (
            f"Hello {ngo_name},\n\n"
            f"A surplus food donation matching your requirements has been identified:\n"
            f"- Food: {food_name}\n"
            f"- Quantity: {quantity} {unit}\n"
            f"- Match Compatibility: {match_score}%\n\n"
            f"Please log in to your NGO portal to accept or decline this allocation.\n\n"
            f"— The MealBridge AI Team"
        )
        html_body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #2563eb;">New Food Match Found</h2>
            <p>Dear <strong>{ngo_name}</strong>,</p>
            <p>A fresh food donation matching your requirements is available:</p>
            <ul>
                <li><strong>Item:</strong> {food_name}</li>
                <li><strong>Quantity:</strong> {quantity} {unit}</li>
                <li><strong>Match Score:</strong> {match_score}%</li>
            </ul>
            <p>Please review and accept this match in your dashboard to initiate volunteer logistics.</p>
        </div>
        """
        return await self.send_email(email, subject, html_body, text_body, "NGO_MATCH")

    async def send_delivery_assigned(self, email: str, volunteer_name: str, pickup_location: str, delivery_location: str):
        subject = "Delivery Assigned: Food Pickup & Redistribution"
        text_body = (
            f"Hello {volunteer_name},\n\n"
            f"You have been assigned a food redistribution mission.\n"
            f"- Pickup: {pickup_location}\n"
            f"- Delivery: {delivery_location}\n\n"
            f"Please open your MealBridge Volunteer Portal to start live tracking.\n\n"
            f"— The MealBridge AI Team"
        )
        html_body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #ea580c;">New Delivery Assignment</h2>
            <p>Dear <strong>{volunteer_name}</strong>,</p>
            <p>A food delivery assignment is waiting for you:</p>
            <p><strong>Pickup:</strong> {pickup_location}<br><strong>Destination:</strong> {delivery_location}</p>
            <p>Open your volunteer app to start navigation.</p>
        </div>
        """
        return await self.send_email(email, subject, html_body, text_body, "DELIVERY_ASSIGNED")

    async def send_verification_email(self, email: str, ngo_name: str, token: str) -> bool:
        safe_ngo_name = html.escape(ngo_name or "Partner Organization")
        verification_url = f"{self.frontend_url}/verify-email?token={token}"
        subject = "Verify your MealBridge NGO Email"
        text_body = (
            f"Hello {ngo_name},\n\n"
            f"Welcome to MealBridge.\n\n"
            f"Please verify your organization email address by clicking the button below.\n\n"
            f"[ Verify Email ]: {verification_url}\n\n"
            f"This verification link will expire in 30 minutes.\n\n"
            f"If you did not request this verification, you can safely ignore this email.\n\n"
            f"Regards,\n"
            f"MealBridge Team\n"
            f"Food Donation & Redistribution Platform"
        )
        html_body = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
    <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 32px;">
        <h2 style="color: #16a34a; margin-top: 0;">MealBridge</h2>
        <p>Hello {safe_ngo_name},</p>
        <p>Welcome to MealBridge.</p>
        <p>Please verify your organization email address by clicking the button below.</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{verification_url}" style="background-color: #16a34a; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Email</a>
        </div>
        <p style="color: #64748b; font-size: 13px;">This verification link will expire in 30 minutes.</p>
        <p style="color: #64748b; font-size: 13px;">If you did not request this verification, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #475569; font-size: 13px; margin-bottom: 0;">
            Regards,<br>
            <strong>MealBridge Team</strong><br>
            Food Donation & Redistribution Platform
        </p>
    </div>
</body>
</html>"""
        return await self.send_email(email, subject, html_body, text_body, "NGO_EMAIL_VERIFICATION")

    async def send_donation_match_email(
        self,
        email: str,
        ngo_name: str,
        food_name: str,
        quantity: str,
        pickup_location: str,
        expiry: str
    ) -> bool:
        safe_ngo_name = html.escape(ngo_name or "Partner Organization")
        safe_food_name = html.escape(food_name)
        safe_quantity = html.escape(str(quantity))
        safe_pickup_location = html.escape(pickup_location or "Donor Location")
        safe_expiry = html.escape(str(expiry) if expiry else "Not specified")
        dashboard_url = f"{self.frontend_url}/ngo/dashboard"

        subject = "MealBridge Donation Match"
        text_body = (
            f"Hello {ngo_name},\n\n"
            f"A new food donation has been matched with your organization.\n\n"
            f"Donation:\n"
            f"Food: {food_name}\n"
            f"Quantity: {quantity}\n"
            f"Pickup Location: {pickup_location}\n"
            f"Expiry: {expiry}\n\n"
            f"Please log in to MealBridge to review and respond:\n"
            f"{dashboard_url}\n\n"
            f"Regards,\n"
            f"MealBridge Team\n"
            f"Food Donation & Redistribution Platform"
        )
        html_body = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
    <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 32px;">
        <h2 style="color: #16a34a; margin-top: 0;">MealBridge Donation Match</h2>
        <p>Hello {safe_ngo_name},</p>
        <p>A new food donation has been matched with your organization.</p>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0; font-size: 14px; line-height: 1.6;">
            <div><strong>Food:</strong> {safe_food_name}</div>
            <div><strong>Quantity:</strong> {safe_quantity}</div>
            <div><strong>Pickup Location:</strong> {safe_pickup_location}</div>
            <div><strong>Expiry:</strong> {safe_expiry}</div>
        </div>
        <p>Please log in to MealBridge to review and respond.</p>
        <div style="text-align: center; margin: 28px 0;">
            <a href="{dashboard_url}" style="background-color: #16a34a; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Open NGO Dashboard</a>
        </div>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #475569; font-size: 13px; margin-bottom: 0;">
            Regards,<br>
            <strong>MealBridge Team</strong><br>
            Food Donation & Redistribution Platform
        </p>
    </div>
</body>
</html>"""
        return await self.send_email(email, subject, html_body, text_body, "DONATION_MATCH")

    async def send_donation_status_email(
        self,
        email: str,
        recipient_name: str,
        food_name: str,
        status: str,
        details: str = ""
    ) -> bool:
        safe_name = html.escape(recipient_name or "Member")
        safe_food = html.escape(food_name)
        safe_status = html.escape(status)
        subject = f"MealBridge Donation Status: {status}"
        text_body = (
            f"Hello {recipient_name},\n\n"
            f"The status of food donation '{food_name}' has been updated to: {status}.\n"
            f"{details}\n\n"
            f"Regards,\n"
            f"MealBridge Team"
        )
        html_body = f"""<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
    <h2>Donation Status Update</h2>
    <p>Hello {safe_name},</p>
    <p>The status of food donation <strong>{safe_food}</strong> is now <strong>{safe_status}</strong>.</p>
    {f"<p>{html.escape(details)}</p>" if details else ""}
    <p>Regards,<br>MealBridge Team</p>
</body>
</html>"""
        return await self.send_email(email, subject, html_body, text_body, "DONATION_STATUS_UPDATE")


email_service = EmailService()
