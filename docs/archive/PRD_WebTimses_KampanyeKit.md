# Product Requirements Document (PRD)
# KampanyeKit — Web Timses (Campaign Team Dashboard)

**Version:** 1.0
**Last Updated:** 2026-04-03
**Status:** Active Development
**Module:** Web Timses — Internal Campaign Team Dashboard
**Parent PRD:** KampanyeKit Platform v1.0
**Related Module:** Web Profile PRD v1.0

---

## 1. Overview

The **Web Timses** is the internal command center used by the campaign team (Tim Sukses) to manage all digital campaign operations. Unlike the public-facing Web Profile, this dashboard is fully authenticated and role-restricted.

It consolidates three domains that are currently fragmented across spreadsheets, WhatsApp groups, and separate ad platforms:

1. **Kampanye Digital** — Unified ads management and performance intelligence across Meta, Google, and TikTok
2. **Kelola Relawan** — Full volunteer lifecycle management: recruitment, task assignment, content tracking, and performance monitoring
3. **Kelola Pendukung** — Supporter data management and geographic analytics

Access URL: `app.kampanyekit.id/timses` or `[slug].kampanyekit.id/timses`

---

## 2. User Roles in Web Timses

| Role | Description | Access Level |
|---|---|---|
| Kandidat | The candidate themselves | Read-only view of all dashboards |
| Koordinator Utama | Head of Tim Sukses, full platform access | Full access |
| Koordinator Wilayah | Area coordinator managing kecamatan-level teams | Scoped to their wilayah |
| Koordinator Kecamatan | Sub-district coordinator | Scoped to their kecamatan |
| Staf Ads | Dedicated digital ads team member | Kampanye Digital only |
| Staf Admin | General campaign admin | Relawan + Pendukung management |

> **Scope Rule:** Coordinators at any level can only view and manage data within their assigned wilayah hierarchy. A Koordinator Wilayah in Semarang cannot see data from Demak.

---

## 3. Module Architecture

```
/timses
├── /dashboard               → Campaign Overview (home)
├── /management profile          
│   ├── /profile             → profile management
│   ├── /berita              → berita and content management
│   ├── /aspirasi            → reply aspirasi management
├── /kampanye-digital
│   ├── /overview            → Unified Ads Dashboard
│   ├── /meta-ads            → Meta Ads Management
│   ├── /google-ads          → Google Ads Management
│   ├── /tiktok-ads          → TikTok Ads Management
│   ├── /budget              → Budget Tracker
│   ├── /audience            → Leads & Audience Analytics
│   └── /insights            → AI-powered Strategy Insights
├── /relawan
│   ├── /list                → Volunteer List & Directory
│   ├── /permintaan          → Volunteer Registration Requests
│   ├── /tugas               → Task Management
│   ├── /konten              → Content Performance per Volunteer
│   └── /statistik           → Volunteer Geographic Statistics
└── /pendukung
    ├── /list                → Supporter Directory
    ├── /statistik           → Supporter Analytics
    └── /peta                → Supporter Geographic Map
```

---

## 4. Module 1 — Kampanye Digital

### 4.1 FR-TS-101: Platform Connection & Setup

**Description:** Before any ads data is visible, Tim Sukses must connect the candidate's ad accounts. This is a one-time setup per platform.

**Supported Platforms:**

| Platform | Connection Method | Data Available |
|---|---|---|
| Meta (Facebook & Instagram) | OAuth 2.0 via Meta Business Login | Campaigns, Ad Sets, Ads, Audiences, Creatives |
| Google Ads | OAuth 2.0 via Google Ads API | Search, Display, YouTube campaigns |
| TikTok Ads | OAuth 2.0 via TikTok Marketing API | Campaigns, Ad Groups, Ads |

**Business Process Flow:**

```
Koordinator Utama opens /timses/kampanye-digital/overview
        │
        ▼
System detects: no platform connected yet
Shows "Hubungkan Platform Iklan Anda" onboarding screen
        │
        ▼
User clicks "Hubungkan Meta Ads"
        │
        ▼
System initiates OAuth flow → opens Meta Business login popup
        │
        ├─── User CANCELS → Returns to onboarding screen, platform = not connected
        │
        └─── User GRANTS PERMISSION
                    │
                    ▼
            System stores access token (encrypted, AES-256)
            System fetches: Ad Account list from Meta
                    │
                    ▼
            User selects which Ad Account to link to this candidate
            (A Meta Business account may manage multiple ad accounts)
                    │
                    ▼
            System runs first data sync (pulls last 30 days of data)
            Platform card shows status = CONNECTED ✓
                    │
                    ▼
            User repeats for Google Ads and TikTok Ads
                    │
                    ▼
            All connected → Redirect to /timses/kampanye-digital/overview
            Dashboard auto-populates with synced data
```

**Data Refresh:** Automatic sync every 30 minutes via background Celery task. Manual "Refresh Now" button available.

**Acceptance Criteria:**
- Tokens stored encrypted at rest; never exposed in frontend
- If token expires or is revoked, system shows alert: "Koneksi Meta Ads terputus. Hubungkan ulang."
- Multiple candidates on the platform cannot share ad account connections
- Disconnect option available per platform (clears token and cached data)

---

### 4.2 FR-TS-102: Ads Overview Dashboard

**Description:** A unified single-screen view that consolidates performance data across all connected platforms, giving Tim Sukses an at-a-glance picture of the entire digital campaign.

**Summary Metric Cards (Top Row):**

