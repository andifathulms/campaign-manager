# Product Requirements Document — KampanyeKit

**Version:** 2.0 (Consolidated)
**Last Updated:** 2026-06-25
**Status:** Active Development
**Target Market:** Indonesia — Caleg (DPRD/DPR), Calon Bupati/Walikota, Calon Gubernur

> **This is the single canonical PRD for KampanyeKit.** It supersedes and merges the four prior documents:
> `PRD.md` (master), `Alternatif PRD.md`, `PRD_WebProfile_KampanyeKit.md`, and `PRD_WebTimses_KampanyeKit.md`.
> Those documents are archived under `docs/archive/` and must not be used for new work.

---

## Table of Contents

1. [Document Control](#1-document-control)
2. [Executive Summary](#2-executive-summary)
3. [Problem & Market](#3-problem--market)
4. [Personas & Roles](#4-personas--roles)
5. [Product Architecture](#5-product-architecture)
6. [Information Architecture](#6-information-architecture)
7. [Surface A — Public Web Profile](#7-surface-a--public-web-profile)
8. [Surface B — Relawan Portal](#8-surface-b--relawan-portal)
9. [Surface C — Web Timses (Command Center)](#9-surface-c--web-timses-command-center)
10. [Cross-Cutting Features](#10-cross-cutting-features)
11. [v1 Scope (MoSCoW)](#11-v1-scope-moscow)
12. [Phasing](#12-phasing)
13. [Non-Functional Requirements](#13-non-functional-requirements)
14. [Tech Stack](#14-tech-stack)
15. [Integrations & Dependencies](#15-integrations--dependencies)
16. [Business Model](#16-business-model)
17. [Success Metrics](#17-success-metrics)
18. [Resolved Contradictions (Decision Record)](#18-resolved-contradictions-decision-record)
19. [Open Questions](#19-open-questions)

**Phase tags used throughout:** `[v1]` = MUST ship first · `[FF]` = fast-follow after v1 · `[P2]` = Phase 2 · `[P3]` = Phase 3.

---

## 1. Document Control

| Field | Value |
|---|---|
| Document owner | Product |
| Supersedes | `PRD.md`, `Alternatif PRD.md`, `PRD_WebProfile_KampanyeKit.md`, `PRD_WebTimses_KampanyeKit.md` |
| Audience | Product, Engineering, Design, Campaign Ops |
| Build rule | Ship **v1 spine** first. Phase 2/3 features stay behind `Tenant.feature_flags` and are not built until v1 is live. |

### Changelog from source docs
- **Merged** the master platform vision, the Web Profile module, and the Web Timses command-center module into one surface-organized spec.
- **Architecture decided:** three role-split surfaces (public / relawan / team), not segment-split products.
- **Account model decided:** `Agency`-above-`Tenant` (consultant-manages-many + direct candidate, one code path).
- **ICP decided:** Cabup/Cawalkot.
- **Ads v1 decided:** full control (pause/resume, edit budget, duplicate) with mandatory guardrails (§18).
- **Deferred to later phases:** LLM-powered insights (P3), conversion/UTM attribution, voter-population coverage, donations, mobile app.
- **Cut from v1:** view-count-based content reward points (replaced with credit-on-share + spot audit).
- **Team portal URL standardized** to `app.kampanyekit.id` (central, candidate-switcher), resolving the per-slug ambiguity.

---

## 2. Executive Summary

**KampanyeKit** is a multi-tenant SaaS platform that lets Indonesian political candidates — and the consultants who serve them — run an entire campaign digitally from one place: a public candidate website, a mobilized volunteer (relawan) network, unified paid-ads management, and supporter data with geographic intelligence.

**Core value proposition:** Replace expensive, untrackable offline campaign spending (baliho, physical materials, WhatsApp-group chaos, scattered Excel sheets) with a single, measurable digital campaign command center.

Each tenant = one candidate's campaign. An **Agency** account can own many tenants, so a political consultant manages a whole roster from one login.

---

## 3. Problem & Market

### 3.1 The three inefficiencies
1. **Untrackable spending** — Baliho and physical materials cost Rp 5–10 juta each with zero viewership data.
2. **Fragmented team coordination** — Tim sukses run over WhatsApp groups with no accountability or tracking.
3. **No digital infrastructure** — Most candidates lack a proper digital presence or unified ads management.

### 3.2 Market segments are customer *sizes*, not different products
Same job-to-be-done (win the seat, mobilize people, measure spend) at three intensities. **One tiered product** handled via plan + `feature_flags` + hierarchy depth — *not* separate portals or separate builds.

| Segment | Role in GTM | Budget / tier | Why they buy |
|---|---|---|---|
| Caleg (DPRD/DPR) | Volume / logos | Rp 2–20 juta | Cheap legitimate presence + small relawan network. Thin ad-spend revenue. |
| **Cabup / Cawalkot** | **ICP — design here** | Rp 30–75 juta | Ad ROI + geographic coordination + real tim-sukses hierarchy + surveys. Pays for the ads value prop. |
| Cagub / Consultants | Enterprise / white-label | Custom | Scale, multi-region rollup, war-room, compliance. |

**ICP = Cabup/Cawalkot.** Design and sequence the build around them; caleg is the self-serve volume layer; cagub + consultants are the enterprise wedge reached through the agency account model.

---

## 4. Personas & Roles

| Persona | Surface(s) | Auth | Description |
|---|---|---|---|
| Public voter / supporter | Public Web Profile | None | Browses candidate page, registers as supporter, sends aspirasi |
| Relawan (volunteer) | Relawan Portal | WhatsApp OTP (primary), email+password (secondary) | Takes tasks, shares content, recruits supporters, earns points |
| Kandidat | Web Timses | JWT | Read-only view of all dashboards |
| Koordinator Utama | Web Timses | JWT | Head of Tim Sukses — full access |
| Koordinator Wilayah | Web Timses | JWT | Scoped to their wilayah subtree |
| Koordinator Kecamatan | Web Timses | JWT | Scoped to their kecamatan |
| Staf Ads | Web Timses | JWT | Kampanye Digital only (incl. ad write-control) |
| Staf Admin | Web Timses | JWT | Relawan + Pendukung management |
| Konsultan (Agency admin) | Web Timses | JWT | Manages multiple candidate tenants via candidate-switcher |
| Platform Admin | Platform console | JWT | Multi-tenant operator (KampanyeKit staff) |

> **Scope Rule (RBAC):** Coordinators see and manage data only within their assigned wilayah hierarchy. A Koordinator Wilayah in Semarang cannot see Demak. This wilayah-scoped access control is **v1 core**, not polish.

---

## 5. Product Architecture

### 5.1 Three surfaces, split by role

| Surface | Users | URL |
|---|---|---|
| **A — Public Web Profile** | voters / supporters | `[slug].kampanyekit.id` |
| **B — Relawan Portal** | volunteers | `[slug].kampanyekit.id/dashboard` |
| **C — Web Timses** | candidate (read-only), coordinators, ads staff, admin, consultant | `app.kampanyekit.id/timses` |

The public + relawan surfaces live on the candidate's branded slug domain. The team command center lives on the central app domain with a candidate-switcher (so a consultant operates many campaigns from one shell).

### 5.2 Account & tenancy model

```
Agency (account owner)
  └── owns N Tenants
        └── Tenant = one candidate's campaign  (all data isolated per tenant)
              ├── Candidate (1:1)
              ├── Users (coordinators, staff, relawan) — role + wilayah scoped
              ├── Supporters
              └── Ads accounts, content, etc.
```

- A **direct candidate is an Agency-of-one** — same code path, no fork.
- A **consultant** is an Agency owning several Tenants; switching candidates is an explicit context switch, never a cross-tenant join.
- Every queryset is filtered by `request.tenant` via `TenantQuerysetMixin`. RBAC adds wilayah-subtree filtering on top for coordinator roles.

### 5.3 Multi-tenancy & isolation
- `Tenant` model linked 1:1 to `Candidate`; `Agency` is the new owning layer above `Tenant`.
- Hard isolation guarantee: Tenant A's data is never visible to Tenant B — **including when one Agency owns both**, except by deliberate candidate-switch.
- All models: UUID PK, `created_at`, `updated_at`. Sensitive models add soft-delete (`is_deleted`, `deleted_at`).

---

## 6. Information Architecture

### 6.1 Surface A + B — `[slug].kampanyekit.id`
```
/ (Home)                → Candidate Profile (public)
/berita                 → News & Updates (public)
/berita/[article-slug]  → Article detail (public)
/relawan                → Volunteer Hub + registration (public)
/aspirasi               → Aspiration form (public)
/dukung?ref=[code]      → Supporter sign-up via relawan link (public)
/login                  → Relawan login (WhatsApp OTP)
/dashboard              → Relawan dashboard (authenticated)
  /dashboard/tugas          → Task pool
  /dashboard/konten         → Daily content
  /dashboard/cari-pendukung → Add supporter
```

### 6.2 Surface C — `app.kampanyekit.id/timses`
```
/timses
├── /dashboard                      → Campaign overview (home)
├── /management-profile
│   ├── /profile                    → Profile management
│   ├── /berita                     → News & content management
│   └── /aspirasi                   → Aspirasi inbox & replies
├── /kampanye-digital
│   ├── /overview                   → Unified ads dashboard
│   ├── /meta-ads                   → Meta ads management (read + control)
│   ├── /google-ads                 → Google ads management [FF]
│   ├── /tiktok-ads                 → TikTok ads management [FF]
│   ├── /budget                     → Budget tracker
│   ├── /audience                   → Audience & leads analytics [P2]
│   └── /insights                   → Strategy insights (rule-based [FF], LLM [P3])
├── /relawan
│   ├── /list                       → Volunteer directory
│   ├── /permintaan                 → Registration approval queue
│   ├── /tugas                      → Task management (Kanban)
│   ├── /konten                     → Content performance per volunteer
│   └── /statistik                  → Volunteer geographic statistics
├── /pendukung
│   ├── /list                       → Supporter directory
│   ├── /statistik                  → Supporter analytics
│   └── /peta                       → Supporter geographic map
└── /settings                       → Tenant settings, roles, integrations
```

---

## 7. Surface A — Public Web Profile

Public, no login. Delivered at `[slug].kampanyekit.id` or a custom domain. Mobile-first, < 2s load on 4G, per-candidate SEO/OG tags, `/dashboard` is noindex.

### FR-A-101 — Candidate Profile Page `[v1]`
Main landing section introducing the candidate.

| Section | Content |
|---|---|
| Hero | Photo, full name, nomor urut, partai, dapil, tagline |
| Visi & Misi | Visi statement; Misi list (≤10 items) |
| Program Unggulan | ≤10 cards (icon, title, short description) |
| Pendukung Counter | Live registered-supporter count |
| Social Media | Instagram, TikTok, Facebook, Twitter/X, YouTube (open in new tab) |
| CTA | "Daftar Jadi Relawan", "Kirim Aspirasi" |

**Flow:** load by slug → `PUBLISHED` renders full page · `PAUSED` shows "Halaman sedang dalam pemeliharaan" · not found → 404.
**Acceptance:** < 2s on 4G; responsive; SEO/OG per candidate; counter reflects real DB count.

### FR-A-102 — Berita (News & Updates) `[v1]`
Chronological feed of articles published by the team.

- Card grid (12/page), category filter (Kegiatan, Program, Pengumuman, Media), full-text search, detail page at `/berita/[slug]`, share (WhatsApp / copy link).
- **Acceptance:** unpublished never visible; view count +1 per unique visitor per session; WhatsApp share pre-fills "[Title] — [URL]"; empty state shown.

### FR-A-103 — Relawan Hub (public) `[v1]`
Sells the value of volunteering and registers people.

- Sections: hero + CTA, 4–8 benefit cards, "How it works" 3-step, inline registration form, active-volunteer counter.
- **Registration fields:** Nama Lengkap*, Nomor HP (WhatsApp)*, Email*, Kelurahan*, Kecamatan* (dropdown), Kabupaten/Kota* (auto), Alasan bergabung (≤200), Referral Code (auto if via link).
- **Flow:** validate → duplicate check (phone/email per candidate) → create account `PENDING_VERIFICATION` → WhatsApp OTP → on valid OTP: activate (or `PENDING_APPROVAL` if tenant requires review, see §18.4) → membership card + welcome. Referral credited **before** OTP.
- **Acceptance:** CAPTCHA + rate limit; OTP expires 10 min, resend ≤3×; admin notified of new registration.

### FR-A-104 — Aspirasi (Aspiration Form) `[v1]`
Public form for any voter to send feedback.

- **Fields:** Nama*, Nomor HP, Kelurahan/Kecamatan*, Tema* (Infrastruktur/Kesehatan/Pendidikan/Ekonomi/Keamanan/Lainnya), Isi* (≤1000), Izin tampilkan nama (default OFF).
- **Flow:** validate → CAPTCHA → save `UNREAD` + IP hash → admin notified → admin replies publicly (shown on page) or privately (WhatsApp/email).
- **Acceptance:** rate limit 3/IP/hour; stored with timestamp + anonymized IP hash + candidate_id; admin can tag/archive/mark addressed.

### FR-A-105 — Pledge Wall `[P2]`
Public section showing moderated supporter statements (nama, wilayah, statement ≤100 chars).

---

## 8. Surface B — Relawan Portal

Authenticated volunteer dashboard at `[slug].kampanyekit.id/dashboard`. Mobile-first (usable at 375px). Login: WhatsApp OTP (primary), email+password (secondary).

### FR-B-101 — Relawan Dashboard (Overview) `[v1]`
Widgets: Sambutan, Poin Saya, Tugas Aktif (nearest deadline), Pendukung Rekrutan (this month), Konten Dibagikan (this month), Leaderboard rank, Notifikasi.

### FR-B-102 — Tugas (Task Pool) `[v1]`
Self-assignable tasks for decentralized ground work.

- **Task fields:** Judul, Deskripsi, Kategori (Sosialisasi/Pembagian Materi/Pendataan/Event/Digital), Wilayah (or "Semua Wilayah"), Deadline, Poin Reward, Kapasitas (optional), Status (Open/Full/Closed).
- **Flow:** pool filtered to relawan's wilayah + OPEN + deadline>now, sorted by deadline → "Ambil Tugas" (blocked if already taken / full) → `IN_PROGRESS` → submit (optional photo/notes) → `DONE` (pending review if configured) → points credited → coordinator notified.
- **Tabs:** Pool Tugas, Tugas Saya.
- **Acceptance:** cannot take past deadline; history shows completion date + points; admin can require approval before crediting; WhatsApp reminder 24h before deadline.

### FR-B-103 — Konten Harian (Daily Content) `[v1, reduced]`
Pre-made content for relawan to share to personal social media.

- **Content fields:** Judul, Platform Target, Media, Caption, Tema, Tanggal Aktif.
- **Flow (v1):** open item → "Bagikan" generates a unique tracking link (relawan × content) + copies caption → relawan posts manually → "Klaim Konten" registers the share → **points credited on share-claim** with optional admin spot-audit.
- **Tabs:** Konten Hari Ini, Semua Konten, Riwayat Saya.
- **v1 cut (§18.3):** view-count-based reward points and screenshot verification are **deferred** — they don't scale and are gameable. Automated view tracking via platform APIs is `[P3]`.

### FR-B-104 — Cari Pendukung (Add Supporter) `[v1]`
Mobile-optimized field tool for relawan to register supporters.

- **Supporter fields:** Nama*, Nomor HP*, Jenis Kelamin*, Usia, Kelurahan*, Kecamatan* (dropdown), TPS, Catatan.
- **Two paths:** (A) Manual entry → duplicate-phone warning (non-blocking) → save with `referred_by`, `source=MANUAL_ENTRY`, `status=VERIFIED` → +points. (B) Share personal link `/dukung?ref=[code]` → supporter self-registers → save with `source=SELF_REGISTRATION_VIA_LINK` → +points.
- **Summary on page:** Total Pendukung, Pendukung Hari Ini, breakdown by wilayah, Poin dari Pendukung.
- **Acceptance:** relawan sees only their own referred supporters; admin sees all with attribution; referral link persistent.

---

## 9. Surface C — Web Timses (Command Center)

Fully authenticated, role-restricted, wilayah-scoped. Tablet/desktop optimized (mobile read-only). Loads < 3s with Redis-cached data.

### 9.1 Module 1 — Kampanye Digital (Ads)

#### FR-C-101 — Platform Connection & Setup `[v1: Meta]` `[FF: Google, TikTok]`
OAuth 2.0 per platform; one-time setup.

| Platform | Method | Phase |
|---|---|---|
| Meta (FB & IG) | OAuth via Meta Business Login | `[v1]` |
| TikTok Ads | OAuth via TikTok Marketing API | `[FF]` |
| Google Ads | OAuth via Google Ads API | `[FF]` |

- **Flow:** connect → store token encrypted (AES-256/Fernet) → fetch ad-account list → user selects account → first 30-day sync → status CONNECTED. Auto-sync every 30 min via Celery; manual "Refresh Now".
- **Acceptance:** tokens never exposed to frontend; expired-token alert "Koneksi terputus. Hubungkan ulang."; ad-account connections not shareable across candidates; disconnect clears token + cached data.

#### FR-C-102 — Ads Overview Dashboard `[v1]`
Unified single screen across connected platforms.

- **Metric cards:** Total Reach, Total Impressions, Total Spend, Avg CPM, Avg CTR, Total Clicks, Cost Per Click, Best Platform (lowest CPM).
- **Charts:** Daily Reach Trend (line per platform), Spend Breakdown (donut), Impressions vs Reach (bar), CTR comparison (bar), Top 5 Ads (table).
- **Filters:** Date range (7/14/30/90/custom), Platform, Campaign.
- **Acceptance:** < 3s with cache; skeletons while fetching; currency always IDR (USD auto-converted at daily rate); export CSV/PDF.

#### FR-C-103 — Per-Platform Ads Management `[v1: Meta read + control]`
3-level hierarchy: Campaign → Ad Set/Group → Ad. Platform-specific metric columns (Meta: frequency, video retention, reactions, quality ranking; TikTok `[FF]`: view rates, completion, follows; Google `[FF]`: impression share, quality score, search terms).

- **Write actions `[v1]` (full control, per locked decision) with mandatory guardrails (§18.1):** Toggle Status (pause/resume), Edit Budget (daily/lifetime), Duplicate. Each requires confirmation modal, audit-log entry, optimistic-UI rollback on API error, role-gated to Koordinator Utama + Staf Ads.
- **Read actions `[v1]`:** View Creative, Add to Library.

#### FR-C-104 — Budget Tracker `[v1]`
- **Config:** Total Digital Budget, Period, Per-Platform Allocation (sum ≤ total), Alert Threshold (default 80%).
- **Dashboard:** Budget Health Bar (green<60 / yellow 60–80 / red>80), per-platform cards (allocated/spent/remaining), Daily Burn Rate, Projected Total Spend, Overspend banner, Budget History (with user + timestamp).
- **Flow:** 30-min task pulls actual spend → checks (spent/allocated ≥ threshold) → alert once per crossing (in-app + WhatsApp).
- **Acceptance:** IDR with USD auto-convert; alert fires once per threshold; mid-period edits logged; "Sisa Anggaran" always prominent.

#### FR-C-105 — Audience & Leads Analytics `[P2]`
Demographic breakdown (gender, age, gender×age heatmap, device, placement), geographic reach (province choropleth, city ranking, dapil overlap), behavioral signals (creative-type CTR, retention funnel, best time/day, theme performance, fatigue). Conversion tracking (UTM-based supporter attribution, cost-per-supporter) is `[P3]`.

#### FR-C-106 — Strategy Insights `[FF: rule-based]` `[P3: LLM]`
Nightly Celery job turns ad data into plain-Bahasa recommendations: budget reallocation, audience gap, ad-fatigue warning, best time, theme performance. **v1/FF ships rule-based logic only**; the Claude-powered narrative layer (`claude-sonnet`) is Phase 3 (§18.2). Cards sorted by priority; "Terapkan Rekomendasi" deep-links to Budget/Ads; "Abaikan" dismisses.

### 9.2 Module 2 — Kelola Relawan

#### FR-C-201 — Relawan List & Directory `[v1]`
Searchable/filterable master list. Columns: Nama, Nomor HP, Wilayah, Role, Status, Tugas Selesai, Pendukung Rekrutan, Konten Dibagikan, Total Poin, Tanggal Bergabung, Aksi. Filters: search, wilayah cascade, role, status, sort. Add relawan manually (WhatsApp welcome on create). Deactivate → invalidate sessions, return open tasks to pool, notify coordinator.

#### FR-C-202 — Registration Approval Queue `[v1]`
Review queue for self-registered relawan. Columns: Nama, Nomor HP, Wilayah, Alasan, Referral Dari, Tanggal, Status, Aksi (Approve / Reject / Hubungi-via-WhatsApp). Approve → ACTIVE + WhatsApp + referral credit. Reject → reason + WhatsApp. Approval-required vs auto-activate is a tenant setting (§18.4).

#### FR-C-203 — Task Management `[v1]`
Full create/assign/track/close. Fields add to FR-B-102: Deskripsi (rich text), Role Target (multi-select), Bukti Diperlukan (toggle), Review Required (toggle). **Kanban board:** Draft / Open / In Progress / Under Review / Completed. Publish validates deadline>now + ≥1 wilayah → notifies matching relawan. Review flow: Under Review → Approve (credit points + WhatsApp) or Reject (reason + relawan can resubmit). Per-task tracking table with evidence links.

#### FR-C-204 — Volunteer Statistics & Geographic Overview `[v1: tables]` `[P2: map]`
Summary cards (Total Aktif, Baru Bulan Ini, Tingkat Aktivitas, Rata-rata Poin). Geographic distribution (per-kabupaten/kecamatan tables `[v1]`; choropleth map `[P2]`; Coverage Gap highlighting kecamatan with <3 relawan). Performance leaderboard (filterable by period/wilayah/role).

#### FR-C-205 — Content Performance per Volunteer `[v1, reduced]`
Per-relawan content activity table and aggregates (total shared, platform favorit, top post). **Aligned with FR-B-103 v1 cut:** tracks shares/claims; self-reported-view verification and view-based points are deferred (§18.3).

### 9.3 Module 3 — Kelola Pendukung

#### FR-C-301 — Supporter Directory `[v1]`
Searchable list regardless of source. Columns: Nama, Nomor HP (masked `0812-****-1234`), Jenis Kelamin, Usia, Kelurahan, Kecamatan, Kabupaten/Kota, TPS, Sumber (Mandiri/Relawan Manual/Link Relawan/QR Event), Dirujuk Oleh, Tanggal Daftar. Filters: search, wilayah cascade, sumber, gender, date range. Export CSV/Excel (admin only; phone unmasked in export).

#### FR-C-302 — Supporter Analytics `[v1: cards+tables]` `[P2: map/heatmap]`
Summary cards (Total, Baru Bulan/Minggu Ini, growth %). Growth trend (daily registration line, cumulative curve, growth-by-source stacked area). Demographic breakdown (gender, age, gender×age). Geographic breakdown (ranking tables `[v1]`; choropleth heatmap `[P2]`; Blank Spot alerts; "Buat Tugas Canvassing di Area Ini" shortcut pre-fills a task). Source attribution (sumber donut, top-10 recruiters, self-registration rate). Coverage vs voter population is `[P3]` (needs DPT data, §19).

### 9.4 Module 4 — Kelola Web Profile

#### FR-C-401 — Manajemen Profil `[v1]`
Edit candidate info displayed on Surface A: Status Web (PUBLISHED/PAUSED), hero (foto, nama, nomor urut, partai & dapil, tagline), visi, misi (≤10), program unggulan cards, social links.

#### FR-C-402 — Kelola Berita `[v1]`
List/search/filter articles. Columns: Judul, Kategori, Tanggal Dibuat, Tanggal Publikasi, Status, Views. Rich-text editor for create/edit; Draft (hidden) vs Publikasikan (live on Surface A).

#### FR-C-403 — Kelola Aspirasi `[v1]`
Inbox for FR-A-104 submissions. Columns: Pengirim (hidden if anonymous), Nomor HP (masked), Wilayah, Tema, Isi (truncated), Tanggal, Status (UNREAD/ADDRESSED/ARCHIVED). Reply Publik (shown on page) / Reply Privat (WhatsApp with unmasked number) / Tandai Selesai / Arsipkan.

### 9.5 Campaign Overview Dashboard (Timses Home) `[v1]`
Widgets: Campaign Health Score (composite 0–100 — *formula TBD, §19*), Total Supporters (+trend), Total Reach, Total Ad Spend vs budget, Active Volunteers, Tasks Pending Review, Pending Relawan Requests, Recent Activity Feed (last 20), Quick Actions (Buat Tugas, Tambah Relawan, Lihat Laporan).

### 9.6 Reporting
- **FR-C-501 Weekly Auto-Report `[v1]`** — every Monday, emailed to Kandidat + Koordinator Utama. Sections: Ringkasan Eksekutif, Performa Iklan, Pertumbuhan Pendukung, Aktivitas Relawan, Konten Viral, Rekomendasi (top 3). Format TBD (§19).
- **FR-C-502 On-Demand Reports `[FF]`** — custom date-range report (ads, supporter growth by wilayah, volunteer ranking, budget). PDF or Excel.

---

## 10. Cross-Cutting Features

### 10.1 Points & Rewards `[v1, reduced]`
| Action | Points |
|---|---|
| Register as Relawan | 50 (one-time) |
| Complete a task | per task (default 20) |
| Share daily content | 10 base (credit-on-share; **view-bonus deferred**, §18.3) |
| Register a supporter (manual) | 10 |
| Supporter registers via relawan's link | 15 |
| Attend an event (QR check-in) | 25 `[P2]` |

Points drive internal leaderboard ranking. Redemption is handled by the campaign admin outside the platform in v1.

### 10.2 WhatsApp Notifications `[v1]`
Via WhatsApp Business API (Fonnte/Wati) behind the existing `whatsapp.py` backend. Used for: OTP login, relawan onboarding/approval, task reminders + verification results, budget alerts, new-supporter/new-relawan notices. **WhatsApp Blast** (segmented broadcasts) is `[P3]`.

### 10.3 Press Kit `[v1]`
Auto-generated branded PDF (photo, bio, key messages) in the candidate's color scheme. *(Fix the current `PressKitPDFView` missing-import crash.)*

---

## 11. v1 Scope (MoSCoW)

### MUST `[v1]` — the spine; nothing ships without these
- Three-surface IA + **`Agency`-above-`Tenant`** + candidate-switcher.
- **RBAC with wilayah-scoped data access** (6 Timses roles) + tenant-isolation tests.
- **Real WhatsApp BSP**: OTP login, onboarding, notifications.
- **Unified ads — real Meta integration**: OAuth, 30-min Celery sync, overview dashboard, **full ad control** with §18.1 guardrails.
- **Budget tracker + 80% alert** on real spend.
- **Kelola Pendukung**: directory + analytics (cards/tables).
- **Kelola Relawan**: directory, approval queue, task board with review.
- **Kelola Web Profile**: profil/berita/aspirasi management; fix press-kit crash; CAPTCHA on public forms.
- **Weekly auto-report**; Timses overview + relawan dashboard.
- Public Web Profile (already functional) + relawan portal funnel.

### SHOULD `[FF]` — fast-follow right after v1
TikTok + Google ads; per-platform deep read views; rule-based strategy insights; on-demand reports; content-reward redesign finalization.

### COULD `[P2]` — Phase 2
Audience analytics depth; true Leaflet choropleth maps (relawan + supporter); pledge wall; events/QR check-in; polls; announcements; leaderboard/gamification depth.

### WON'T (v1) — explicitly deferred
LLM-powered insights `[P3]`; conversion/UTM attribution + cost-per-supporter `[P3]`; coverage-vs-voter-population `[P3]`; donations `[P3]`; white-label `[P3]`; mobile app `[P3]`; AI chatbot/speech writer `[P3]`; WhatsApp blast `[P3]`; content view-count points (cut, §18.3).

---

## 12. Phasing

| Phase | Theme | Contents |
|---|---|---|
| **Phase 0** | Stop the bleeding | Fix press-kit crash; flag Phase 2/3 surfaces off; tenant-isolation tests; CAPTCHA on public forms; archive superseded docs |
| **Phase 1A** | Account + RBAC | `Agency`-above-`Tenant`, candidate-switcher, 6-role RBAC + wilayah scoping (test isolation hardest here) |
| **Phase 1B** | Ads spine (Meta) | OAuth `ads_management`, 30-min sync, overview, budget + alert, write-control + guardrails + audit log |
| **Phase 1C** | WhatsApp funnel | Real BSP; OTP login → onboarding → relawan dashboard; approval queue; notifications |
| **Phase 1D** | Team + supporters | Task board with review; supporter directory/analytics; content mgmt; weekly report; cross-side proof |
| **Phase 2** | Widen | TikTok/Google; rule-based insights; audience depth; Leaflet maps; pledge wall; events; polls |
| **Phase 3** | Premium | LLM insights; attribution; donations; white-label; mobile app; AI chatbot/speech; WhatsApp blast; compliance/KPU |

---

## 13. Non-Functional Requirements

| Area | Requirement |
|---|---|
| Performance (public) | < 2s on 4G mobile; usable at 375px |
| Performance (Timses) | < 3s with Redis cache; skeleton loaders during fetch |
| Ads refresh | Every 30 min via Celery; never call platform APIs on a user request |
| Authentication | JWT (access 15 min / refresh 7 days); WhatsApp OTP for relawan; OTP expires 10 min |
| Authorization | RBAC; wilayah-scoped data access; ad write-control role-gated |
| Data isolation | Multi-tenant strict isolation incl. across an Agency's tenants; 80% test coverage on `apps/` |
| Security | OWASP Top 10; platform API keys + ad tokens encrypted AES-256/Fernet; HTTPS everywhere; CORS allowlist |
| Audit log | All data-modification actions logged (user, timestamp, action); ad write-control actions mandatory; tenant-admin cannot tamper |
| Rate limiting | Aspirasi 3/IP/hr; registration 5/IP/hr |
| Privacy (UU PDP) | Supporter PII stored in Indonesia (GCP asia-southeast2); IP hashed `sha256(ip + date)`; phone normalized `62XXXXXXXXXX`; data export + deletion on request |
| Export | CSV/Excel up to 50,000 records; async generation for large exports |
| Availability | 99.5% monthly; daily backups, 30-day retention |
| Scalability | ≤10,000 supporters/candidate without degradation; horizontal Docker scaling on GCP |

---

## 14. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui |
| State | Zustand (global) + TanStack Query (server) |
| Forms | React Hook Form + Zod |
| Backend | Django 5 + DRF 3.15+ (class-based views, serializer-validated) |
| API | `/api/v1/`, JWT (simplejwt), drf-spectacular at `/api/docs/` |
| Database | PostgreSQL 16 (UUID PKs) |
| Cache / Queue | Redis; Celery + Celery Beat |
| Storage | Google Cloud Storage (S3-compatible) via django-storages |
| Charts / Maps | Recharts; Leaflet + Indonesia GeoJSON |
| Containerization | Docker + Docker Compose; Nginx reverse proxy; Gunicorn (4 workers) |
| CI/CD | GitHub Actions + GHCR |
| AI | Anthropic API (`claude-sonnet`) — Phase 3 |
| Mobile | Flutter — Phase 3 |

---

## 15. Integrations & Dependencies

| Dependency | Purpose | Phase |
|---|---|---|
| Meta Marketing API (`ads_management`) | Campaign data, audience insights, ad status/budget control | `[v1]` |
| TikTok Marketing API | Campaign data, video metrics | `[FF]` |
| Google Ads API | Search/Display/YouTube data | `[FF]` |
| WhatsApp Business API (Fonnte/Wati) | OTP, notifications | `[v1]` |
| Google Cloud Storage | Media (photos, videos, cards) | `[v1]` |
| Leaflet + Indonesia GeoJSON | Geographic maps | `[P2]` |
| Anthropic API | LLM strategy insights, chatbot, speech writer | `[P3]` |
| Midtrans | Donation management | `[P3]` |

---

## 16. Business Model

| Tier | Features | Price (IDR / cycle) | Segment |
|---|---|---|---|
| Starter | v1 spine | Rp 2–5 juta | Caleg DPRD Kab/Kota |
| Pro | v1 + fast-follow + Phase 2 | Rp 10–20 juta | Caleg DPRD Provinsi |
| Premium | All phases | Rp 30–75 juta | **Bupati/Walikota (ICP)** |
| Enterprise | White-label, multi-candidate (Agency) | Custom | Gubernur / Konsultan |

Additional revenue: 10–15% management fee on ad spend managed through the platform (meaningful at Premium/Enterprise budgets).

---

## 17. Success Metrics

| Metric | MVP target | 12-month target |
|---|---|---|
| Paying candidates | 5 | 100 |
| Avg supporter registrations / candidate | 500 | 2,000 |
| Ads managed (total spend) | Rp 50 juta | Rp 5 miliar |
| Monthly recurring revenue | Rp 25 juta | Rp 500 juta |
| NPS | > 40 | > 60 |
| Relawan activation rate (≥1 task/content/month) | — | > 50% |

---

## 18. Resolved Contradictions (Decision Record)

1. **Ads write-control (v1, full) — with mandatory guardrails.** Source docs conflicted ("view and control only" vs pause/budget/duplicate). **Decision: full control in v1**, gated by: Meta `ads_management` scope (start app review early); confirmation modal per write; audit-log entry per write; optimistic-UI rollback on API error; role-gated to Koordinator Utama + Staf Ads. The "no write" wording in old Timses §12 is void.
2. **AI insights altitude.** Rule-based insights `[FF]`; LLM-narrative layer `[P3]`. Resolves master-PRD-vs-Timses conflict.
3. **Content view-count points (cut from v1).** Self-reported views + admin screenshot verification doesn't scale (>~50 relawan) and is gameable. v1 credits on share-claim with optional spot-audit; automated platform-API view tracking is `[P3]`.
4. **Relawan approval default.** Tenant setting: auto-activate after OTP **or** require approval; **default = require approval** (ICP wants control). Approval queue (FR-C-202) built regardless.
5. **Team portal URL.** Standardized on `app.kampanyekit.id/timses` (central + candidate-switcher), not per-slug — required for the consultant/Agency model.
6. **`/dashboard` collision.** `[slug]/dashboard` = relawan portal; team uses `/timses`. No overlap.

---

## 19. Open Questions

| # | Question | Owner | Blocks |
|---|---|---|---|
| 1 | Is voter-population (DPT) per kecamatan available? | Research | Coverage-vs-population features (kept `[P3]` until answered) |
| 2 | Campaign Health Score formula? | Product | Timses overview dashboard (define before build) |
| 3 | Weekly report: PDF email attachment vs in-app + link? | Product | FR-C-501 |
| 4 | Can Koordinator Wilayah create tasks, or Koordinator Utama only? | Product | FR-C-203 RBAC rules |
| 5 | OTP provider for v1 — Fonnte, Wati, or Zocket? | Tech Lead | Phase 1C |
| 6 | Max simultaneous tasks per relawan? | Product | FR-B-102 |
| 7 | Google Ads: supporter-registration as conversion goal in scope? | Tech | FR-C-105 attribution |

---

*End of canonical PRD. For build sequencing and the current-state audit, see the implementation plan.*
