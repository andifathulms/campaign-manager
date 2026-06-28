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
        fields = ['id', 'name', 'slug', 'plan', 'is_active', 'feature_flags',
                  'enabled_features', 'relawan_auto_approve']

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
    # Accepts a username OR a phone number (relawan often know only their phone).
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        identifier = (data['username'] or '').strip()

        # Resolve a phone-number identifier to its account's username.
        user_obj = User.objects.filter(username=identifier).first()
        if user_obj is None:
            digits = ''.join(ch for ch in identifier if ch.isdigit())
            if digits:
                variants = {digits}
                if digits.startswith('0'):
                    variants.add('62' + digits[1:])
                if digits.startswith('62'):
                    variants.add('0' + digits[2:])
                user_obj = User.objects.filter(phone__in=variants).first()

        username = user_obj.username if user_obj else identifier
        user = authenticate(username=username, password=data['password'])
        if not user:
            raise serializers.ValidationError('Username/nomor atau password salah.')
        if not user.is_active:
            raise serializers.ValidationError('Akun Anda dinonaktifkan. Hubungi admin.')
        data['user'] = user
        return data


class TokenResponseSerializer(serializers.Serializer):
    access = serializers.CharField()
    refresh = serializers.CharField()
    user = UserSerializer()
