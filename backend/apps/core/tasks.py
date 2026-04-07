"""
Celery tasks for KampanyeKit.

Tasks:
  - generate_weekly_report(tenant_id)  — builds PDF + emails candidate
  - generate_weekly_report_all_tenants — fan-out for all active tenants
"""
import io
import logging
from datetime import date, timedelta
from decimal import Decimal

from celery import shared_task
from django.conf import settings
from django.core.mail import EmailMessage
from django.db.models import Sum

logger = logging.getLogger(__name__)


# ── PDF builder ────────────────────────────────────────────────────────────────

def _build_report_pdf(tenant) -> bytes:
    """Generate a weekly summary PDF for the given tenant using ReportLab."""
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm
    from reportlab.lib import colors
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
    )

    from apps.supporters.models import Supporter
    from apps.teams.models import TeamMember, Task
    from apps.ads.models import AdsCampaignSnapshot, BudgetAllocation
    try:
        from apps.engagement.models import Aspirasi
    except Exception:
        Aspirasi = None
    try:
        from apps.analytics.models import ElectabilitySurvey
    except Exception:
        ElectabilitySurvey = None

    today = date.today()
    week_start = today - timedelta(days=7)
    month_start = today.replace(day=1)

    # ── Gather data ──────────────────────────────────────────────────────
    supporter_total = Supporter.objects.filter(tenant=tenant, is_active=True).count()
    supporter_new = Supporter.objects.filter(
        tenant=tenant, is_active=True, created_at__date__gte=week_start
    ).count()

    team_count = TeamMember.objects.filter(tenant=tenant, is_active=True).count()

    ads_qs = AdsCampaignSnapshot.objects.filter(
        tenant=tenant, snapshot_date__gte=week_start, snapshot_date__lte=today
    )
    ads_agg = ads_qs.aggregate(
        spend=Sum('spend'), reach=Sum('reach'),
        impressions=Sum('impressions'), clicks=Sum('clicks'),
    )
    week_spend = float(ads_agg['spend'] or 0)
    week_reach = ads_agg['reach'] or 0
    week_clicks = ads_agg['clicks'] or 0

    budget = BudgetAllocation.objects.filter(
        tenant=tenant, period_start__lte=today, period_end__gte=today
    ).first()

    month_spend_agg = AdsCampaignSnapshot.objects.filter(
        tenant=tenant, snapshot_date__gte=month_start
    ).aggregate(total=Sum('spend'))
    month_spend = float(month_spend_agg['total'] or 0)

    # Phase 2 data
    task_qs = Task.objects.filter(tenant=tenant)
    task_total = task_qs.count()
    task_done = task_qs.filter(status='done').count()
    task_overdue = task_qs.filter(
        status__in=['assigned', 'in_progress'], deadline__lt=today
    ).count()

    aspirasi_total = 0
    aspirasi_unread = 0
    if Aspirasi is not None:
        aspirasi_qs = Aspirasi.objects.filter(tenant=tenant)
        aspirasi_total = aspirasi_qs.count()
        aspirasi_unread = aspirasi_qs.filter(status='unread').count()

    latest_elektabilitas = None
    if ElectabilitySurvey is not None:
        latest_elektabilitas = ElectabilitySurvey.objects.filter(
            tenant=tenant
        ).order_by('-tanggal').first()

    try:
        candidate = tenant.candidate
        candidate_name = candidate.nama_lengkap
        dapil = candidate.dapil
        partai = candidate.partai
    except Exception:
        candidate_name = tenant.name
        dapil = ''
        partai = ''

    # ── Build PDF ────────────────────────────────────────────────────────
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm,
        topMargin=2*cm, bottomMargin=2*cm,
    )

    styles = getSampleStyleSheet()
    INDIGO = colors.HexColor('#4F46E5')
    GRAY = colors.HexColor('#6B7280')
    LIGHT = colors.HexColor('#F3F4F6')

    title_style = ParagraphStyle('Title', parent=styles['Title'],
                                  textColor=INDIGO, fontSize=22, spaceAfter=4)
    sub_style = ParagraphStyle('Sub', parent=styles['Normal'],
                                textColor=GRAY, fontSize=10, spaceAfter=2)
    section_style = ParagraphStyle('Section', parent=styles['Heading2'],
                                    textColor=INDIGO, fontSize=13, spaceBefore=16, spaceAfter=8)
    body_style = ParagraphStyle('Body', parent=styles['Normal'], fontSize=10, spaceAfter=4)

    def rp(n): return f"Rp {int(n):,}".replace(',', '.')
    def num(n): return f"{int(n):,}".replace(',', '.')

    story = [
        Paragraph("Laporan Mingguan Kampanye", title_style),
        Paragraph(f"{candidate_name} &bull; {partai} &bull; {dapil}", sub_style),
        Paragraph(
            f"Periode: {week_start.strftime('%d %b')} – {today.strftime('%d %b %Y')}",
            sub_style
        ),
        HRFlowable(width='100%', thickness=1, color=INDIGO, spaceAfter=12),

        # Ringkasan
        Paragraph("Ringkasan Minggu Ini", section_style),
    ]

    summary_data = [
        ['Metrik', 'Minggu Ini', 'Total'],
        ['Total Pendukung', f'+{num(supporter_new)} baru', num(supporter_total)],
        ['Anggota Tim', '—', num(team_count)],
        ['Jangkauan Iklan', num(week_reach), '—'],
        ['Klik Iklan', num(week_clicks), '—'],
        ['Belanja Iklan', rp(week_spend), rp(month_spend) + ' (bulan ini)'],
    ]

    tbl = Table(summary_data, colWidths=[7*cm, 5*cm, 5*cm])
    tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), INDIGO),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT]),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E5E7EB')),
        ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(tbl)

    # Budget section
    if budget:
        story.append(Paragraph("Anggaran Iklan", section_style))
        spend_pct = (month_spend / float(budget.total_budget) * 100) if budget.total_budget else 0
        story.append(Paragraph(
            f"Total anggaran: <b>{rp(float(budget.total_budget))}</b> &nbsp;|&nbsp; "
            f"Terpakai bulan ini: <b>{rp(month_spend)}</b> ({spend_pct:.1f}%)",
            body_style
        ))
        if spend_pct >= budget.alert_threshold_pct:
            story.append(Paragraph(
                f"⚠ Peringatan: Anggaran telah melampaui {budget.alert_threshold_pct}% batas.",
                ParagraphStyle('Warn', parent=body_style, textColor=colors.HexColor('#D97706'))
            ))

    # Tasks section
    if task_total > 0:
        story.append(Paragraph("Tugas Tim", section_style))
        tasks_data = [
            ['Total Tugas', 'Selesai', 'Terlambat'],
            [num(task_total), num(task_done), num(task_overdue)],
        ]
        tasks_tbl = Table(tasks_data, colWidths=[5.6*cm, 5.6*cm, 5.6*cm])
        tasks_tbl.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), INDIGO),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [LIGHT]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E5E7EB')),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(tasks_tbl)

    # Aspirasi section
    if aspirasi_total > 0:
        story.append(Paragraph("Aspirasi Masyarakat", section_style))
        story.append(Paragraph(
            f"Total aspirasi masuk: <b>{num(aspirasi_total)}</b> &nbsp;|&nbsp; "
            f"Belum ditanggapi: <b>{num(aspirasi_unread)}</b>",
            body_style
        ))

    # Electability
    if latest_elektabilitas is not None:
        story.append(Paragraph("Elektabilitas Terkini", section_style))
        story.append(Paragraph(
            f"Survei terakhir ({latest_elektabilitas.tanggal.strftime('%d %b %Y')}): "
            f"<b>{latest_elektabilitas.elektabilitas_pct}%</b> — {latest_elektabilitas.sumber}",
            body_style
        ))

    # Footer
    story.append(Spacer(1, 1*cm))
    story.append(HRFlowable(width='100%', thickness=0.5, color=GRAY))
    story.append(Paragraph(
        f"Dibuat otomatis oleh KampanyeKit &bull; {today.strftime('%d %B %Y')}",
        ParagraphStyle('Footer', parent=body_style, textColor=GRAY, fontSize=8)
    ))

    doc.build(story)
    return buf.getvalue()


