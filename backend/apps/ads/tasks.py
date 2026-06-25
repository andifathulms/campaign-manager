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

from apps.accounts.whatsapp import notify_tenant_admins
from apps.core.crypto import decrypt
from .meta import get_meta_client
from .models import AdsAccount, AdsCampaignSnapshot, BudgetAllocation

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


def _rp(n):
    return f"Rp {int(n):,}".replace(',', '.')


@shared_task
def check_budget_alerts():
    """Alert a tenant's admins once when ad spend crosses the budget threshold.

    Fires a single WhatsApp/in-app notification per crossing; re-arms if spend
    later drops back below the threshold. Run every 30 min (beat) and after a
    manual sync. (PRD FR-C-104)
    """
    today = timezone.now().date()
    budgets = BudgetAllocation.objects.filter(period_start__lte=today, period_end__gte=today)
    fired = 0
    for budget in budgets:
        pct = budget.spend_pct()
        crossed = pct >= budget.alert_threshold_pct
        if crossed and not budget.alert_sent:
            notify_tenant_admins(
                budget.tenant,
                f"⚠ Anggaran iklan digital telah mencapai {pct:.0f}%. "
                f"Terpakai {_rp(budget.spent())} dari {_rp(float(budget.total_budget))}.",
            )
            budget.alert_sent = True
            budget.save(update_fields=['alert_sent'])
            fired += 1
        elif not crossed and budget.alert_sent:
            budget.alert_sent = False  # re-arm for the next crossing
            budget.save(update_fields=['alert_sent'])
    return fired