| Metric | Description | Source |
|---|---|---|
| Total Reach | Unique people reached across all platforms (deduplicated estimate) | Meta + TikTok + Google |
| Total Impressions | Total ad views across all platforms | All platforms |
| Total Spend | Combined ad spend in IDR | All platforms |
| Avg. CPM | Weighted average Cost Per 1,000 Impressions | All platforms |
| Avg. CTR | Weighted average Click-Through Rate | All platforms |
| Total Clicks | Clicks to landing page / profile | All platforms |
| Cost Per Click | Total Spend ÷ Total Clicks | Calculated |
| Best Platform | Platform with lowest CPM this period | Calculated |

**Charts & Visualizations:**

| Chart | Type | Description |
|---|---|---|
| Daily Reach Trend | Line chart | Last 30 days reach per day, one line per platform |
| Spend Breakdown | Donut chart | % of total spend per platform |
| Impressions vs Reach | Bar chart | Frequency ratio (impressions/reach) per platform |
| CTR Comparison | Horizontal bar | CTR side-by-side per platform |
| Top Performing Ads | Table (top 5) | Best ads by reach across all platforms |

**Filter Controls:**

| Filter | Options |
|---|---|
| Date Range | Last 7 days, Last 14 days, Last 30 days, Last 90 days, Custom range |
| Platform | All, Meta only, Google only, TikTok only |
| Campaign | All campaigns, or select specific campaign |

**Business Process Flow:**

```
User opens /timses/kampanye-digital/overview
        │
        ▼
System fetches latest synced data from cache (Redis)
Applies default filter: All Platforms, Last 30 Days
        │
        ▼
Dashboard renders metric cards and charts
        │
        ├─── User changes date range filter
        │           │
        │           └─── System re-queries DB, updates all widgets reactively
        │
        ├─── User clicks metric card (e.g., "Total Reach")
        │           │
        │           └─── Drilldown panel opens: breakdown by platform + trend
        │
        ├─── User clicks "Top Performing Ads" row
        │           │
        │           └─── Opens Ad Detail view (creative preview + full metrics)
        │
        └─── User clicks "Refresh Now"
                    │
                    └─── System triggers manual sync from platform APIs
                         Shows "Sedang menyinkronkan..." spinner
                         Updates data on completion
```

**Acceptance Criteria:**
- Dashboard loads in < 3 seconds with cached data
- If no data in cache, show skeleton loaders while fetching
- Currency always displayed in IDR (converted from USD if platform bills in USD using daily exchange rate)
- Export button: download full dashboard data as CSV or PDF report

---

### 4.3 FR-TS-103: Per-Platform Ads Management

**Description:** Deep-dive management pages for each connected platform (Meta, Google, TikTok). Each platform page follows the same structural pattern but surfaces platform-specific metrics.

#### 4.3.1 Campaign Hierarchy View

Each platform page shows a 3-level hierarchy:

```
Campaign
└── Ad Set / Ad Group
    └── Ad (Creative)
```

**Column Defaults per level:**

| Level | Columns Shown |
|---|---|
| Campaign | Name, Status, Objective, Budget, Spend, Reach, Impressions, Results, Cost per Result |
| Ad Set / Ad Group | Name, Status, Audience, Placement, Budget, Spend, Reach, CTR, CPM |
| Ad | Name, Status, Creative Preview (thumbnail), Spend, Reach, Impressions, CTR, CPC, Frequency |

**Actions available from this view:**

| Action | Description |
|---|---|
| Toggle Status | Pause / Resume a campaign, ad set, or ad (calls platform API) |
| Duplicate | Duplicate a campaign or ad set (opens pre-filled form) |
| View Creative | Preview the ad image/video and copy text |
| Add to Library | Save creative to Ad Creative Library (FR-206) |
| Edit Budget | Inline edit of daily or lifetime budget (calls API) |

#### 4.3.2 Meta Ads — Specific Features

**Audience Breakdown (per Ad Set):**

| Dimension | Data Available |
|---|---|
| Gender | % reach: Laki-laki / Perempuan / Tidak diketahui |
| Age Group | % reach across: 18–24, 25–34, 35–44, 45–54, 55–64, 65+ |
| Device | Mobile vs Desktop breakdown |
| Placement | Feed, Reels, Stories, Marketplace, Audience Network |
| Region | Province and city-level reach (based on Meta geo data) |

**Meta-Specific Metrics:**

| Metric | Description |
|---|---|
| Frequency | Avg times a person saw the ad |
| Video Retention | % of video watched (25%, 50%, 75%, 100%) |
| Post Reactions | Likes, Comments, Shares, Saves |
| Link Clicks vs Landing Page Views | Drop-off between click and actual page load |
| Relevance Score / Quality Ranking | Meta's quality, engagement, and conversion rate ranking |

#### 4.3.3 TikTok Ads — Specific Features

**TikTok-Specific Metrics:**

| Metric | Description |
|---|---|
| Video Views | Total video plays |
| 2-Second View Rate | % who watched at least 2 seconds |
| 6-Second View Rate | % who watched at least 6 seconds |
| Video Completion Rate | % who watched 100% |
| Profile Visits | Visits to TikTok profile from ad |
| Follows | New followers from ad |
| Hashtag Performance | If hashtag challenge is used — views and participants |

#### 4.3.4 Google Ads — Specific Features

**Google-Specific Metrics:**

| Metric | Description |
|---|---|
| Search Impression Share | % of eligible searches where ad appeared |
| Quality Score | 1–10 score per keyword |
| Top Keywords | Keywords driving most clicks and spend |
| Search Terms Report | Actual search terms triggering ads |
| Display Placements | Websites/apps where Display ads appeared |
| YouTube View Rate | % of YouTube video ads watched to completion |

