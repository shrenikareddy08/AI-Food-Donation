import logging
import re
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)


class SMSDeliveryError(Exception):
    """Raised when SMS delivery fails or credentials are not configured."""
    pass


def normalize_phone(phone: str | None) -> str:
    """
    Normalizes a phone number to standard E.164-like format (+91XXXXXXXXXX).
    Removes spaces, dashes, parentheses.
    """
    if not phone:
        return ""
    cleaned = re.sub(r"[\s\-\(\)\.]", "", phone.strip())
    if cleaned.startswith("+"):
        digits = re.sub(r"\D", "", cleaned[1:])
        return f"+{digits}"
    digits = re.sub(r"\D", "", cleaned)
    if len(digits) == 10:
        return f"+91{digits}"
    elif len(digits) == 11 and digits.startswith("0"):
        return f"+91{digits[1:]}"
    elif len(digits) == 12 and digits.startswith("91"):
        return f"+{digits}"
    return f"+{digits}" if digits else ""


def get_10_digit_phone(phone: str) -> str:
    """Extracts the 10-digit national number from a phone number."""
    digits = re.sub(r"\D", "", phone)
    if len(digits) >= 10:
        return digits[-10:]
    return digits


def is_valid_phone(phone: str | None) -> bool:
    """Validates that a phone number has a realistic length (10 to 15 digits)."""
    if not phone:
        return False
    digits = re.sub(r"\D", "", phone)
    return 10 <= len(digits) <= 15


def is_valid_indian_phone(phone: str | None) -> bool:
    """Validates if the phone number is a valid 10-digit Indian mobile number."""
    if not phone:
        return False
    digits = re.sub(r"\D", "", phone)
    if len(digits) == 10:
        return digits[0] in "6789"
    elif len(digits) == 12 and digits.startswith("91"):
        return digits[2] in "6789"
    elif len(digits) == 11 and digits.startswith("0"):
        return digits[1] in "6789"
    return False


