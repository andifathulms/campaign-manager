"""Abuse protection for public (unauthenticated) endpoints.

Two layers, both safe to call from any AllowAny view:

* ``throttle()``   — cache-based per-IP rate limiting (Redis in prod).
* ``verify_captcha()`` — server-side CAPTCHA token verification (Cloudflare
  Turnstile or Google reCAPTCHA). If no secret is configured it returns True,
  so local/dev works without a CAPTCHA provider while rate limiting still
  applies. Configure ``CAPTCHA_SECRET`` to enforce it in production.

IP addresses are never stored raw — use ``make_ip_hash()`` for persistence
(UU PDP compliance).
"""
import hashlib
import logging
from datetime import date

import requests
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)

CAPTCHA_VERIFY_URLS = {
    'turnstile': 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    'recaptcha': 'https://www.google.com/recaptcha/api/siteverify',
}


def client_ip(request):
    """Best-effort client IP, honouring X-Forwarded-For behind Nginx."""
    forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if forwarded:
        return forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '')


def make_ip_hash(ip):
    """Daily-rotating, non-reversible IP hash for privacy-safe storage."""
    return hashlib.sha256(f"{ip}{date.today().isoformat()}".encode()).hexdigest()


def throttle(scope, key, limit, window_seconds):
    """Return True if ``key`` has exceeded ``limit`` requests for ``scope``
    within ``window_seconds``. Increments the counter as a side effect.

    Fails open (returns False) if the cache backend is unavailable — never
    block a legitimate user because Redis hiccuped.
    """
    cache_key = f"throttle:{scope}:{key}"
    try:
        current = cache.get(cache_key)
        if current is None:
            cache.set(cache_key, 1, timeout=window_seconds)
            return False
        if current >= limit:
            return True
        try:
            cache.incr(cache_key)
        except ValueError:
            cache.set(cache_key, 1, timeout=window_seconds)
        return False
    except Exception:  # pragma: no cover - cache outage
        logger.warning("throttle: cache unavailable, failing open for %s", cache_key)
        return False


def verify_captcha(token, remote_ip=''):
    """Verify a CAPTCHA token server-side. Returns True when the token is
    valid, or when no provider secret is configured (dev). Returns False only
    when a secret IS configured and verification fails."""
    secret = getattr(settings, 'CAPTCHA_SECRET', '')
    if not secret:
        return True  # CAPTCHA disabled (no secret) — rate limiting still applies.
    if not token:
        return False
    provider = getattr(settings, 'CAPTCHA_PROVIDER', 'turnstile')
    url = CAPTCHA_VERIFY_URLS.get(provider, CAPTCHA_VERIFY_URLS['turnstile'])
    try:
        resp = requests.post(
            url,
            data={'secret': secret, 'response': token, 'remoteip': remote_ip},
            timeout=5,
        )
        return bool(resp.json().get('success'))
    except Exception:
        logger.exception("verify_captcha: provider request failed")
        return False  # fail closed: a configured CAPTCHA that errors blocks submit.