**Business Process Flow (Pausing an Ad):**

```
User opens /timses/kampanye-digital/meta-ads
        │
        ▼
User finds underperforming ad in the table
Clicks toggle: Active → Paused
        │
        ▼
System shows confirmation modal:
"Yakin ingin menjeda iklan [Ad Name]? Iklan tidak akan tayang."
        │
        ├─── User CANCELS → Toggle reverts, no change
        │
        └─── User CONFIRMS
                    │
                    ▼
            System calls Meta Ads API: update ad status = PAUSED
                    │
                    ├─── API SUCCESS → Ad status updated in DB and UI
                    │                  Audit log entry recorded
                    │
                    └─── API ERROR → Toast error shown:
                                     "Gagal menjeda iklan. Coba lagi."
                                     Toggle reverts to original state
```

---

### 4.4 FR-TS-104: Campaign Budget Tracker

**Description:** A financial control panel that gives Tim Sukses full visibility into how campaign budget is being allocated and consumed across platforms, with alerts before overspend occurs.

**Budget Configuration (per campaign cycle):**

| Field | Description |
|---|---|
| Total Digital Budget | Total IDR allocated for digital ads this period |
| Period | Start date to end date |
| Per-Platform Allocation | Amount allocated to Meta, Google, TikTok (must sum ≤ total budget) |
| Alert Threshold | % of budget spend that triggers alert (default: 80%) |

**Budget Dashboard Elements:**

| Element | Description |
|---|---|
| Budget Health Bar | Visual bar: Total Allocated vs Total Spent (color: green < 60%, yellow 60–80%, red > 80%) |
| Per-Platform Budget Cards | Allocated / Spent / Remaining per platform with mini progress bar |
| Daily Burn Rate | Avg IDR spent per day; projected days until budget depletion |
| Projected Total Spend | If current daily burn continues, estimated total spend at period end |
| Overspend Alert Banner | Shows if any platform exceeds its allocation |
| Budget History | Log of all budget changes with timestamp and user |

**Business Process Flow:**

```
Koordinator Utama opens /timses/kampanye-digital/budget
        │
        ▼
If no budget configured → "Atur Anggaran Kampanye" setup wizard
        │
        ▼
User inputs: Total Budget, Period, Per-Platform Allocation
System validates: sum of allocations ≤ total budget
        │
        ▼
Budget saved → Dashboard populates
        │
        ▼
Background task runs every 30 min:
Fetches actual spend from Meta, Google, TikTok APIs
Updates "Total Spent" per platform
        │
        ▼
System checks alert condition:
(Total Spent / Total Allocated) × 100 ≥ alert_threshold?
        │
        ├─── YES → Send alert:
        │          - In-app notification to Koordinator Utama and Staf Ads
        │          - WhatsApp message: "Anggaran iklan digital telah mencapai 80%.
        │            Total terpakai: Rp X dari Rp Y."
        │
        └─── NO → No action, next check in 30 minutes
```

**Acceptance Criteria:**
- Budget inputs are in IDR; platform spend in USD is auto-converted
- Alert fires once per threshold crossing (not repeatedly)
- Budget can be updated mid-period; history of changes is logged
- "Sisa Anggaran" (remaining budget) is always shown prominently

---

### 4.5 FR-TS-105: Audience & Leads Analytics Dashboard

**Description:** A dedicated analytics view focused on understanding who is being reached by the campaign — breaking down audience demographics, geographic reach, and behavioral signals across all platforms.

**Section 1 — Demographic Breakdown**

| Dimension | Visualizations |
|---|---|
| Gender | Donut chart: % Male / Female / Unknown; trend over time |
| Age Group | Stacked bar chart: reach per age band per platform |
| Gender × Age Cross-tab | Heatmap: which gender+age combo has best CTR / lowest CPM |
| Device Type | Bar chart: Mobile vs Desktop vs Tablet per platform |
| Platform Placement | Bar chart: which placement (Feed, Reels, Stories, etc.) drives most reach |

**Section 2 — Geographic Reach**

| Dimension | Visualizations |
|---|---|
| Province-level Map | Choropleth map: reach intensity per province |
| City/Kabupaten Breakdown | Ranked table: top 20 cities by reach volume |
| Dapil Overlap | How much of the ad reach falls within the candidate's dapil (estimated) |
| Top vs Bottom Wilayah | Which areas are under-reached relative to voter population |
| Reach per Platform by Region | Side-by-side comparison: which platform reaches more people in the target dapil |

**Section 3 — Behavioral & Intent Signals**

| Signal | Source | Description |
|---|---|---|
| Link Click Rate by Creative Type | All platforms | Image vs Video vs Carousel CTR comparison |
| Audience Retention Funnel | Meta + TikTok | Impression → Click → Landing Page View → Supporter Registration |
| Best Time of Day | All platforms | Hourly reach distribution (heat chart: hour × day of week) |
| Best Day of Week | All platforms | Which day drives highest reach and lowest CPM |
| Content Theme Performance | Tagged ads | Reach and CTR per campaign theme (Infrastruktur, Pendidikan, etc.) |
| Frequency vs Fatigue | Meta | Frequency trend — high frequency with declining CTR signals ad fatigue |

**Section 4 — Conversion Tracking (Supporter Acquisition)**

| Metric | Description |
|---|---|
| Landing Page Visits from Ads | Visits to candidate page attributed to ad click (UTM-based) |
| Supporter Registrations from Ads | Supporter form submissions with UTM source = ads |
| Cost Per Supporter Registration | Total spend ÷ supporter registrations attributed to ads |
| Supporter-to-Ad Attribution Rate | % of new supporters who came via a paid ad |

