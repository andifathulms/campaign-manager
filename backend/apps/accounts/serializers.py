from rest_framework import serializers
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from apps.core.feature_flags import enabled_features
from .models import User, Tenant, Agency


class AgencySerializer(serializers.ModelSerializer):
    class Meta:
        model = Agency
        fields = ['id', 'name', 'slug', 'is_active']


class TenantSerializer(serializers.ModelSerializer):
    enabled_features = serializers.SerializerMethodField()

    class Meta:
        model = Tenant
        fields = ['id', 'name', 'slug', 'plan', 'is_active', 'feature_flags', 'enabled_features']

    def get_enabled_features(self, obj):
        return enabled_features(obj)


class UserSerializer(serializers.ModelSerializer):
    tenant = TenantSerializer(read_only=True)
    agency = AgencySerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name',
                  'role', 'phone', 'wilayah', 'referral_code', 'tenant', 'agency']
        read_only_fields = ['id', 'referral_code']


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(username=data['username'], password=data['password'])
        if not user:
            raise serializers.ValidationError('Invalid credentials.')
        if not user.is_active:
            raise serializers.ValidationError('Account is disabled.')
        data['user'] = user
        return data


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    tenant_name = serializers.CharField(write_only=True)
    tenant_slug = serializers.SlugField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name',
                  'tenant_name', 'tenant_slug']

    def validate_tenant_slug(self, value):
        if Tenant.objects.filter(slug=value).exists():
            raise serializers.ValidationError('This slug is already taken.')
        return value

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('This username is already taken.')
        return value

    def create(self, validated_data):
        tenant_name = validated_data.pop('tenant_name')
        tenant_slug = validated_data.pop('tenant_slug')
        # Direct candidate = agency of one (single code path with consultants).
        agency = Agency.objects.create(name=tenant_name, slug=tenant_slug)
        tenant = Tenant.objects.create(name=tenant_name, slug=tenant_slug, agency=agency)
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.tenant = tenant
        user.agency = agency
        user.role = 'candidate'
        user.set_password(password)
        user.save()
        return user


class TokenResponseSerializer(serializers.Serializer):
    access = serializers.CharField()
    refresh = serializers.CharField()
    user = UserSerializer()
