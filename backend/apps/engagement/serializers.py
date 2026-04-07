from rest_framework import serializers
from .models import Aspirasi, Poll, PollOption, PollResponse


class AspirasiSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    tema_display = serializers.CharField(source='get_tema_display', read_only=True)

    class Meta:
        model = Aspirasi
        fields = [
            'id', 'nama', 'phone', 'email', 'pesan', 'tema', 'tema_display',
            'wilayah', 'status', 'status_display', 'balasan_publik',
            'is_published', 'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'status_display', 'tema_display']


class PublicAspirasiSerializer(serializers.ModelSerializer):
    """Used for public submission — no auth required."""
    class Meta:
        model = Aspirasi
        fields = ['nama', 'phone', 'email', 'pesan', 'tema', 'wilayah']


class AspirasiReplySerializer(serializers.ModelSerializer):
    class Meta:
        model = Aspirasi
        fields = ['status', 'balasan_publik', 'is_published']


class PollOptionSerializer(serializers.ModelSerializer):
    pct = serializers.SerializerMethodField()

    class Meta:
        model = PollOption
        fields = ['id', 'teks', 'vote_count', 'pct']
        read_only_fields = ['id', 'vote_count', 'pct']

    def get_pct(self, obj):
        total = self.context.get('total_votes', 0)
        if total == 0:
            return 0
        return round(obj.vote_count / total * 100, 1)


class PollSerializer(serializers.ModelSerializer):
    options = serializers.SerializerMethodField()
    total_votes = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Poll
        fields = [
            'id', 'pertanyaan', 'status', 'status_display',
            'ends_at', 'options', 'total_votes', 'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'status_display']

    def get_total_votes(self, obj):
        return sum(opt.vote_count for opt in obj.options.all())

    def get_options(self, obj):
        total = sum(opt.vote_count for opt in obj.options.all())
        return PollOptionSerializer(obj.options.all(), many=True, context={'total_votes': total}).data


class PollCreateSerializer(serializers.ModelSerializer):
    options = serializers.ListField(
        child=serializers.CharField(max_length=300), min_length=2, max_length=5, write_only=True
    )

    class Meta:
        model = Poll
        fields = ['pertanyaan', 'ends_at', 'options']

    def create(self, validated_data):
        options_data = validated_data.pop('options')
        poll = Poll.objects.create(tenant=self.context['tenant'], **validated_data)
        for teks in options_data:
            PollOption.objects.create(poll=poll, teks=teks)
        return poll


class PublicVoteSerializer(serializers.Serializer):
    option_id = serializers.UUIDField()
