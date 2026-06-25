"""Meta (Facebook/Instagram) Marketing API client with a sandbox fallback.

When ``META_APP_ID`` + ``META_APP_SECRET`` are configured (and ``META_SANDBOX``
is off), real Graph API calls are made. Otherwise a deterministic sandbox
client returns realistic placeholder data so the full flow — connect → sync →
dashboard → pause/budget — works end to end without live credentials.

Swap in real credentials later and the same code paths light up; nothing in the
views/tasks/serializers needs to change.
"""
import hashlib
import logging
from datetime import date

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

GRAPH_VERSION = 'v19.0'
GRAPH_BASE = f'https://graph.facebook.com/{GRAPH_VERSION}'
OAUTH_DIALOG = f'https://www.facebook.com/{GRAPH_VERSION}/dialog/oauth'
OAUTH_SCOPES = 'ads_management,ads_read,business_management'


def is_sandbox():
    """True when we should use placeholder data instead of real Graph calls."""
    if getattr(settings, 'META_SANDBOX', False):
        return True
    return not (getattr(settings, 'META_APP_ID', '') and getattr(settings, 'META_APP_SECRET', ''))


def authorize_url(redirect_uri, state):
    return (
        f'{OAUTH_DIALOG}?client_id={settings.META_APP_ID}'
        f'&redirect_uri={redirect_uri}&state={state}&scope={OAUTH_SCOPES}'
    )


# ── Real client ──────────────────────────────────────────────────────────────

class MetaAdsClient:
    """Thin wrapper over the Meta Graph API (live credentials required)."""

    def exchange_code_for_token(self, code, redirect_uri):
        resp = requests.get(
            f'{GRAPH_BASE}/oauth/access_token',
            params={
                'client_id': settings.META_APP_ID,
                'client_secret': settings.META_APP_SECRET,
                'redirect_uri': redirect_uri,
                'code': code,
            },
            timeout=15,
        )
        resp.raise_for_status()
        return resp.json().get('access_token', '')

    def list_ad_accounts(self, token):
        resp = requests.get(
            f'{GRAPH_BASE}/me/adaccounts',
            params={'fields': 'account_id,name', 'access_token': token},
            timeout=15,
        )
        resp.raise_for_status()
        return resp.json().get('data', [])

    def fetch_campaign_insights(self, account_id, token, since, until):
        resp = requests.get(
            f'{GRAPH_BASE}/act_{account_id}/insights',
            params={
                'level': 'campaign',
                'fields': 'campaign_id,campaign_name,reach,impressions,clicks,spend,cpm,ctr',
                'time_range': f'{{"since":"{since}","until":"{until}"}}',
                'access_token': token,
            },
            timeout=30,
        )
        resp.raise_for_status()
        return resp.json().get('data', [])

    def set_campaign_status(self, campaign_id, token, status):
        resp = requests.post(
            f'{GRAPH_BASE}/{campaign_id}',
            data={'status': status, 'access_token': token},
            timeout=15,
        )
        resp.raise_for_status()
        return resp.json()

    def update_campaign_budget(self, campaign_id, token, daily_budget_cents):
        resp = requests.post(
            f'{GRAPH_BASE}/{campaign_id}',
            data={'daily_budget': daily_budget_cents, 'access_token': token},
            timeout=15,
        )
        resp.raise_for_status()
        return resp.json()


# ── Sandbox client (placeholder data) ────────────────────────────────────────

class SandboxMetaClient:
    """Deterministic placeholder client. No network. Metrics are derived from
    stable hashes so the dashboard looks alive and consistent across syncs."""

    _THEMES = ['Infrastruktur', 'Pendidikan', 'Kesehatan', 'UMKM']

    def _seed(self, *parts):
        raw = '|'.join(str(p) for p in parts)
        return int(hashlib.sha256(raw.encode()).hexdigest(), 16)

    def exchange_code_for_token(self, code, redirect_uri):
        return 'SANDBOX_TOKEN'

    def list_ad_accounts(self, token):
        return [{'account_id': '100000000000001', 'name': 'Akun Iklan (Sandbox)'}]

    def fetch_campaign_insights(self, account_id, token, since, until):
        campaigns = []
        for i, theme in enumerate(self._THEMES):
            s = self._seed(account_id, theme, until)
            reach = 8000 + s % 42000
            impressions = reach + s % 60000
            clicks = 150 + s % 3500
            spend = round(250000 + s % 4750000, 2)  # IDR
            cpm = round(spend / impressions * 1000, 4) if impressions else 0
            ctr = round(clicks / impressions * 100, 4) if impressions else 0
            campaigns.append({
                'campaign_id': f'sbx-{account_id}-{i}',
                'campaign_name': f'Kampanye {theme}',
                'status': 'ACTIVE',
                'reach': reach,
                'impressions': impressions,
                'clicks': clicks,
                'spend': spend,
                'cpm': cpm,
                'ctr': ctr,
            })
        return campaigns

    def set_campaign_status(self, campaign_id, token, status):
        return {'success': True, 'id': campaign_id, 'status': status}

    def update_campaign_budget(self, campaign_id, token, daily_budget_cents):
        return {'success': True, 'id': campaign_id, 'daily_budget': daily_budget_cents}


def get_meta_client():
    """Factory: real client when credentials are present, else sandbox."""
    return SandboxMetaClient() if is_sandbox() else MetaAdsClient()
