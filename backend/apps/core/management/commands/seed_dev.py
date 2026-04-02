"""
Usage:
    python manage.py seed_dev

Seeds the development database with sample data for the 'afms' tenant:
- Fills in the candidate profile and publishes it
- Creates 5 team members with referral links
- Creates 15 supporters
"""
from django.core.management.base import BaseCommand
from django.utils import timezone


class Command(BaseCommand):
    help = 'Seed development data for the afms tenant'

    def handle(self, *args, **options):
        from apps.accounts.models import User, Tenant
        from apps.candidates.models import Candidate, CampaignPage
        from apps.teams.models import TeamMember, ReferralLink
        from apps.supporters.models import Supporter

        # ── Tenant & User ────────────────────────────────────────────────────
        try:
            user = User.objects.get(username='afms')
        except User.DoesNotExist:
            self.stderr.write('User "afms" not found. Please create it first via createsuperuser or register.')
            return

        tenant, _ = Tenant.objects.get_or_create(
            slug='afms',
            defaults={'name': 'Kampanye Andi Fathul', 'plan': 'pro', 'is_active': True},
        )
        if user.tenant != tenant:
            user.tenant = tenant
            user.save(update_fields=['tenant'])

        # ── Candidate profile ─────────────────────────────────────────────────
        candidate, _ = Candidate.objects.get_or_create(
            tenant=tenant,
            defaults={'user': user, 'nama_lengkap': user.get_full_name() or 'Andi Fathul'},
        )

        candidate.nama_lengkap = 'Andi Fathul Mukminin'
        candidate.nomor_urut = 3
        candidate.jenis_pemilihan = 'pileg_dprd_kota'
        candidate.dapil = 'Kota Bandung Dapil 2'
        candidate.partai = 'Partai Maju Bersama'
        candidate.tagline = 'Bersama Kita Bisa, Bandung Lebih Baik'
        candidate.visi = (
            'Mewujudkan Kota Bandung yang modern, inklusif, dan berdaya saing tinggi '
            'melalui tata kelola pemerintahan yang bersih, inovatif, dan berpihak pada rakyat.'
        )
        candidate.misi = [
            'Meningkatkan kualitas pendidikan dan kesehatan warga Bandung secara merata',
            'Mendorong pertumbuhan ekonomi kreatif berbasis digital dan UMKM lokal',
            'Membangun infrastruktur kota yang ramah lingkungan dan modern',
            'Mewujudkan tata kelola pemerintahan yang transparan dan akuntabel',
            'Memberdayakan generasi muda sebagai agen perubahan kota',
        ]
        candidate.program_unggulan = [
            {
                'icon': '🎓',
                'title': 'Beasiswa Bandung Cerdas',
                'desc': 'Beasiswa penuh untuk 500 pelajar berprestasi dari keluarga kurang mampu setiap tahun.',
            },
            {
                'icon': '🏥',
                'title': 'Klinik Kelurahan Gratis',
                'desc': 'Setiap kelurahan memiliki klinik kesehatan gratis yang beroperasi 24 jam.',
            },
            {
                'icon': '💼',
                'title': 'Inkubator UMKM Digital',
                'desc': 'Pusat pelatihan dan pendampingan UMKM go-digital di setiap kecamatan.',
            },
            {
                'icon': '🌳',
                'title': 'Bandung Hijau 2030',
                'desc': 'Program penanaman 100.000 pohon dan revitalisasi taman kota yang terbengkalai.',
            },
            {
                'icon': '🚌',
                'title': 'Transportasi Publik Terintegrasi',
                'desc': 'Integrasi angkot, bus, dan feeder dengan sistem tiket digital satu kartu.',
            },
            {
                'icon': '📡',
                'title': 'WiFi Gratis Fasilitas Publik',
                'desc': 'Internet gratis di semua taman, terminal, dan pusat kegiatan warga.',
            },
        ]
        candidate.sosmed = {
            'instagram': 'https://instagram.com/andifathul',
            'tiktok': 'https://tiktok.com/@andifathul',
            'youtube': 'https://youtube.com/@andifathul',
        }
        candidate.color_primary = '#4F46E5'
        candidate.status = 'published'
        candidate.save()
        self.stdout.write(self.style.SUCCESS('✓ Candidate profile updated & published'))

        # ── Campaign page ─────────────────────────────────────────────────────
        page, _ = CampaignPage.objects.get_or_create(candidate=candidate)
        page.is_published = True
        page.published_at = timezone.now()
        page.seo_title = 'Andi Fathul Mukminin — Caleg DPRD Kota Bandung'
        page.seo_description = 'Bersama Kita Bisa, Bandung Lebih Baik. Dukung Andi Fathul Mukminin nomor urut 3.'
        page.save()
        self.stdout.write(self.style.SUCCESS('✓ Campaign page published'))

        # ── Team members ──────────────────────────────────────────────────────
        members_data = [
            {'nama': 'Budi Santoso', 'phone': '081234567890', 'level': 1, 'wilayah_name': 'Kota Bandung', 'wilayah_level': 'kabupaten'},
            {'nama': 'Siti Rahayu', 'phone': '081234567891', 'level': 2, 'wilayah_name': 'Kec. Coblong', 'wilayah_level': 'kecamatan'},
            {'nama': 'Dedi Kurniawan', 'phone': '081234567892', 'level': 2, 'wilayah_name': 'Kec. Sukajadi', 'wilayah_level': 'kecamatan'},
            {'nama': 'Rina Wulandari', 'phone': '081234567893', 'level': 3, 'wilayah_name': 'Kel. Sadang Serang', 'wilayah_level': 'kelurahan'},
            {'nama': 'Agus Purnomo', 'phone': '081234567894', 'level': 4, 'wilayah_name': 'Kel. Lebak Siliwangi', 'wilayah_level': 'kelurahan'},
        ]

        created_members = []
        for data in members_data:
            member, created = TeamMember.objects.get_or_create(
                tenant=tenant,
                nama=data['nama'],
                defaults=data,
            )
            if not member.referral_links.exists():
                link = ReferralLink.objects.create(team_member=member, label='Default')
            else:
                link = member.referral_links.first()
            # Simulate some click counts
            import random
            if link.clicks == 0:
                link.clicks = random.randint(5, 120)
                link.unique_visitors = int(link.clicks * random.uniform(0.6, 0.9))
                link.last_clicked_at = timezone.now()
                link.save()
            created_members.append(member)
            if created:
                self.stdout.write(f'  + Team member: {member.nama}')

        self.stdout.write(self.style.SUCCESS(f'✓ {len(created_members)} team members ready'))

        # ── Supporters ────────────────────────────────────────────────────────
        supporters_data = [
            ('Ahmad Fauzi', '081111000001', 'Lebak Siliwangi', 'Coblong', 'Kota Bandung', 'Jawa Barat', 'Siap mendukung penuh!'),
            ('Dewi Lestari', '081111000002', 'Sadang Serang', 'Coblong', 'Kota Bandung', 'Jawa Barat', 'Bandung pasti bisa lebih maju'),
            ('Hendra Gunawan', '081111000003', 'Cipaganti', 'Coblong', 'Kota Bandung', 'Jawa Barat', ''),
            ('Yuli Astuti', '081111000004', 'Sukawarna', 'Sukajadi', 'Kota Bandung', 'Jawa Barat', 'Semangat untuk Bandung!'),
            ('Roni Saputra', '081111000005', 'Pasteur', 'Sukajadi', 'Kota Bandung', 'Jawa Barat', ''),
            ('Mega Pratiwi', '081111000006', 'Sukabungah', 'Sukajadi', 'Kota Bandung', 'Jawa Barat', 'Demi anak cucu kita'),
            ('Eko Wijaya', '081111000007', 'Cigadung', 'Cibeunying Kaler', 'Kota Bandung', 'Jawa Barat', ''),
            ('Fitri Handayani', '081111000008', 'Cibeunying', 'Cibeunying Kaler', 'Kota Bandung', 'Jawa Barat', 'Siap jadi relawan!'),
            ('Doni Kusuma', '081111000009', 'Pasirkaliki', 'Cicendo', 'Kota Bandung', 'Jawa Barat', ''),
            ('Lina Marlina', '081111000010', 'Husein Sastranegara', 'Cicendo', 'Kota Bandung', 'Jawa Barat', 'Kami percaya program Anda'),
            ('Ridwan Falah', '081111000011', 'Antapani Kidul', 'Antapani', 'Kota Bandung', 'Jawa Barat', ''),
            ('Sari Indah', '081111000012', 'Antapani Tengah', 'Antapani', 'Kota Bandung', 'Jawa Barat', 'Bandung untuk semua'),
            ('Wahyu Nugroho', '081111000013', 'Manjahlega', 'Rancasari', 'Kota Bandung', 'Jawa Barat', ''),
            ('Tuti Suryani', '081111000014', 'Derwati', 'Rancasari', 'Kota Bandung', 'Jawa Barat', 'Ikut mendukung!'),
            ('Bambang Setiawan', '081111000015', 'Margasari', 'Buahbatu', 'Kota Bandung', 'Jawa Barat', ''),
        ]

        count = 0
        for i, (nama, phone, kel, kec, kab, prov, stmt) in enumerate(supporters_data):
            if not Supporter.objects.filter(tenant=tenant, phone=f'62{phone[1:]}').exists():
                ref_member = created_members[i % len(created_members)]
                Supporter.objects.create(
                    tenant=tenant,
                    nama=nama,
                    phone=phone,
                    kelurahan=kel,
                    kecamatan=kec,
                    kabupaten_kota=kab,
                    provinsi=prov,
                    statement=stmt or None,
                    referred_by_team=ref_member,
                )
                count += 1

        self.stdout.write(self.style.SUCCESS(f'✓ {count} new supporters created'))

        # ── Ads accounts + snapshots ──────────────────────────────────────────
        from apps.ads.models import AdsAccount, AdsCampaignSnapshot, BudgetAllocation
        from datetime import date, timedelta
        import random

        accounts_data = [
            ('meta', 'ACT-123456789', 'Meta Ads — Kampanye Andi'),
            ('tiktok', 'TT-987654321', 'TikTok Ads — Andi Fathul'),
        ]
        ads_accounts = []
        for platform, acc_id, acc_name in accounts_data:
            acc, _ = AdsAccount.objects.get_or_create(
                tenant=tenant, platform=platform, account_id=acc_id,
                defaults={'account_name': acc_name, 'access_token': 'dev-token', 'is_active': True},
            )
            ads_accounts.append(acc)

        self.stdout.write(self.style.SUCCESS(f'✓ {len(ads_accounts)} ads accounts ready'))

        # Seed 30 days of campaign snapshots
        meta_campaigns = [
            ('meta-c-001', 'Kampanye Kesadaran Nama'),
            ('meta-c-002', 'Iklan Program Pendidikan'),
            ('meta-c-003', 'Boost Halaman Kampanye'),
        ]
        tiktok_campaigns = [
            ('tt-c-001', 'TikTok Brand Awareness'),
            ('tt-c-002', 'Video Program Unggulan'),
        ]

        today = date.today()
        snap_count = 0
        for days_ago in range(30, 0, -1):
            snap_date = today - timedelta(days=days_ago)
            meta_acc = ads_accounts[0]
            tiktok_acc = ads_accounts[1]

            for cid, cname in meta_campaigns:
                spend = round(random.uniform(150_000, 800_000), 0)
                impressions = int(spend * random.uniform(8, 15))
                reach = int(impressions * random.uniform(0.6, 0.85))
                clicks = int(impressions * random.uniform(0.02, 0.06))
                AdsCampaignSnapshot.objects.get_or_create(
                    ads_account=meta_acc, campaign_id=cid, snapshot_date=snap_date,
                    defaults=dict(
                        tenant=tenant, platform='meta', campaign_name=cname,
                        status='ACTIVE', spend=spend, impressions=impressions,
                        reach=reach, clicks=clicks,
                        cpm=round(spend / impressions * 1000, 2) if impressions else None,
                        ctr=round(clicks / impressions * 100, 4) if impressions else None,
                    )
                )
                snap_count += 1

            for cid, cname in tiktok_campaigns:
                spend = round(random.uniform(100_000, 500_000), 0)
                impressions = int(spend * random.uniform(10, 20))
                reach = int(impressions * random.uniform(0.5, 0.8))
                clicks = int(impressions * random.uniform(0.01, 0.04))
                AdsCampaignSnapshot.objects.get_or_create(
                    ads_account=tiktok_acc, campaign_id=cid, snapshot_date=snap_date,
                    defaults=dict(
                        tenant=tenant, platform='tiktok', campaign_name=cname,
                        status='ACTIVE', spend=spend, impressions=impressions,
                        reach=reach, clicks=clicks,
                        cpm=round(spend / impressions * 1000, 2) if impressions else None,
                        ctr=round(clicks / impressions * 100, 4) if impressions else None,
                    )
                )
                snap_count += 1

        self.stdout.write(self.style.SUCCESS(f'✓ {snap_count} ad snapshots seeded'))

        # Budget allocation
        period_start = today.replace(day=1)
        import calendar
        last_day = calendar.monthrange(today.year, today.month)[1]
        period_end = today.replace(day=last_day)
        BudgetAllocation.objects.get_or_create(
            tenant=tenant,
            period_start=period_start,
            defaults={
                'total_budget': 50_000_000,
                'allocations': {'meta': 30_000_000, 'tiktok': 15_000_000, 'google': 5_000_000},
                'period_end': period_end,
                'alert_threshold_pct': 80,
                'notes': 'Anggaran iklan digital bulan ini',
            }
        )
        self.stdout.write(self.style.SUCCESS('✓ Budget allocation seeded (Rp 50 juta)'))
        self.stdout.write(self.style.SUCCESS('\n🚀 Seed complete! Visit http://localhost:3001/afms to see the public campaign.'))
