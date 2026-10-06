import asyncio
import logging
import smtplib
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
        self.smtp_host = getattr(settings, "SMTP_HOST", "localhost")
        self.smtp_port = getattr(settings, "SMTP_PORT", 587)
        self.smtp_user = getattr(settings, "SMTP_USER", "")
        self.smtp_password = getattr(settings, "SMTP_PASSWORD", "")
        self.from_email = getattr(settings, "FROM_EMAIL", "no-reply@mealbridge.org")
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
            # Fallback for development / test environment: log cleanly to console
            logger.info(
                f"[EMAIL CONSOLE DISPATCH]\n"
                f"To: {recipient_email}\n"
                f"Subject: {subject}\n"
                f"Body Preview: {text_body[:120]}...\n"
                f"----------------------------------------"
            )
            return True

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = self.from_email
            msg["To"] = recipient_email

            msg.attach(MIMEText(text_body, "plain"))
            msg.attach(MIMEText(html_body, "html"))

            with smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=10) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.send_message(msg)
            return True
        except Exception as e:
            logger.error(f"Failed to deliver SMTP email to {recipient_email}: {e}")
            return False

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
        subject = f"MealBridge AI — Your Verification Code is {otp}"
        text_body = (
            f"Hello,\n\n"
            f"Your MealBridge AI one-time verification code for {purpose} is: {otp}\n\n"
            f"This code will expire in 5 minutes. Do not share this code with anyone.\n\n"
            f"— The MealBridge AI Team"
        )
        html_body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #16a34a; margin-top: 0;">MealBridge AI</h2>
            <p>Your one-time verification code for <strong>{purpose}</strong> is:</p>
            <div style="background-color: #f0fdf4; border: 1px dashed #16a34a; font-size: 28px; font-weight: bold; letter-spacing: 6px; text-align: center; padding: 12px; margin: 20px 0; color: #15803d;">
                {otp}
            </div>
            <p style="color: #64748b; font-size: 13px;">This code is valid for 5 minutes. Never disclose this code to anyone.</p>
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

    async def send_delivery_completed(self, email: str, recipient_name: str, food_name: str, delivered_to: str):
        subject = f"Delivery Confirmed: {food_name}"
        text_body = (
            f"Hello {recipient_name},\n\n"
            f"The delivery for '{food_name}' has been successfully completed to {delivered_to}.\n"
            f"Thank you for helping combat hunger and eliminate food waste!\n\n"
            f"— The MealBridge AI Team"
        )
        html_body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #16a34a;">Delivery Confirmed!</h2>
            <p>Dear <strong>{recipient_name}</strong>,</p>
            <p>Your food donation of <strong>{food_name}</strong> was successfully handed over to <strong>{delivered_to}</strong>.</p>
            <p style="color: #64748b;">Every meal preserved brings us closer to a zero-hunger community.</p>
        </div>
        """
        return await self.send_email(email, subject, html_body, text_body, "DONATION_COMPLETED")


email_service = EmailService()
