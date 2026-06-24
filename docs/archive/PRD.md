# Product Requirements Document (PRD)
# KampanyeKit — Digital Political Campaign Manager Platform

**Version:** 1.0  
**Last Updated:** 2026-03-31  
**Status:** Active Development  
**Target Market:** Indonesia (Caleg DPRD, Calon Bupati/Walikota, Calon Gubernur)

---

## 1. Executive Summary

KampanyeKit is a SaaS platform that enables Indonesian political candidates to manage their entire campaign digitally — from a candidate landing page to unified ads management, tim sukses coordination, supporter membership, and AI-powered analytics. The platform replaces fragmented tools (WhatsApp groups, Excel sheets, separate ad dashboards) with a single, measurable system.

**Core Value Proposition:** Replace expensive, untrackable offline campaign spending with a measurable digital campaign command center.

---

## 2. Problem Statement

Indonesian political campaigns face three critical inefficiencies:

1. **Untrackable spending** — Baliho and physical materials cost Rp 5–10 juta each with zero viewership data
2. **Fragmented team coordination** — Tim sukses managed via WhatsApp groups, no accountability or tracking
3. **No digital infrastructure** — Most candidates lack a proper digital presence or unified ads management

---

## 3. Target Users

| User Type | Description | Primary Need |
|---|---|---|
| Kandidat | Caleg DPRD / Calon Kepala Daerah | Campaign overview, budget tracking, performance |
| Tim Sukses | Campaign team coordinators | Task management, referral tracking, team coordination |
| Relawan | Ground-level volunteers | Task updates, check-in, share links |
| Pendukung | Registered supporters | Membership, event info, sharing |
| Admin Platform | KampanyeKit operators | Multi-tenant management |

---

## 4. Product Phases

### Phase 1 — MVP (Month 1–3)
Core platform: get a candidate online, team organized, ads tracked.

### Phase 2 — Growth (Month 4–6)
Team intelligence, content tools, supporter engagement, advanced analytics.

### Phase 3 — Premium (Month 7–12)
AI features, compliance tools, white-label, mobile app.

---

## 5. Feature Requirements

---

### 5.1 PHASE 1 — MVP

#### 5.1.1 Candidate Profile & Landing Page

**FR-101: Campaign Landing Page**
- Each candidate gets a dedicated campaign page at `[slug].kampanyekit.id` or custom domain
- Page sections: hero photo + tagline, visi-misi, program unggulan (up to 10 items), contact/sosmed links, pendukung counter
- Mobile-first responsive design
- Basic SEO meta tags (title, description, og:image)
- Page preview before publishing

**FR-102: Candidate Profile Management**
- Candidate fills in: nama lengkap, foto, nomor urut, dapil/wilayah, partai, tagline, visi, misi, program
- Upload photo (max 5MB, jpg/png/webp)
- Social media links: Instagram, TikTok, Facebook, Twitter/X, YouTube
- Status: draft / published / paused

**FR-103: Press Kit Generator**
- Auto-generate downloadable PDF with candidate photo, bio, key messages
- Branded with candidate's color scheme

#### 5.1.2 Unified Ads Dashboard

**FR-104: Meta Ads Integration**
- OAuth connection to Meta Business account
- Pull campaigns, ad sets, and ads from Meta
- Display: reach, impressions, clicks, spend, CPM, CTR
- Date range filter (last 7d, 30d, custom)

**FR-105: TikTok Ads Integration**
- OAuth connection to TikTok Ads account
- Pull campaign data from TikTok Ads Manager
- Display same metrics as Meta
- Cross-platform side-by-side comparison

**FR-106: Campaign Budget Tracker**
- Input total campaign budget (digital allocation)
- Allocate per platform (Meta, TikTok, Google)
- Real-time spend tracking vs. allocation
- Alert when spend reaches 80% of budget

**FR-107: Ads Overview Dashboard**
- Combined metrics card: total reach, total spend, avg CPM, best performing platform
- Spend breakdown pie chart by platform
- Daily reach trend line chart (last 30 days)

#### 5.1.3 Tim Sukses Module

**FR-108: Team Registration**
- Admin invites team members via email or link
- Roles: Koordinator Wilayah, Koordinator Kecamatan, Relawan
- Each member has a profile: nama, wilayah, nomor HP, role

**FR-109: Referral Link System**
- Each team member gets a unique shareable referral URL pointing to the candidate's landing page
- System tracks: clicks, unique visitors, time on page from each referral link
- Dashboard showing each member's referral performance

**FR-110: Team Dashboard**
- Table view of all team members: name, role, wilayah, referral clicks, status
- Sort and filter by role, wilayah, performance
- Export team list to CSV

