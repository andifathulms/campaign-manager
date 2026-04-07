from django.db import models
from apps.core.models import BaseModel


class ElectabilitySurvey(BaseModel):
    """Manual internal survey entry for electability tracking (FR-219)."""
    tenant = models.ForeignKey(
        'accounts.Tenant', on_delete=models.CASCADE, related_name='electability_surveys'
    )
    tanggal = models.DateField()
    elektabilitas_pct = models.DecimalField(max_digits=5, decimal_places=2)  # e.g. 12.50%
    sumber = models.CharField(max_length=200)  # e.g. "LSI Denny JA", "Internal"
    catatan = models.TextField(blank=True)
    sample_size = models.IntegerField(null=True, blank=True)

    class Meta:
        ordering = ['tanggal']

    def __str__(self):
        return f"{self.tanggal}: {self.elektabilitas_pct}% ({self.sumber})"
