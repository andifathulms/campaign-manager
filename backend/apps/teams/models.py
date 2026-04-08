import secrets
from django.db import models
from apps.core.models import BaseModel


class TeamMember(BaseModel):
    LEVEL_CHOICES = [
        (1, 'Koordinator Wilayah'),
        (2, 'Koordinator Kecamatan'),
        (3, 'Koordinator Kelurahan'),
        (4, 'Relawan'),
    ]
    WILAYAH_LEVEL_CHOICES = [
        ('provinsi', 'Provinsi'),
        ('kabupaten', 'Kabupaten/Kota'),
        ('kecamatan', 'Kecamatan'),
        ('kelurahan', 'Kelurahan'),
    ]

    tenant = models.ForeignKey(
        'accounts.Tenant', on_delete=models.CASCADE, related_name='team_members'
    )
    user = models.OneToOneField(
        'accounts.User', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='team_member'
    )
    parent = models.ForeignKey(
        'self', on_delete=models.SET_NULL, null=True, blank=True, related_name='subordinates'
    )
    level = models.IntegerField(choices=LEVEL_CHOICES, default=4)
    nama = models.CharField(max_length=200)
    phone = models.CharField(max_length=20)
    wilayah_name = models.CharField(max_length=200)
    wilayah_level = models.CharField(max_length=20, choices=WILAYAH_LEVEL_CHOICES, default='kelurahan')
    is_active = models.BooleanField(default=True)
    total_points = models.IntegerField(default=0)

    class Meta:
        ordering = ['level', 'nama']

    def __str__(self):
        return f"{self.nama} ({self.get_level_display()})"

    def get_referral_stats(self):
        links = self.referral_links.all()
        total_clicks = sum(l.clicks for l in links)
        return {'total_clicks': total_clicks, 'link_count': links.count()}


class ReferralLink(BaseModel):
    team_member = models.ForeignKey(
        TeamMember, on_delete=models.CASCADE, related_name='referral_links'
    )
    code = models.CharField(max_length=20, unique=True)
    label = models.CharField(max_length=100, blank=True)
    clicks = models.IntegerField(default=0)
    unique_visitors = models.IntegerField(default=0)
    last_clicked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-clicks']

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = secrets.token_urlsafe(8)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.code} ({self.team_member.nama})"


class ReferralClick(BaseModel):
    referral_link = models.ForeignKey(
        ReferralLink, on_delete=models.CASCADE, related_name='click_records'
    )
    ip_hash = models.CharField(max_length=64)
    user_agent = models.TextField(blank=True)
    clicked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-clicked_at']


class Task(BaseModel):
    PRIORITY_CHOICES = [
        ('high', 'Tinggi'),
        ('medium', 'Sedang'),
        ('low', 'Rendah'),
    ]
    STATUS_CHOICES = [
        ('assigned', 'Ditugaskan'),
        ('in_progress', 'Dikerjakan'),
        ('done', 'Selesai'),
    ]
    KATEGORI_CHOICES = [
        ('sosialisasi', 'Sosialisasi'),
        ('pembagian_materi', 'Pembagian Materi'),
        ('pendataan', 'Pendataan'),
        ('event', 'Event'),
        ('digital', 'Digital'),
    ]

    tenant = models.ForeignKey(
        'accounts.Tenant', on_delete=models.CASCADE, related_name='tasks'
    )
    assigned_to = models.ForeignKey(
        TeamMember, on_delete=models.CASCADE, null=True, blank=True, related_name='tasks'
    )
    assigned_by = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL, null=True, related_name='assigned_tasks'
    )
    judul = models.CharField(max_length=300)
    deskripsi = models.TextField(blank=True)
    prioritas = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='assigned')
    deadline = models.DateField(null=True, blank=True)
    wilayah = models.CharField(max_length=200, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    # Pool / self-assignment fields
    is_pool = models.BooleanField(default=False)
    capacity = models.IntegerField(default=1)
    kategori = models.CharField(max_length=20, choices=KATEGORI_CHOICES, blank=True)
    poin_reward = models.IntegerField(default=0)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        if self.assigned_to:
            return f"{self.judul} → {self.assigned_to.nama}"
        return f"{self.judul} (pool)"

    @property
    def assignments_count(self):
        return self.assignments.exclude(status='rejected').count()

    @property
    def is_full(self):
        return self.assignments_count >= self.capacity


class TaskAssignment(BaseModel):
    """Tracks volunteer self-assignment to pool tasks."""
    STATUS_CHOICES = [
        ('in_progress', 'Dikerjakan'),
        ('completed', 'Selesai'),
        ('expired', 'Kedaluwarsa'),
        ('rejected', 'Ditolak'),
    ]

    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='assignments')
    volunteer = models.ForeignKey(TeamMember, on_delete=models.CASCADE, related_name='task_assignments')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_progress')
    evidence_photo = models.ImageField(upload_to='tasks/evidence/', null=True, blank=True)
    evidence_notes = models.TextField(blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_assignments'
    )
    approved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ('task', 'volunteer')

    def __str__(self):
        return f"{self.volunteer.nama} → {self.task.judul} ({self.status})"


class Announcement(BaseModel):
    """Internal announcement board for the tim sukses."""
    LEVEL_CHOICES = [
        (0, 'Semua'),
        (1, 'Koordinator Wilayah ke atas'),
        (2, 'Koordinator Kecamatan ke atas'),
        (3, 'Koordinator Kelurahan ke atas'),
        (4, 'Semua termasuk Relawan'),
    ]

    tenant = models.ForeignKey(
        'accounts.Tenant', on_delete=models.CASCADE, related_name='announcements'
    )
    author = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL, null=True, related_name='announcements'
    )
    judul = models.CharField(max_length=300)
    isi = models.TextField()
    min_level = models.IntegerField(
        choices=LEVEL_CHOICES, default=4,
        help_text='Members at this level and above will see this announcement.'
    )
    is_pinned = models.BooleanField(default=False)

    class Meta:
        ordering = ['-is_pinned', '-created_at']

    def __str__(self):
        return self.judul


class PointRule(BaseModel):
    """Configurable point values per tenant for each rewarded action."""
    ACTION_CHOICES = [
        ('register', 'Registrasi Relawan'),
        ('task_complete', 'Selesai Tugas'),
        ('share_content', 'Bagikan Konten'),
        ('manual_supporter', 'Input Pendukung Manual'),
        ('link_supporter', 'Pendukung via Link'),
        ('event_checkin', 'Checkin Event'),
    ]

    tenant = models.ForeignKey(
        'accounts.Tenant', on_delete=models.CASCADE, related_name='point_rules'
    )
    action_type = models.CharField(max_length=30, choices=ACTION_CHOICES)
    points = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('tenant', 'action_type')
        ordering = ['action_type']

    def __str__(self):
        return f"{self.tenant.name} — {self.get_action_type_display()}: {self.points} pts"


class PointTransaction(BaseModel):
    """Immutable log of every point credit/debit for a team member."""
    tenant = models.ForeignKey(
        'accounts.Tenant', on_delete=models.CASCADE, related_name='point_transactions'
    )
    team_member = models.ForeignKey(
        TeamMember, on_delete=models.CASCADE, related_name='point_transactions'
    )
    action_type = models.CharField(max_length=30)
    points = models.IntegerField()
    description = models.CharField(max_length=500, blank=True)
    reference_id = models.UUIDField(null=True, blank=True)
    reference_type = models.CharField(max_length=50, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.team_member.nama}: {self.points:+d} pts ({self.action_type})"
