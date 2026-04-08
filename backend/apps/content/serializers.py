from rest_framework import serializers
from .models import ContentItem, AdCreative, ContentShare, Article


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
            'is_daily_content', 'reward_per_100_views', 'reward_max_cap',
        ]


class ContentShareSerializer(serializers.ModelSerializer):
    content_judul = serializers.CharField(source='content.judul', read_only=True)
    content_caption = serializers.CharField(source='content.caption', read_only=True)
    volunteer_nama = serializers.CharField(source='volunteer.nama', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = ContentShare
        fields = [
            'id', 'content', 'content_judul', 'content_caption',
            'volunteer', 'volunteer_nama', 'tracking_code',
            'proof_url', 'proof_screenshot', 'view_count', 'points_earned',
            'status', 'status_display', 'expires_at', 'last_updated_views_at', 'created_at',
        ]
        read_only_fields = [
            'id', 'content', 'volunteer', 'tracking_code',
            'points_earned', 'status', 'expires_at', 'created_at',
        ]


class ArticleSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    author_nama = serializers.SerializerMethodField()
    featured_image_url = serializers.SerializerMethodField()

    class Meta:
        model = Article
        fields = [
            'id', 'title', 'slug', 'body', 'excerpt', 'featured_image', 'featured_image_url',
            'category', 'category_display', 'status', 'status_display',
            'author', 'author_nama', 'view_count', 'published_at', 'created_at',
        ]
        read_only_fields = ['id', 'view_count', 'created_at']

    def get_author_nama(self, obj):
        if obj.author:
            return obj.author.get_full_name() or obj.author.username
        return ''

    def get_featured_image_url(self, obj):
        if obj.featured_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.featured_image.url)
        return None


class ArticleCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Article
        fields = ['title', 'slug', 'body', 'excerpt', 'featured_image', 'category', 'status']


class PublicArticleListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for public article listing (no full body)."""
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    featured_image_url = serializers.SerializerMethodField()

    class Meta:
        model = Article
        fields = [
            'id', 'title', 'slug', 'excerpt', 'featured_image_url',
            'category', 'category_display', 'view_count', 'published_at',
        ]

    def get_featured_image_url(self, obj):
        if obj.featured_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.featured_image.url)
        return None
