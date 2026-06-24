# Product Requirements Document (PRD)
# KampanyeKit — Web Profile Module

**Version:** 1.0
**Last Updated:** 2026-03-31
**Status:** Active Development
**Module:** Web Profile (Public Candidate Page)
**Parent PRD:** KampanyeKit Platform v1.0

---

## 1. Overview

The **Web Profile** is the public-facing website generated for each candidate on KampanyeKit. It serves as the digital front door of the campaign — accessible to the general public without login, and unlocking additional tools for authenticated volunteers (Relawan).

The Web Profile is delivered at `[slug].kampanyekit.id` or a custom domain configured by the candidate.

---

## 2. User Types

| User Type | Auth State | Description |
|---|---|---|
| Public User | Not logged in | General voter or visitor browsing the candidate's page |
| Relawan | Logged in (volunteer account) | Registered volunteer with access to task, content, and supporter tools |

---

## 3. Page Architecture

The Web Profile is a single multi-section website with role-aware content rendering.

```
[slug].kampanyekit.id
├── / (Home)              → Candidate Profile
├── /berita               → News & Updates
├── /relawan              → Volunteer Hub (public info + registration)
├── /aspirasi             → Aspiration Form
└── /dashboard            → Volunteer Dashboard (authenticated only)
    ├── /dashboard/tugas          → Task Pool
    ├── /dashboard/konten         → Daily Content
    └── /dashboard/cari-pendukung → Add Supporter
```

---

## 4. Feature Requirements — Public User (Unauthenticated)

---

### 4.1 FR-WP-101: Candidate Profile Page

**Description:** The main landing section that introduces the candidate to first-time visitors.

**Page Sections:**

| Section | Content |
|---|---|
| Hero | Candidate photo, full name, nomor urut, partai, dapil, tagline |
| Visi & Misi | Visi statement, Misi list (up to 10 items) |
| Program Unggulan | Up to 10 program cards with icon, title, and short description |
| Pendukung Counter | Live count of registered supporters |
| Social Media Links | Instagram, TikTok, Facebook, Twitter/X, YouTube |
| CTA Buttons | "Daftar Jadi Relawan", "Kirim Aspirasi" |

**Business Process Flow:**

```
Visitor lands on [slug].kampanyekit.id
        │
        ▼
System loads candidate record by slug
        │
        ├─── Candidate status = PUBLISHED → Render full profile page
        │
        ├─── Candidate status = PAUSED → Show "Halaman sedang dalam pemeliharaan" page
        │
        └─── Candidate not found → 404 page
```

**Acceptance Criteria:**
- Page renders in < 2 seconds on 4G mobile connection
- All sections are responsive (mobile-first)
- Basic SEO meta tags (title, description, og:image) are injected per candidate
- Pendukung counter reflects real-time supporter count from DB
- Social media links open in new tab

---

### 4.2 FR-WP-102: Berita (News & Updates)

**Description:** A chronological feed of content updates published by the candidate's admin team, replacing the need for a separate website or blog.

**Page Elements:**

| Element | Detail |
|---|---|
| Article Card | Featured image, title, category tag, published date, short excerpt |
| Category Filter | Filter by tag: Kegiatan, Program, Pengumuman, Media |
| Search Bar | Full-text search across article titles and body |
| Article Detail | Full content page at `/berita/[article-slug]` |
| Share Buttons | WhatsApp, Instagram, copy link |

**Business Process Flow:**

```
Visitor opens /berita
        │
        ▼
System fetches published articles (status = PUBLISHED, sorted by date DESC)
        │
        ▼
Articles rendered as paginated card grid (12 per page)
        │
        ├─── Visitor clicks article card
        │           │
        │           ▼
        │    Article detail page loads
        │    System increments article view counter (+1)
        │           │
        │           ▼
        │    Visitor can share via WhatsApp / copy link
        │
        └─── Visitor uses category filter or search
                    │
                    ▼
             System re-fetches filtered/searched results
             Results update without full page reload
```

**Acceptance Criteria:**
- Unpublished articles are never visible to public
- View count is incremented once per unique visitor per article (based on session)
- Share link generates pre-filled WhatsApp message: "[Article title] — [URL]"
- Empty state message shown when no articles exist

---

### 4.3 FR-WP-103: Relawan Hub (Volunteer Page — Public)

**Description:** A dedicated section that communicates the value of becoming a volunteer and allows interested individuals to register.

**Page Sections:**

