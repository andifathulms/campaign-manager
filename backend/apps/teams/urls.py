from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TeamMemberViewSet,
    ReferralListView,
    LeaderboardView,
    PublicReferralClickView,
)

router = DefaultRouter()
router.register(r'teams/members', TeamMemberViewSet, basename='team-member')

urlpatterns = [
    path('', include(router.urls)),
    path('teams/referrals/', ReferralListView.as_view(), name='team-referrals'),
    path('teams/leaderboard/', LeaderboardView.as_view(), name='team-leaderboard'),
    path('public/ref/<str:code>/click/', PublicReferralClickView.as_view(), name='referral-click'),
]
