import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models
from apps.core.models import BaseModel


class Agency(BaseModel):
    """Account owner that can manage one or many Tenants (candidate campaigns).

    A direct candidate is modelled as an "agency of one" so there is a single
    code path: every Tenant belongs to exactly one Agency. A political
    consultant owns several Tenants and switches between them.
    """
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'accounts_agency'
        verbose_name_plural = 'agencies'


class Tenant(BaseModel):
    agency = models.ForeignKey(
        Agency, null=True, blank=True, on_delete=models.SET_NULL, related_name='tenants'
    )
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    custom_domain = models.CharField(max_length=200, null=True, blank=True)
    plan = models.CharField(
        max_length=20,
        choices=[('starter','Starter'),('pro','Pro'),('premium','Premium'),('enterprise','Enterprise')],
        default='starter'
    )
    is_active = models.BooleanField(default=True)
    feature_flags = models.JSONField(default=dict)
    # When False (default), self-registered relawan land in a pending approval
    # queue; when True they activate immediately after OTP. (PRD §18.4)
    relawan_auto_approve = models.BooleanField(default=False)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'accounts_tenant'


class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # Home tenant. For a consultant this is their default; they may act on any
    # tenant under `agency` via the tenant switcher.
    tenant = models.ForeignKey(Tenant, null=True, blank=True, on_delete=models.SET_NULL, related_name='users')
    # Set for consultant accounts that span multiple tenants under one agency.
    agency = models.ForeignKey(
        Agency, null=True, blank=True, on_delete=models.SET_NULL, related_name='members'
    )
    # Four canonical roles, one per portal:
    #   superadmin / admin -> Admin Portal (KampanyeKit platform staff)
    #   candidate          -> Candidate Portal (incl. consultants via Agency)
    #   volunteer          -> Volunteer Portal (relawan)
    role = models.CharField(
        max_length=30,
        choices=[
            ('superadmin', 'Super Admin'),
            ('admin', 'Admin'),
            ('candidate', 'Candidate'),
            ('coordinator', 'Koordinator'),
            ('volunteer', 'Volunteer'),
        ],
        default='candidate'
    )
    phone = models.CharField(max_length=20, null=True, blank=True)
    wilayah = models.CharField(max_length=200, null=True, blank=True)
    referral_code = models.CharField(max_length=20, unique=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.referral_code:
            import secrets
            self.referral_code = secrets.token_urlsafe(8)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.username

    class Meta:
        db_table = 'accounts_user'


class OTPCode(BaseModel):
    """One-time password for WhatsApp-based authentication."""
    phone = models.CharField(max_length=20, db_index=True)
    code = models.CharField(max_length=6)
    expires_at = models.DateTimeField()
    attempts = models.IntegerField(default=0)
    is_used = models.BooleanField(default=False)

    class Meta:
        db_table = 'accounts_otpcode'
        ordering = ['-created_at']

    def __str__(self):
        return f"OTP {self.phone} ({self.code})"