| Section | Content |
|---|---|
| Hero Section | Headline, subheadline, CTA "Daftar Sekarang" |
| Benefit Relawan | List of 4–8 benefit cards (e.g., Digital membership card, Access to daily content, Reward points, Event invitations) |
| How It Works | 3-step visual flow: Daftar → Aktifkan Akun → Mulai Berkontribusi |
| Registration Form | Inline registration form (see below) |
| Relawan Counter | Total active volunteers count |

**Registration Form Fields:**

| Field | Type | Required |
|---|---|---|
| Nama Lengkap | Text | Yes |
| Nomor HP (WhatsApp) | Phone | Yes |
| Email | Email | Yes |
| Kelurahan | Text | Yes |
| Kecamatan | Dropdown (from wilayah data) | Yes |
| Kabupaten/Kota | Auto-filled based on kecamatan | Yes |
| Alasan bergabung | Textarea (max 200 chars) | No |
| Referral Code | Text (auto-filled if via referral link) | No |

**Business Process Flow:**

```
Visitor opens /relawan
        │
        ▼
System displays benefit section and registration form
        │
        ▼
Visitor fills and submits registration form
        │
        ▼
System validates input (required fields, valid phone, valid email)
        │
        ├─── Validation FAILS → Inline error messages shown, form not submitted
        │
        └─── Validation PASSES
                    │
                    ▼
            System checks: is phone/email already registered for this candidate?
                    │
                    ├─── DUPLICATE → Show message: "Nomor HP sudah terdaftar.
                    │               Silakan login atau hubungi tim kampanye."
                    │
                    └─── NEW USER
                                │
                                ▼
                        Create Relawan account (status = PENDING_VERIFICATION)
                        Send WhatsApp OTP to nomor HP
                        If referral code present → credit referring member
                                │
                                ▼
                        Visitor receives OTP via WhatsApp
                        Enters OTP on verification page
                                │
                                ├─── OTP VALID → Account activated (status = ACTIVE)
                                │               Redirect to /dashboard
                                │               Show welcome modal + digital membership card
                                │
                                └─── OTP INVALID / EXPIRED → Allow resend OTP (max 3x)
```

**Acceptance Criteria:**
- CAPTCHA or rate limiting applied to prevent spam registrations
- OTP expires after 10 minutes
- Referral code attribution is saved before OTP verification (not after)
- Digital membership card auto-generated on account activation (per FR-112)
- Admin is notified of new volunteer registration (in-app notification)

---

### 4.4 FR-WP-104: Aspirasi (Aspiration Form)

**Description:** A public-facing form that allows any voter — registered or not — to send aspirations, questions, or feedback directly to the candidate's team.

**Form Fields:**

| Field | Type | Required |
|---|---|---|
| Nama | Text | Yes |
| Nomor HP | Phone | No |
| Kelurahan / Kecamatan | Text | Yes |
| Tema Aspirasi | Dropdown: Infrastruktur, Kesehatan, Pendidikan, Ekonomi, Keamanan, Lainnya | Yes |
| Isi Aspirasi | Textarea (max 1000 chars) | Yes |
| Izin tampilkan nama | Toggle (default: OFF) | No |

**Business Process Flow:**

```
Visitor opens /aspirasi
        │
        ▼
Visitor fills out aspiration form
        │
        ▼
System validates: required fields present, HP format valid (if filled)
        │
        ├─── Validation FAILS → Inline errors shown
        │
        └─── Validation PASSES
                    │
                    ▼
            CAPTCHA check passed?
                    │
                    ├─── NO → Block submission, show CAPTCHA challenge
                    │
                    └─── YES
                                │
                                ▼
                        Aspirasi saved to DB (status = UNREAD)
                        Admin receives in-app notification: "Aspirasi baru dari [Nama], [Wilayah]"
                        Visitor sees success message:
                        "Aspirasi Anda telah terkirim. Terima kasih."
                                │
                                ▼
                        Admin reviews in Aspirasi Inbox (FR-213)
                                │
                                ├─── Admin replies PUBLICLY → Reply shown on candidate page
                                │
                                └─── Admin replies PRIVATELY → WhatsApp / email to submitter
```

**Acceptance Criteria:**
- Rate limit: max 3 submissions per IP per hour
- Aspirasi stored with timestamp, IP hash (anonymized), and candidate_id
- Public reply (if enabled by admin) appears in a "Tanggapan Kandidat" section on the page
- Admin can tag, archive, or mark aspirasi as addressed

