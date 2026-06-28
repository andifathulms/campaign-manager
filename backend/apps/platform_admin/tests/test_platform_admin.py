"""Platform-admin API: role-gating, cross-tenant directory, and staff actions."""
import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.accounts.models import Agency, Tenant, User
from apps.candidates.models import Candidate, CampaignPage
from apps.platform_admin.models import PlatformAuditLog


# ── helpers ──────────────────────────────────────────────────────────────────

def make_candidate(slug, plan='starter'):
    agency = Agency.objects.create(name=slug.title(), slug=slug)
    tenant = Tenant.objects.create(name=slug.title(), slug=slug, agency=agency, plan=plan)
    user = User.objects.create_user(username=f'{slug}_user', password='pw12345678', tenant=tenant, agency=agency, role='candidate')
    candidate = Candidate.objects.create(tenant=tenant, user=user, nama_lengkap=slug.title(), status='published')
    CampaignPage.objects.create(candidate=candidate, is_published=True)
    return tenant, user


def make_staff(username, role):
    return User.objects.create_user(username=username, password='pw12345678', role=role,
                                    is_staff=(role == 'superadmin'), is_superuser=(role == 'superadmin'))


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def superadmin():
    return make_staff('super', 'superadmin')


@pytest.fixture
def admin():
    return make_staff('admin', 'admin')


# ── role gating ───────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestRoleGating:
    def test_unauthenticated_blocked(self, client):
        assert client.get(reverse('platform-overview')).status_code in (401, 403)

    def test_candidate_forbidden(self, client):
        _, candidate_user = make_candidate('cabup-a')
        client.force_authenticate(user=candidate_user)
        assert client.get(reverse('platform-overview')).status_code == 403
        assert client.get(reverse('platform-tenants')).status_code == 403

    def test_volunteer_forbidden(self, client):
        volunteer = User.objects.create_user(username='vol', password='pw12345678', role='volunteer')
        client.force_authenticate(user=volunteer)
        assert client.get(reverse('platform-tenants')).status_code == 403

    def test_admin_and_superadmin_allowed(self, client, admin, superadmin):
        client.force_authenticate(user=admin)
        assert client.get(reverse('platform-overview')).status_code == 200
        client.force_authenticate(user=superadmin)
        assert client.get(reverse('platform-overview')).status_code == 200

    def test_staff_management_is_superadmin_only(self, client, admin, superadmin):
        client.force_authenticate(user=admin)
        assert client.get(reverse('platform-admins')).status_code == 403
        client.force_authenticate(user=superadmin)
        assert client.get(reverse('platform-admins')).status_code == 200


# ── directory + overview (cross-tenant) ────────────────────────────────────────

@pytest.mark.django_db
class TestDirectory:
    def test_lists_all_tenants_regardless_of_tenant(self, client, superadmin):
        make_candidate('cabup-a')
        make_candidate('cabup-b')
        client.force_authenticate(user=superadmin)
        resp = client.get(reverse('platform-tenants'))
        assert resp.status_code == 200
        names = {r['slug'] for r in resp.data['results']}
        assert {'cabup-a', 'cabup-b'} <= names

    def test_search_filter(self, client, superadmin):
        make_candidate('semarang-satu')
        make_candidate('bandung-dua')
        client.force_authenticate(user=superadmin)
        resp = client.get(reverse('platform-tenants'), {'search': 'semarang'})
        slugs = {r['slug'] for r in resp.data['results']}
        assert 'semarang-satu' in slugs and 'bandung-dua' not in slugs

    def test_overview_counts(self, client, superadmin):
        make_candidate('cabup-a', plan='premium')
        client.force_authenticate(user=superadmin)
        data = client.get(reverse('platform-overview')).data
        assert data['total_campaigns'] >= 1
        assert data['by_plan']['premium'] >= 1


# ── mutating actions + audit ────────────────────────────────────────────────────

@pytest.mark.django_db
class TestActions:
    def test_suspend_and_pause(self, client, superadmin):
        tenant, _ = make_candidate('cabup-a')
        client.force_authenticate(user=superadmin)
        resp = client.patch(reverse('platform-tenant-detail', args=[tenant.id]),
                            {'is_active': False, 'candidate_status': 'paused'}, format='json')
        assert resp.status_code == 200
        tenant.refresh_from_db()
        tenant.candidate.refresh_from_db()
        assert tenant.is_active is False
        assert tenant.candidate.status == 'paused'
        assert PlatformAuditLog.objects.filter(action='suspend').exists()
        assert PlatformAuditLog.objects.filter(action='pause').exists()

    def test_provision_creates_loginable_candidate(self, client, superadmin):
        client.force_authenticate(user=superadmin)
        resp = client.post(reverse('platform-provision'), {
            'nama_lengkap': 'Budi Santoso', 'username': 'budi', 'tenant_name': 'Kampanye Budi',
            'tenant_slug': 'budi', 'plan': 'pro', 'jenis_pemilihan': 'pilkada_bupati',
        }, format='json')
        assert resp.status_code == 201
        assert resp.data['temp_password']
        user = User.objects.get(username='budi')
        assert user.role == 'candidate'
        assert user.check_password(resp.data['temp_password'])
        assert Candidate.objects.filter(tenant__slug='budi').exists()
        assert PlatformAuditLog.objects.filter(action='provision').exists()

    def test_provision_rejects_duplicate_slug(self, client, superadmin):
        make_candidate('dupe')
        client.force_authenticate(user=superadmin)
        resp = client.post(reverse('platform-provision'), {
            'nama_lengkap': 'X', 'username': 'xuser', 'tenant_name': 'X', 'tenant_slug': 'dupe',
            'plan': 'starter', 'jenis_pemilihan': 'pileg_dprd_kota',
        }, format='json')
        assert resp.status_code == 400

    def test_impersonate_returns_candidate_token(self, client, superadmin):
        tenant, candidate_user = make_candidate('cabup-a')
        client.force_authenticate(user=superadmin)
        resp = client.post(reverse('platform-impersonate', args=[tenant.id]))
        assert resp.status_code == 200
        assert resp.data['access'] and resp.data['refresh']
        assert resp.data['user']['username'] == candidate_user.username
        assert PlatformAuditLog.objects.filter(action='impersonate').exists()

    def test_candidate_cannot_impersonate(self, client):
        tenant, candidate_user = make_candidate('cabup-a')
        client.force_authenticate(user=candidate_user)
        assert client.post(reverse('platform-impersonate', args=[tenant.id])).status_code == 403

    def test_create_staff_user(self, client, superadmin):
        client.force_authenticate(user=superadmin)
        resp = client.post(reverse('platform-admins'),
                          {'username': 'ops1', 'role': 'admin', 'first_name': 'Ops'}, format='json')
        assert resp.status_code == 201
        assert User.objects.get(username='ops1').role == 'admin'
