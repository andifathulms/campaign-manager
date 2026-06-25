"""Celery tasks for ad-platform data sync.

``sync_meta_account`` pulls campaign insights for one account into daily
``AdsCampaignSnapshot`` rows. ``sync_all_meta_accounts`` fans out across every
active Meta account (scheduled every 30 minutes via Celery beat).

In sandbox mode (no Meta credentials) the client returns placeholder data, so
these tasks populate a realistic dashboard without live API access.
"""
import logging
from datetime import date, timedelta
from decimal import Decimal

from celery import shared_task
from django.utils import timezone

from apps.core.crypto import decrypt
from .meta import get_meta_client
from .models import AdsAccount, AdsCampaignSnapshot

logger = logging.getLogger(__name__)


def _to_decimal(value):
    try:
        return Decimal(str(value))
    except Exception:
        return Decimal('0')


@shared_task
def sync_meta_account(account_id):
    """Sync one Meta ad account's campaigns into today's snapshot rows."""
    try:
        account = AdsAccount.objects.get(id=account_id, platform='meta', is_active=True)
    except AdsAccount.DoesNotExist:
        logger.warning("sync_meta_account: account %s not found/inactive", account_id)
        return 0

    client = get_meta_client()
    token = decrypt(account.access_token)
    today = timezone.now().date()
    since = (today - timedelta(days=1)).isoformat()
    until = today.isoformat()

    try:
        rows = client.fetch_campaign_insights(account.account_id, token, since, until)
    except Exception:
        logger.exception("sync_meta_account: insights fetch failed for %s", account_id)
        return 0

    count = 0
    for c in rows:
        AdsCampaignSnapshot.objects.update_or_create(
            ads_account=account,
            campaign_id=c['campaign_id'],
            snapshot_date=today,
            defaults={
                'tenant': account.tenant,
                'platform': 'meta',
                'campaign_name': c.get('campaign_name', ''),
                'status': c.get('status', 'ACTIVE'),
                'reach': c.get('reach', 0),
                'impressions': c.get('impressions', 0),
                'clicks': c.get('clicks', 0),
                'spend': _to_decimal(c.get('spend', 0)),
                'cpm': _to_decimal(c.get('cpm', 0)),
                'ctr': _to_decimal(c.get('ctr', 0)),
                'raw_data': c,
            },
        )
        count += 1

    account.last_synced_at = timezone.now()
    account.save(update_fields=['last_synced_at'])
    logger.info("sync_meta_account: %s campaigns synced for %s", count, account_id)
    return count


@shared_task
def sync_all_meta_accounts():
    """Fan out a sync across every active Meta account (beat: every 30 min)."""
    ids = AdsAccount.objects.filter(platform='meta', is_active=True).values_list('id', flat=True)
    for account_id in ids:
        sync_meta_account.delay(str(account_id))
    return len(ids)
