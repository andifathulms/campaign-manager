# CLAUDE.md — KampanyeKit Project Guide
# For Claude Code Agent

> This file is the single source of truth for how to build KampanyeKit.
> Read this fully before writing any code. Always refer back to this when making architectural decisions.

---

## Project Overview

**KampanyeKit** is a multi-tenant SaaS platform for Indonesian political campaign management.

Each tenant = one candidate (or one political consultant managing multiple candidates).

**Primary goal of the codebase:** Ship Phase 1 MVP first, then extend to Phase 2 and Phase 3 without major rewrites. Every architectural decision should support this.

---

## Monorepo Structure

```
kampanyekit/
├── backend/                  # Django + DRF API
│   ├── config/               # Django project settings
│   │   ├── settings/
│   │   │   ├── base.py
│   │   │   ├── development.py
│   │   │   └── production.py
│   │   ├── urls.py
│   │   ├── wsgi.py
│   │   └── asgi.py
│   ├── apps/
│   │   ├── accounts/         # User auth, roles, tenant management
│   │   ├── candidates/       # Candidate profiles, landing pages
│   │   ├── teams/            # Tim sukses, referral links
│   │   ├── supporters/       # Pendukung registration, membership cards
│   │   ├── ads/              # Ads dashboard, Meta/TikTok integrations
│   │   ├── content/          # Content calendar, ad creative library (Phase 2)
│   │   ├── analytics/        # Reports, heatmaps, sentiment (Phase 2-3)
│   │   ├── events/           # Campaign events, QR check-in (Phase 2)
│   │   ├── engagement/       # Polls, aspirasi inbox, pledge wall (Phase 2)
│   │   ├── compliance/       # KPU checklist, audit log (Phase 3)
│   │   ├── ai/               # AI features: chatbot, speech writer (Phase 3)
│   │   └── core/             # Shared utilities, base models
│   ├── requirements/
│   │   ├── base.txt
│   │   ├── development.txt
│   │   └── production.txt
│   ├── manage.py
│   └── Dockerfile
├── frontend/                 # Next.js 14 App Router
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/       # Login, register pages
│   │   │   ├── (dashboard)/  # Admin dashboard (candidate-facing)
│   │   │   ├── (public)/     # Public campaign pages
│   │   │   └── api/          # Next.js API routes (minimal, prefer Django)
│   │   ├── components/
│   │   │   ├── ui/           # Shadcn/ui base components
│   │   │   ├── dashboard/    # Dashboard-specific components
│   │   │   ├── campaign/     # Campaign page components
│   │   │   └── shared/       # Shared across contexts
│   │   ├── lib/
│   │   │   ├── api.ts        # API client (axios instance)
│   │   │   ├── auth.ts       # NextAuth config
│   │   │   └── utils.ts
│   │   ├── hooks/            # Custom React hooks
│   │   ├── stores/           # Zustand state stores
│   │   └── types/            # TypeScript types/interfaces
│   ├── public/
│   ├── package.json
│   ├── tailwind.config.ts
│   ├── next.config.ts
│   └── Dockerfile
├── mobile/                   # Flutter app (Phase 3 only — do not build yet)
├── docker-compose.yml
├── docker-compose.prod.yml
├── nginx/
│   ├── nginx.conf
│   └── conf.d/
│       └── default.conf
├── .github/
│   └── workflows/
│       ├── backend-ci.yml
│       └── frontend-ci.yml
├── PRD.md                    # Full product requirements
└── CLAUDE.md                 # This file
```

---

## Development Rules

### General
- **Always build Phase 1 first.** Do not implement Phase 2 or 3 features until explicitly instructed.
- **Never hardcode secrets.** Use environment variables via `.env` files. Provide `.env.example` with all required keys.
- **Write migrations every time** a model changes. Never edit existing migrations.
- **Use feature flags** (simple DB toggle) for Phase 2+ features so they can be enabled per tenant without deployment.