---

## 5. Feature Requirements — Relawan (Authenticated Volunteer)

After login, the volunteer accesses a personal dashboard at `/dashboard`. The public-facing web profile navigation remains visible, but a Relawan-specific menu is added.

---

### 5.1 FR-WP-201: Tugas (Task Pool)

**Description:** A pool of available tasks assigned by the admin or coordinator that volunteers can browse and self-assign, enabling decentralized campaign ground work.

**Task Object:**

| Field | Detail |
|---|---|
| Judul Tugas | Short task name |
| Deskripsi | Full instructions |
| Kategori | Sosialisasi, Pembagian Materi, Pendataan, Event, Digital |
| Wilayah | Target kecamatan/kelurahan (can be "Semua Wilayah") |
| Deadline | Date/time |
| Poin Reward | Points earned upon task completion |
| Kapasitas | Max number of relawan who can take this task (optional) |
| Status | Open / Full / Closed |

**Business Process Flow:**

```
Relawan opens /dashboard/tugas
        │
        ▼
System loads task pool: tasks assigned to relawan's wilayah OR "Semua Wilayah"
Tasks filtered to: status = OPEN and deadline > now
Sorted by: deadline ASC (soonest first)
        │
        ▼
Relawan browses task list
Can filter by: Kategori, Wilayah, Deadline range
        │
        ▼
Relawan clicks on a task → Task detail modal/page opens
        │
        ▼
Relawan clicks "Ambil Tugas"
        │
        ├─── Relawan already has this task → Show: "Tugas sudah diambil"
        │
        ├─── Task is FULL (capacity reached) → Show: "Kuota penuh"
        │
        └─── Task available
                    │
                    ▼
            Task assigned to relawan (status = IN_PROGRESS)
            Relawan capacity count on task incremented
            Task appears in "Tugas Saya" tab
            In-app notification: "Tugas berhasil diambil. Deadline: [date]"
                    │
                    ▼
            Relawan works on the task (offline/online)
                    │
                    ▼
            Relawan submits task completion:
            - Optional: upload photo evidence or fill completion notes
            - Click "Tandai Selesai"
                    │
                    ▼
            Task status updated to DONE (pending review if admin configured review)
            Poin reward credited to relawan's account
            Admin/coordinator notified of completion
```

**Tabs in Tugas Page:**

| Tab | Content |
|---|---|
| Pool Tugas | All available open tasks |
| Tugas Saya | Tasks taken by this relawan (in-progress + done) |

**Acceptance Criteria:**
- Relawan cannot take a task past its deadline
- Completed tasks show in history with completion date and points earned
- Admin can set tasks to require approval before points are credited
- Relawan receives push/WhatsApp reminder 24 hours before task deadline

---

### 5.2 FR-WP-202: Konten Harian (Daily Content)

**Description:** A daily content feed where volunteers can pick up pre-made campaign content (images, videos, captions) and share them to their personal social media accounts. Volunteers earn reward points based on the engagement (views) their shares generate.

**Content Object:**

| Field | Detail |
|---|---|
| Judul Konten | Short title |
| Platform Target | Instagram, TikTok, Facebook, Twitter/X (one or multiple) |
| Media | Image or video file |
| Caption | Ready-to-copy caption text |
| Tema | Infrastruktur, Kesehatan, Pendidikan, dll |
| Tanggal Aktif | Date this content is "assigned" as daily content |
| Reward Rule | Points per 100 views (e.g., 5 poin per 100 views) |
| Max Reward Cap | Maximum poin per content item per relawan |

**Business Process Flow:**

```
Admin publishes content item with reward rule (from Admin panel, FR-206)
        │
        ▼
Content item appears in Relawan's /dashboard/konten feed
        │
        ▼
Relawan opens content item
        │
        ▼
Relawan clicks "Bagikan" on desired platform
        │
        ▼
System generates a unique tracking link for this relawan + content combination
Caption + tracking link is copied to clipboard automatically
        │
        ▼
Relawan posts to their social media (manual action, outside the platform)
        │
        ▼
Relawan returns to platform and clicks "Klaim Konten" to register that they shared it
System records: relawan_id, content_id, platform, timestamp (status = SHARED)
        │
        ▼
Relawan submits proof of sharing:
- Paste the post URL (e.g., TikTok or Instagram link)
- OR upload screenshot of post
        │
        ▼
Admin reviews and verifies proof (manual or semi-automated)
        │
        ├─── REJECTED → Relawan notified, no points credited
        │
        └─── VERIFIED
                    │
                    ▼
            Relawan inputs view count periodically (self-reported) OR
            System reads view data via platform API (if connected)
                    │
                    ▼
            System calculates points:
            Points = floor(views / 100) × reward_per_100_views
            Capped at max_reward_cap per content item
                    │
                    ▼
            Points credited to relawan's account
            Progress shown in "Riwayat Konten" tab
```

