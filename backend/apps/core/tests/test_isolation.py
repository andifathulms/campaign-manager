"""Multi-tenant isolation + RBAC + feature-flag tests.

These guard the most sensitive guarantee in KampanyeKit: one candidate's data
(voter PII, ads, team) must never leak to another — including across tenants
owned by the same consultant agency, except by an explicit, validated switch.
"""
import pytest
from django.db.models import Q
from django.urls import reverse
from rest_framework.test import APIClient, APIRequestFactory

from apps.accounts.models import Agency, Tenant, User
from apps.core.rbac import wilayah_filter, is_full_access, is_wilayah_scoped
from apps.core.tenancy import active_tenant, switchable_tenants
from apps.supporters.models import Supporter


# ── fixtures ────────────────────────────────────────────────────────────────

def make_tenant(slug, agency=None, feature_flags=None):
    return Tenant.objects.create(
        name=slug.title(), slug=slug, agency=agency, feature_flags=feature_flags or {}
    )


def make_user(username, tenant, role='candidate', agency=None, wilayah=None):
    return User.objects.create_user(
        username=username, password='pw12345678',
        tenant=tenant, agency=agency, role=role, wilayah=wilayah,
    )


def make_supporter(tenant, nama, kecamatan='Semarang Tengah'):
    return Supporter.objects.create(
        tenant=tenant, nama=nama, phone='08123456789',
        kelurahan='Pekunden', kecamatan=kecamatan,
        kabupaten_kota='Kota Semarang', provinsi='Jawa Tengah',
    )


@pytest.fixture
def api_client():
    return APIClient()


def rows(resp):
    """List rows from a response, handling DRF pagination ({results: [...]})."""
    data = resp.data
    if isinstance(data, dict) and 'results' in data:
        return data['results']
    return data


# ── tenant isolation via the API ────────────────────────────────────────────

@pytest.mark.django_db
class TestTenantIsolation:
    def test_supporter_list_only_returns_own_tenant(self, api_client):
        t_a, t_b = make_tenant('alpha'), make_tenant('beta')
        user_a = make_user('user_a', t_a)
        make_supporter(t_a, 'Andi A')
        make_supporter(t_b, 'Budi B')  # other tenant — must never appear

        api_client.force_authenticate(user=user_a)
        resp = api_client.get(reverse('supporter-list'))
        assert resp.status_code == 200
        names = {row['nama'] for row in rows(resp)}
        assert names == {'Andi A'}

    def test_supporter_detail_cross_tenant_is_404(self, api_client):
        t_a, t_b = make_tenant('gamma'), make_tenant('delta')
        user_a = make_user('user_a2', t_a)
        other = make_supporter(t_b, 'Other Tenant Supporter')

        api_client.force_authenticate(user=user_a)
        resp = api_client.get(reverse('supporter-detail', args=[other.id]))
        assert resp.status_code == 404


# ── consultant (agency) switching ───────────────────────────────────────────

@pytest.mark.django_db
class TestConsultantSwitch:
    def _setup(self):
        agency = Agency.objects.create(name='Konsultan X', slug='konsultan-x')
        t_a = make_tenant('cab-a', agency=agency)
        t_b = make_tenant('cab-b', agency=agency)
        consultant = make_user('consultant', t_a, role='consultant_admin', agency=agency)
        return agency, t_a, t_b, consultant

    def test_no_header_uses_home_tenant(self):
        _, t_a, _, consultant = self._setup()
        req = APIRequestFactory().get('/')
        req.user = consultant
        assert active_tenant(req) == t_a

    def test_valid_switch_within_agency(self):
        _, _, t_b, consultant = self._setup()
        req = APIRequestFactory().get('/', HTTP_X_TENANT_ID=str(t_b.id))
        req.user = consultant
        assert active_tenant(req) == t_b

    def test_switch_to_foreign_tenant_is_ignored(self):
        _, t_a, _, consultant = self._setup()
        outsider = make_tenant('rival', agency=Agency.objects.create(name='Rival', slug='rival-ag'))
        req = APIRequestFactory().get('/', HTTP_X_TENANT_ID=str(outsider.id))
        req.user = consultant
        # Falls back to home tenant — never crosses into another agency.
        assert active_tenant(req) == t_a

    def test_switchable_lists_agency_tenants_only(self):
        _, t_a, t_b, consultant = self._setup()
        make_tenant('rival2', agency=Agency.objects.create(name='Rival2', slug='rival2-ag'))
        switchable = set(switchable_tenants(consultant))
        assert switchable == {t_a, t_b}

    def test_supporter_list_respects_switch(self, api_client):
        _, t_a, t_b, consultant = self._setup()
        make_supporter(t_a, 'A Person')
        make_supporter(t_b, 'B Person')
        api_client.force_authenticate(user=consultant)

        resp_a = api_client.get(reverse('supporter-list'))
        assert {r['nama'] for r in rows(resp_a)} == {'A Person'}

        resp_b = api_client.get(reverse('supporter-list'), HTTP_X_TENANT_ID=str(t_b.id))
        assert {r['nama'] for r in rows(resp_b)} == {'B Person'}


# ── wilayah scoping ─────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestWilayahScoping:
    def test_full_access_role_is_not_narrowed(self):
        t = make_tenant('full')
        candidate = make_user('cand', t, role='candidate', wilayah='Semarang Tengah')
        assert is_full_access(candidate)
        assert wilayah_filter(candidate, fields=('kecamatan',)) == Q()

    def test_scoped_coordinator_is_narrowed(self, api_client):
        t = make_tenant('scoped')
        make_supporter(t, 'In Area', kecamatan='Semarang Tengah')
        make_supporter(t, 'Out Area', kecamatan='Demak Kota')
        korcam = make_user('korcam', t, role='koordinator_kecamatan', wilayah='Semarang Tengah')
        assert is_wilayah_scoped(korcam)

        api_client.force_authenticate(user=korcam)
        resp = api_client.get(reverse('supporter-list'))
        assert {r['nama'] for r in rows(resp)} == {'In Area'}

    def test_scoped_without_wilayah_is_noop(self):
        t = make_tenant('scoped2')
        korcam = make_user('korcam2', t, role='koordinator_kecamatan', wilayah=None)
        assert wilayah_filter(korcam, fields=('kecamatan',)) == Q()


# ── feature-flag enforcement ────────────────────────────────────────────────

@pytest.mark.django_db
class TestFeatureFlagEnforcement:
    def test_phase2_endpoint_blocked_by_default(self, api_client):
        t = make_tenant('noflags')  # feature_flags = {}
        user = make_user('u_noflag', t)
        api_client.force_authenticate(user=user)
        assert api_client.get(reverse('event-list')).status_code == 403

    def test_phase2_endpoint_allowed_when_enabled(self, api_client):
        t = make_tenant('withflags', feature_flags={'events': True})
        user = make_user('u_flag', t)
        api_client.force_authenticate(user=user)
        assert api_client.get(reverse('event-list')).status_code == 200
