import uuid
import django.db.models.deletion
from django.db import migrations, models


def backfill_agencies(apps, schema_editor):
    """Give every existing Tenant an 'agency of one' and link its users."""
    Agency = apps.get_model('accounts', 'Agency')
    Tenant = apps.get_model('accounts', 'Tenant')
    User = apps.get_model('accounts', 'User')
    for tenant in Tenant.objects.all():
        agency = Agency.objects.create(
            name=tenant.name,
            slug=tenant.slug,
            is_active=True,
        )
        tenant.agency = agency
        tenant.save(update_fields=['agency'])
        User.objects.filter(tenant=tenant).update(agency=agency)


def unlink_agencies(apps, schema_editor):
    """Reverse: detach agencies (the AddField/CreateModel reversals drop them)."""
    Tenant = apps.get_model('accounts', 'Tenant')
    User = apps.get_model('accounts', 'User')
    Tenant.objects.update(agency=None)
    User.objects.update(agency=None)


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0003_otpcode'),
    ]

    operations = [
        migrations.CreateModel(
            name='Agency',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('name', models.CharField(max_length=200)),
                ('slug', models.SlugField(unique=True)),
                ('is_active', models.BooleanField(default=True)),
            ],
            options={
                'db_table': 'accounts_agency',
                'verbose_name_plural': 'agencies',
            },
        ),
        migrations.AddField(
            model_name='tenant',
            name='agency',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='tenants', to='accounts.agency',
            ),
        ),
        migrations.AddField(
            model_name='user',
            name='agency',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='members', to='accounts.agency',
            ),
        ),
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(
                default='candidate', max_length=30,
                choices=[
                    ('platform_admin', 'Platform Admin'),
                    ('consultant_admin', 'Consultant Admin'),
                    ('candidate', 'Candidate'),
                    ('koordinator_utama', 'Koordinator Utama'),
                    ('koordinator_wilayah', 'Koordinator Wilayah'),
                    ('koordinator_kecamatan', 'Koordinator Kecamatan'),
                    ('koordinator_kelurahan', 'Koordinator Kelurahan'),
                    ('staf_ads', 'Staf Ads'),
                    ('staf_admin', 'Staf Admin'),
                    ('relawan', 'Relawan'),
                ],
            ),
        ),
        migrations.RunPython(backfill_agencies, unlink_agencies),
    ]