**Business Process Flow:**

```
User opens /timses/kampanye-digital/audience
        │
        ▼
System loads demographic data from last sync
Default view: All Platforms, Last 30 Days
        │
        ▼
User selects a specific platform or campaign to drill down
        │
        ▼
User selects geographic filter: Province → Kabupaten/Kota → Kecamatan
        │
        ▼
All charts and tables update reactively to the applied filters
        │
        ├─── User clicks on a province on the map
        │           │
        │           └─── Side panel opens: platform breakdown + age/gender for that province
        │
        └─── User clicks "Export"
                    │
                    └─── Downloads full audience report as CSV or PDF
                         Data segmented by: platform, demographic, wilayah
```

---

### 4.6 FR-TS-106: Strategy Insights & Recommendations

**Description:** An AI-assisted insights panel that translates raw ad data into actionable recommendations for the campaign team in plain Bahasa Indonesia.

**Insight Categories:**

| Category | Example Insight |
|---|---|
| Budget Reallocation | "CPM di TikTok (Rp 12.400) 40% lebih murah dari Meta (Rp 20.700) untuk kelompok usia 25–34. Pertimbangkan memindahkan Rp 2 juta dari Meta ke TikTok untuk efisiensi yang lebih tinggi." |
| Audience Gap | "Hanya 12% jangkauan Anda yang berada di wilayah Dapil 3 (Semarang Selatan). Buat kampanye geo-targeted untuk meningkatkan kehadiran di wilayah ini." |
| Ad Fatigue Warning | "Iklan 'Program Kesehatan Gratis' memiliki frekuensi rata-rata 7.2x dengan CTR turun 60% dalam 7 hari. Saatnya refresh creative." |
| Best Time to Run | "Jangkauan tertinggi terjadi pada Selasa–Kamis pukul 19:00–21:00. Jadwalkan iklan baru pada jam-jam ini." |
| Theme Performance | "Konten bertema Pendidikan memiliki CTR 2.8x lebih tinggi dibanding tema Infrastruktur di semua platform." |
| Competitor Activity | "Aktivitas konten organik kompetitor meningkat 40% minggu ini. Pertimbangkan meningkatkan frekuensi penayangan." |

**Business Process Flow:**

```
System runs nightly analysis job (Celery scheduled task):
        │
        ▼
Reads last 30 days of ads data per candidate from DB
Applies rule-based and AI analysis:
  - Budget efficiency comparison across platforms
  - Frequency vs CTR trend detection (fatigue check)
  - Geographic coverage vs dapil map overlay
  - Theme/creative performance ranking
  - Best hour/day pattern extraction
        │
        ▼
Generates 3–7 insight cards per candidate
Stores in DB with: category, priority, generated_at, is_read
        │
        ▼
User opens /timses/kampanye-digital/insights
        │
        ▼
Insights displayed as cards, sorted by priority (HIGH → MEDIUM → LOW)
Each card shows:
  - Insight title
  - Data-backed explanation
  - Recommended action button
        │
        ├─── User clicks "Terapkan Rekomendasi" (where applicable)
        │           │
        │           └─── For budget move: opens Budget Tracker with pre-filled suggestion
        │                For ad pause: opens Ads Management with ad pre-selected
        │
        └─── User clicks "Abaikan"
                    │
                    └─── Card dismissed, not shown again (logged as ignored)
```

---

## 5. Module 2 — Kelola Relawan

### 5.1 FR-TS-201: Relawan List & Directory

**Description:** A searchable, filterable master list of all volunteers for this candidate, with full profile and performance data per volunteer.

**Relawan Table Columns:**

| Column | Description |
|---|---|
| Nama | Full name (link to relawan profile) |
| Nomor HP | WhatsApp number |
| Wilayah | Kecamatan / Kabupaten |
| Role | Koordinator Wilayah / Koordinator Kecamatan / Relawan |
| Status | Active / Inactive / Suspended |
| Tugas Selesai | Count of completed tasks |
| Pendukung Rekrutan | Count of supporters registered |
| Konten Dibagikan | Count of content items shared |
| Total Poin | Accumulated reward points |
| Tanggal Bergabung | Registration date |
| Aksi | Edit, Nonaktifkan, Hapus |

**Filter & Search Controls:**

| Control | Options |
|---|---|
| Search | By nama or nomor HP |
| Wilayah | Province → Kabupaten → Kecamatan cascade |
| Role | All, Koordinator Wilayah, Koordinator Kecamatan, Relawan |
| Status | All, Active, Inactive, Suspended |
| Sort | By: Nama, Tanggal Bergabung, Poin, Tugas Selesai, Pendukung |

**Business Process Flow (Adding a Relawan Manually):**

```
Admin opens /timses/relawan/list
Clicks "+ Tambah Relawan"
        │
        ▼
Modal form opens:
- Nama Lengkap, Nomor HP, Email, Wilayah, Role
        │
        ▼
System validates: nomor HP not already registered for this candidate
        │
        ├─── DUPLICATE → Error: "Nomor HP sudah terdaftar"
        │
        └─── VALID
                    │
                    ▼
            Relawan account created (status = ACTIVE, source = MANUAL_ADD)
            WhatsApp welcome message sent with login instructions
            Relawan appears in list
```

**Business Process Flow (Removing a Relawan):**

