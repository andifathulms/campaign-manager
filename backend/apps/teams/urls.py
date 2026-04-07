from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TeamMemberViewSet,
    ReferralListView,
    LeaderboardView,
    PublicReferralClickView,
    TaskListCreateView,
    TaskDetailView,
    TaskStatsView,
    AnnouncementListCreateView,
    AnnouncementDetailView,
)

router = DefaultRouter()
router.register(r'teams/members', TeamMemberViewSet, basename='team-member')

urlpatterns = [
    path('', include(router.urls)),
    path('teams/referrals/', ReferralListView.as_view(), name='team-referrals'),
    path('teams/leaderboard/', LeaderboardView.as_view(), name='team-leaderboard'),
    path('teams/tasks/', TaskListCreateView.as_view(), name='task-list'),
    path('teams/tasks/stats/', TaskStatsView.as_view(), name='task-stats'),
    path('teams/tasks/<uuid:pk>/', TaskDetailView.as_view(), name='task-detail'),
    path('public/ref/<str:code>/click/', PublicReferralClickView.as_view(), name='referral-click'),
    path('teams/announcements/', AnnouncementListCreateView.as_view(), name='announcement-list'),
    path('teams/announcements/<uuid:pk>/', AnnouncementDetailView.as_view(), name='announcement-detail'),
]
