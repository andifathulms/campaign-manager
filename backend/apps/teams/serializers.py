from rest_framework import serializers
from .models import TeamMember, ReferralLink, ReferralClick, Task, Announcement


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


class TaskSerializer(serializers.ModelSerializer):
    assigned_to_nama = serializers.CharField(source='assigned_to.nama', read_only=True)
    assigned_by_nama = serializers.SerializerMethodField()
    prioritas_display = serializers.CharField(source='get_prioritas_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    is_overdue = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            'id', 'judul', 'deskripsi', 'prioritas', 'prioritas_display',
            'status', 'status_display', 'deadline', 'wilayah',
            'assigned_to', 'assigned_to_nama', 'assigned_by_nama',
            'is_overdue', 'completed_at', 'created_at',
        ]
        read_only_fields = ['id', 'assigned_by_nama', 'assigned_to_nama', 'is_overdue', 'completed_at', 'created_at']

    def get_assigned_by_nama(self, obj):
        if obj.assigned_by:
            return obj.assigned_by.get_full_name() or obj.assigned_by.username
        return ''

    def get_is_overdue(self, obj):
        from django.utils import timezone
        if obj.deadline and obj.status != 'done':
            return obj.deadline < timezone.now().date()
        return False


class TaskCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ['judul', 'deskripsi', 'prioritas', 'deadline', 'wilayah', 'assigned_to']

    def create(self, validated_data):
        request = self.context['request']
        return Task.objects.create(
            tenant=request.user.tenant,
            assigned_by=request.user,
            **validated_data,
        )


class AnnouncementSerializer(serializers.ModelSerializer):
    author_nama = serializers.SerializerMethodField()

    class Meta:
        model = Announcement
        fields = [
            'id', 'judul', 'isi', 'min_level', 'is_pinned',
            'author_nama', 'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'author_nama']

    def get_author_nama(self, obj):
        if obj.author:
            return obj.author.get_full_name() or obj.author.username
        return ''


class TaskUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ['status', 'judul', 'deskripsi', 'prioritas', 'deadline', 'wilayah', 'assigned_to']

    def update(self, instance, validated_data):
        from django.utils import timezone
        new_status = validated_data.get('status', instance.status)
        if new_status == 'done' and instance.status != 'done':
            validated_data['completed_at'] = timezone.now()
        return super().update(instance, validated_data)
