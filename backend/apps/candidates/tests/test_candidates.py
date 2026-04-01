import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from apps.accounts.models import User, Tenant


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def tenant():
    return Tenant.objects.create(name='Test Candidate', slug='test-candidate')


@pytest.fixture
def user(tenant):
    return User.objects.create_user(
        username='testcandidate',
        password='testpass123',
        tenant=tenant,
        role='candidate'
    )


@pytest.mark.django_db
class TestCandidateProfile:
    def test_get_creates_candidate_on_first_access(self, api_client, user):
        api_client.force_authenticate(user=user)
        response = api_client.get(reverse('candidate-me'))
        assert response.status_code == 200
        assert response.data['nama_lengkap'] == user.username

    def test_update_candidate_profile(self, api_client, user):
        api_client.force_authenticate(user=user)
        response = api_client.put(reverse('candidate-me'), {
            'nama_lengkap': 'Budi Santoso',
            'tagline': 'Bersama Membangun Kota',
            'partai': 'Partai Maju',
        }, format='json')
        assert response.status_code == 200
        assert response.data['nama_lengkap'] == 'Budi Santoso'
        assert response.data['tagline'] == 'Bersama Membangun Kota'

    def test_unauthenticated_cannot_access(self, api_client):
        response = api_client.get(reverse('candidate-me'))
        assert response.status_code == 401

    def test_publish_campaign_page(self, api_client, user):
        api_client.force_authenticate(user=user)
        api_client.get(reverse('candidate-me'))  # create candidate
        response = api_client.post(reverse('candidate-publish'))
        assert response.status_code == 200
        assert response.data['is_published'] is True
