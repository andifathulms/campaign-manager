from rest_framework import serializers
from .models import Supporter


class SupporterSerializer(serializers.ModelSerializer):
    foto_url = serializers.SerializerMethodField()

    class Meta:
        model = Supporter
        fields = [
            'id', 'nama', 'phone', 'email', 'foto_url',
            'kelurahan', 'kecamatan', 'kabupaten_kota', 'provinsi',
            'referred_by_team', 'membership_id', 'referral_code', 'referral_count',
            'statement', 'is_verified', 'is_active', 'created_at',
        ]
        read_only_fields = ['id', 'membership_id', 'referral_code', 'referral_count', 'created_at', 'foto_url']

    def get_foto_url(self, obj):
        if obj.foto:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.foto.url)
        return None


class PublicJoinSerializer(serializers.ModelSerializer):
    ref_code = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Supporter
        fields = [
            'nama', 'phone', 'email', 'kelurahan', 'kecamatan',
            'kabupaten_kota', 'provinsi', 'statement', 'ref_code',
        ]

    def create(self, validated_data):
        from apps.teams.models import ReferralLink
        ref_code = validated_data.pop('ref_code', None)
        tenant = self.context['tenant']

        referred_by_team = None
        referred_by_supporter = None

        if ref_code:
            # Try team referral first
            try:
                link = ReferralLink.objects.get(code=ref_code, team_member__tenant=tenant)
                referred_by_team = link.team_member
            except ReferralLink.DoesNotExist:
                pass

            # Try supporter referral
            if not referred_by_team:
                try:
                    ref_sup = Supporter.objects.get(referral_code=ref_code, tenant=tenant)
                    referred_by_supporter = ref_sup
                    ref_sup.referral_count += 1
                    ref_sup.save(update_fields=['referral_count'])
                except Supporter.DoesNotExist:
                    pass

        return Supporter.objects.create(
            tenant=tenant,
            referred_by_team=referred_by_team,
            referred_by_supporter=referred_by_supporter,
            **validated_data,
        )


class MembershipCardSerializer(serializers.ModelSerializer):
    candidate_name = serializers.SerializerMethodField()
    candidate_partai = serializers.SerializerMethodField()

    class Meta:
        model = Supporter
        fields = [
            'id', 'nama', 'membership_id', 'referral_code', 'referral_count',
            'kelurahan', 'kecamatan', 'kabupaten_kota', 'provinsi',
            'candidate_name', 'candidate_partai', 'created_at',
        ]

    def get_candidate_name(self, obj):
        try:
            return obj.tenant.candidate.nama_lengkap
        except Exception:
            return ''

    def get_candidate_partai(self, obj):
        try:
            return obj.tenant.candidate.partai
        except Exception:
            return ''


class SupporterStatsSerializer(serializers.Serializer):
    total = serializers.IntegerField()
    by_kecamatan = serializers.ListField(child=serializers.DictField())
    by_kabupaten = serializers.ListField(child=serializers.DictField())


class VolunteerSupporterCreateSerializer(serializers.ModelSerializer):
    """For volunteer manual supporter entry in the field."""
    class Meta:
        model = Supporter
        fields = [
            'nama', 'phone', 'email', 'kelurahan', 'kecamatan',
            'kabupaten_kota', 'provinsi',
        ]

    def validate_phone(self, value):
        # Normalize phone
        phone = value.strip().replace(' ', '').replace('-', '')
        if phone.startswith('0'):
            phone = '62' + phone[1:]
        elif phone.startswith('+'):
            phone = phone[1:]
        return phone

    def create(self, validated_data):
        tenant = self.context['tenant']
        volunteer = self.context['volunteer']

        # Duplicate detection (warn, don't block)
        duplicate = Supporter.objects.filter(
            tenant=tenant, phone=validated_data['phone']
        ).exists()

        supporter = Supporter.objects.create(
            tenant=tenant,
            referred_by_team=volunteer,
            source='manual_entry',
            is_verified=True,  # volunteer vouches
            **validated_data,
        )

        # Award points
        from apps.teams.points import award_points
        award_points(
            volunteer, 'manual_supporter',
            description=f'Input pendukung: {supporter.nama}',
            reference_id=supporter.pk, reference_type='supporter',
        )

        # Attach duplicate flag to instance for response
        supporter._is_duplicate = duplicate
        return supporter
