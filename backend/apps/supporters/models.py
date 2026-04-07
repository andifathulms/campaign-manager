import secrets
from django.db import models
from apps.core.models import BaseModel


def _generate_membership_id():
    return f"KK-{secrets.token_hex(4).upper()}"


class Supporter(BaseModel):
    tenant = models.ForeignKey(
        'accounts.Tenant', on_delete=models.CASCADE, related_name='supporters'
    )
    nama = models.CharField(max_length=200)
    phone = models.CharField(max_length=20)
    email = models.CharField(max_length=254, null=True, blank=True)
    foto = models.ImageField(upload_to='supporters/', null=True, blank=True)
    kelurahan = models.CharField(max_length=200)
    kecamatan = models.CharField(max_length=200)
    kabupaten_kota = models.CharField(max_length=200)
    provinsi = models.CharField(max_length=200)
    referred_by_team = models.ForeignKey(
        'teams.TeamMember', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='supporters'
    )
    referred_by_supporter = models.ForeignKey(
        'self', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='referrals'
    )
    referral_code = models.CharField(max_length=20, unique=True, blank=True)
    referral_count = models.IntegerField(default=0)
    membership_id = models.CharField(max_length=20, unique=True)
    statement = models.CharField(max_length=100, null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.referral_code:
            self.referral_code = secrets.token_urlsafe(8)
        if not self.membership_id:
            # Ensure uniqueness
            for _ in range(10):
                mid = _generate_membership_id()
                if not Supporter.objects.filter(membership_id=mid).exists():
                    self.membership_id = mid
                    break
        # Normalize phone: strip leading 0, add 62
        if self.phone:
            phone = self.phone.strip().replace(' ', '').replace('-', '')
            if phone.startswith('0'):
                phone = '62' + phone[1:]
            elif phone.startswith('+'):
                phone = phone[1:]
            self.phone = phone
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.nama} ({self.membership_id})"
