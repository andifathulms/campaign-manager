from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from drf_spectacular.utils import extend_schema
from .models import Candidate, CampaignPage
from .serializers import CandidateSerializer, CampaignPageSerializer, PublicCandidateSerializer
from apps.accounts.models import Tenant


class MyCandidateView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def _get_or_create_candidate(self, user):
        try:
            return user.candidate
        except Candidate.DoesNotExist:
            candidate = Candidate.objects.create(
                tenant=user.tenant,
                user=user,
                nama_lengkap=user.get_full_name() or user.username,
            )
            CampaignPage.objects.create(candidate=candidate)
            return candidate

    @extend_schema(responses={200: CandidateSerializer})
    def get(self, request):
        candidate = self._get_or_create_candidate(request.user)
        serializer = CandidateSerializer(candidate, context={'request': request})
        return Response(serializer.data)

    @extend_schema(request=CandidateSerializer, responses={200: CandidateSerializer})
    def put(self, request):
        candidate = self._get_or_create_candidate(request.user)
        serializer = CandidateSerializer(
            candidate, data=request.data, partial=True, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class MyCampaignPageView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def _get_page(self, user):
        try:
            return user.candidate.campaign_page
        except (Candidate.DoesNotExist, CampaignPage.DoesNotExist):
            return None

    @extend_schema(responses={200: CampaignPageSerializer})
    def get(self, request):
        page = self._get_page(request.user)
        if not page:
            return Response({'detail': 'Candidate profile not set up yet.'}, status=404)
        return Response(CampaignPageSerializer(page, context={'request': request}).data)

    @extend_schema(request=CampaignPageSerializer, responses={200: CampaignPageSerializer})
    def put(self, request):
        page = self._get_page(request.user)
        if not page:
            return Response({'detail': 'Candidate profile not set up yet.'}, status=404)
        serializer = CampaignPageSerializer(
            page, data=request.data, partial=True, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class PublishCampaignPageView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: CampaignPageSerializer})
    def post(self, request):
        try:
            page = request.user.candidate.campaign_page
        except (Candidate.DoesNotExist, CampaignPage.DoesNotExist):
            return Response({'detail': 'Candidate profile not set up yet.'}, status=404)

        page.is_published = True
        page.published_at = timezone.now()
        page.candidate.status = 'published'
        page.candidate.save()
        page.save()
        return Response(CampaignPageSerializer(page, context={'request': request}).data)


class PublicCandidateView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(responses={200: PublicCandidateSerializer})
    def get(self, request, slug):
        try:
            tenant = Tenant.objects.get(slug=slug, is_active=True)
            candidate = tenant.candidate
        except (Tenant.DoesNotExist, Candidate.DoesNotExist):
            return Response({'detail': 'Not found.'}, status=404)

        if candidate.status != 'published':
            return Response({'detail': 'Not found.'}, status=404)

        serializer = PublicCandidateSerializer(candidate, context={'request': request})
        return Response(serializer.data)


class PublicViewCountView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, slug):
        try:
            tenant = Tenant.objects.get(slug=slug, is_active=True)
            page = tenant.candidate.campaign_page
            page.view_count += 1
            page.save(update_fields=['view_count'])
        except Exception:
            pass
        return Response({'ok': True})