#### 5.1.4 Supporter (Pendukung) Registration

**FR-111: Supporter Sign-up**
- Public sign-up form on candidate landing page
- Fields: nama, nomor HP, kelurahan, kecamatan, kabupaten/kota
- Optional: foto, email
- CAPTCHA to prevent spam

**FR-112: Digital Membership Card**
- Auto-generated digital card after registration
- Shows: supporter name, candidate name, membership ID, QR code
- Downloadable as PNG/PDF
- Shareable via WhatsApp

**FR-113: Supporter Admin Panel**
- Table view of all registered supporters
- Filter by wilayah (kecamatan, kelurahan)
- Total supporter count by wilayah
- Export to CSV/Excel

#### 5.1.5 Admin & Candidate Dashboard

**FR-114: Campaign Overview Dashboard**
- Summary cards: total supporters, total ad reach, total ad spend, team size
- Recent activity feed: new supporters, team check-ins, ad alerts
- Campaign health score (simple composite metric)

**FR-115: Weekly Summary Report**
- Auto-generated PDF every Monday
- Includes: supporter growth, ad performance, team activity, top referrers
- Emailed to candidate automatically

---

### 5.2 PHASE 2 — GROWTH FEATURES

#### 5.2.1 Advanced Team Management

**FR-201: Hierarchical Team Structure**
- Multi-level: Koordinator Wilayah → Koordinator Kecamatan → Koordinator Kelurahan → Relawan
- Each coordinator sees their subtree only
- Aggregate stats roll up to candidate level

**FR-202: Task Assignment System**
- Admin/coordinator assigns tasks to team members
- Task fields: judul, deskripsi, deadline, prioritas (high/medium/low), wilayah
- Task status: assigned → in-progress → done
- Task notification via in-app + email

**FR-203: QR Code Event Check-in**
- Candidate creates event in system
- Each relawan has a personal QR code
- Event organizer scans QR to mark attendance
- Dashboard shows who attended which events

**FR-204: Internal Announcement Board**
- Admin posts announcements visible to all team members
- Filter by role or wilayah (only relevant levels see it)
- Read receipt tracking
- Replaces WhatsApp broadcast

**FR-205: Team Leaderboard**
- Weekly ranking of team members by: referral clicks, tasks completed, events attended
- Gamified badges: Top Recruiter, Most Active, Best Wilayah
- Public within team (visible to all members)

#### 5.2.2 Content & Ads Management

**FR-206: Ad Creative Library**
- Upload and store images, videos, captions for ads
- Tag by: platform, tema (infrastruktur, kesehatan, pendidikan), date
- Search and filter by tag
- One-click copy caption to clipboard

**FR-207: Content Calendar**
- Monthly calendar view of planned content
- Add content item: tanggal, platform, jenis (post/story/reel/ads), status
- Drag-and-drop rescheduling
- Status: draft → scheduled → published

**FR-208: A/B Testing Module**
- Create two ad variants (A and B) with different creative or copy
- Run both simultaneously on Meta or TikTok
- System auto-identifies winner after set duration or spend threshold
- Winner recommendation with supporting data

**FR-209: AI Caption Generator**
- Input: tema, platform, tone (formal/casual/inspiratif), key message
- Output: 3 caption variants to choose from
- Candidate's visi-misi auto-injected as context
- Supports Bahasa Indonesia

**FR-210: Google Ads Integration**
- Connect Google Ads account (same OAuth flow as Meta)
- Pull Search and Display campaign data
- Add to unified ads dashboard

#### 5.2.3 Supporter Engagement

**FR-211: Supporter Map**
- Geographic heatmap showing supporter density per kecamatan/kelurahan
- Color-coded by density (light → dark)
- Click on area to see supporter list for that zone
- Uses Leaflet.js with Indonesia admin boundary GeoJSON

**FR-212: Mini Survey / Quick Poll**
- Admin creates poll: pertanyaan + 2–5 pilihan jawaban
- Sent to registered supporters via in-platform notification + WhatsApp link
- Real-time results shown as bar chart
- Export results to CSV

**FR-213: Aspirasi Inbox**
- Public-facing form on candidate page for voter aspirations/messages
- Admin inbox with read/unread status
- Reply publicly (shown on candidate page) or privately (WhatsApp/email)
- Tag aspirasi by tema (infrastruktur, ekonomi, etc.)

**FR-214: Supporter Referral Loop**
- Registered supporters also get a unique referral link
- If someone registers via their link, they get credited
- Top supporter referrers shown on public pledge wall
- Points system: 1 point per referral, 2 points per event attendance