### Backend (Django)
- Django version: **5.x**
- DRF version: **3.15+**
- Use **class-based views** (APIView or ModelViewSet). No function-based views except for simple webhooks.
- Use **serializers for all input validation.** Never trust raw `request.data` directly.
- All API endpoints are prefixed with `/api/v1/`
- Use **drf-spectacular** for auto-generating OpenAPI schema and Swagger UI at `/api/docs/`
- Multi-tenancy: use a `Tenant` model linked to `Candidate`. All querysets must be filtered by tenant. Use a mixin `TenantQuerysetMixin` that auto-filters by `request.tenant`.
- Authentication: **JWT** via `djangorestframework-simplejwt`. Access token TTL: 15 minutes. Refresh token TTL: 7 days.
- File uploads go to **Google Cloud Storage** (or S3-compatible). Use `django-storages`.
- Background tasks: **Celery + Redis** for report generation, email sending, ads data sync.
- Caching: **Redis** for ads dashboard data (TTL: 30 minutes).
- Use `django-environ` for environment variable management.
- Every model must have: `created_at`, `updated_at` (auto), `id` as UUID primary key.

### Frontend (Next.js)
- Next.js version: **14** with **App Router**
- Use **TypeScript** everywhere. No `.js` files (except config files).
- Styling: **Tailwind CSS** + **shadcn/ui** for component library.
- State management: **Zustand** for global state, **React Query (TanStack Query)** for server state.
- API calls: use **axios** with an interceptor that attaches JWT and handles 401 refresh.
- Forms: **React Hook Form** + **Zod** for validation.
- Charts: **Recharts** for dashboards, **Leaflet** for maps.
- Authentication: **NextAuth.js** with JWT strategy, backed by Django JWT endpoint.
- All dashboard routes are under `/dashboard/` and require auth.
- All public campaign pages are under `/[slug]/` (candidate slug).
- Error boundaries on every page component.
- Loading states on all async operations.

### Database
- PostgreSQL 16
- All models use **UUID** as primary key
- Soft delete pattern: `is_deleted` + `deleted_at` fields on sensitive models
- Database backups: daily, retained 30 days
- Migrations must be reviewed before applying to production

### Docker & Deployment
- All services run in Docker containers
- Use `docker-compose.yml` for local development
- Use `docker-compose.prod.yml` for production (no volume mounts for code, use built images)
- GitHub Actions builds and pushes images to GHCR
- Backend container: Python 3.12 slim base
- Frontend container: Node 20 alpine, `output: standalone` for Next.js
- Nginx as reverse proxy: `/api/` → backend, everything else → frontend
- Backend runs with **Gunicorn** (4 workers) in production
- Celery runs as a separate container from the same backend image

---

## Environment Variables

### Backend `.env`
```
# Django
DJANGO_SECRET_KEY=
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=kampanyekit.id,www.kampanyekit.id
DJANGO_SETTINGS_MODULE=config.settings.production

# Database
DATABASE_URL=postgres://user:password@db:5432/kampanyekit

# Redis
REDIS_URL=redis://redis:6379/0

# Storage (GCS or S3-compatible)
GCS_BUCKET_NAME=
GCS_PROJECT_ID=
GOOGLE_APPLICATION_CREDENTIALS=/app/credentials/gcs-key.json

# JWT
JWT_ACCESS_TOKEN_LIFETIME_MINUTES=15
JWT_REFRESH_TOKEN_LIFETIME_DAYS=7

# Meta Ads API
META_APP_ID=
META_APP_SECRET=

# TikTok Ads API
TIKTOK_APP_ID=
TIKTOK_APP_SECRET=

# Anthropic API (Phase 3)
ANTHROPIC_API_KEY=

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=

# Midtrans (Phase 3)
MIDTRANS_SERVER_KEY=
MIDTRANS_CLIENT_KEY=

# WhatsApp Business API (Phase 3)
WATI_API_KEY=
WATI_API_ENDPOINT=
```

### Frontend `.env.local`
```
NEXT_PUBLIC_API_URL=https://kampanyekit.id/api/v1
NEXT_PUBLIC_APP_URL=https://kampanyekit.id
NEXTAUTH_URL=https://kampanyekit.id
NEXTAUTH_SECRET=

# Meta OAuth (for ads connection)
NEXT_PUBLIC_META_APP_ID=

# TikTok OAuth
NEXT_PUBLIC_TIKTOK_APP_ID=
```

---

## Database Schema (Core Models)