# ── Celery tasks ───────────────────────────────────────────────────────────────

@shared_task(bind=True, max_retries=3, default_retry_delay=300)
def generate_weekly_report(self, tenant_id: str):
    """Generate and email weekly report for one tenant."""
    from apps.accounts.models import Tenant

    try:
        tenant = Tenant.objects.get(id=tenant_id, is_active=True)
    except Tenant.DoesNotExist:
        logger.warning(f"Tenant {tenant_id} not found, skipping report.")
        return {'status': 'skipped', 'reason': 'tenant not found'}

    try:
        candidate = tenant.candidate
        recipient_email = candidate.user.email
        candidate_name = candidate.nama_lengkap
    except Exception:
        logger.warning(f"No candidate for tenant {tenant_id}, skipping.")
        return {'status': 'skipped', 'reason': 'no candidate'}

    if not recipient_email:
        logger.warning(f"No email for candidate {candidate_name}, skipping.")
        return {'status': 'skipped', 'reason': 'no email'}

    try:
        pdf_bytes = _build_report_pdf(tenant)
        today = date.today()
        filename = f"laporan-mingguan-{today.strftime('%Y-%m-%d')}.pdf"

        email = EmailMessage(
            subject=f"Laporan Mingguan Kampanye — {candidate_name}",
            body=(
                f"Halo {candidate_name},\n\n"
                f"Berikut laporan mingguan kampanye digital Anda.\n"
                f"Silakan buka lampiran untuk melihat ringkasan lengkap.\n\n"
                f"Salam,\nTim KampanyeKit"
            ),
            from_email=settings.REPORT_FROM_EMAIL,
            to=[recipient_email],
        )
        email.attach(filename, pdf_bytes, 'application/pdf')
        email.send()

        logger.info(f"Weekly report sent to {recipient_email} for tenant {tenant.slug}")
        return {'status': 'sent', 'to': recipient_email, 'file': filename}

    except Exception as exc:
        logger.error(f"Report generation failed for {tenant.slug}: {exc}")
        raise self.retry(exc=exc)


@shared_task
def generate_weekly_report_all_tenants():
    """Fan-out: trigger weekly report for every active tenant."""
    from apps.accounts.models import Tenant

    tenants = Tenant.objects.filter(is_active=True)
    count = 0
    for tenant in tenants:
        generate_weekly_report.delay(str(tenant.id))
        count += 1

    logger.info(f"Queued weekly reports for {count} tenants.")
    return {'queued': count}