**FR-215: Pledge Wall**
- Public section on candidate page showing supporter statements
- Supporter writes a short statement (max 100 chars) during registration
- Moderation by admin before display
- Shows: nama, wilayah, statement

#### 5.2.4 Advanced Analytics

**FR-216: Engagement Heatmap by Theme**
- Tag ads and content by tema (infrastruktur, kesehatan, pendidikan, ekonomi, dll)
- Show which tema generates most engagement
- Breakdown by platform and wilayah

**FR-217: Geographic Performance**
- Which wilayah/dapil responds best to which ads (based on Meta/TikTok geo data)
- Map overlay showing ad performance by region
- Recommendation: increase spend in underperforming areas

**FR-218: Competitor Social Media Tracker**
- Input competitor candidate names
- Track their estimated social media activity (public TikTok/Instagram post frequency, estimated engagement)
- Side-by-side noise comparison
- Note: uses public data only, no private API access

**FR-219: Electability Trend Graph**
- Admin inputs internal survey results (date, %, sumber survei)
- System plots trend line over time
- Overlaid with ad spend timeline to show correlation
- Shareable as image

**FR-220: Advanced Weekly Report**
- All Phase 1 content plus: supporter growth by wilayah, top content themes, team performance summary, competitor activity
- Customizable sections

---

### 5.3 PHASE 3 — PREMIUM FEATURES

#### 5.3.1 AI-Powered Features

**FR-301: AI Chatbot on Candidate Page**
- Trained on candidate's visi-misi, program, FAQ
- Answers voter questions 24/7 in Bahasa Indonesia
- Powered by Claude API (claude-sonnet-4-20250514)
- Fallback: "Hubungi tim kami di [nomor]" for unanswered questions
- Admin can review chat history and add to FAQ

**FR-302: AI Speech Writer**
- Input: lokasi kampanye, jenis audiens, durasi, tema utama
- Output: full speech draft in Bahasa Indonesia
- Incorporates candidate's visi-misi and program unggulan
- Adjustable tone: formal, akrab, inspiratif
- Export as Word document

**FR-303: Voter Sentiment Tracker**
- Monitor public TikTok and Twitter/X mentions of candidate name
- Classify sentiment: positif, negatif, netral
- Daily sentiment score trend
- Alert when negative spike detected
- Note: uses public API / web scraping within ToS

**FR-304: Ad Spend Optimizer**
- Based on 30-day performance data, recommend budget reallocation
- "Move Rp X from [platform A] to [platform B] to increase reach by estimated Y%"
- One-click apply recommendation
- Explanation in plain Bahasa Indonesia

**FR-305: Cost Per Voter Reached**
- Composite metric: total spend ÷ estimated unique voters reached
- Compared to benchmark of baliho/offline spending
- Shows ROI vs. traditional campaign spending

#### 5.3.2 Advanced Campaign Tools

**FR-306: WhatsApp Blast Integration**
- Connect via WhatsApp Business API (Wati / Fonnte / Zocket)
- Send announcements to supporter list segmented by wilayah
- Template-based messages (pre-approved WA templates)
- Delivery and read receipt tracking

**FR-307: Donation Management**
- Supporter can donate via Midtrans (bank transfer, e-wallet, QRIS)
- Admin sees donation list: nama, jumlah, tanggal, metode
- Auto-generate donation receipt (PDF)
- Note: candidate is responsible for KPU donation compliance

**FR-308: Live Event Streaming Embed**
- Admin adds YouTube Live or TikTok Live URL to event
- Embedded player shown on candidate page during live event
- Event reminder notification to supporters
- Post-event: recording auto-embedded in event archive

**FR-309: Video Testimonial Collector**
- Supporter records short video (max 60s) via mobile browser
- Submitted to admin for review and approval
- Approved videos shown in testimonial gallery on candidate page
- Auto-compressed for web

#### 5.3.3 Compliance & Legal

**FR-310: KPU Regulation Checklist**
- Built-in checklist per election type (Pileg, Pilkada Kabupaten, Pilkada Provinsi, Pilpres)
- Items sourced from KPU regulation (PKPU) — admin-maintained, manually updated
- Check off items as completed
- Warning flags for incomplete items approaching masa kampanye

**FR-311: Campaign Period Countdown**
- Display countdown to: masa kampanye start, masa kampanye end, hari tenang, hari H
- Alert notifications 7 days and 1 day before each milestone
- Source: manually entered by admin per election

