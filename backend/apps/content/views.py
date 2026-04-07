from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from .models import ContentItem, AdCreative
from .serializers import (
    ContentItemSerializer,
    ContentItemCreateSerializer,
    AdCreativeSerializer,
    AdCreativeCreateSerializer,
)


@extend_schema(tags=['content'])
class ContentItemListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = ContentItem.objects.filter(tenant=request.user.tenant).select_related('creative')
        platform = request.query_params.get('platform')
        status_filter = request.query_params.get('status')
        month = request.query_params.get('month')  # YYYY-MM
        if platform:
            qs = qs.filter(platform=platform)
        if status_filter:
            qs = qs.filter(status=status_filter)
        if month:
            try:
                year, m = month.split('-')
                qs = qs.filter(scheduled_at__year=int(year), scheduled_at__month=int(m))
            except (ValueError, AttributeError):
                pass
        return Response(ContentItemSerializer(qs, many=True, context={'request': request}).data)

    def post(self, request):
        serializer = ContentItemCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item = serializer.save(tenant=request.user.tenant)
        return Response(ContentItemSerializer(item, context={'request': request}).data, status=status.HTTP_201_CREATED)


@extend_schema(tags=['content'])
class ContentItemDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get(self, request, pk):
        return get_object_or_404(ContentItem, pk=pk, tenant=request.user.tenant)

    def get(self, request, pk):
        return Response(ContentItemSerializer(self._get(request, pk), context={'request': request}).data)

    def patch(self, request, pk):
        item = self._get(request, pk)
        serializer = ContentItemCreateSerializer(item, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        # Auto-set published_at when status changes to published
        if request.data.get('status') == 'published' and item.status != 'published':
            item.published_at = timezone.now()
        item = serializer.save()
        return Response(ContentItemSerializer(item, context={'request': request}).data)

    def delete(self, request, pk):
        self._get(request, pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(tags=['content'])
class AdCreativeListCreateView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        qs = AdCreative.objects.filter(tenant=request.user.tenant, is_active=True)
        tema = request.query_params.get('tema')
        platform = request.query_params.get('platform')
        media_type = request.query_params.get('media_type')
        search = request.query_params.get('search')
        if tema:
            qs = qs.filter(tema=tema)
        if platform:
            qs = qs.filter(platform_tags__contains=[platform])
        if media_type:
            qs = qs.filter(media_type=media_type)
        if search:
            qs = qs.filter(judul__icontains=search)
        return Response(AdCreativeSerializer(qs, many=True, context={'request': request}).data)

    def post(self, request):
        serializer = AdCreativeCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        creative = serializer.save(tenant=request.user.tenant)
        return Response(AdCreativeSerializer(creative, context={'request': request}).data, status=status.HTTP_201_CREATED)


@extend_schema(tags=['content'])
class AdCreativeDetailView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def _get(self, request, pk):
        return get_object_or_404(AdCreative, pk=pk, tenant=request.user.tenant)

    def get(self, request, pk):
        return Response(AdCreativeSerializer(self._get(request, pk), context={'request': request}).data)

    def patch(self, request, pk):
        creative = self._get(request, pk)
        serializer = AdCreativeCreateSerializer(creative, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        creative = serializer.save()
        return Response(AdCreativeSerializer(creative, context={'request': request}).data)

    def delete(self, request, pk):
        creative = self._get(request, pk)
        creative.is_active = False
        creative.save(update_fields=['is_active'])
        return Response(status=status.HTTP_204_NO_CONTENT)
