import secrets

from django.db.models import Sum
from rest_framework import serializers

from apps.accounts.models import Agency, Tenant, User
from apps.candidates.models import Candidate, CampaignPage


def _candidate(tenant):
    return getattr(tenant, 'candidate', None)


class TenantStatsSerializer(serializers.ModelSerializer):
    """Cross-tenant directory row: tenant + candidate summary + aggregate stats."""
    nama_lengkap = serializers.SerializerMethodField()
    partai = serializers.SerializerMethodField()
    jenis_pemilihan = serializers.SerializerMethodField()
    candidate_status = serializers.SerializerMethodField()
    agency_name = serializers.CharField(source='agency.name', default=None)
    supporter_count = serializers.SerializerMethodField()
    team_count = serializers.SerializerMethodField()
    ads_spend = serializers.SerializerMethodField()
    page_views = serializers.SerializerMethodField()

    class Meta:
        model = Tenant
        fields = [
            'id', 'name', 'slug', 'plan', 'is_active', 'created_at', 'agency_name',
            'nama_lengkap', 'partai', 'jenis_pemilihan', 'candidate_status',
            'supporter_count', 'team_count', 'ads_spend', 'page_views',
        ]

    def get_nama_lengkap(self, obj):
        c = _candidate(obj)
        return c.nama_lengkap if c else None

    def get_partai(self, obj):
        c = _candidate(obj)
        return c.partai if c else None

    def get_jenis_pemilihan(self, obj):
        c = _candidate(obj)
        return c.jenis_pemilihan if c else None

    def get_candidate_status(self, obj):
        c = _candidate(obj)
        return c.status if c else None

    def get_supporter_count(self, obj):
        from apps.supporters.models import Supporter
        return Supporter.objects.filter(tenant=obj, is_active=True).count()

    def get_team_count(self, obj):
        from apps.teams.models import TeamMember
        return TeamMember.objects.filter(tenant=obj, is_active=True).count()

    def get_ads_spend(self, obj):
        from apps.ads.models import AdsCampaignSnapshot
        agg = AdsCampaignSnapshot.objects.filter(tenant=obj).aggregate(total=Sum('spend'))
        return float(agg['total'] or 0)

    def get_page_views(self, obj):
        c = _candidate(obj)
        page = getattr(c, 'campaign_page', None) if c else None
        return page.view_count if page else 0


class TenantUpdateSerializer(serializers.Serializer):
    """Suspend/activate a tenant and/or publish/pause its candidate page."""
    is_active = serializers.BooleanField(required=False)
    candidate_status = serializers.ChoiceField(
        choices=['draft', 'published', 'paused'], required=False
    )


class ProvisionCandidateSerializer(serializers.Serializer):
    """Create Agency + Tenant + Candidate + login user in one shot."""
    nama_lengkap = serializers.CharField(max_length=200)
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField(required=False, allow_blank=True)
    tenant_name = serializers.CharField(max_length=200)
    tenant_slug = serializers.SlugField(max_length=50)
    plan = serializers.ChoiceField(choices=['starter', 'pro', 'premium', 'enterprise'], default='starter')
    partai = serializers.CharField(max_length=200, required=False, allow_blank=True)
    dapil = serializers.CharField(max_length=200, required=False, allow_blank=True)
    jenis_pemilihan = serializers.ChoiceField(
        choices=[c[0] for c in Candidate._meta.get_field('jenis_pemilihan').choices],
        default='pileg_dprd_kota',
    )

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('Username sudah dipakai.')
        return value

    def validate_tenant_slug(self, value):
        if Tenant.objects.filter(slug=value).exists():
            raise serializers.ValidationError('Slug sudah dipakai.')
        return value

    def create(self, validated_data):
        temp_password = secrets.token_urlsafe(9)
        agency = Agency.objects.create(name=validated_data['tenant_name'], slug=validated_data['tenant_slug'])
        tenant = Tenant.objects.create(
            name=validated_data['tenant_name'], slug=validated_data['tenant_slug'],
            agency=agency, plan=validated_data.get('plan', 'starter'),
        )
        first, _, last = validated_data['nama_lengkap'].partition(' ')
        user = User(
            username=validated_data['username'], email=validated_data.get('email', '') or '',
            first_name=first, last_name=last, role='candidate', tenant=tenant, agency=agency,
        )
        user.set_password(temp_password)
        user.save()
        candidate = Candidate.objects.create(
            tenant=tenant, user=user, nama_lengkap=validated_data['nama_lengkap'],
            partai=validated_data.get('partai', '') or '', dapil=validated_data.get('dapil', '') or '',
            jenis_pemilihan=validated_data.get('jenis_pemilihan', 'pileg_dprd_kota'),
            status='draft',
        )
        CampaignPage.objects.create(candidate=candidate)
        self._temp_password = temp_password
        self._tenant = tenant
        return tenant

    def to_representation(self, instance):
        return {
            'tenant_id': str(instance.id),
            'slug': instance.slug,
            'username': self.validated_data['username'],
            'temp_password': getattr(self, '_temp_password', None),
        }


class StaffUserSerializer(serializers.ModelSerializer):
    """List/create platform staff (superadmin/admin)."""
    password = serializers.CharField(write_only=True, required=False, min_length=8)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'is_active', 'password']
        read_only_fields = ['id']

    def validate_role(self, value):
        if value not in ('superadmin', 'admin'):
            raise serializers.ValidationError('Role staf harus superadmin atau admin.')
        return value

    def create(self, validated_data):
        password = validated_data.pop('password', None) or secrets.token_urlsafe(9)
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        self._temp_password = password
        return user

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if getattr(self, '_temp_password', None):
            data['temp_password'] = self._temp_password
        return data
