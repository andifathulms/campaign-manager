"""Collapse the 10-role taxonomy to 4 portal roles and remap existing rows.

  platform_admin                          -> superadmin
  consultant_admin                        -> candidate  (consultant = candidate + Agency)
  candidate                               -> candidate
  koordinator_* / staf_ads / staf_admin   -> candidate
  relawan                                 -> volunteer
"""
from django.db import migrations, models

ROLE_MAP = {
    'platform_admin': 'superadmin',
    'consultant_admin': 'candidate',
    'candidate': 'candidate',
    'koordinator_utama': 'candidate',
    'koordinator_wilayah': 'candidate',
    'koordinator_kecamatan': 'candidate',
    'koordinator_kelurahan': 'candidate',
    'staf_ads': 'candidate',
    'staf_admin': 'candidate',
    'relawan': 'volunteer',
}


def forwards(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    for old, new in ROLE_MAP.items():
        if old != new:
            User.objects.filter(role=old).update(role=new)
    # Anything unexpected falls back to candidate (never leave an invalid role).
    valid = {'superadmin', 'admin', 'candidate', 'volunteer'}
    User.objects.exclude(role__in=valid).update(role='candidate')


def backwards(apps, schema_editor):
    # Lossy collapse — restore superadmin only; everything else stays as-is.
    User = apps.get_model('accounts', 'User')
    User.objects.filter(role='superadmin').update(role='platform_admin')


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0005_tenant_relawan_auto_approve'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(
                choices=[
                    ('superadmin', 'Super Admin'),
                    ('admin', 'Admin'),
                    ('candidate', 'Candidate'),
                    ('volunteer', 'Volunteer'),
                ],
                default='candidate',
                max_length=30,
            ),
        ),
        migrations.RunPython(forwards, backwards),
    ]