### Tenant & Accounts App
```python
# accounts/models.py

class Tenant(BaseModel):
    name = CharField(max_length=200)
    slug = SlugField(unique=True)           # used for subdomain
    custom_domain = CharField(null=True)    # optional custom domain
    plan = CharField(choices=['starter','pro','premium','enterprise'])
    is_active = BooleanField(default=True)
    feature_flags = JSONField(default=dict)  # for phase 2/3 features

class User(AbstractUser):
    id = UUIDField(primary_key=True)
    tenant = ForeignKey(Tenant, null=True)  # null for platform admin
    role = CharField(choices=['platform_admin','candidate','koordinator_wilayah',
                               'koordinator_kecamatan','koordinator_kelurahan','relawan'])
    phone = CharField(null=True)
    wilayah = CharField(null=True)          # for team members
    referral_code = CharField(unique=True)  # auto-generated
    referral_clicks = IntegerField(default=0)
```

### Candidates App
```python
# candidates/models.py

class Candidate(BaseModel):
    tenant = OneToOneField(Tenant)
    user = OneToOneField(User)
    nama_lengkap = CharField(max_length=200)
    foto = ImageField()
    nomor_urut = IntegerField(null=True)
    jenis_pemilihan = CharField(choices=['pileg_dpr','pileg_dprd_provinsi',
                                          'pileg_dprd_kota','pilkada_bupati',
                                          'pilkada_walikota','pilkada_gubernur'])
    dapil = CharField(max_length=200)
    partai = CharField(max_length=200)
    tagline = CharField(max_length=300)
    visi = TextField()
    misi = TextField()                       # store as JSON array
    program_unggulan = JSONField(default=list)  # list of {title, desc, icon}
    sosmed = JSONField(default=dict)         # {instagram, tiktok, facebook, twitter, youtube}
    status = CharField(choices=['draft','published','paused'], default='draft')
    color_primary = CharField(default='#1E40AF')  # for branding
    color_secondary = CharField(default='#FFFFFF')

class CampaignPage(BaseModel):
    candidate = OneToOneField(Candidate)
    hero_image = ImageField(null=True)
    hero_video_url = CharField(null=True)
    sections_order = JSONField(default=list)  # ordered list of visible sections
    seo_title = CharField(null=True)
    seo_description = TextField(null=True)
    og_image = ImageField(null=True)
    is_published = BooleanField(default=False)
    published_at = DateTimeField(null=True)
    view_count = IntegerField(default=0)
```

### Teams App
```python
# teams/models.py

class TeamMember(BaseModel):
    tenant = ForeignKey(Tenant)
    user = OneToOneField(User)
    parent = ForeignKey('self', null=True)     # for hierarchy
    level = IntegerField()                     # 1=korwil, 2=korcam, 3=korkel, 4=relawan
    nama = CharField(max_length=200)
    phone = CharField(max_length=20)
    wilayah_name = CharField(max_length=200)
    wilayah_level = CharField(choices=['provinsi','kabupaten','kecamatan','kelurahan'])
    is_active = BooleanField(default=True)

class ReferralLink(BaseModel):
    team_member = ForeignKey(TeamMember)
    code = CharField(unique=True)
    clicks = IntegerField(default=0)
    unique_visitors = IntegerField(default=0)
    last_clicked_at = DateTimeField(null=True)

class ReferralClick(BaseModel):
    referral_link = ForeignKey(ReferralLink)
    ip_hash = CharField()                      # hashed for privacy
    user_agent = TextField()
    clicked_at = DateTimeField(auto_now_add=True)
```

### Supporters App
```python
# supporters/models.py

class Supporter(BaseModel):
    tenant = ForeignKey(Tenant)
    nama = CharField(max_length=200)
    phone = CharField(max_length=20)
    email = CharField(null=True)
    foto = ImageField(null=True)
    kelurahan = CharField(max_length=200)
    kecamatan = CharField(max_length=200)
    kabupaten_kota = CharField(max_length=200)
    provinsi = CharField(max_length=200)
    referred_by_team = ForeignKey(TeamMember, null=True)
    referred_by_supporter = ForeignKey('self', null=True)  # Phase 2
    membership_id = CharField(unique=True)     # auto-generated
    statement = CharField(max_length=100, null=True)  # pledge wall
    is_verified = BooleanField(default=False)
    is_active = BooleanField(default=True)
```

