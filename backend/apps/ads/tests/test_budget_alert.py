"""Budget threshold alert task (FR-C-104)."""
from datetime import date, timedelta
from decimal import Decimal

import pytest

from apps.accounts.models import Tenant, User
from apps.ads.models import AdsAccount, AdsCampaignSnapshot, BudgetAllocation
from apps.ads.tasks import check_budget_alerts


def make_budget(tenant, total, threshold=80):
    today = date.today()
    return BudgetAllocation.objects.create(
        tenant=tenant, total_budget=Decimal(total),
        period_start=today - timedelta(days=5), period_end=today + timedelta(days=25),
        alert_threshold_pct=threshold,
    )


def add_spend(tenant, amount):
    acct = AdsAccount.objects.create(tenant=tenant, platform='meta', account_id='1', account_name='x')
    AdsCampaignSnapshot.objects.create(
        tenant=tenant, ads_account=acct, platform='meta', campaign_id='c1',
        campaign_name='C1', spend=Decimal(amount), snapshot_date=date.today(),
    )


@pytest.mark.django_db
class TestBudgetAlert:
    def test_fires_once_when_crossed_then_not_again(self):
        t = Tenant.objects.create(name='A', slug='a')
        User.objects.create_user(username='cand_a', password='pw12345678', tenant=t,
                                 role='candidate', phone='628100000001')
        make_budget(t, 1_000_000)
        add_spend(t, 900_000)  # 90% > 80%

        assert check_budget_alerts() == 1
        assert BudgetAllocation.objects.get(tenant=t).alert_sent is True
        # second run does not re-fire
        assert check_budget_alerts() == 0

    def test_does_not_fire_below_threshold(self):
        t = Tenant.objects.create(name='B', slug='b')
        make_budget(t, 1_000_000)
        add_spend(t, 500_000)  # 50% < 80%
        assert check_budget_alerts() == 0
        assert BudgetAllocation.objects.get(tenant=t).alert_sent is False

    def test_rearms_when_spend_drops(self):
        t = Tenant.objects.create(name='C', slug='c')
        b = make_budget(t, 1_000_000)
        add_spend(t, 900_000)
        check_budget_alerts()
        assert BudgetAllocation.objects.get(tenant=t).alert_sent is True
        # raise the budget so pct falls below threshold → re-arm
        b.total_budget = Decimal(10_000_000)
        b.save(update_fields=['total_budget'])
        check_budget_alerts()
        assert BudgetAllocation.objects.get(tenant=t).alert_sent is False
