"""Relawan self-registration + approval-queue tests."""
import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.accounts.models import Tenant, User
from apps.teams.models import TeamMember


def make_tenant(slug, auto=False):
    return Tenant.objects.create(name=slug.title(), slug=slug, relawan_auto_approve=auto)


def make_admin(tenant):
    return User.objects.create_user(username=f'admin_{tenant.slug}', password='pw12345678',
                                    tenant=tenant, role='candidate')


@pytest.fixture
def api_client():
    return APIClient()


def register(api_client, slug, phone='081200000001', nama='Siti'):
    return api_client.post(
        reverse('public-relawan-register', args=[slug]),
        {'nama': nama, 'phone': phone, 'email': 's@e.com',
         'kelurahan': 'Pekunden', 'kecamatan': 'Semarang Tengah', 'kabupaten_kota': 'Kota Semarang'},
        format='json',
    )


@pytest.mark.django_db
class TestRelawanRegistration:
    def test_register_requires_approval_by_default(self, api_client):
        t = make_tenant('alpha')  # auto_approve = False
        resp = register(api_client, 'alpha')
        assert resp.status_code == 201
        assert resp.data['status'] == 'pending'
        member = TeamMember.objects.get(tenant=t)
        assert member.status == 'pending'
        assert member.is_active is False
        assert member.level == 4
        assert member.user.role == 'volunteer'
        assert member.user.is_active is False  # cannot log in until approved

    def test_register_auto_approve_activates(self, api_client):
        make_tenant('beta', auto=True)
        resp = register(api_client, 'beta')
        assert resp.status_code == 201
        assert resp.data['status'] == 'active'
        member = TeamMember.objects.get(tenant__slug='beta')
        assert member.is_active is True
        assert member.user.is_active is True

    def test_duplicate_phone_blocked(self, api_client):
        make_tenant('gamma')
        register(api_client, 'gamma', phone='081255556666')
        dup = register(api_client, 'gamma', phone='081255556666', nama='Lain')
        assert dup.status_code == 409

    def test_registration_is_tenant_scoped(self, api_client):
        make_tenant('one')
        make_tenant('two')
        register(api_client, 'one', phone='081277778888')
        # same phone can register under a different candidate
        resp = register(api_client, 'two', phone='081277778888')
        assert resp.status_code == 201


@pytest.mark.django_db
class TestApprovalQueue:
    def test_approve_activates_and_clears_queue(self, api_client):
        t = make_tenant('delta')
        admin = make_admin(t)
        register(api_client, 'delta')
        member = TeamMember.objects.get(tenant=t)

        api_client.force_authenticate(user=admin)
        assert len(api_client.get(reverse('relawan-requests')).data) == 1

        resp = api_client.post(reverse('relawan-approve', args=[member.id]))
        assert resp.status_code == 200
        member.refresh_from_db()
        assert member.status == 'active' and member.is_active
        assert member.user.is_active
        assert len(api_client.get(reverse('relawan-requests')).data) == 0

    def test_reject_sets_reason_and_disables_login(self, api_client):
        t = make_tenant('epsilon')
        admin = make_admin(t)
        register(api_client, 'epsilon')
        member = TeamMember.objects.get(tenant=t)

        api_client.force_authenticate(user=admin)
        resp = api_client.post(reverse('relawan-reject', args=[member.id]),
                               {'rejection_reason': 'Data tidak lengkap'}, format='json')
        assert resp.status_code == 200
        member.refresh_from_db()
        assert member.status == 'rejected'
        assert member.rejection_reason == 'Data tidak lengkap'
        assert member.user.is_active is False

    def test_queue_blocked_for_relawan_role(self, api_client):
        t = make_tenant('zeta')
        relawan = User.objects.create_user(username='r1', password='pw12345678', tenant=t, role='volunteer')
        api_client.force_authenticate(user=relawan)
        assert api_client.get(reverse('relawan-requests')).status_code == 403
