import uuid
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0004_agency_tenant_agency_user_agency_and_roles'),
        ('ads', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='AdsAuditLog',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('action', models.CharField(choices=[
                    ('connect', 'Connect Account'),
                    ('disconnect', 'Disconnect Account'),
                    ('pause', 'Pause'),
                    ('resume', 'Resume'),
                    ('update_budget', 'Update Budget'),
                    ('duplicate', 'Duplicate'),
                ], max_length=20)),
                ('target_type', models.CharField(blank=True, max_length=20)),
                ('target_id', models.CharField(blank=True, max_length=100)),
                ('detail', models.JSONField(default=dict)),
                ('success', models.BooleanField(default=True)),
                ('ads_account', models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='audit_logs', to='ads.adsaccount',
                )),
                ('tenant', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='ads_audit_logs', to='accounts.tenant',
                )),
                ('user', models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='ads_audit_logs', to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
