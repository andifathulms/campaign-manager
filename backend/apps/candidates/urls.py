from django.urls import path
from .views import (
    MyCandidateView, MyCampaignPageView, PublishCampaignPageView,
    PublicCandidateView, PublicViewCountView,
)

urlpatterns = [
    path('candidates/me/', MyCandidateView.as_view(), name='candidate-me'),
    path('candidates/me/page/', MyCampaignPageView.as_view(), name='candidate-page'),
    path('candidates/me/publish/', PublishCampaignPageView.as_view(), name='candidate-publish'),
    path('public/<slug:slug>/', PublicCandidateView.as_view(), name='public-candidate'),
    path('public/<slug:slug>/view/', PublicViewCountView.as_view(), name='public-candidate-view'),
]
