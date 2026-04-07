from rest_framework import serializers
from .models import ElectabilitySurvey


class ElectabilitySurveySerializer(serializers.ModelSerializer):
    class Meta:
        model = ElectabilitySurvey
        fields = [
            'id', 'tanggal', 'elektabilitas_pct', 'sumber',
            'catatan', 'sample_size', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']