### Ads App
```python
# ads/models.py

class AdsAccount(BaseModel):
    tenant = ForeignKey(Tenant)
    platform = CharField(choices=['meta','tiktok','google'])
    account_id = CharField()
    account_name = CharField()
    access_token_encrypted = TextField()       # encrypted with Fernet
    refresh_token_encrypted = TextField(null=True)
    token_expires_at = DateTimeField(null=True)
    is_active = BooleanField(default=True)
    last_synced_at = DateTimeField(null=True)

class AdsCampaignSnapshot(BaseModel):
    tenant = ForeignKey(Tenant)
    ads_account = ForeignKey(AdsAccount)
    platform = CharField()
    campaign_id = CharField()
    campaign_name = CharField()
    status = CharField()
    reach = BigIntegerField(default=0)
    impressions = BigIntegerField(default=0)
    clicks = IntegerField(default=0)
    spend = DecimalField(max_digits=14, decimal_places=2, default=0)
    cpm = DecimalField(max_digits=10, decimal_places=4, null=True)
    ctr = DecimalField(max_digits=6, decimal_places=4, null=True)
    snapshot_date = DateField()                # daily snapshot
    raw_data = JSONField(default=dict)

class BudgetAllocation(BaseModel):
    tenant = ForeignKey(Tenant)
    total_budget = DecimalField(max_digits=16, decimal_places=2)
    allocations = JSONField(default=dict)      # {meta: X, tiktok: Y, google: Z}
    period_start = DateField()
    period_end = DateField()
    alert_threshold_pct = IntegerField(default=80)
```

---

## API Endpoint Reference

### Authentication
```
POST   /api/v1/auth/login/          # returns access + refresh tokens
POST   /api/v1/auth/refresh/        # refresh access token
POST   /api/v1/auth/logout/
POST   /api/v1/auth/register/       # platform admin only
```

### Candidates
```
GET    /api/v1/candidates/me/              # current tenant's candidate
PUT    /api/v1/candidates/me/             # update candidate profile
GET    /api/v1/candidates/me/page/        # get campaign page config
PUT    /api/v1/candidates/me/page/        # update campaign page
POST   /api/v1/candidates/me/publish/     # publish campaign page
GET    /api/v1/public/{slug}/             # public: get candidate page data (no auth)
POST   /api/v1/public/{slug}/view/        # public: increment view count
```

### Teams
```
GET    /api/v1/teams/members/
POST   /api/v1/teams/members/
GET    /api/v1/teams/members/{id}/
PUT    /api/v1/teams/members/{id}/
DELETE /api/v1/teams/members/{id}/
POST   /api/v1/teams/members/invite/      # send invite link
GET    /api/v1/teams/referrals/           # all referral links + stats
GET    /api/v1/teams/leaderboard/         # ranked by referral clicks
POST   /api/v1/public/ref/{code}/click/   # public: track referral click (no auth)
```

### Supporters
```
GET    /api/v1/supporters/
POST   /api/v1/public/{slug}/join/        # public: supporter registration
GET    /api/v1/supporters/{id}/card/      # get membership card data
GET    /api/v1/supporters/export/         # CSV/Excel export
GET    /api/v1/supporters/stats/          # count by wilayah
```

### Ads
```
GET    /api/v1/ads/accounts/
POST   /api/v1/ads/accounts/connect/meta/
POST   /api/v1/ads/accounts/connect/tiktok/
DELETE /api/v1/ads/accounts/{id}/
POST   /api/v1/ads/accounts/{id}/sync/   # trigger manual data sync
GET    /api/v1/ads/dashboard/            # aggregated dashboard data
GET    /api/v1/ads/campaigns/            # all campaigns across platforms
GET    /api/v1/ads/budget/               # budget allocation
PUT    /api/v1/ads/budget/               # update budget allocation
```

### Dashboard
```
GET    /api/v1/dashboard/overview/       # summary cards
GET    /api/v1/dashboard/activity/       # recent activity feed
GET    /api/v1/dashboard/report/weekly/  # latest weekly report
POST   /api/v1/dashboard/report/generate/ # trigger manual report generation
```

---

## Frontend Route Structure

