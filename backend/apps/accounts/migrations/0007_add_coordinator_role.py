from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0006_collapse_roles_to_four'),
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
                    ('coordinator', 'Koordinator'),
                    ('volunteer', 'Volunteer'),
                ],
                default='candidate',
                max_length=30,
            ),
        ),
    ]