class SMSService:
    """
    Real SMS Gateway Integration Service for MealBridge.
    Supports Fast2SMS, Twilio, MSG91, and Generic REST API gateways.
    Configured strictly through environment variables.
    """

    def __init__(self):
        self.provider = (settings.SMS_PROVIDER or "generic").lower().strip()
        self.api_key = (settings.SMS_API_KEY or "").strip()
        self.api_url = (settings.SMS_API_URL or "").strip()
        self.sender_id = (settings.SMS_SENDER_ID or "MLBRDG").strip()
        self.fast2sms_route = (getattr(settings, "FAST2SMS_ROUTE", None) or "otp").strip().lower()
        self.fast2sms_template_id = (getattr(settings, "FAST2SMS_TEMPLATE_ID", None) or "").strip()
        self.fast2sms_otp_id = (
            getattr(settings, "FAST2SMS_OTP_ID", None)
            or getattr(settings, "FAST2SMS_TEMPLATE_ID", None)
            or ""
        ).strip()

    def is_configured(self) -> bool:
        return bool(self.api_key)

    async def send_otp_sms(self, phone: str, otp: str) -> bool:
        """
        Dispatches a 6-digit OTP SMS to the recipient's normalized phone number.
        Raises SMSDeliveryError if credentials are not configured or dispatch fails.
        NEVER logs the OTP or API keys.
        """
        norm_phone = normalize_phone(phone)
        if not is_valid_phone(norm_phone):
            raise SMSDeliveryError("Invalid phone number format. Please provide a valid 10-digit number.")

        if not self.is_configured():
            logger.warning(
                "SMS delivery attempted but SMS_API_KEY is not configured in environment. Provider: %s",
                self.provider,
            )
            raise SMSDeliveryError(
                "SMS provider integration implemented, but real SMS delivery requires valid provider credentials."
            )

        message = f"Your MealBridge verification OTP is {otp}. It expires in 5 minutes."

        try:
            if self.provider == "fast2sms":
                return await self._send_fast2sms(norm_phone, otp, message)
            elif self.provider == "twilio":
                return await self._send_twilio(norm_phone, message)
            elif self.provider == "msg91":
                return await self._send_msg91(norm_phone, otp)
            else:
                return await self._send_generic(norm_phone, otp, message)
        except SMSDeliveryError:
            raise
        except Exception as exc:
            # Safe diagnostic logging: NEVER log OTP or API key
            safe_phone = (norm_phone[:5] + "***") if len(norm_phone) > 5 else "***"
            logger.error(
                "Failed to send SMS to %s via provider %s: %s",
                safe_phone,
                self.provider,
                type(exc).__name__,
            )
            raise SMSDeliveryError("Unable to send OTP via SMS. Please try again.")

    async def _send_fast2sms(self, phone: str, otp: str, message: str) -> bool:
        ten_digit = get_10_digit_phone(phone)
        route = self.fast2sms_route

        # Determine endpoint and payload based on configured Fast2SMS route
        if route == "otp_send" or (self.fast2sms_otp_id and route not in ("dlt", "q")):
            url = self.api_url or "https://www.fast2sms.com/dev/otp/send"
            payload = {
                "mobile": ten_digit,
                "otp_id": self.fast2sms_otp_id or self.fast2sms_template_id or self.sender_id,
                "otp": str(otp),
            }
        elif route == "dlt":
            url = self.api_url or "https://www.fast2sms.com/dev/bulkV2"
            payload = {
                "route": "dlt",
                "sender_id": self.sender_id,
                "message": self.fast2sms_template_id,
                "variables_values": str(otp),
                "numbers": ten_digit,
            }
        elif route == "q":
            url = self.api_url or "https://www.fast2sms.com/dev/bulkV2"
            payload = {
                "route": "q",
                "message": message,
                "numbers": ten_digit,
            }
        else:
            # Default official Fast2SMS bulkV2 OTP route (POST /dev/bulkV2)
            url = self.api_url or "https://www.fast2sms.com/dev/bulkV2"
            payload = {
                "route": "otp",
                "variables_values": str(otp),
                "numbers": ten_digit,
            }

        headers = {
            "authorization": self.api_key,
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload, headers=headers)

            if resp.status_code == 200:
                data = resp.json()
                if data.get("return") is True:
                    return True

                raw_msg = data.get("message", ["SMS dispatch failed"])
                err_msg = ", ".join(raw_msg) if isinstance(raw_msg, list) else str(raw_msg)
                safe_err = err_msg.replace(self.api_key, "***").replace(str(otp), "******")
                logger.error("Fast2SMS response: %s", safe_err)
                raise SMSDeliveryError("Unable to send OTP via SMS. Please try again.")
            else:
                try:
                    data = resp.json()
                    raw_msg = data.get("message") or resp.text
                    err_msg = ", ".join(raw_msg) if isinstance(raw_msg, list) else str(raw_msg)
                except Exception:
                    err_msg = resp.text or "Unknown error"

                # NEVER log API key, OTP, passwords, or tokens
                safe_err = str(err_msg).replace(self.api_key, "***").replace(str(otp), "******")
                logger.error("Fast2SMS HTTP status: %d", resp.status_code)
                logger.error("Fast2SMS response: %s", safe_err)
                raise SMSDeliveryError("Unable to send OTP via SMS. Please try again.")

    async def _send_twilio(self, phone: str, message: str) -> bool:
        if ":" in self.api_key:
            account_sid, auth_token = self.api_key.split(":", 1)
        else:
            account_sid = self.sender_id
            auth_token = self.api_key

        url = self.api_url or f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
        data = {
            "To": phone,
            "Body": message,
        }
        if self.sender_id.startswith("+"):
            data["From"] = self.sender_id
        else:
            data["MessagingServiceSid"] = self.sender_id

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, data=data, auth=(account_sid, auth_token))
            if resp.status_code in (200, 201):
                return True
            logger.error("Twilio API returned HTTP status %d", resp.status_code)
            raise SMSDeliveryError("Unable to send OTP via SMS. Please try again.")

    async def _send_msg91(self, phone: str, otp: str) -> bool:
        url = self.api_url or "https://control.msg91.com/api/v5/otp"
        ten_digit = get_10_digit_phone(phone)
        headers = {
            "authkey": self.api_key,
            "Content-Type": "application/json",
        }
        params = {
            "template_id": self.sender_id,
            "mobile": f"91{ten_digit}",
            "otp": otp,
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, headers=headers, params=params)
            if resp.status_code in (200, 201):
                return True
            logger.error("MSG91 API returned HTTP status %d", resp.status_code)
            raise SMSDeliveryError("Unable to send OTP via SMS. Please try again.")

    async def _send_generic(self, phone: str, otp: str, message: str) -> bool:
        url = self.api_url or "https://api.mealbridge.org/v1/sms/send"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "to": phone,
            "message": message,
            "sender": self.sender_id,
            "otp": otp,
        }
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            if resp.status_code in (200, 201, 202):
                return True
            logger.error("Generic SMS API returned HTTP status %d", resp.status_code)
            raise SMSDeliveryError("Unable to send OTP via SMS. Please try again.")


sms_service = SMSService()