**View Claim Sub-flow (Self-Reported):**

```
Relawan opens "Tugas Saya" → selects shared content item
        │
        ▼
Relawan enters current view count from their social media post
        │
        ▼
System validates: new count ≥ previous reported count (no going backward)
        │
        ▼
System recalculates incremental points earned
Points delta credited to relawan's balance
        │
        ▼
Final claim locked after: content item expires (admin sets expiry date)
```

**Tabs in Konten Harian Page:**

| Tab | Content |
|---|---|
| Konten Hari Ini | Today's active content items |
| Semua Konten | Full library of available content |
| Riwayat Saya | Content items this relawan has shared + points earned |

**Acceptance Criteria:**
- Each relawan gets a unique tracking link per content item (for attribution)
- Relawan cannot claim the same content item twice on the same platform
- Admin can disable a content item and it disappears from the feed immediately
- Points are shown in relawan's profile and leaderboard
- View count update window: relawan can update view count for up to 7 days after sharing

---

### 5.3 FR-WP-203: Cari Pendukung (Add Supporter)

**Description:** A tool that allows volunteers to register supporters they recruit in the field — canvassing, at events, or through personal networks — directly through the platform using a simple mobile-optimized form.

**Supporter Object (as registered by Relawan):**

| Field | Type | Required |
|---|---|---|
| Nama Lengkap | Text | Yes |
| Nomor HP | Phone | Yes |
| Jenis Kelamin | Radio: Laki-laki / Perempuan | Yes |
| Usia | Number | No |
| Kelurahan | Text | Yes |
| Kecamatan | Dropdown | Yes |
| TPS (Tempat Pemungutan Suara) | Text | No |
| Catatan | Textarea (e.g., "Ditemui di acara RT, tertarik program pendidikan") | No |

**Business Process Flow:**

```
Relawan opens /dashboard/cari-pendukung
        │
        ▼
Relawan sees two options:
[+ Tambah Pendukung Manual] or [📱 Bagikan Link Pendukung]
        │
        ├─── Option A: Manual Entry
        │           │
        │           ▼
        │   Relawan fills supporter form
        │           │
        │           ▼
        │   System validates required fields
        │           │
        │           ├─── INVALID → Inline errors shown
        │           │
        │           └─── VALID
        │                       │
        │                       ▼
        │               System checks: is nomor HP already registered as
        │               a supporter for this candidate?
        │                       │
        │                       ├─── DUPLICATE → Show warning:
        │                       │    "Nomor ini sudah terdaftar sebagai pendukung."
        │                       │    Relawan can still save with flag = DUPLICATE
        │                       │
        │                       └─── NEW
        │                                   │
        │                                   ▼
        │                           Supporter record saved with:
        │                           - referred_by = relawan's ID
        │                           - source = MANUAL_ENTRY
        │                           - status = VERIFIED (since relawan vouches)
        │                           Relawan's supporter count incremented (+1)
        │                           Poin reward credited (e.g., 10 poin per supporter)
        │                           Relawan sees success confirmation:
        │                           "Pendukung berhasil ditambahkan!"
        │
        └─── Option B: Share Link
                    │
                    ▼
            System generates a personal registration link for this relawan:
            [slug].kampanyekit.id/dukung?ref=[relawan_code]
                    │
                    ▼
            Relawan shares link via WhatsApp, Instagram DM, etc.
                    │
                    ▼
            Supporter opens link → Sees public supporter sign-up form (FR-111)
            Supporter fills and submits form
                    │
                    ▼
            Supporter record saved with referred_by = relawan's ID
            source = SELF_REGISTRATION_VIA_LINK
                    │
                    ▼
            Relawan's dashboard updates: supporter count +1
            Points credited to relawan
```

**Relawan's Supporter Summary (on this page):**

| Metric | Description |
|---|---|
| Total Pendukung | Number of supporters registered by this relawan |
| Pendukung Hari Ini | Supporters added today |
| Breakdown by Wilayah | Mini table showing supporter count per kecamatan |
| Poin dari Pendukung | Total points earned from supporter referrals |