```
Admin clicks "Nonaktifkan" on a relawan record
        │
        ▼
Confirmation modal: "Nonaktifkan [Nama]? Relawan tidak dapat login
atau menerima tugas baru."
        │
        ├─── CANCEL → No action
        │
        └─── CONFIRM
                    │
                    ▼
            Relawan status = INACTIVE
            Active sessions invalidated (forced logout)
            All open tasks assigned to this relawan → status = UNASSIGNED (returned to pool)
            In-app notification to relevant coordinator
```

---

### 5.2 FR-TS-202: Volunteer Registration Requests

**Description:** A review queue for volunteers who self-registered through the public Web Profile (/relawan). Admins can approve, reject, or request additional information.

**Request Queue Columns:**

| Column | Description |
|---|---|
| Nama | Applicant name |
| Nomor HP | WhatsApp number |
| Wilayah | Kecamatan / Kabupaten dari registrasi |
| Alasan Bergabung | Submitted motivation text |
| Referral Dari | Which relawan referred them (if any) |
| Tanggal Daftar | Registration submission timestamp |
| Status | Pending / Approved / Rejected |
| Aksi | Approve, Reject, Hubungi (opens WhatsApp) |

**Business Process Flow:**

```
New volunteer completes registration on Web Profile (FR-WP-103)
OTP verified → Account status = PENDING_APPROVAL (if admin review required)
        │
        ▼
System sends in-app notification to Koordinator:
"Permintaan relawan baru: [Nama] dari [Kecamatan]"
        │
        ▼
Koordinator opens /timses/relawan/permintaan
Reviews request details
        │
        ├─── APPROVE
        │       │
        │       ▼
        │   Relawan status = ACTIVE
        │   WhatsApp to relawan: "Selamat! Pendaftaran Anda sebagai relawan
        │   [Nama Kandidat] telah disetujui. Silakan login."
        │   Referral credit granted to referring relawan (if applicable)
        │
        ├─── REJECT
        │       │
        │       ▼
        │   Admin fills rejection reason (optional)
        │   Relawan status = REJECTED
        │   WhatsApp to relawan: "Terima kasih telah mendaftar. Saat ini
        │   kami belum dapat memproses pendaftaran Anda."
        │
        └─── HUBUNGI
                │
                └─── Opens pre-filled WhatsApp link to applicant's number
                     Admin can clarify before making decision
```

> **Config Note:** Admin can toggle whether new volunteer registrations require manual approval or are auto-activated after OTP. This setting is in /timses/settings.

---

### 5.3 FR-TS-203: Task Management (Kelola Tugas)

**Description:** The full task management interface for creating, assigning, tracking, and closing tasks across the volunteer network.

**Task Object (Full Fields):**

| Field | Type | Description |
|---|---|---|
| Judul Tugas | Text | Short task title |
| Deskripsi | Rich text | Full instructions, can include images |
| Kategori | Dropdown | Sosialisasi, Pembagian Materi, Pendataan, Event, Digital |
| Wilayah Target | Multi-select | Which kecamatan/kelurahan this task applies to |
| Role Target | Multi-select | Which roles can see/take this task |
| Deadline | Date + time | Task must be completed by this time |
| Poin Reward | Number | Points awarded on completion |
| Kapasitas | Number | Max volunteers who can take this task (blank = unlimited) |
| Bukti Diperlukan | Toggle | Does completion require photo/file upload? |
| Review Required | Toggle | Does admin need to verify before points are credited? |
| Status | System | Open / Full / Closed / Archived |

**Task Board View:**

Tasks are displayed in a Kanban-style board with the following columns:

| Column | Tasks Shown |
|---|---|
| Draft | Created but not yet published |
| Open | Published, available to take |
| In Progress | Being worked on by one or more relawan |
| Under Review | Submitted by relawan, pending admin review |
| Completed | Fully closed and points credited |

**Business Process Flow (Creating and Publishing a Task):**

```
Admin opens /timses/relawan/tugas
Clicks "+ Buat Tugas Baru"
        │
        ▼
Task creation form opens
Admin fills all required fields
        │
        ▼
Admin clicks "Simpan sebagai Draft" OR "Publikasikan"
        │
        ├─── DRAFT → Task saved, status = DRAFT, not visible to relawan
        │
        └─── PUBLISH
                    │
                    ▼
            System validates: deadline > now, at least one wilayah selected
                    │
                    ├─── INVALID → Inline errors shown
                    │
                    └─── VALID
                                │
                                ▼
                        Task status = OPEN
                        Visible to relawan in matching wilayah + role
                        Push notification sent (if enabled):
                        "Tugas baru tersedia: [Judul Tugas]"
```

**Business Process Flow (Tracking Task Completion):**

```
Relawan submits task completion (from Web Profile dashboard)
        │
        ▼
Task entry for this relawan → status = SUBMITTED
Admin sees task in "Under Review" column
        │
        ▼
Admin opens submission:
- Views completion notes from relawan
- Views uploaded photo/file (if required)
- Views submission timestamp and relawan location (optional)
        │
        ├─── APPROVE
        │       │
        │       ▼
        │   Task entry status = COMPLETED
        │   Points credited to relawan's account
        │   WhatsApp to relawan: "Tugas '[Judul]' Anda telah diverifikasi!
        │   +[X] poin telah ditambahkan ke akun Anda."
        │
        └─── REJECT
                │
                ▼
            Admin fills rejection reason
            Task entry status = REJECTED
            Relawan notified: "Tugas '[Judul]' belum dapat diverifikasi.
            Alasan: [reason]. Silakan ulangi."
            Relawan can resubmit
```

**Task Tracking Table (per task):**

