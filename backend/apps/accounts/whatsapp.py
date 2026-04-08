"""
WhatsApp OTP delivery backends.
In development: prints to console.
In production: use Fonnte, Wablas, or similar Indonesian WhatsApp API.
"""
import logging

logger = logging.getLogger(__name__)


class ConsoleWhatsAppBackend:
    """Development backend — logs OTP to console."""

    def send_otp(self, phone: str, code: str):
        logger.info(f"[WhatsApp OTP] Sending to {phone}: {code}")
        print(f"\n{'='*40}")
        print(f"  WhatsApp OTP for {phone}")
        print(f"  Code: {code}")
        print(f"{'='*40}\n")


class FonnteWhatsAppBackend:
    """Production backend using Fonnte API."""

    def __init__(self, api_key: str):
        self.api_key = api_key

    def send_otp(self, phone: str, code: str):
        import requests
        message = f"Kode OTP Anda: {code}\n\nJangan bagikan kode ini. Berlaku 10 menit."
        try:
            resp = requests.post(
                'https://api.fonnte.com/send',
                headers={'Authorization': self.api_key},
                data={'target': phone, 'message': message},
                timeout=10,
            )
            resp.raise_for_status()
            logger.info(f"Fonnte OTP sent to {phone}: {resp.json()}")
        except Exception as e:
            logger.error(f"Fonnte OTP failed for {phone}: {e}")
            raise


def get_whatsapp_backend():
    """Factory: returns the configured WhatsApp backend."""
    import os
    backend = os.environ.get('WHATSAPP_BACKEND', 'console')
    if backend == 'fonnte':
        api_key = os.environ.get('WHATSAPP_API_KEY', '')
        return FonnteWhatsAppBackend(api_key)
    return ConsoleWhatsAppBackend()
