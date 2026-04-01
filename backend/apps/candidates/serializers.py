from rest_framework import serializers
from .models import Candidate, CampaignPage


class CampaignPageSerializer(serializers.ModelSerializer):
    hero_image_url = serializers.SerializerMethodField()
    og_image_url = serializers.SerializerMethodField()

    class Meta:
        model = CampaignPage
        fields = [
            'id', 'hero_image', 'hero_image_url', 'hero_video_url',
            'sections_order', 'seo_title', 'seo_description',
            'og_image', 'og_image_url', 'is_published', 'published_at',
            'view_count', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'published_at', 'view_count', 'created_at', 'updated_at',
                            'hero_image_url', 'og_image_url']

    def get_hero_image_url(self, obj):
        if obj.hero_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.hero_image.url)
        return None

    def get_og_image_url(self, obj):
        if obj.og_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.og_image.url)
        return None


class CandidateSerializer(serializers.ModelSerializer):
    foto_url = serializers.SerializerMethodField()
    tenant_slug = serializers.CharField(source='tenant.slug', read_only=True)
    campaign_page = CampaignPageSerializer(read_only=True)

    class Meta:
        model = Candidate
        fields = [
            'id', 'nama_lengkap', 'foto', 'foto_url', 'nomor_urut',
            'jenis_pemilihan', 'dapil', 'partai', 'tagline',
            'visi', 'misi', 'program_unggulan', 'sosmed',
            'status', 'color_primary', 'color_secondary',
            'tenant_slug', 'campaign_page',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'foto_url', 'tenant_slug', 'campaign_page']

    def get_foto_url(self, obj):
        if obj.foto:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.foto.url)
            return obj.foto.url
        return None


class PublicCandidateSerializer(serializers.ModelSerializer):
    """Serializer for public-facing candidate data (no auth required)."""
    foto_url = serializers.SerializerMethodField()
    tenant_slug = serializers.CharField(source='tenant.slug', read_only=True)
    campaign_page = CampaignPageSerializer(read_only=True)

    class Meta:
        model = Candidate
        fields = [
            'id', 'nama_lengkap', 'foto_url', 'nomor_urut',
            'jenis_pemilihan', 'dapil', 'partai', 'tagline',
            'visi', 'misi', 'program_unggulan', 'sosmed',
            'color_primary', 'color_secondary', 'tenant_slug', 'campaign_page',
        ]

    def get_foto_url(self, obj):
        if obj.foto:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.foto.url)
        return None