| Column | Description |
|---|---|
| Nama Relawan | Name (with link to profile) |
| Wilayah | Relawan's kecamatan |
| Status | Not Taken / In Progress / Submitted / Completed / Rejected |
| Tanggal Ambil | When task was accepted |
| Tanggal Submit | When completion was submitted |
| Bukti | Link to uploaded photo/file |
| Poin | Credited / Pending |

---

### 5.4 FR-TS-204: Volunteer Statistics & Geographic Overview

**Description:** An analytics view showing the distribution and performance of the volunteer network across the candidate's region.

**Section 1 — Summary Cards:**

| Metric | Description |
|---|---|
| Total Relawan Aktif | All active volunteers |
| Relawan Baru Bulan Ini | New registrations this month |
| Tingkat Aktivitas | % relawan who completed ≥1 task or shared ≥1 content this month |
| Rata-rata Poin per Relawan | Average points across all active relawan |

**Section 2 — Geographic Distribution:**

| View | Description |
|---|---|
| Peta Relawan | Choropleth map showing relawan density per kecamatan |
| Tabel per Kabupaten | Kabupaten → Total relawan, active this month, avg points |
| Tabel per Kecamatan | Kecamatan → Total relawan, active this month, tasks completed |
| Coverage Gap | Kecamatan with 0 or < 3 relawan highlighted in red |

**Section 3 — Performance Leaderboard:**

| Column | Description |
|---|---|
| Rank | 1–N overall |
| Nama | Relawan name |
| Wilayah | Kecamatan |
| Tugas Selesai | Task completion count |
| Pendukung Rekrutan | Supporter count |
| Konten Dibagikan | Content shared count |
| Total Views | Total views generated from shared content |
| Total Poin | Overall score |

Filter leaderboard by: time period (this week / this month / all time), wilayah, role.

---

### 5.5 FR-TS-205: Content Performance per Volunteer

**Description:** Tracks the content-sharing activity of each volunteer — which content they shared, on what platform, and how many views it generated.

**Content Activity Table (filtered per relawan or all relawan):**

| Column | Description |
|---|---|
| Nama Relawan | Volunteer name |
| Judul Konten | Content item title |
| Platform | Platform where content was shared |
| Tanggal Share | Date shared |
| URL Post | Link submitted as proof |
| Views Dilaporkan | Self-reported view count |
| Status Verifikasi | Pending / Verified / Rejected |
| Poin Diperoleh | Points credited for this item |

**Aggregate per Relawan:**

| Metric | Description |
|---|---|
| Total Konten Dibagikan | Count of content items shared (all time) |
| Total Views Dilaporkan | Sum of all reported views |
| Total Poin dari Konten | Sum of points earned from content sharing |
| Platform Favorit | Platform this relawan shares most on |
| Konten Terpopuler | Their single highest-viewed shared post |

**Business Process Flow (Admin Verifying Content Proof):**

```
Relawan submits content share proof (URL or screenshot) from Web Profile
        │
        ▼
Admin sees pending verification in /timses/relawan/konten
Filter: Status = Pending Verification
        │
        ▼
Admin opens submission:
- Views URL or screenshot
- Checks that post is visible and matches the content item
        │
        ├─── VERIFY → Status = Verified
        │             Views count accepted
        │             Points calculated and credited
        │
        └─── REJECT → Admin fills reason
                       Status = Rejected
                       Relawan notified, no points credited
                       Relawan can re-submit with corrected proof
```

---

## 6. Module 3 — Kelola Pendukung

### 6.1 FR-TS-301: Supporter Directory

**Description:** A searchable, filterable list of all registered supporters for this candidate, regardless of registration source.

**Supporter Table Columns:**

| Column | Description |
|---|---|
| Nama | Full name |
| Nomor HP | Phone number (masked: 0812-****-1234) |
| Jenis Kelamin | Laki-laki / Perempuan |
| Usia | Age (if provided) |
| Kelurahan | Village |
| Kecamatan | Sub-district |
| Kabupaten/Kota | City/Regency |
| TPS | Polling station (if provided) |
| Sumber | How registered: Mandiri (self-reg), Relawan Manual, Link Relawan, QR Event |
| Dirujuk Oleh | Relawan name (if referred) |
| Tanggal Daftar | Registration date |

**Filter Controls:**

| Control | Options |
|---|---|
| Search | By nama or nomor HP |
| Wilayah | Kabupaten → Kecamatan → Kelurahan cascade |
| Sumber | All, Mandiri, Relawan Manual, Link Relawan, Event |
| Jenis Kelamin | All, Laki-laki, Perempuan |
| Tanggal Daftar | Date range picker |

**Export:**
- CSV export with all fields (admin only; phone numbers unmasked in export)
- Excel export with wilayah-based grouping

---

### 6.2 FR-TS-302: Supporter Analytics Dashboard

**Description:** Statistical overview of the supporter base with demographic and geographic breakdowns to inform campaign strategy.

**Section 1 — Summary Cards:**

| Metric | Description |
|---|---|
| Total Pendukung | All-time registered supporters |
| Pendukung Baru Bulan Ini | New registrations this month |
| Pendukung Baru Minggu Ini | New registrations this week |
| Pertumbuhan vs Bulan Lalu | % change in supporter count |

**Section 2 — Growth Trend:**

| Chart | Description |
|---|---|
| Daily Registration Chart | Line chart: new supporters per day (last 30/60/90 days) |
| Cumulative Supporter Curve | Running total of supporters over time |
| Growth by Source | Stacked area chart: Mandiri vs Relawan Manual vs Link Relawan vs Event per day |

**Section 3 — Demographic Breakdown:**

