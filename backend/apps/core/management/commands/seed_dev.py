"""
Seed the development database with several demo campaigns so you can see the
app populated with varied data (different election types, colors, plans, team
sizes, supporter counts, and ad spend).

Usage (inside the backend container):
    python manage.py seed_dev          # create / update demo data (idempotent)
    python manage.py seed_dev --fresh  # wipe demo tenants first, then reseed

Every demo user logs in with the SAME password:  kampanye123
Login at the /login page with one of the usernames printed at the end.

Safe to run multiple times — it upserts by slug/username and won't duplicate.
"""
import calendar
import random
from datetime import date, timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

DEV_PASSWORD = 'kampanye123'

# A pool of plausible Indonesian names used to generate supporters & team.
NAME_POOL = [
    'Ahmad Fauzi', 'Dewi Lestari', 'Hendra Gunawan', 'Yuli Astuti', 'Roni Saputra',
    'Mega Pratiwi', 'Eko Wijaya', 'Fitri Handayani', 'Doni Kusuma', 'Lina Marlina',
    'Ridwan Falah', 'Sari Indah', 'Wahyu Nugroho', 'Tuti Suryani', 'Bambang Setiawan',
    'Nur Aisyah', 'Agus Salim', 'Rina Oktaviani', 'Joko Susilo', 'Maya Sari',
    'Dimas Prayoga', 'Indah Permata', 'Fajar Ramadhan', 'Citra Dewanti', 'Bayu Aji',
    'Putri Maharani', 'Reza Pratama', 'Wulan Sucipto', 'Arif Budiman', 'Siti Nurhaliza',
    'Gunawan Wibisono', 'Yani Kurnia', 'Teguh Santoso', 'Ratna Sari', 'Andre Taulany',
    'Sinta Bella', 'Hadi Pranoto', 'Vina Panduwinata', 'Krisna Mukti', 'Lia Amelia',
    'Oki Setiana', 'Bagas Pangestu', 'Nadia Putri', 'Iwan Setiawan', 'Dina Lorenza',
    'Yoga Pradana', 'Mira Lesmana', 'Fauzan Akbar', 'Selvi Anggraini', 'Rangga Wijaya',
    'Tari Mulyani', 'Galih Saputro', 'Wati Komariah', 'Bima Sakti', 'Anisa Rahma',
]

STATEMENTS = [
    'Siap mendukung penuh!', 'Bersama kita pasti bisa', '', 'Semangat untuk daerah kita!',
    '', 'Demi masa depan anak cucu', '', 'Saya percaya program ini', '',
    'Maju terus pantang mundur', 'Kami menanti perubahan', '',
]


