from rest_framework import serializers
from .models import ContentItem, AdCreative


class AdCreativeSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    media_type_display = serializers.CharField(source='get_media_type_display', read_only=True)
    tema_display = serializers.CharField(source='get_tema_display', read_only=True)

    class Meta:
        model = AdCreative
        fields = [
            'id', 'judul', 'media_type', 'media_type_display', 'file_url',
            'caption', 'tema', 'tema_display', 'platform_tags', 'is_active', 'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'file_url']

    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
        return None


class AdCreativeCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdCreative
        fields = ['judul', 'media_type', 'file', 'caption', 'tema', 'platform_tags']


class ContentItemSerializer(serializers.ModelSerializer):
    platform_display = serializers.CharField(source='get_platform_display', read_only=True)
    jenis_display = serializers.CharField(source='get_jenis_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    creative_detail = AdCreativeSerializer(source='creative', read_only=True)

    class Meta:
        model = ContentItem
        fields = [
            'id', 'judul', 'caption', 'platform', 'platform_display',
            'jenis', 'jenis_display', 'status', 'status_display',
            'scheduled_at', 'published_at', 'tags', 'notes',
            'creative', 'creative_detail', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class ContentItemCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContentItem
        fields = [
            'judul', 'caption', 'platform', 'jenis', 'status',
            'scheduled_at', 'tags', 'notes', 'creative',
        ]