| Dimension | Visualization |
|---|---|
| Gender Split | Donut chart: Laki-laki / Perempuan / Tidak Diketahui |
| Age Distribution | Bar chart: age bands (< 20, 20–29, 30–39, 40–49, 50–59, 60+) |
| Gender × Age | Stacked bar: age bands split by gender |

**Section 4 — Geographic Breakdown:**

| View | Description |
|---|---|
| Supporter Map | Choropleth heatmap per kecamatan — supporter density |
| Ranking Kabupaten/Kota | Ranked table: most to fewest supporters per kabupaten |
| Ranking Kecamatan | Ranked table: most to fewest supporters per kecamatan |
| Coverage vs Voter Population | Estimated % of voters reached per kecamatan (requires voter population data input) |
| Blank Spot Alert | Kecamatan within dapil with 0 registered supporters |

**Section 5 — Source Attribution:**

| Metric | Description |
|---|---|
| Sumber Breakdown | Donut: % from each registration source |
| Top Relawan Recruiters | Table: top 10 relawan by supporter count referred |
| Event Registrations | Count of supporters registered via event check-in or QR |
| Self-Registration Rate | % who registered independently via the candidate page |

**Business Process Flow:**

```
Admin opens /timses/pendukung/statistik
        │
        ▼
System loads supporter count and analytics data from DB
Default view: All time, All wilayah
        │
        ▼
Admin applies geographic filter: selects specific Kabupaten → Kecamatan
        │
        ▼
All charts and tables update reactively
        │
        ├─── Admin clicks kecamatan on map
        │           │
        │           └─── Side panel: supporter list for that kecamatan
        │                + top relawan recruiters in that area
        │
        ├─── Admin identifies "Blank Spot" kecamatan (0 supporters)
        │           │
        │           └─── Shortcut: "Buat Tugas Canvassing di Area Ini"
        │                Pre-fills a new task with that kecamatan as target wilayah
        │
        └─── Admin clicks "Export"
                    │
                    └─── Exports supporter list filtered by current view
                         as CSV or Excel
```

---
## 7. Module 3 — Kelola Web Profile

### 7.1 FR-TS-501: Manajemen Profil

**Description:** An interface for managing candidate information, vision & mission, flagship programs, and social media links displayed on the public Web Profile.

**Profile Form Fields:**

| Section | Field | Description |
|---|---|---|
| Status Konten | Status Web | Toggle: PUBLISHED (aktif) / PAUSED (pemeliharaan) |
| Hero Section | Foto Kandidat | Upload file (JPG/PNG/WEBP) |
| | Nama Lengkap | Text input |
| | Nomor Urut | Number input |
| | Partai & Dapil | Text input |
| | Tagline | Short text |
| Visi & Misi | Visi | Textarea |
| | Misi | Dynamic list (max 10 items) |
| Program Unggulan | Card Konten | Icon, Title, and Short Description (dynamic cards) |
| Social Links | Tautan Sosmed | URL Inputs: Instagram, TikTok, Facebook, Twitter, YouTube |

**Business Process Flow:**

Admin opens /timses/management-profile/berita
        │
        ▼
System loads list of news articles
        │
        ├─── Admin clicks "+ Tulis Berita"
        │           │
        │           └─── Opens Rich Text Editor to create new article
        │
        ├─── Admin clicks existing article
        │           │
        │           └─── Admin can edit content, change category, or delete
        │
        └─── Admin selects save action:
                    │
                    ├─── Clicks "Simpan sebagai Draft"
                    │           │
                    │           └─── Status = DRAFT, hidden from public
                    │
                    └─── Clicks "Publikasikan"
                                │
                                └─── Status = PUBLISHED, appears on web profile
                                
### 7.2 FR-TS-502: Kelola Berita

**Description:** A searchable and filterable list of all news articles and updates published on the candidate's web profile.

**Berita Table Columns:**

| Column | Description |
|---|---|
| Judul Berita | Title of the article |
| Kategori | Kegiatan / Program / Pengumuman / Media |
| Tanggal Dibuat | Date of creation |
| Tanggal Publikasi | Date published to live site (if applicable) |
| Status | DRAFT / PUBLISHED |
| Views | Read counter on the public page |

**Filter Controls:**

| Control | Options |
|---|---|
| Search | By judul berita |
| Kategori | All, Kegiatan, Program, Pengumuman, Media |
| Status | All, Draft, Published |
| Tanggal | Date range picker |

**Business Process Flow:**
Admin opens /timses/management-profile/berita
        │
        ▼
System loads list of news articles
        │
        ├─── Admin clicks "+ Tulis Berita"
        │           │
        │           └─── Opens Rich Text Editor to create new article
        │
        ├─── Admin clicks existing article
        │           │
        │           └─── Admin can edit content, change category, or delete
        │
        └─── Admin selects save action:
                    │
                    ├─── Clicks "Simpan sebagai Draft"
                    │           │
                    │           └─── Status = DRAFT, hidden from public
                    │
                    └─── Clicks "Publikasikan"
                                │
                                └─── Status = PUBLISHED, appears on web profile
                                
                                
---

### 5.3 FR-TS-503: Kelola Aspirasi

**Description:** An inbox management system to view, categorize, and respond to public aspirations sent via the web profile.

**Aspirasi Table Columns:**

| Column | Description |
|---|---|
| Pengirim | Name of sender (hidden if sender opted for anonymous) |
| Nomor HP | Phone number for follow-up (masked: 0812-****-1234) |
| Wilayah | Kelurahan & Kecamatan |
| Tema | Infrastruktur / Kesehatan / Pendidikan / Ekonomi / Lainnya |
| Isi Aspirasi | Truncated message text |
| Tanggal Masuk | Timestamp when submitted |
| Status | UNREAD / ADDRESSED / ARCHIVED |

