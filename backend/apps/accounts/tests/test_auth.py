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
    u = User.objects.create_user(
        username='testcandidate',
        email='test@example.com',
        password='testpass123',
        tenant=tenant,
        role='candidate'
    )
    return u


@pytest.mark.django_db
class TestLogin:
    def test_login_success(self, api_client, user):
        response = api_client.post(reverse('auth-login'), {
            'username': 'testcandidate',
            'password': 'testpass123',
        })
        assert response.status_code == 200
        assert 'access' in response.data
        assert 'refresh' in response.data
        assert response.data['user']['username'] == 'testcandidate'

    def test_login_invalid_credentials(self, api_client):
        response = api_client.post(reverse('auth-login'), {
            'username': 'nobody',
            'password': 'wrongpass',
        })
        assert response.status_code == 400

    def test_me_authenticated(self, api_client, user):
        api_client.force_authenticate(user=user)
        response = api_client.get(reverse('auth-me'))
        assert response.status_code == 200
        assert response.data['username'] == 'testcandidate'

    def test_me_unauthenticated(self, api_client):
        response = api_client.get(reverse('auth-me'))
        assert response.status_code == 401


@pytest.mark.django_db
class TestLoginByPhone:
    def test_login_with_phone_number(self, api_client, tenant):
        User.objects.create_user(
            username='relawan_x', password='kampanye123', tenant=tenant,
            role='volunteer', phone='628111222333',
        )
        # Relawan logs in with their phone (entered as 0811...) + password.
        response = api_client.post(reverse('auth-login'), {
            'username': '08111222333',
            'password': 'kampanye123',
        })
        assert response.status_code == 200
        assert response.data['user']['username'] == 'relawan_x'

    def test_registration_endpoint_removed(self, api_client):
        # Self-registration is disabled — accounts are provisioned by admin.
        from django.urls import NoReverseMatch
        with pytest.raises(NoReverseMatch):
            reverse('auth-register')