# ── Demo campaign definitions ────────────────────────────────────────────────
CAMPAIGNS = [
    {
        'slug': 'afms', 'username': 'afms', 'superuser': True,
        'nama': 'Andi Fathul Mukminin', 'plan': 'pro', 'color': '#2456E6',
        'jenis': 'pileg_dprd_kota', 'nomor_urut': 3,
        'dapil': 'Kota Bandung Dapil 2', 'partai': 'Partai Maju Bersama',
        'tagline': 'Bersama Kita Bisa, Bandung Lebih Baik',
        'visi': ('Mewujudkan Kota Bandung yang modern, inklusif, dan berdaya saing tinggi '
                 'melalui tata kelola pemerintahan yang bersih, inovatif, dan berpihak pada rakyat.'),
        'misi': [
            'Meningkatkan kualitas pendidikan dan kesehatan warga Bandung secara merata',
            'Mendorong pertumbuhan ekonomi kreatif berbasis digital dan UMKM lokal',
            'Membangun infrastruktur kota yang ramah lingkungan dan modern',
            'Mewujudkan tata kelola pemerintahan yang transparan dan akuntabel',
            'Memberdayakan generasi muda sebagai agen perubahan kota',
        ],
        'program': [
            {'icon': '🎓', 'title': 'Beasiswa Bandung Cerdas', 'desc': 'Beasiswa penuh untuk 500 pelajar berprestasi dari keluarga kurang mampu setiap tahun.'},
            {'icon': '🏥', 'title': 'Klinik Kelurahan Gratis', 'desc': 'Setiap kelurahan memiliki klinik kesehatan gratis yang beroperasi 24 jam.'},
            {'icon': '💼', 'title': 'Inkubator UMKM Digital', 'desc': 'Pusat pelatihan dan pendampingan UMKM go-digital di setiap kecamatan.'},
            {'icon': '🌳', 'title': 'Bandung Hijau 2030', 'desc': 'Penanaman 100.000 pohon dan revitalisasi taman kota yang terbengkalai.'},
            {'icon': '🚌', 'title': 'Transportasi Terintegrasi', 'desc': 'Integrasi angkot, bus, dan feeder dengan tiket digital satu kartu.'},
            {'icon': '📡', 'title': 'WiFi Gratis Publik', 'desc': 'Internet gratis di semua taman, terminal, dan pusat kegiatan warga.'},
        ],
        'sosmed': {'instagram': 'https://instagram.com/andifathul', 'tiktok': 'https://tiktok.com/@andifathul', 'youtube': 'https://youtube.com/@andifathul'},
        'prov': 'Jawa Barat', 'kab': 'Kota Bandung',
        'kecamatan': ['Coblong', 'Sukajadi', 'Cicendo', 'Antapani', 'Rancasari'],
        'team': 5, 'supporters': 16, 'views': 1240,
        'ads': {'platforms': ['meta', 'tiktok'], 'budget': 50_000_000, 'alloc': {'meta': 30_000_000, 'tiktok': 15_000_000, 'google': 5_000_000}},
        'features': {},
    },
    {
        'slug': 'sripurnama', 'username': 'sri', 'superuser': False,
        'nama': 'Sri Purnama Wardani', 'plan': 'premium', 'color': '#0E9F6E',
        'jenis': 'pilkada_walikota', 'nomor_urut': 2,
        'dapil': 'Kota Surabaya', 'partai': 'Partai Hijau Nusantara',
        'tagline': 'Surabaya Maju, Warga Sejahtera',
        'visi': ('Menjadikan Surabaya kota metropolitan yang humanis, hijau, dan berkeadilan '
                 'sosial bagi seluruh warganya.'),
        'misi': [
            'Membuka 50.000 lapangan kerja baru melalui investasi dan UMKM',
            'Menyediakan layanan kesehatan dan pendidikan gratis berkualitas',
            'Menata kota bebas banjir dengan drainase modern',
            'Mewujudkan birokrasi digital yang cepat dan anti-korupsi',
        ],
        'program': [
            {'icon': '🏗️', 'title': 'Surabaya Bebas Banjir', 'desc': 'Normalisasi sungai dan pembangunan rumah pompa di 12 titik rawan banjir.'},
            {'icon': '👩‍💼', 'title': 'Kartu Kerja Surabaya', 'desc': 'Pelatihan kerja gratis dan penyaluran ke industri bagi 20.000 pencari kerja.'},
            {'icon': '🏫', 'title': 'Sekolah Gratis 12 Tahun', 'desc': 'Bebas biaya SD hingga SMA termasuk seragam dan buku untuk warga ber-KTP Surabaya.'},
            {'icon': '🚑', 'title': 'Ambulans Gratis 24 Jam', 'desc': 'Layanan ambulans dan call center kesehatan gratis di seluruh kecamatan.'},
        ],
        'sosmed': {'instagram': 'https://instagram.com/sripurnama', 'facebook': 'https://facebook.com/sripurnama', 'youtube': 'https://youtube.com/@sripurnama', 'twitter': 'https://x.com/sripurnama'},
        'prov': 'Jawa Timur', 'kab': 'Kota Surabaya',
        'kecamatan': ['Gubeng', 'Wonokromo', 'Tegalsari', 'Rungkut', 'Sukolilo', 'Tambaksari'],
        'team': 7, 'supporters': 34, 'views': 8730,
        'ads': {'platforms': ['meta', 'tiktok', 'google'], 'budget': 120_000_000, 'alloc': {'meta': 70_000_000, 'tiktok': 30_000_000, 'google': 20_000_000}},
        'features': {'announcements': True, 'polls': True},
    },
    {
        'slug': 'hartono', 'username': 'hartono', 'superuser': False,
        'nama': 'H. Hartono Prawiro', 'plan': 'starter', 'color': '#B91C1C',
        'jenis': 'pileg_dpr', 'nomor_urut': 7,
        'dapil': 'Jawa Tengah Dapil 5', 'partai': 'Partai Rakyat Bersatu',
        'tagline': 'Suara Rakyat, Amanah Kita',
        'visi': 'Memperjuangkan aspirasi rakyat kecil di parlemen dengan jujur dan konsisten.',
        'misi': [
            'Memperjuangkan subsidi pupuk dan harga gabah yang adil bagi petani',
            'Mendorong anggaran pembangunan desa yang tepat sasaran',
            'Memberi advokasi hukum gratis bagi warga tidak mampu',
        ],
        'program': [
            {'icon': '🌾', 'title': 'Petani Sejahtera', 'desc': 'Pendampingan dan jaminan harga panen untuk kelompok tani di dapil.'},
            {'icon': '🏘️', 'title': 'Dana Desa Transparan', 'desc': 'Pengawalan dana desa agar benar-benar dirasakan warga.'},
            {'icon': '⚖️', 'title': 'Posko Bantuan Hukum', 'desc': 'Bantuan hukum gratis untuk warga di setiap kabupaten dapil.'},
        ],
        'sosmed': {'facebook': 'https://facebook.com/hartonoprawiro', 'instagram': 'https://instagram.com/hartonoprawiro'},
        'prov': 'Jawa Tengah', 'kab': 'Kabupaten Kebumen',
        'kecamatan': ['Kebumen', 'Gombong', 'Karanganyar', 'Prembun'],
        'team': 3, 'supporters': 11, 'views': 430,
        'ads': None,  # no ads connected — shows the empty/connect state
        'features': {},
    },
    {
        'slug': 'wirautama', 'username': 'wira', 'superuser': False,
        'nama': 'Dr. Wira Utama, M.M.', 'plan': 'enterprise', 'color': '#0F766E',
        'jenis': 'pilkada_gubernur', 'nomor_urut': 1,
        'dapil': 'Provinsi Jawa Barat', 'partai': 'Koalisi Jabar Juara',
        'tagline': 'Jabar Juara, Untuk Semua',
        'visi': ('Membangun Jawa Barat sebagai provinsi terdepan di Indonesia dalam ekonomi '
                 'digital, pendidikan, dan kesejahteraan yang merata dari kota hingga desa.'),
        'misi': [
            'Menciptakan 1 juta lapangan kerja melalui hilirisasi dan ekonomi digital',
            'Pemerataan akses pendidikan tinggi dan vokasi berkualitas',
            'Jaminan kesehatan semesta untuk seluruh warga Jawa Barat',
            'Pembangunan infrastruktur konektivitas antar-wilayah',
            'Tata kelola pemerintahan digital yang bersih dan responsif',
            'Pemberdayaan desa dan pertanian modern',
            'Pelestarian lingkungan dan ketahanan terhadap bencana',
        ],
        'program': [
            {'icon': '💻', 'title': 'Jabar Digital Valley', 'desc': 'Pusat ekonomi digital dan startup di 5 wilayah untuk membuka lapangan kerja muda.'},
            {'icon': '🎓', 'title': 'Beasiswa Jabar Juara', 'desc': '10.000 beasiswa kuliah & vokasi setiap tahun bagi anak Jawa Barat.'},
            {'icon': '🏥', 'title': 'Kartu Sehat Jabar', 'desc': 'Jaminan kesehatan gratis kelas 1 untuk seluruh warga ber-KTP Jabar.'},
            {'icon': '🛣️', 'title': 'Tol & Jalan Desa', 'desc': 'Konektivitas jalan provinsi hingga desa terpencil dalam 5 tahun.'},
            {'icon': '🌾', 'title': 'Petani Naik Kelas', 'desc': 'Mekanisasi pertanian dan jaminan serapan hasil panen.'},
            {'icon': '♻️', 'title': 'Jabar Hijau Lestari', 'desc': 'Pengelolaan sampah terpadu dan energi terbarukan di tiap kabupaten.'},
        ],
        'sosmed': {'instagram': 'https://instagram.com/wirautama', 'tiktok': 'https://tiktok.com/@wirautama', 'facebook': 'https://facebook.com/wirautama', 'youtube': 'https://youtube.com/@wirautama', 'twitter': 'https://x.com/wirautama'},
        'prov': 'Jawa Barat', 'kab': 'Provinsi Jawa Barat',
        'kecamatan': ['Kota Bandung', 'Kab. Bogor', 'Kota Bekasi', 'Kota Depok', 'Kab. Garut', 'Kab. Cirebon', 'Kota Tasikmalaya', 'Kab. Sukabumi'],
        'team': 8, 'supporters': 52, 'views': 25640,
        'ads': {'platforms': ['meta', 'tiktok', 'google'], 'budget': 300_000_000, 'alloc': {'meta': 160_000_000, 'tiktok': 80_000_000, 'google': 60_000_000}},
        'features': {'announcements': True, 'events': True, 'polls': True, 'electability': True, 'pledge_wall': True},
    },
]

