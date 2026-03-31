import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom User model — full implementation happens in Step 2.
    Extends AbstractUser to allow UUID primary key and role/tenant fields.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class Meta:
        db_table = 'accounts_user'
