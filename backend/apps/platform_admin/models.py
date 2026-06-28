from django.db import models
from apps.core.models import BaseModel


class PlatformAuditLog(BaseModel):
    """Audit trail for sensitive platform-staff actions (suspend, provision, impersonate)."""
    ACTION_CHOICES = [
        ('suspend', 'Suspend tenant'),
        ('activate', 'Activate tenant'),
        ('publish', 'Publish candidate'),
        ('pause', 'Pause candidate'),
        ('provision', 'Provision candidate'),
        ('impersonate', 'Impersonate candidate'),
        ('create_admin', 'Create staff user'),
    ]
    actor = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL, null=True, related_name='platform_actions'
    )
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    target_tenant = models.ForeignKey(
        'accounts.Tenant', on_delete=models.SET_NULL, null=True, blank=True, related_name='+'
    )
    detail = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = 'platform_audit_log'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.action} by {self.actor_id} @ {self.created_at:%Y-%m-%d %H:%M}'
