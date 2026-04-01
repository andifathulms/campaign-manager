import csv
import io

from django.db.models import Count
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from apps.candidates.models import Candidate
from apps.core.mixins import TenantQuerysetMixin
from .models import Supporter
from .serializers import (
    SupporterSerializer,
    PublicJoinSerializer,
    MembershipCardSerializer,
    SupporterStatsSerializer,
)


@extend_schema(tags=['supporters'])
class SupporterListView(TenantQuerysetMixin, generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = SupporterSerializer

    def get_queryset(self):
        qs = Supporter.objects.filter(
            tenant=self.request.user.tenant, is_active=True
        )
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(nama__icontains=search)
        kecamatan = self.request.query_params.get('kecamatan')
        if kecamatan:
            qs = qs.filter(kecamatan__icontains=kecamatan)
        return qs


@extend_schema(tags=['supporters'])
class SupporterDetailView(TenantQuerysetMixin, generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = SupporterSerializer

    def get_queryset(self):
        return Supporter.objects.filter(tenant=self.request.user.tenant)


@extend_schema(tags=['supporters'])
class SupporterCardView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = MembershipCardSerializer

    def get_queryset(self):
        return Supporter.objects.filter(tenant=self.request.user.tenant)


@extend_schema(tags=['supporters'])
class SupporterStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant = request.user.tenant
        qs = Supporter.objects.filter(tenant=tenant, is_active=True)
        total = qs.count()
        by_kecamatan = list(
            qs.values('kecamatan').annotate(count=Count('id')).order_by('-count')[:10]
        )
        by_kabupaten = list(
            qs.values('kabupaten_kota').annotate(count=Count('id')).order_by('-count')[:10]
        )
        return Response({
            'total': total,
            'by_kecamatan': by_kecamatan,
            'by_kabupaten': by_kabupaten,
        })


@extend_schema(tags=['supporters'])
class SupporterExportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Supporter.objects.filter(
            tenant=request.user.tenant, is_active=True
        ).select_related('referred_by_team')

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            'Nama', 'Phone', 'Email', 'Kelurahan', 'Kecamatan',
            'Kabupaten/Kota', 'Provinsi', 'Membership ID',
            'Direferensikan Oleh', 'Tanggal Daftar',
        ])
        for s in qs:
            writer.writerow([
                s.nama, s.phone, s.email or '',
                s.kelurahan, s.kecamatan, s.kabupaten_kota, s.provinsi,
                s.membership_id,
                s.referred_by_team.nama if s.referred_by_team else '',
                s.created_at.strftime('%Y-%m-%d'),
            ])

        response = HttpResponse(output.getvalue(), content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="pendukung.csv"'
        return response


@extend_schema(tags=['public'])
class PublicJoinView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, slug):
        candidate = get_object_or_404(Candidate, tenant__slug=slug)
        tenant = candidate.tenant
        serializer = PublicJoinSerializer(
            data=request.data,
            context={'tenant': tenant, 'request': request},
        )
        serializer.is_valid(raise_exception=True)
        supporter = serializer.save()
        return Response(
            MembershipCardSerializer(supporter).data,
            status=status.HTTP_201_CREATED,
        )
