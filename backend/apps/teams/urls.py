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
    PointRuleListView,
    PointRuleUpdateView,
    PointTransactionListView,
    VolunteerPointsView,
    VolunteerTaskPoolView,
    VolunteerTaskAssignView,
    VolunteerMyAssignmentsView,
    VolunteerTaskCompleteView,
    AdminTaskAssignmentApproveView,
    VolunteerOverviewView,
    PublicVolunteerStatsView,
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
    # Points & Rewards
    path('teams/points/rules/', PointRuleListView.as_view(), name='point-rules'),
    path('teams/points/rules/<str:action_type>/', PointRuleUpdateView.as_view(), name='point-rule-update'),
    path('teams/points/transactions/', PointTransactionListView.as_view(), name='point-transactions'),
    path('volunteer/points/my/', VolunteerPointsView.as_view(), name='volunteer-points'),
    # Volunteer task pool
    path('volunteer/tasks/pool/', VolunteerTaskPoolView.as_view(), name='volunteer-task-pool'),
    path('volunteer/tasks/<uuid:pk>/assign/', VolunteerTaskAssignView.as_view(), name='volunteer-task-assign'),
    path('volunteer/tasks/my/', VolunteerMyAssignmentsView.as_view(), name='volunteer-my-assignments'),
    path('volunteer/tasks/assignments/<uuid:pk>/complete/', VolunteerTaskCompleteView.as_view(), name='volunteer-task-complete'),
    path('teams/tasks/assignments/<uuid:pk>/approve/', AdminTaskAssignmentApproveView.as_view(), name='admin-task-approve'),
    # Volunteer overview
    path('volunteer/overview/', VolunteerOverviewView.as_view(), name='volunteer-overview'),
    # Public volunteer stats
    path('public/<slug:slug>/volunteer-stats/', PublicVolunteerStatsView.as_view(), name='public-volunteer-stats'),
]
