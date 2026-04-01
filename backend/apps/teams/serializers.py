from rest_framework import serializers
from .models import TeamMember, ReferralLink, ReferralClick


class ReferralLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReferralLink
        fields = ['id', 'code', 'label', 'clicks', 'unique_visitors', 'last_clicked_at', 'created_at']
        read_only_fields = ['id', 'code', 'clicks', 'unique_visitors', 'last_clicked_at', 'created_at']


class TeamMemberSerializer(serializers.ModelSerializer):
    referral_links = ReferralLinkSerializer(many=True, read_only=True)
    total_clicks = serializers.SerializerMethodField()
    level_display = serializers.CharField(source='get_level_display', read_only=True)
    wilayah_level_display = serializers.CharField(source='get_wilayah_level_display', read_only=True)

    class Meta:
        model = TeamMember
        fields = [
            'id', 'nama', 'phone', 'level', 'level_display',
            'wilayah_name', 'wilayah_level', 'wilayah_level_display',
            'parent', 'is_active', 'referral_links', 'total_clicks', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def get_total_clicks(self, obj):
        return sum(link.clicks for link in obj.referral_links.all())


class TeamMemberCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeamMember
        fields = [
            'nama', 'phone', 'level', 'wilayah_name', 'wilayah_level', 'parent', 'is_active',
        ]

    def create(self, validated_data):
        tenant = self.context['request'].user.tenant
        member = TeamMember.objects.create(tenant=tenant, **validated_data)
        # Auto-create a referral link for every new member
        ReferralLink.objects.create(team_member=member, label='Default')
        return member


class LeaderboardSerializer(serializers.ModelSerializer):
    total_clicks = serializers.SerializerMethodField()
    level_display = serializers.CharField(source='get_level_display', read_only=True)

    class Meta:
        model = TeamMember
        fields = ['id', 'nama', 'level', 'level_display', 'wilayah_name', 'total_clicks']

    def get_total_clicks(self, obj):
        return sum(link.clicks for link in obj.referral_links.all())


class PublicReferralClickSerializer(serializers.Serializer):
    user_agent = serializers.CharField(required=False, allow_blank=True, default='')
