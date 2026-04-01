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
        self.stdout.write(self.style.SUCCESS('\n🚀 Seed complete! Visit http://localhost:3001/afms to see the public campaign.'))