**Acceptance Criteria:**
- Relawan can only view supporter records they personally referred (not others')
- Admin can see all supporters with referral attribution
- Duplicate phone warning does not block submission (admin resolves duplicates)
- Manual entry is mobile-optimized: large tap targets, autofill-friendly fields
- Relawan's referral link is persistent (does not change after generation)

---

## 6. Relawan Dashboard — Overview

The `/dashboard` home screen provides a summary for the logged-in volunteer.

**Dashboard Widgets:**

| Widget | Data Shown |
|---|---|
| Sambutan | "Halo, [Nama Relawan]! Selamat datang di tim [Nama Kandidat]" |
| Poin Saya | Total accumulated reward points |
| Tugas Aktif | Count of in-progress tasks, nearest deadline highlighted |
| Pendukung Rekrutan | Total supporters recruited this month |
| Konten Dibagikan | Total content items shared this month |
| Leaderboard Preview | Relawan's rank among all volunteers (based on points) |
| Notifikasi | Unread task assignments, announcements, point credits |

---

## 7. Authentication & Session Management

| Scenario | Behavior |
|---|---|
| Public user visits any page | Full access to public sections, no login required |
| Public user visits `/dashboard` | Redirected to `/login` |
| Relawan logs in | Redirected to `/dashboard` |
| Relawan session expires | Redirected to `/login` with message "Sesi Anda telah berakhir" |
| Relawan logs out | Session cleared, redirected to candidate home page |

**Login Method:**
- Nomor HP + OTP via WhatsApp (primary)
- Email + password (secondary, optional)

---

## 8. Points & Reward System

| Action | Points Earned |
|---|---|
| Register as Relawan | 50 poin (one-time) |
| Complete a task | Per task (set by admin, default 20 poin) |
| Share daily content | 10 poin base + view-based bonus |
| Register a supporter (manual) | 10 poin per supporter |
| Supporter registers via relawan's link | 15 poin per supporter |
| Attend an event (QR check-in) | 25 poin per event |

**Points Redemption:** Points are used for internal leaderboard ranking. Redemption against rewards (merchandise, recognition) is managed by the campaign admin outside the platform in v1.

---

## 9. Non-Functional Requirements

| Requirement | Spec |
|---|---|
| Page Load | < 2 seconds on 4G (mobile) |
| Mobile-first | All pages must be fully usable on a 375px wide screen |
| SEO | OG meta tags per candidate; robots.txt allows indexing of public pages; `/dashboard` is noindex |
| Rate Limiting | Aspirasi form: 3 req/hour/IP; Registration: 5 req/hour/IP |
| Data Isolation | Supporter and relawan data is strictly scoped to candidate (tenant) |
| Uptime | 99.5% monthly |
| Tracking Links | Unique per relawan per content; short URL format (e.g., `kk.id/[code]`) |

---

## 10. Dependencies & Integrations

| Dependency | Purpose |
|---|---|
| WhatsApp Business API (Wati/Fonnte) | OTP delivery, notifications |
| Midtrans (Phase 3) | Donation on candidate page |
| Leaflet.js + GeoJSON | Supporter map (Phase 2, FR-211) |
| Anthropic API | AI Chatbot on candidate page (Phase 3, FR-301) |
| Meta / TikTok API | View tracking for content (future enhancement) |
| Google Cloud Storage | Media files (photos, videos, membership cards) |

---

## 11. Out of Scope (Web Profile Module v1)

- Direct scheduling or publishing to social media (relawan shares manually)
- Real-time view count fetching from social media APIs (self-reported in v1)
- In-app chat between relawan and admin (replaced by WhatsApp)
- Relawan-to-relawan messaging
- Payment or point redemption within the platform

---

## 12. Open Questions

| # | Question | Owner | Status |
|---|---|---|---|
| 1 | What is the OTP provider for phase 1 — Wati, Fonnte, or Zocket? | Tech Lead | Open |
| 2 | Should view count for daily content be fully self-reported or require admin verification? | Product | Open |
| 3 | Is there a maximum number of tasks a relawan can hold simultaneously? | Product | Open |
| 4 | Should the Pledge Wall (FR-215) be part of the Candidate Profile in v1? | Product | Open |
| 5 | Should relawan registration require admin approval, or be auto-activated after OTP? | Product | Open |
