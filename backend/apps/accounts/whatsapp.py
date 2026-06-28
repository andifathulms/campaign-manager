"""WhatsApp messaging backends (OTP + notifications).

Development: logs to console. Production: Fonnte (Indonesian WhatsApp BSP).
Configure via settings ``WHATSAPP_BACKEND`` ('console' | 'fonnte') and
``WHATSAPP_API_KEY``.

All sends go through ``normalize_phone`` so numbers are stored/sent as
``62XXXXXXXXXX`` (per CLAUDE.md gotcha #10).
"""
import logging
import re

from django.conf import settings

logger = logging.getLogger(__name__)


def normalize_phone(phone: str) -> str:
    """Normalise an Indonesian number to ``62XXXXXXXXXX`` (no +, no leading 0)."""
    digits = re.sub(r'\D', '', phone or '')
    if digits.startswith('0'):
        digits = '62' + digits[1:]
    elif digits.startswith('62'):
        pass
    elif digits.startswith('8'):
        digits = '62' + digits
    return digits


class ConsoleWhatsAppBackend:
    """Development backend — logs messages to the console."""

    def send_message(self, phone: str, message: str):
        phone = normalize_phone(phone)
        logger.info("[WhatsApp] to %s: %s", phone, message)
        print(f"\n{'='*44}\n  WhatsApp -> {phone}\n  {message}\n{'='*44}\n")
        return True

    def send_otp(self, phone: str, code: str):
        return self.send_message(
            phone,
            f"Kode OTP Anda: {code}\n\nJangan bagikan kode ini. Berlaku 10 menit.",
        )


class FonnteWhatsAppBackend:
    """Production backend using the Fonnte API."""

    def __init__(self, api_key: str):
        self.api_key = api_key

    def send_message(self, phone: str, message: str):
        import requests
        phone = normalize_phone(phone)
        try:
            resp = requests.post(
                'https://api.fonnte.com/send',
                headers={'Authorization': self.api_key},
                data={'target': phone, 'message': message},
                timeout=10,
            )
            resp.raise_for_status()
            logger.info("Fonnte sent to %s: %s", phone, resp.json())
            return True
        except Exception as e:
            logger.error("Fonnte send failed for %s: %s", phone, e)
            raise

    def send_otp(self, phone: str, code: str):
        return self.send_message(
            phone,
            f"Kode OTP Anda: {code}\n\nJangan bagikan kode ini. Berlaku 10 menit.",
        )


def get_whatsapp_backend():
    """Factory: returns the configured WhatsApp backend."""
    backend = getattr(settings, 'WHATSAPP_BACKEND', 'console')
    if backend == 'fonnte':
        return FonnteWhatsAppBackend(getattr(settings, 'WHATSAPP_API_KEY', ''))
    return ConsoleWhatsAppBackend()


def notify(phone: str, message: str) -> bool:
    """Fire-and-forget notification. Never raises — a failed notification must
    not break the request that triggered it. Returns True on success."""
    if not phone:
        return False
    try:
        return bool(get_whatsapp_backend().send_message(phone, message))
    except Exception:
        logger.exception("notify: WhatsApp send failed for %s", phone)
        return False


def notify_tenant_admins(tenant, message: str):
    """Notify a tenant's decision-makers (candidate / koordinator utama / staf
    admin) — e.g. for a new supporter or relawan registration."""
    if tenant is None:
        return
    from apps.accounts.models import User
    phones = (
        User.objects.filter(tenant=tenant, role='candidate')
        .exclude(phone__isnull=True).exclude(phone='')
        .values_list('phone', flat=True)
    )
    for phone in set(phones):
        notify(phone, message)
