import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models
from apps.core.models import BaseModel


class Tenant(BaseModel):
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

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'accounts_tenant'


class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, null=True, blank=True, on_delete=models.SET_NULL, related_name='users')
    role = models.CharField(
        max_length=30,
        choices=[
            ('platform_admin', 'Platform Admin'),
            ('candidate', 'Candidate'),
            ('koordinator_wilayah', 'Koordinator Wilayah'),
            ('koordinator_kecamatan', 'Koordinator Kecamatan'),
            ('koordinator_kelurahan', 'Koordinator Kelurahan'),
            ('relawan', 'Relawan'),
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
