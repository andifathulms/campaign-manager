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
class TestRegister:
    def test_register_creates_tenant_and_user(self, api_client):
        response = api_client.post(reverse('auth-register'), {
            'username': 'newcandidate',
            'email': 'new@example.com',
            'password': 'securepass123',
            'first_name': 'Budi',
            'last_name': 'Santoso',
            'tenant_name': 'Budi for Mayor',
            'tenant_slug': 'budi-for-mayor',
        })
        assert response.status_code == 201
        assert Tenant.objects.filter(slug='budi-for-mayor').exists()
        assert User.objects.filter(username='newcandidate').exists()

    def test_register_duplicate_slug(self, api_client, tenant):
        response = api_client.post(reverse('auth-register'), {
            'username': 'another',
            'email': 'another@example.com',
            'password': 'securepass123',
            'tenant_name': 'Another',
            'tenant_slug': 'test-candidate',  # already taken
        })
        assert response.status_code == 400
