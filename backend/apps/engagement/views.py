import hashlib
from datetime import date

from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from apps.candidates.models import Candidate
from .models import Aspirasi, Poll, PollOption, PollResponse
from .serializers import (
    AspirasiSerializer,
    PublicAspirasiSerializer,
    AspirasiReplySerializer,
    PollSerializer,
    PollCreateSerializer,
    PublicVoteSerializer,
)


# ── Aspirasi ──────────────────────────────────────────────────────────────────

@extend_schema(tags=['engagement'])
class AspirasiListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Aspirasi.objects.filter(tenant=request.user.tenant)
        status_filter = request.query_params.get('status')
        tema = request.query_params.get('tema')
        archived = request.query_params.get('archived', 'false')
        tag = request.query_params.get('tag')
        if status_filter:
            qs = qs.filter(status=status_filter)
        if tema:
            qs = qs.filter(tema=tema)
        if archived.lower() != 'true':
            qs = qs.filter(is_archived=False)
        if tag:
            qs = [a for a in qs if tag in (a.tags or [])]
        return Response(AspirasiSerializer(qs, many=True).data)


@extend_schema(tags=['engagement'])
class AspirasiDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get(self, request, pk):
        return get_object_or_404(Aspirasi, pk=pk, tenant=request.user.tenant)

    def get(self, request, pk):
        aspirasi = self._get(request, pk)
        if aspirasi.status == 'unread':
            aspirasi.status = 'read'
            aspirasi.save(update_fields=['status'])
        return Response(AspirasiSerializer(aspirasi).data)

    def patch(self, request, pk):
        aspirasi = self._get(request, pk)
        serializer = AspirasiReplySerializer(aspirasi, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        aspirasi = serializer.save()
        if aspirasi.balasan_publik and aspirasi.status != 'replied':
            aspirasi.status = 'replied'
            aspirasi.save(update_fields=['status'])
        return Response(AspirasiSerializer(aspirasi).data)

    def delete(self, request, pk):
        self._get(request, pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(tags=['public'])
class PublicAspirasiSubmitView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, slug):
        from datetime import timedelta
        from django.utils import timezone

        candidate = get_object_or_404(Candidate, tenant__slug=slug)

        # Rate limit: max 3 aspirasi per IP per hour
        ip = request.META.get('REMOTE_ADDR', '')
        ip_hash = hashlib.sha256(f"{ip}{date.today().isoformat()}".encode()).hexdigest()
        one_hour_ago = timezone.now() - timedelta(hours=1)
        recent_count = Aspirasi.objects.filter(
            tenant=candidate.tenant, ip_hash=ip_hash, created_at__gte=one_hour_ago
        ).count()
        if recent_count >= 3:
            return Response(
                {'detail': 'Terlalu banyak aspirasi. Coba lagi dalam 1 jam.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        serializer = PublicAspirasiSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        Aspirasi.objects.create(
            tenant=candidate.tenant,
            ip_hash=ip_hash,
            **serializer.validated_data,
        )
        return Response({'detail': 'Aspirasi Anda telah diterima. Terima kasih!'}, status=status.HTTP_201_CREATED)


@extend_schema(tags=['public'])
class PublicAspirasiRepliesView(APIView):
    """Public: list aspirasi with published replies for the campaign page."""
    permission_classes = [AllowAny]

    def get(self, request, slug):
        candidate = get_object_or_404(Candidate, tenant__slug=slug)
        qs = Aspirasi.objects.filter(
            tenant=candidate.tenant, is_published=True, status='replied'
        ).only('nama', 'pesan', 'tema', 'balasan_publik', 'wilayah', 'created_at')
        data = [
            {
                'nama': a.nama,
                'wilayah': a.wilayah,
                'tema': a.tema,
                'pesan': a.pesan,
                'balasan': a.balasan_publik,
                'created_at': a.created_at,
            }
            for a in qs
        ]
        return Response(data)


# ── Poll ──────────────────────────────────────────────────────────────────────

@extend_schema(tags=['engagement'])
class PollListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Poll.objects.filter(tenant=request.user.tenant).prefetch_related('options')
        return Response(PollSerializer(qs, many=True).data)

    def post(self, request):
        serializer = PollCreateSerializer(
            data=request.data,
            context={'tenant': request.user.tenant},
        )
        serializer.is_valid(raise_exception=True)
        poll = serializer.save()
        return Response(PollSerializer(poll).data, status=status.HTTP_201_CREATED)


@extend_schema(tags=['engagement'])
class PollDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get(self, request, pk):
        return get_object_or_404(Poll, pk=pk, tenant=request.user.tenant)

    def get(self, request, pk):
        return Response(PollSerializer(self._get(request, pk)).data)

    def patch(self, request, pk):
        poll = self._get(request, pk)
        allowed = {k: v for k, v in request.data.items() if k in ('status', 'ends_at', 'pertanyaan')}
        for k, v in allowed.items():
            setattr(poll, k, v)
        poll.save()
        return Response(PollSerializer(poll).data)

    def delete(self, request, pk):
        self._get(request, pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(tags=['public'])
class PublicPollVoteView(APIView):
    """Public: vote on an active poll (once per IP per day)."""
    permission_classes = [AllowAny]

    def get(self, request, pk):
        poll = get_object_or_404(Poll, pk=pk, status='active')
        return Response(PollSerializer(poll).data)

    def post(self, request, pk):
        poll = get_object_or_404(Poll, pk=pk, status='active')
        serializer = PublicVoteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        option = get_object_or_404(PollOption, pk=serializer.validated_data['option_id'], poll=poll)

        ip = request.META.get('REMOTE_ADDR', '')
        ip_hash = hashlib.sha256(f"{ip}{date.today().isoformat()}".encode()).hexdigest()

        _, created = PollResponse.objects.get_or_create(
            poll=poll, ip_hash=ip_hash,
            defaults={'option': option},
        )
        if not created:
            return Response({'detail': 'Anda sudah memberikan suara.'}, status=status.HTTP_400_BAD_REQUEST)

        option.vote_count += 1
        option.save(update_fields=['vote_count'])
        return Response({'detail': 'Suara Anda berhasil dicatat.'})