TEAM_LEVELS = [
    (1, 'kabupaten'), (2, 'kecamatan'), (2, 'kecamatan'),
    (3, 'kelurahan'), (4, 'kelurahan'), (4, 'kelurahan'), (3, 'kelurahan'), (4, 'kelurahan'),
]


class Command(BaseCommand):
    help = 'Seed development data with several varied demo campaigns'

    def add_arguments(self, parser):
        parser.add_argument('--fresh', action='store_true',
                            help='Delete the demo tenants before reseeding')

    def handle(self, *args, **options):
        from apps.accounts.models import User, Tenant, Agency

        if options['fresh']:
            slugs = [c['slug'] for c in CAMPAIGNS]
            Tenant.objects.filter(slug__in=slugs).delete()
            Agency.objects.filter(slug__in=slugs).delete()
            User.objects.filter(username__in=[c['username'] for c in CAMPAIGNS]).delete()
            self.stdout.write(self.style.WARNING(f'Wiped demo tenants: {", ".join(slugs)}'))

        random.seed(42)  # reproducible numbers across machines
        for idx, cfg in enumerate(CAMPAIGNS, start=1):
            self._seed_campaign(idx, cfg)

        self._print_credentials()

    @transaction.atomic
    def _seed_campaign(self, idx, cfg):
        from apps.accounts.models import User, Tenant, Agency
        from apps.candidates.models import Candidate, CampaignPage

        self.stdout.write(self.style.HTTP_INFO(f'\n── {cfg["nama"]} (/{cfg["slug"]}) ───────────────'))

        agency, _ = Agency.objects.get_or_create(slug=cfg['slug'], defaults={'name': cfg['nama']})
        tenant, _ = Tenant.objects.get_or_create(
            slug=cfg['slug'],
            defaults={'name': f'Kampanye {cfg["nama"]}', 'agency': agency},
        )
        tenant.name = f'Kampanye {cfg["nama"]}'
        tenant.agency = agency
        tenant.plan = cfg['plan']
        tenant.is_active = True
        tenant.feature_flags = cfg['features']
        tenant.save()

        user, _ = User.objects.get_or_create(
            username=cfg['username'],
            defaults={'email': f'{cfg["username"]}@example.com'},
        )
        first, _, last = cfg['nama'].partition(' ')
        user.first_name, user.last_name = first, last
        user.email = f'{cfg["username"]}@example.com'
        user.tenant = tenant
        user.agency = agency
        user.role = 'candidate'
        user.is_active = True
        if cfg.get('superuser'):
            user.is_staff = user.is_superuser = True
        user.set_password(DEV_PASSWORD)
        user.save()

        candidate, _ = Candidate.objects.get_or_create(
            tenant=tenant, defaults={'user': user, 'nama_lengkap': cfg['nama']},
        )
        candidate.user = user
        candidate.nama_lengkap = cfg['nama']
        candidate.nomor_urut = cfg['nomor_urut']
        candidate.jenis_pemilihan = cfg['jenis']
        candidate.dapil = cfg['dapil']
        candidate.partai = cfg['partai']
        candidate.tagline = cfg['tagline']
        candidate.visi = cfg['visi']
        candidate.misi = cfg['misi']
        candidate.program_unggulan = cfg['program']
        candidate.sosmed = cfg['sosmed']
        candidate.color_primary = cfg['color']
        candidate.status = 'published'
        candidate.save()

        page, _ = CampaignPage.objects.get_or_create(candidate=candidate)
        page.is_published = True
        page.published_at = page.published_at or timezone.now()
        page.seo_title = f'{cfg["nama"]} — Kampanye Digital'
        page.seo_description = cfg['tagline']
        page.view_count = cfg['views']
        page.save()
        self.stdout.write(f'  ✓ profile + page published ({cfg["plan"]} plan)')

        members = self._seed_team(tenant, cfg)
        self._seed_supporters(idx, tenant, cfg, members)
        if cfg['ads']:
            self._seed_ads(tenant, cfg['ads'])
        else:
            self.stdout.write('  • no ads connected (empty state demo)')

    def _seed_team(self, tenant, cfg):
        from apps.teams.models import TeamMember, ReferralLink
        members = []
        for i in range(cfg['team']):
            level, wlevel = TEAM_LEVELS[i % len(TEAM_LEVELS)]
            nama = NAME_POOL[(i * 3) % len(NAME_POOL)]
            wname = cfg['kecamatan'][i % len(cfg['kecamatan'])]
            member, _ = TeamMember.objects.get_or_create(
                tenant=tenant, nama=nama,
                defaults={
                    'phone': f'0813{tenant.pk.int % 1000:03d}{i:04d}'[:20],
                    'level': level, 'wilayah_name': wname, 'wilayah_level': wlevel,
                    'kecamatan': wname, 'kabupaten_kota': cfg['kab'],
                    'total_points': random.randint(20, 400),
                },
            )
            link = member.referral_links.first() or ReferralLink.objects.create(team_member=member, label='Utama')
            if link.clicks == 0:
                link.clicks = random.randint(8, 220)
                link.unique_visitors = int(link.clicks * random.uniform(0.6, 0.9))
                link.last_clicked_at = timezone.now()
                link.save()
            members.append(member)
        self.stdout.write(f'  ✓ {len(members)} team members + referral links')
        return members

    def _seed_supporters(self, idx, tenant, cfg, members):
        from apps.supporters.models import Supporter
        kecs = cfg['kecamatan']
        created = 0
        for i in range(cfg['supporters']):
            phone = f'08{idx}{i:08d}'
            if Supporter.objects.filter(tenant=tenant, phone=phone).exists():
                continue
            kec = kecs[i % len(kecs)]
            Supporter.objects.create(
                tenant=tenant,
                nama=NAME_POOL[i % len(NAME_POOL)],
                phone=phone,
                kelurahan=f'Kel. {kec} {i % 4 + 1}',
                kecamatan=kec,
                kabupaten_kota=cfg['kab'],
                provinsi=cfg['prov'],
                statement=STATEMENTS[i % len(STATEMENTS)] or None,
                is_verified=(i % 3 != 0),
                referred_by_team=members[i % len(members)] if members else None,
            )
            created += 1
        self.stdout.write(f'  ✓ {created} supporters across {len(kecs)} kecamatan')

    def _seed_ads(self, tenant, ads_cfg):
        from apps.ads.models import AdsAccount, AdsCampaignSnapshot, BudgetAllocation
        platform_campaigns = {
            'meta': [('meta-c-001', 'Kesadaran Nama'), ('meta-c-002', 'Program Unggulan'), ('meta-c-003', 'Boost Halaman')],
            'tiktok': [('tt-c-001', 'Brand Awareness'), ('tt-c-002', 'Video Program')],
            'google': [('ga-c-001', 'Search Branded'), ('ga-c-002', 'YouTube Bumper')],
        }
        spend_range = {'meta': (200_000, 900_000), 'tiktok': (120_000, 520_000), 'google': (90_000, 400_000)}
        today = date.today()
        snaps = 0
        for platform in ads_cfg['platforms']:
            acc, _ = AdsAccount.objects.get_or_create(
                tenant=tenant, platform=platform, account_id=f'{platform.upper()}-{tenant.slug}',
                defaults={'account_name': f'{platform.title()} Ads — {tenant.name}', 'access_token': 'dev-token', 'is_active': True},
            )
            lo, hi = spend_range[platform]
            for days_ago in range(30, 0, -1):
                snap_date = today - timedelta(days=days_ago)
                for cid, cname in platform_campaigns[platform]:
                    spend = round(random.uniform(lo, hi), 0)
                    impressions = int(spend * random.uniform(8, 18))
                    reach = int(impressions * random.uniform(0.55, 0.85))
                    clicks = int(impressions * random.uniform(0.015, 0.05))
                    AdsCampaignSnapshot.objects.get_or_create(
                        ads_account=acc, campaign_id=cid, snapshot_date=snap_date,
                        defaults=dict(
                            tenant=tenant, platform=platform, campaign_name=cname, status='ACTIVE',
                            spend=spend, impressions=impressions, reach=reach, clicks=clicks,
                            cpm=round(spend / impressions * 1000, 2) if impressions else None,
                            ctr=round(clicks / impressions * 100, 4) if impressions else None,
                        ),
                    )
                    snaps += 1

        period_start = today.replace(day=1)
        last_day = calendar.monthrange(today.year, today.month)[1]
        BudgetAllocation.objects.get_or_create(
            tenant=tenant, period_start=period_start,
            defaults={
                'total_budget': ads_cfg['budget'], 'allocations': ads_cfg['alloc'],
                'period_end': today.replace(day=last_day), 'alert_threshold_pct': 80,
                'notes': 'Anggaran iklan digital bulan ini',
            },
        )
        self.stdout.write(f'  ✓ {len(ads_cfg["platforms"])} ads accounts, {snaps} snapshots, budget Rp {ads_cfg["budget"]:,}')

    def _print_credentials(self):
        self.stdout.write(self.style.SUCCESS('\n\n🚀 Seed complete!  All accounts use password: ') + self.style.WARNING(DEV_PASSWORD))
        self.stdout.write(self.style.SUCCESS('\nLogin at /login with any of these usernames:\n'))
        self.stdout.write('  USERNAME    CAMPAIGN                              PUBLIC PAGE')
        self.stdout.write('  ' + '-' * 74)
        for c in CAMPAIGNS:
            extra = '  (admin)' if c.get('superuser') else ''
            self.stdout.write(f'  {c["username"]:<10}  {c["nama"]:<36}  /{c["slug"]}{extra}')
        self.stdout.write('')