```
/                           → Marketing landing page (KampanyeKit homepage)
/login                      → Login page
/register                   → Register (invite only or platform admin)

/dashboard                  → Redirect to /dashboard/overview
/dashboard/overview         → Campaign overview + summary cards
/dashboard/profile          → Candidate profile editor
/dashboard/page             → Campaign page builder/preview
/dashboard/ads              → Unified ads dashboard
/dashboard/ads/connect      → Connect Meta/TikTok accounts
/dashboard/ads/budget       → Budget allocation
/dashboard/team             → Tim sukses management
/dashboard/team/invite      → Invite new member
/dashboard/supporters       → Supporter list + stats
/dashboard/supporters/map   → Supporter map (Phase 2)
/dashboard/content          → Content calendar (Phase 2)
/dashboard/content/library  → Ad creative library (Phase 2)
/dashboard/analytics        → Advanced analytics (Phase 2)
/dashboard/polls            → Mini surveys (Phase 2)
/dashboard/aspirasi         → Aspirasi inbox (Phase 2)
/dashboard/events           → Campaign events (Phase 2)
/dashboard/ai/chatbot       → AI chatbot config (Phase 3)
/dashboard/ai/speech        → AI speech writer (Phase 3)
/dashboard/compliance       → KPU checklist + audit log (Phase 3)
/dashboard/settings         → Tenant settings, billing, integrations

/[slug]                     → Public candidate campaign page
/[slug]/join                → Supporter registration form (embedded in [slug])
/[slug]/aspirasi            → Voter aspirasi form
```

---

## Phase 1 Build Order

Build in this exact order. Complete and test each step before moving to the next.

```
Step 1: Project scaffold
  - Django project setup with apps structure
  - Next.js setup with Tailwind + shadcn/ui
  - Docker Compose with postgres + redis
  - GitHub Actions CI skeleton

Step 2: Auth system
  - Django: User model, Tenant model, JWT auth endpoints
  - Frontend: Login page, NextAuth, protected route middleware
  - Test: login → get token → access protected route

Step 3: Candidate profile CRUD
  - Django: Candidate model, CampaignPage model, serializers, viewsets
  - Frontend: /dashboard/profile editor form
  - File upload to GCS

Step 4: Public campaign page
  - Django: public GET /api/v1/public/{slug}/ endpoint
  - Frontend: /[slug] page with all sections
  - Mobile responsive, SEO meta tags

Step 5: Tim Sukses module
  - Django: TeamMember, ReferralLink, ReferralClick models
  - Frontend: /dashboard/team management page
  - Public referral click tracking endpoint

Step 6: Supporter registration
  - Django: Supporter model, public join endpoint
  - Frontend: supporter form on /[slug] page
  - Membership card data endpoint

Step 7: Meta Ads integration
  - Django: AdsAccount model, Meta OAuth flow
  - Celery task: sync Meta campaign data every 30 min
  - Frontend: connect Meta account UI, ads dashboard

Step 8: TikTok Ads integration
  - Same pattern as Meta
  - Add TikTok to unified dashboard

Step 9: Budget tracker
  - Django: BudgetAllocation model
  - Frontend: budget allocation UI with spend vs. budget chart

Step 10: Dashboard overview
  - Aggregate all data into overview endpoint
  - Frontend: summary cards, activity feed, charts

Step 11: Weekly report
  - Celery beat task: every Monday, generate PDF, email to candidate
  - Manual trigger endpoint

Step 12: Deployment
  - docker-compose.prod.yml
  - Nginx config
  - GitHub Actions deploy workflow
```

---

## Coding Conventions

### Python / Django
```python
# Models: always use BaseModel for UUID, timestamps
class BaseModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        abstract = True

# ViewSets: always inherit TenantMixin
class MyViewSet(TenantQuerysetMixin, viewsets.ModelViewSet):
    ...

# Mixin: auto-filter by tenant
class TenantQuerysetMixin:
    def get_queryset(self):
        return super().get_queryset().filter(tenant=self.request.user.tenant)

# Serializers: explicit fields, never Meta fields = '__all__'
class CandidateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Candidate
        fields = ['id', 'nama_lengkap', 'foto', 'tagline', ...]
```