**Filter Controls:**

| Control | Options |
|---|---|
| Search | By pengirim or isi aspirasi |
| Wilayah | Kecamatan → Kelurahan cascade |
| Tema | All, Infrastruktur, Kesehatan, Pendidikan, Ekonomi, Lainnya |
| Status | All, Unread, Addressed, Archived |

**Business Process Flow:**
Admin opens /timses/management-profile/aspirasi
        │
        ▼
System loads inbox with UNREAD aspirations at the top
        │
        ▼
Admin clicks a message to read full details
        │
        ▼
Admin decides on follow-up method:
        │
        ├─── Admin clicks "Balas Publik" (If sender permitted display)
        │           │
        │           └─── Admin types response and clicks submit.
        │                Reply is displayed on public web profile
        │
        ├─── Admin clicks "Balas Privat"
        │           │
        │           └─── System redirects to WhatsApp Web/App using unmasked
        │                phone number
        │
        └─── Admin clicks "Tandai Selesai" / "Arsipkan"
                    │
                    └─── Status updates to ADDRESSED / ARCHIVED
                                    
------


## 8. Campaign Overview Dashboard (Home)

The `/timses/dashboard` landing page gives all roles a high-level read on campaign health.

**Dashboard Widgets:**

| Widget | Data |
|---|---|
| Campaign Health Score | Composite score (0–100) based on: ad performance, volunteer activity, supporter growth |
| Total Supporters | Count + trend (↑/↓ vs last week) |
| Total Reach (Ads) | Combined reach across all platforms this month |
| Total Ad Spend | Spend this month vs budget |
| Active Volunteers | Count of volunteers active this month |
| Tasks Pending Review | Count of task submissions awaiting admin review |
| Pending Relawan Requests | Count of volunteer registrations awaiting approval |
| Recent Activity Feed | Last 20 events: new supporter, task completed, ad spend alert, new relawan |
| Quick Actions | Buttons: Buat Tugas, Tambah Relawan, Lihat Laporan |

---

## 9. Reporting

### 9.1 FR-TS-401: Weekly Auto-Report

Auto-generated every Monday and emailed to Kandidat and Koordinator Utama.

**Report Sections:**

| Section | Content |
|---|---|
| Ringkasan Eksekutif | Campaign health score, key wins, key concerns |
| Performa Iklan | Total spend, reach, CPM, CTR per platform; vs previous week |
| Pertumbuhan Pendukung | New supporters this week, total, top kecamatan |
| Aktivitas Relawan | Tasks completed, top 5 relawan, new recruits |
| Konten Viral | Highest-view content shared by relawan this week |
| Rekomendasi | Top 3 action items for the upcoming week |

### 9.2 FR-TS-402: On-Demand Reports

Admin can generate a custom report for any date range covering:
- Ads performance summary
- Supporter growth by wilayah
- Volunteer performance ranking
- Budget spend breakdown

Output format: PDF or Excel.

---

## 10. Non-Functional Requirements

| Requirement | Specification |
|---|---|
| Authentication | Email + password or WhatsApp OTP; JWT session tokens |
| Authorization | Role-based access control (RBAC); wilayah-scoped data access |
| Data Isolation | Multi-tenant: each candidate's data is strictly isolated |
| API Refresh | Ads data synced every 30 minutes via Celery background tasks |
| Dashboard Load | < 3 seconds with cached data (Redis); skeleton loaders during fetch |
| Export Performance | CSV/Excel export for up to 50,000 records; async generation for large exports |
| Audit Log | All data modification actions logged with user, timestamp, action (FR-313) |
| Mobile Responsive | Timses dashboard optimized for tablet and desktop; mobile view read-only |
| Security | OWASP Top 10 compliance; all platform API keys encrypted AES-256 |
| Uptime | 99.5% monthly SLA |

---

## 11. Dependencies & Integrations

| Dependency | Purpose |
|---|---|
| Meta Marketing API | Campaign data, audience insights, ad status control |
| Google Ads API | Search, Display, YouTube campaign data |
| TikTok Marketing API | Campaign data, video metrics |
| Anthropic API (claude-sonnet-4-20250514) | Strategy insight generation (FR-TS-106) |
| WhatsApp Business API (Wati/Fonnte) | Notifications to coordinators and relawan |
| Celery + Redis | Background sync jobs, scheduled reports |
| Leaflet.js + Indonesia GeoJSON | Geographic maps (relawan density, supporter heatmap) |
| Midtrans (Phase 3) | Donation management |

---

## 12. Out of Scope (Web Timses v1)

- Direct ad creation / publishing from within KampanyeKit (view and control only)
- Automated budget reallocation without human confirmation
- Real-time (< 1 min) ads data refresh
- Cross-candidate benchmarking
- Competitor ad spend estimation
- Deepfake or disinformation detection

---

## 13. Open Questions

| # | Question | Owner | Status |
|---|---|---|---|
| 1 | Should Koordinator Wilayah be able to create tasks, or is task creation Koordinator Utama only? | Product | Open |
| 2 | Is voter population data per kecamatan available to compute reach coverage %? | Research | Open |
| 3 | Should content view count verification be manual (admin review) or AI-assisted (image parsing of screenshot)? | Tech | Open |
| 4 | Is the Campaign Health Score formula defined, or should product define it before dev? | Product | Open |
| 5 | For Google Ads, is conversion tracking (supporter registration as conversion goal) in scope for v1? | Tech | Open |
| 6 | Should the weekly auto-report be a PDF email attachment or an in-app report with email link? | Product | Open |
