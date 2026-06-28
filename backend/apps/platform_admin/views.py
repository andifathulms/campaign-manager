from django.db.models import Sum
from drf_spectacular.utils import extend_schema
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import Tenant, User
from apps.accounts.serializers import UserSerializer
from apps.candidates.models import Candidate
from .models import PlatformAuditLog
from .permissions import IsPlatformAdmin, IsSuperAdmin
from .serializers import (
    ProvisionCandidateSerializer,
    StaffUserSerializer,
    TenantStatsSerializer,
    TenantUpdateSerializer,
)


def _audit(request, action, tenant=None, **detail):
    PlatformAuditLog.objects.create(
        actor=request.user if request.user.is_authenticated else None,
        action=action, target_tenant=tenant, detail=detail,
    )


@extend_schema(tags=['platform-admin'])
class PlatformOverviewView(APIView):
    permission_classes = [IsPlatformAdmin]

    def get(self, request):
        from apps.supporters.models import Supporter
        from apps.ads.models import AdsCampaignSnapshot

        tenants = Tenant.objects.all()
        return Response({
            'total_campaigns': tenants.count(),
            'active_campaigns': tenants.filter(is_active=True).count(),
            'published_campaigns': Candidate.objects.filter(status='published').count(),
            'total_supporters': Supporter.objects.filter(is_active=True).count(),
            'total_spend': float(AdsCampaignSnapshot.objects.aggregate(t=Sum('spend'))['t'] or 0),
            'by_plan': {
                p: tenants.filter(plan=p).count()
                for p in ('starter', 'pro', 'premium', 'enterprise')
            },
        })


@extend_schema(tags=['platform-admin'])
class PlatformTenantListView(generics.ListAPIView):
    permission_classes = [IsPlatformAdmin]
    serializer_class = TenantStatsSerializer

    def get_queryset(self):
        qs = Tenant.objects.select_related('agency', 'candidate', 'candidate__campaign_page').order_by('-created_at')
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(name__icontains=search) | qs.filter(candidate__nama_lengkap__icontains=search)
        plan = self.request.query_params.get('plan')
        if plan:
            qs = qs.filter(plan=plan)
        active = self.request.query_params.get('is_active')
        if active in ('true', 'false'):
            qs = qs.filter(is_active=(active == 'true'))
        return qs


@extend_schema(tags=['platform-admin'])
class PlatformTenantDetailView(APIView):
    permission_classes = [IsPlatformAdmin]

    def get_object(self, pk):
        return Tenant.objects.select_related('agency', 'candidate', 'candidate__campaign_page').filter(pk=pk).first()

    def get(self, request, pk):
        tenant = self.get_object(pk)
        if not tenant:
            return Response({'detail': 'Tidak ditemukan.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(TenantStatsSerializer(tenant).data)

    def patch(self, request, pk):
        tenant = self.get_object(pk)
        if not tenant:
            return Response({'detail': 'Tidak ditemukan.'}, status=status.HTTP_404_NOT_FOUND)
        ser = TenantUpdateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        if 'is_active' in data:
            tenant.is_active = data['is_active']
            tenant.save(update_fields=['is_active'])
            _audit(request, 'activate' if data['is_active'] else 'suspend', tenant)
        if 'candidate_status' in data:
            candidate = getattr(tenant, 'candidate', None)
            if candidate:
                candidate.status = data['candidate_status']
                candidate.save(update_fields=['status'])
                _audit(request, 'publish' if data['candidate_status'] == 'published' else 'pause',
                       tenant, candidate_status=data['candidate_status'])
        return Response(TenantStatsSerializer(self.get_object(pk)).data)


@extend_schema(tags=['platform-admin'])
class PlatformProvisionView(APIView):
    permission_classes = [IsPlatformAdmin]

    def post(self, request):
        ser = ProvisionCandidateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        tenant = ser.save()
        _audit(request, 'provision', tenant, username=ser.validated_data['username'])
        return Response(ser.data, status=status.HTTP_201_CREATED)


@extend_schema(tags=['platform-admin'])
class PlatformImpersonateView(APIView):
    permission_classes = [IsPlatformAdmin]

    def post(self, request, pk):
        tenant = Tenant.objects.filter(pk=pk).first()
        if not tenant:
            return Response({'detail': 'Tidak ditemukan.'}, status=status.HTTP_404_NOT_FOUND)
        candidate = getattr(tenant, 'candidate', None)
        target = candidate.user if candidate else User.objects.filter(tenant=tenant, role='candidate').first()
        if not target:
            return Response({'detail': 'Kandidat tidak punya akun login.'}, status=status.HTTP_400_BAD_REQUEST)

        refresh = RefreshToken.for_user(target)
        _audit(request, 'impersonate', tenant, target_user=target.username)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(target).data,
        })


@extend_schema(tags=['platform-admin'])
class PlatformStaffListView(generics.ListCreateAPIView):
    """List/create platform staff. Superadmin only."""
    permission_classes = [IsSuperAdmin]
    serializer_class = StaffUserSerializer

    def get_queryset(self):
        return User.objects.filter(role__in=['superadmin', 'admin']).order_by('username')

    def perform_create(self, serializer):
        user = serializer.save()
        _audit(self.request, 'create_admin', None, username=user.username, role=user.role)
