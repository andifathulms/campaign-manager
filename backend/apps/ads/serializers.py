from rest_framework import serializers
from .models import AdsAccount, AdsCampaignSnapshot, BudgetAllocation


class AdsAccountSerializer(serializers.ModelSerializer):
    platform_display = serializers.CharField(source='get_platform_display', read_only=True)

    class Meta:
        model = AdsAccount
        fields = [
            'id', 'platform', 'platform_display', 'account_id', 'account_name',
            'is_active', 'last_synced_at', 'token_expires_at', 'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'last_synced_at']


class ConnectAdsAccountSerializer(serializers.Serializer):
    platform = serializers.ChoiceField(choices=['meta', 'tiktok', 'google'])
    account_id = serializers.CharField(max_length=100)
    account_name = serializers.CharField(max_length=200)
    access_token = serializers.CharField()
    refresh_token = serializers.CharField(required=False, allow_blank=True, default='')


class AdsCampaignSnapshotSerializer(serializers.ModelSerializer):
    platform_label = serializers.SerializerMethodField()
    spend_display = serializers.SerializerMethodField()

    class Meta:
        model = AdsCampaignSnapshot
        fields = [
            'id', 'platform', 'platform_label', 'campaign_id', 'campaign_name',
            'status', 'reach', 'impressions', 'clicks', 'spend', 'spend_display',
            'cpm', 'ctr', 'snapshot_date',
        ]

    def get_platform_label(self, obj):
        labels = {'meta': 'Meta', 'tiktok': 'TikTok', 'google': 'Google'}
        return labels.get(obj.platform, obj.platform)

    def get_spend_display(self, obj):
        return f"Rp {int(obj.spend):,}".replace(',', '.')


class BudgetAllocationSerializer(serializers.ModelSerializer):
    total_spend = serializers.SerializerMethodField()
    spend_pct = serializers.SerializerMethodField()

    class Meta:
        model = BudgetAllocation
        fields = [
            'id', 'total_budget', 'allocations', 'period_start', 'period_end',
            'alert_threshold_pct', 'notes', 'total_spend', 'spend_pct', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def get_total_spend(self, obj):
        from django.db.models import Sum
        result = AdsCampaignSnapshot.objects.filter(
            tenant=obj.tenant,
            snapshot_date__gte=obj.period_start,
            snapshot_date__lte=obj.period_end,
        ).aggregate(total=Sum('spend'))
        return float(result['total'] or 0)

    def get_spend_pct(self, obj):
        total_spend = self.get_total_spend(obj)
        if obj.total_budget and obj.total_budget > 0:
            return round((total_spend / float(obj.total_budget)) * 100, 1)
        return 0


class AdsDashboardSerializer(serializers.Serializer):
    total_spend = serializers.DecimalField(max_digits=16, decimal_places=2)
    total_reach = serializers.IntegerField()
    total_impressions = serializers.IntegerField()
    total_clicks = serializers.IntegerField()
    accounts_count = serializers.IntegerField()
    by_platform = serializers.ListField(child=serializers.DictField())
    recent_campaigns = AdsCampaignSnapshotSerializer(many=True)
    budget = BudgetAllocationSerializer(allow_null=True)