### TypeScript / React
```typescript
// Always type API responses
interface Candidate {
  id: string;
  nama_lengkap: string;
  foto: string | null;
  tagline: string;
  status: 'draft' | 'published' | 'paused';
}

// Use React Query for all server state
const { data: candidate, isLoading } = useQuery({
  queryKey: ['candidate'],
  queryFn: () => api.get<Candidate>('/candidates/me/').then(r => r.data),
});

// Always handle loading and error states
if (isLoading) return <DashboardSkeleton />;
if (error) return <ErrorState message={error.message} />;
```

---

## Testing Requirements

### Backend
- Unit tests for all serializers (valid and invalid inputs)
- Integration tests for all API endpoints
- Use `pytest-django` and `factory_boy` for test factories
- Test multi-tenant isolation: tenant A cannot see tenant B's data
- Target: 80% coverage on `apps/` directory

### Frontend
- Unit tests for utility functions
- Component tests for forms (React Testing Library)
- E2E tests for critical flows: login, profile edit, supporter registration

---

## Security Checklist (apply to every PR)

- [ ] No secrets in code or git history
- [ ] All querysets filtered by tenant
- [ ] User input validated via serializer (backend) or Zod (frontend)
- [ ] File upload: validate type and size before storing
- [ ] Public endpoints: rate limited (Django Ratelimit)
- [ ] Sensitive data: encrypted at rest (tokens use Fernet encryption)
- [ ] CORS: only allow configured origins

---

## Known Gotchas & Notes

1. **Meta Ads API rate limits:** The Marketing API has hourly call limits. Use Celery to sync in background and cache results in Redis. Never call Meta API on a user request.

2. **TikTok Ads API sandbox:** Use sandbox credentials during development. Production credentials require TikTok business verification.

3. **Multi-tenancy:** Every database query in a view MUST be filtered by `request.user.tenant`. Forgetting this is a data leak. The `TenantQuerysetMixin` handles this for ViewSets — always use it.

4. **Subdomain routing:** In development, use `localhost:3000/preview/{slug}` instead of subdomains. In production, Nginx handles `{slug}.kampanyekit.id` routing.

5. **GCS credentials:** In Docker, mount the service account JSON at `/app/credentials/gcs-key.json`. Never bake credentials into the image.

6. **Celery workers:** The backend Dockerfile has an `ENTRYPOINT` that accepts a `CMD` argument. Use `CMD ["celery", "-A", "config", "worker"]` in docker-compose for the worker container.

7. **Indonesia GeoJSON:** Use `indonesia-geojson` from GitHub (kalimdor-level boundaries). Store in `/frontend/public/geo/` and load lazily (large file).

8. **Phase 2/3 features:** These are disabled by default via `feature_flags` on the `Tenant` model. Check `tenant.feature_flags.get('phase2_enabled', False)` before rendering Phase 2 UI. This allows enabling per-tenant without deployment.

9. **Referral click tracking:** Hash the visitor IP with `hashlib.sha256(ip + date.today().isoformat())` before storing. Do not store raw IPs for privacy compliance (UU PDP).

10. **WhatsApp number format:** Indonesian numbers in database should be stored in format `62XXXXXXXXXX` (without + or leading 0). Validate and normalize on input.

---

## Commands Reference

```bash
# Backend
cd backend
python manage.py runserver
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
celery -A config worker --loglevel=info
celery -A config beat --loglevel=info

# Frontend
cd frontend
npm run dev
npm run build
npm run lint

# Docker (development)
docker-compose up -d
docker-compose logs -f backend
docker-compose exec backend python manage.py migrate

# Docker (production build)
docker-compose -f docker-compose.prod.yml up -d --build

# Run tests
cd backend && pytest
cd frontend && npm test
```

---

## Phase Unlock Checklist

Before starting Phase 2, confirm:
- [ ] At least 3 paying candidates live on Phase 1
- [ ] Supporter registration flow working end-to-end
- [ ] Meta + TikTok ads data syncing reliably
- [ ] Weekly reports being sent automatically
- [ ] No critical bugs open

Before starting Phase 3, confirm:
- [ ] Phase 2 fully deployed and stable
- [ ] At least 10 paying candidates
- [ ] AI API integration tested in staging
- [ ] Compliance team reviewed KPU checklist content
