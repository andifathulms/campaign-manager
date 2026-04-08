from django.urls import path
from .views import (
    ContentItemListCreateView,
    ContentItemDetailView,
    AdCreativeListCreateView,
    AdCreativeDetailView,
    VolunteerDailyContentView,
    VolunteerShareContentView,
    VolunteerUpdateShareView,
    VolunteerMySharesView,
    AdminContentShareListView,
    AdminVerifyShareView,
    PublicShareRedirectView,
    ArticleListCreateView,
    ArticleDetailView,
    PublicArticleListView,
    PublicArticleDetailView,
)

urlpatterns = [
    path('content/calendar/', ContentItemListCreateView.as_view(), name='content-list'),
    path('content/calendar/<uuid:pk>/', ContentItemDetailView.as_view(), name='content-detail'),
    path('content/library/', AdCreativeListCreateView.as_view(), name='creative-list'),
    path('content/library/<uuid:pk>/', AdCreativeDetailView.as_view(), name='creative-detail'),
    # Volunteer daily content
    path('volunteer/content/daily/', VolunteerDailyContentView.as_view(), name='volunteer-daily-content'),
    path('volunteer/content/<uuid:pk>/share/', VolunteerShareContentView.as_view(), name='volunteer-share-content'),
    path('volunteer/content/shares/<uuid:pk>/', VolunteerUpdateShareView.as_view(), name='volunteer-update-share'),
    path('volunteer/content/shares/my/', VolunteerMySharesView.as_view(), name='volunteer-my-shares'),
    # Admin content shares
    path('content/shares/', AdminContentShareListView.as_view(), name='admin-content-shares'),
    path('content/shares/<uuid:pk>/verify/', AdminVerifyShareView.as_view(), name='admin-verify-share'),
    # Public tracking redirect
    path('public/share/<str:code>/', PublicShareRedirectView.as_view(), name='public-share-redirect'),
    # Articles / Berita
    path('content/articles/', ArticleListCreateView.as_view(), name='article-list'),
    path('content/articles/<uuid:pk>/', ArticleDetailView.as_view(), name='article-detail'),
    path('public/<slug:slug>/berita/', PublicArticleListView.as_view(), name='public-article-list'),
    path('public/<slug:slug>/berita/<slug:article_slug>/', PublicArticleDetailView.as_view(), name='public-article-detail'),
]
