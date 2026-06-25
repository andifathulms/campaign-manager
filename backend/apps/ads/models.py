from django.db import models
from apps.core.models import BaseModel


class AdsAccount(BaseModel):
    PLATFORM_CHOICES = [
        ('meta', 'Meta (Facebook/Instagram)'),
        ('tiktok', 'TikTok'),
        ('google', 'Google'),
    ]
    tenant = models.ForeignKey(
        'accounts.Tenant', on_delete=models.CASCADE, related_name='ads_accounts'
    )
    platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES)
    account_id = models.CharField(max_length=100)
    account_name = models.CharField(max_length=200)
    access_token = models.TextField(blank=True)
    refresh_token = models.TextField(blank=True)
    token_expires_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    last_synced_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['platform', 'account_name']
        unique_together = [['tenant', 'platform', 'account_id']]

    def __str__(self):
        return f"{self.platform} — {self.account_name}"


class AdsCampaignSnapshot(BaseModel):
    tenant = models.ForeignKey(
        'accounts.Tenant', on_delete=models.CASCADE, related_name='campaign_snapshots'
    )
    ads_account = models.ForeignKey(
        AdsAccount, on_delete=models.CASCADE, related_name='snapshots'
    )
    platform = models.CharField(max_length=20)
    campaign_id = models.CharField(max_length=100)
    campaign_name = models.CharField(max_length=300)
    status = models.CharField(max_length=50, default='ACTIVE')
    reach = models.BigIntegerField(default=0)
    impressions = models.BigIntegerField(default=0)
    clicks = models.IntegerField(default=0)
    spend = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    cpm = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    ctr = models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True)
    snapshot_date = models.DateField()
    raw_data = models.JSONField(default=dict)

    class Meta:
        ordering = ['-snapshot_date', '-spend']
        unique_together = [['ads_account', 'campaign_id', 'snapshot_date']]

    def __str__(self):
        return f"{self.platform} / {self.campaign_name} ({self.snapshot_date})"


class BudgetAllocation(BaseModel):
    tenant = models.ForeignKey(
        'accounts.Tenant', on_delete=models.CASCADE, related_name='budget_allocations'
    )
    total_budget = models.DecimalField(max_digits=16, decimal_places=2, default=0)
    allocations = models.JSONField(default=dict)
    period_start = models.DateField()
    period_end = models.DateField()
    alert_threshold_pct = models.IntegerField(default=80)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-period_start']

    def __str__(self):
        return f"Budget {self.period_start}-{self.period_end}"


class AdsAuditLog(BaseModel):
    """Immutable record of every ad write action (connect, disconnect, pause,
    resume, budget change, duplicate). Required for the write-control guardrail
    (PRD §18.1) — answers "who paused which campaign, when, and did it work."
    """
    ACTION_CHOICES = [
        ('connect', 'Connect Account'),
        ('disconnect', 'Disconnect Account'),
        ('pause', 'Pause'),
        ('resume', 'Resume'),
        ('update_budget', 'Update Budget'),
        ('duplicate', 'Duplicate'),
    ]
    tenant = models.ForeignKey(
        'accounts.Tenant', on_delete=models.CASCADE, related_name='ads_audit_logs'
    )
    user = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='ads_audit_logs'
    )
    ads_account = models.ForeignKey(
        AdsAccount, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='audit_logs'
    )
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    target_type = models.CharField(max_length=20, blank=True)  # campaign/adset/ad/account
    target_id = models.CharField(max_length=100, blank=True)
    detail = models.JSONField(default=dict)
    success = models.BooleanField(default=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.action} {self.target_type}:{self.target_id} ({'ok' if self.success else 'fail'})"
