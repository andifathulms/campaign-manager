import math

from django.db.models import F
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from apps.core.permissions import IsVolunteer
from .models import ContentItem, AdCreative, ContentShare, Article
from .serializers import (
    ContentItemSerializer,
    ContentItemCreateSerializer,
    AdCreativeSerializer,
    AdCreativeCreateSerializer,
    ContentShareSerializer,
    ArticleSerializer,
    ArticleCreateSerializer,
    PublicArticleListSerializer,
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


# --------------- Volunteer Daily Content ---------------

@extend_schema(tags=['volunteer-content'])
class VolunteerDailyContentView(APIView):
    """Volunteer: list today's shareable daily content."""
    permission_classes = [IsVolunteer]

    def get(self, request):
        today = timezone.now().date()
        qs = ContentItem.objects.filter(
            tenant=request.user.tenant,
            is_daily_content=True,
            status='published',
            scheduled_at__date__lte=today,
        ).select_related('creative')
        return Response(ContentItemSerializer(qs, many=True, context={'request': request}).data)


@extend_schema(tags=['volunteer-content'])
class VolunteerShareContentView(APIView):
    """Volunteer initiates a share — gets tracking link + caption."""
    permission_classes = [IsVolunteer]

    def post(self, request, pk):
        content = get_object_or_404(
            ContentItem, pk=pk, tenant=request.user.tenant, is_daily_content=True
        )
        member = request.user.team_member

        share, created = ContentShare.objects.get_or_create(
            content=content, volunteer=member,
            defaults={'expires_at': timezone.now() + timezone.timedelta(days=7)},
        )
        if not created and share.status == 'rejected':
            return Response({'detail': 'Share ditolak oleh admin.'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'share': ContentShareSerializer(share).data,
            'caption': content.caption,
            'tracking_url': f'/api/v1/public/share/{share.tracking_code}/',
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


@extend_schema(tags=['volunteer-content'])
class VolunteerUpdateShareView(APIView):
    """Volunteer submits proof and/or updates view count for a share."""
    permission_classes = [IsVolunteer]

    def patch(self, request, pk):
        share = get_object_or_404(
            ContentShare, pk=pk, volunteer=request.user.team_member
        )
        if share.expires_at < timezone.now():
            return Response({'detail': 'Window update sudah expired (7 hari).'}, status=status.HTTP_400_BAD_REQUEST)

        if 'proof_url' in request.data:
            share.proof_url = request.data['proof_url']
        if 'proof_screenshot' in request.FILES:
            share.proof_screenshot = request.FILES['proof_screenshot']
        if 'view_count' in request.data:
            share.view_count = int(request.data['view_count'])
            share.last_updated_views_at = timezone.now()
        share.save()
        return Response(ContentShareSerializer(share).data)


@extend_schema(tags=['volunteer-content'])
class VolunteerMySharesView(APIView):
    """Volunteer: view own share history."""
    permission_classes = [IsVolunteer]

    def get(self, request):
        shares = ContentShare.objects.filter(
            volunteer=request.user.team_member
        ).select_related('content')
        return Response(ContentShareSerializer(shares, many=True).data)


@extend_schema(tags=['content'])
class AdminContentShareListView(APIView):
    """Admin: list all content shares for the tenant."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = ContentShare.objects.filter(
            content__tenant=request.user.tenant
        ).select_related('content', 'volunteer')
        status_filter = request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return Response(ContentShareSerializer(qs, many=True).data)


@extend_schema(tags=['content'])
class AdminVerifyShareView(APIView):
    """Admin: approve or reject a content share, calculate and award points."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        share = get_object_or_404(
            ContentShare, pk=pk, content__tenant=request.user.tenant
        )
        action = request.data.get('action', 'approve')

        if action == 'reject':
            share.status = 'rejected'
            share.save(update_fields=['status'])
            return Response(ContentShareSerializer(share).data)

        # Calculate points
        content = share.content
        if content.reward_per_100_views > 0 and share.view_count > 0:
            raw_points = math.floor(share.view_count / 100) * content.reward_per_100_views
            pts = min(raw_points, content.reward_max_cap) if content.reward_max_cap > 0 else raw_points
        else:
            pts = 0

        # Also add base share_content points from PointRule
        from apps.teams.points import award_points, award_custom_points
        base_txn = award_points(
            share.volunteer, 'share_content',
            description=f'Bagikan konten: {content.judul}',
            reference_id=share.pk, reference_type='content_share',
        )
        base_pts = base_txn.points if base_txn else 0

        if pts > 0:
            award_custom_points(
                share.volunteer, pts, 'share_content',
                description=f'Bonus views ({share.view_count} views): {content.judul}',
                reference_id=share.pk, reference_type='content_share_views',
            )

        share.points_earned = base_pts + pts
        share.status = 'approved'
        share.save(update_fields=['points_earned', 'status'])
        return Response(ContentShareSerializer(share).data)


@extend_schema(tags=['public'])
class PublicShareRedirectView(APIView):
    """Public: tracking redirect for content share links."""
    permission_classes = [AllowAny]

    def get(self, request, code):
        share = get_object_or_404(ContentShare, tracking_code=code)
        ContentShare.objects.filter(pk=share.pk).update(view_count=F('view_count') + 1)
        # Redirect to the content's creative file or a default URL
        redirect_url = '/'
        if share.content.creative and share.content.creative.file:
            redirect_url = share.content.creative.file.url
        from django.http import HttpResponseRedirect
        return HttpResponseRedirect(redirect_url)


# --------------- Article / Berita ---------------

@extend_schema(tags=['articles'])
class ArticleListCreateView(APIView):
    """Admin: list and create articles."""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        qs = Article.objects.filter(tenant=request.user.tenant)
        category = request.query_params.get('category')
        status_filter = request.query_params.get('status')
        if category:
            qs = qs.filter(category=category)
        if status_filter:
            qs = qs.filter(status=status_filter)
        return Response(ArticleSerializer(qs, many=True, context={'request': request}).data)

    def post(self, request):
        serializer = ArticleCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if request.data.get('status') == 'published':
            article = serializer.save(
                tenant=request.user.tenant, author=request.user, published_at=timezone.now()
            )
        else:
            article = serializer.save(tenant=request.user.tenant, author=request.user)
        return Response(ArticleSerializer(article, context={'request': request}).data, status=status.HTTP_201_CREATED)


@extend_schema(tags=['articles'])
class ArticleDetailView(APIView):
    """Admin: get, update, delete an article."""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def _get(self, request, pk):
        return get_object_or_404(Article, pk=pk, tenant=request.user.tenant)

    def get(self, request, pk):
        return Response(ArticleSerializer(self._get(request, pk), context={'request': request}).data)

    def patch(self, request, pk):
        article = self._get(request, pk)
        serializer = ArticleCreateSerializer(article, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        if request.data.get('status') == 'published' and article.status != 'published':
            article.published_at = timezone.now()
            article.save(update_fields=['published_at'])
        article = serializer.save()
        return Response(ArticleSerializer(article, context={'request': request}).data)

    def delete(self, request, pk):
        self._get(request, pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(tags=['public'])
class PublicArticleListView(APIView):
    """Public: list published articles for a candidate."""
    permission_classes = [AllowAny]

    def get(self, request, slug):
        from apps.accounts.models import Tenant
        tenant = get_object_or_404(Tenant, slug=slug)
        qs = Article.objects.filter(tenant=tenant, status='published')
        category = request.query_params.get('category')
        search = request.query_params.get('search')
        if category:
            qs = qs.filter(category=category)
        if search:
            qs = qs.filter(title__icontains=search)
        # Paginate: 12 per page
        page = int(request.query_params.get('page', 1))
        per_page = 12
        start = (page - 1) * per_page
        total = qs.count()
        articles = qs[start:start + per_page]
        return Response({
            'results': PublicArticleListSerializer(articles, many=True, context={'request': request}).data,
            'total': total,
            'page': page,
            'pages': math.ceil(total / per_page) if total > 0 else 1,
        })


@extend_schema(tags=['public'])
class PublicArticleDetailView(APIView):
    """Public: get a single article and increment view count."""
    permission_classes = [AllowAny]

    def get(self, request, slug, article_slug):
        from apps.accounts.models import Tenant
        tenant = get_object_or_404(Tenant, slug=slug)
        article = get_object_or_404(Article, tenant=tenant, slug=article_slug, status='published')
        Article.objects.filter(pk=article.pk).update(view_count=F('view_count') + 1)
        article.refresh_from_db()
        return Response(ArticleSerializer(article, context={'request': request}).data)
