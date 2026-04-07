from django.urls import path
from .views import (
    AspirasiListView,
    AspirasiDetailView,
    PublicAspirasiSubmitView,
    PublicAspirasiRepliesView,
    PollListCreateView,
    PollDetailView,
    PublicPollVoteView,
)

urlpatterns = [
    path('engagement/aspirasi/', AspirasiListView.as_view(), name='aspirasi-list'),
    path('engagement/aspirasi/<uuid:pk>/', AspirasiDetailView.as_view(), name='aspirasi-detail'),
    path('engagement/polls/', PollListCreateView.as_view(), name='poll-list'),
    path('engagement/polls/<uuid:pk>/', PollDetailView.as_view(), name='poll-detail'),
    # Public endpoints
    path('public/<slug:slug>/aspirasi/', PublicAspirasiSubmitView.as_view(), name='public-aspirasi-submit'),
    path('public/<slug:slug>/aspirasi/replies/', PublicAspirasiRepliesView.as_view(), name='public-aspirasi-replies'),
    path('public/polls/<uuid:pk>/', PublicPollVoteView.as_view(), name='public-poll-vote'),
]
