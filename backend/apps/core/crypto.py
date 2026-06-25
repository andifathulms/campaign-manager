"""Symmetric encryption for secrets at rest (ad/WhatsApp tokens).

Uses Fernet (AES-128-CBC + HMAC) per PRD §13 / CLAUDE.md. Set ``FERNET_KEY`` in
production (a urlsafe-base64 32-byte key, e.g. ``Fernet.generate_key()``). In
dev, if unset, a stable key is derived from ``SECRET_KEY`` so local flows work
— but rotating SECRET_KEY would then invalidate stored tokens, so always set an
explicit ``FERNET_KEY`` in prod.
"""
import base64
import hashlib

from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings


def _fernet():
    key = getattr(settings, 'FERNET_KEY', '') or ''
    if not key:
        digest = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
        key = base64.urlsafe_b64encode(digest)
    elif isinstance(key, str):
        key = key.encode()
    return Fernet(key)


def encrypt(plaintext):
    """Encrypt a string; empty/None passes through as ''."""
    if not plaintext:
        return ''
    return _fernet().encrypt(plaintext.encode()).decode()


def decrypt(token):
    """Decrypt a token; returns '' for empty input or an unreadable token."""
    if not token:
        return ''
    try:
        return _fernet().decrypt(token.encode()).decode()
    except (InvalidToken, ValueError):
        return ''