**FR-312: Content Disclaimer Auto-Appender**
- Toggle: auto-add disclaimer text to all published ads
- Default text: "Dibayar oleh Tim Kampanye [Nama Kandidat]"
- Customizable disclaimer text
- Applied at ad creation in Meta/TikTok if supported by API

**FR-313: Audit Log**
- Full log of all user actions: login, content publish, ad created, supporter data exported, settings changed
- Filter by user, action type, date range
- Cannot be deleted by tenant admin (platform-level only)
- Export as CSV for compliance review

#### 5.3.4 Platform Expansion

**FR-314: White-Label Mode**
- Political consultants can license the platform under their own brand
- Custom logo, color scheme, domain
- Consultant manages multiple candidate accounts
- Billing: per-seat or per-candidate license

**FR-315: Post-Election Constituent Module**
- After election, convert campaign platform to constituency management tool
- Collect constituent aspirations
- Publish realization progress of campaign promises
- Newsletter to former supporters

**FR-316: Pollster API**
- RESTful API endpoint for third-party pollsters to push survey data
- Authentication: API key per candidate
- Survey fields: tanggal, elektabilitas %, margin of error, sample size, metode
- Data appears in electability trend graph

**FR-317: Relawan Mobile App (Flutter)**
- Mobile app for relawan only (not candidate-facing)
- Features: personal task list, QR check-in, referral link share, announcement feed
- Offline mode: cache tasks and sync when online
- Push notifications via FCM
- iOS and Android

---

## 6. Non-Functional Requirements

### 6.1 Performance
- Page load < 2 seconds on 4G connection (mobile)
- Dashboard data refresh every 30 minutes (ads data from Meta/TikTok API)
- Support up to 10,000 registered supporters per candidate without degradation

### 6.2 Security
- Multi-tenant isolation: candidate data is strictly separated
- All API keys (Meta, TikTok) stored encrypted at rest (AES-256)
- HTTPS enforced everywhere
- OWASP Top 10 compliance
- Rate limiting on public forms (supporter registration, aspirasi)
- Admin audit log cannot be tampered with by tenant

### 6.3 Data & Privacy
- Supporter personal data (nama, HP, wilayah) stored in Indonesia (GCP asia-southeast2)
- Compliance with UU PDP (Perlindungan Data Pribadi Indonesia)
- Data export and deletion available to candidate on request
- Supporter can unregister and request data deletion

### 6.4 Availability
- Target uptime: 99.5% monthly
- Daily database backups with 30-day retention
- Health monitoring with Telegram alerting

### 6.5 Scalability
- Multi-tenant SaaS architecture (each candidate = one tenant)
- Horizontal scaling via Docker containers on GCP
- Media files on GCS (Google Cloud Storage) or S3-compatible storage

---

## 7. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Backend | Django 5 + Django REST Framework |
| Database | PostgreSQL 16 |
| Cache | Redis |
| Task Queue | Celery + Redis |
| File Storage | Google Cloud Storage (S3-compatible) |
| Containerization | Docker + Docker Compose |
| CI/CD | GitHub Actions + GHCR |
| Hosting | GCP VM (Compute Engine) |
| Reverse Proxy | Nginx |
| Mobile App (Phase 3) | Flutter |
| AI Integration | Anthropic API (claude-sonnet-4-20250514) |
| Maps | Leaflet.js + Indonesia GeoJSON |
| Payment (Phase 3) | Midtrans |
| WA Integration (Phase 3) | Wati / Fonnte (WhatsApp Business API) |

---

## 8. Business Model

| Tier | Features | Price (IDR / campaign cycle) | Target |
|---|---|---|---|
| Starter | Phase 1 MVP | Rp 2–5 juta | Caleg DPRD Kab/Kota |
| Pro | Phase 1 + 2 | Rp 10–20 juta | Caleg DPRD Provinsi |
| Premium | All phases | Rp 30–75 juta | Bupati/Walikota |
| Enterprise | White-label | Custom | Gubernur / Konsultan |

Additional revenue: 10–15% management fee on total ad spend managed through platform.

---

## 9. Out of Scope (v1)

- Direct social media post scheduling (not just calendar planning)
- Voter database purchase/integration
- Real-time vote counting or TPS monitoring
- Candidate-to-candidate direct messaging
- Deepfake detection (noted as future feature)

---

## 10. Success Metrics

| Metric | MVP Target | 12-Month Target |
|---|---|---|
| Paying candidates | 5 | 100 |
| Avg supporter registrations per candidate | 500 | 2,000 |
| Ads managed through platform (total spend) | Rp 50 juta | Rp 5 miliar |
| Monthly recurring revenue | Rp 25 juta | Rp 500 juta |
| NPS score | > 40 | > 60 |
