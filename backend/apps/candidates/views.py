from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from drf_spectacular.utils import extend_schema
from .models import Candidate, CampaignPage
from .serializers import CandidateSerializer, CampaignPageSerializer, PublicCandidateSerializer
from apps.accounts.models import Tenant


class MyCandidateView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def _get_or_create_candidate(self, user):
        try:
            return user.candidate
        except Candidate.DoesNotExist:
            candidate = Candidate.objects.create(
                tenant=user.tenant,
                user=user,
                nama_lengkap=user.get_full_name() or user.username,
            )
            CampaignPage.objects.create(candidate=candidate)
            return candidate

    @extend_schema(responses={200: CandidateSerializer})
    def get(self, request):
        candidate = self._get_or_create_candidate(request.user)
        serializer = CandidateSerializer(candidate, context={'request': request})
        return Response(serializer.data)

    @extend_schema(request=CandidateSerializer, responses={200: CandidateSerializer})
    def put(self, request):
        candidate = self._get_or_create_candidate(request.user)
        serializer = CandidateSerializer(
            candidate, data=request.data, partial=True, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class MyCampaignPageView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def _get_page(self, user):
        try:
            return user.candidate.campaign_page
        except (Candidate.DoesNotExist, CampaignPage.DoesNotExist):
            return None

    @extend_schema(responses={200: CampaignPageSerializer})
    def get(self, request):
        page = self._get_page(request.user)
        if not page:
            return Response({'detail': 'Candidate profile not set up yet.'}, status=404)
        return Response(CampaignPageSerializer(page, context={'request': request}).data)

    @extend_schema(request=CampaignPageSerializer, responses={200: CampaignPageSerializer})
    def put(self, request):
        page = self._get_page(request.user)
        if not page:
            return Response({'detail': 'Candidate profile not set up yet.'}, status=404)
        serializer = CampaignPageSerializer(
            page, data=request.data, partial=True, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class PublishCampaignPageView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: CampaignPageSerializer})
    def post(self, request):
        try:
            page = request.user.candidate.campaign_page
        except (Candidate.DoesNotExist, CampaignPage.DoesNotExist):
            return Response({'detail': 'Candidate profile not set up yet.'}, status=404)

        page.is_published = True
        page.published_at = timezone.now()
        page.candidate.status = 'published'
        page.candidate.save()
        page.save()
        return Response(CampaignPageSerializer(page, context={'request': request}).data)


class PublicCandidateView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(responses={200: PublicCandidateSerializer})
    def get(self, request, slug):
        try:
            tenant = Tenant.objects.get(slug=slug, is_active=True)
            candidate = tenant.candidate
        except (Tenant.DoesNotExist, Candidate.DoesNotExist):
            return Response({'detail': 'Not found.'}, status=404)

        if candidate.status != 'published':
            return Response({'detail': 'Not found.'}, status=404)

        serializer = PublicCandidateSerializer(candidate, context={'request': request})
        return Response(serializer.data)


class PublicViewCountView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, slug):
        try:
            tenant = Tenant.objects.get(slug=slug, is_active=True)
            page = tenant.candidate.campaign_page
            page.view_count += 1
            page.save(update_fields=['view_count'])
        except Exception:
            pass
        return Response({'ok': True})


class PressKitPDFView(APIView):
    """Download a candidate press kit as a PDF."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            candidate = request.user.candidate
        except Candidate.DoesNotExist:
            return Response({'detail': 'Profile belum diisi.'}, status=404)

        pdf_bytes = self._build_pdf(candidate)
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        slug = candidate.tenant.slug
        response['Content-Disposition'] = f'attachment; filename="press-kit-{slug}.pdf"'
        return response

    def _build_pdf(self, candidate):
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.lib.units import cm
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.platypus import (
            SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
        )
        from reportlab.lib.enums import TA_CENTER, TA_LEFT
        import io as _io

        buf = _io.BytesIO()
        doc = SimpleDocTemplate(
            buf, pagesize=A4,
            leftMargin=2*cm, rightMargin=2*cm,
            topMargin=2*cm, bottomMargin=2*cm,
        )

        # Parse brand color
        try:
            hex_color = (candidate.color_primary or '#4F46E5').lstrip('#')
            r, g, b = int(hex_color[0:2], 16)/255, int(hex_color[2:4], 16)/255, int(hex_color[4:6], 16)/255
            brand = colors.Color(r, g, b)
        except Exception:
            brand = colors.HexColor('#4F46E5')

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'Title', parent=styles['Title'],
            textColor=brand, fontSize=26, spaceAfter=4,
        )
        sub_style = ParagraphStyle(
            'Sub', parent=styles['Normal'],
            textColor=colors.HexColor('#6B7280'), fontSize=12, spaceAfter=12,
        )
        heading_style = ParagraphStyle(
            'Heading', parent=styles['Heading2'],
            textColor=brand, fontSize=14, spaceBefore=18, spaceAfter=6,
        )
        body_style = ParagraphStyle(
            'Body', parent=styles['Normal'],
            fontSize=11, leading=16, spaceAfter=6,
        )
        bullet_style = ParagraphStyle(
            'Bullet', parent=styles['Normal'],
            fontSize=11, leading=16, leftIndent=16, spaceAfter=4,
        )

        story = []

        # Header
        story.append(Paragraph(candidate.nama_lengkap or 'Kandidat', title_style))
        meta_parts = []
        if candidate.partai:
            meta_parts.append(candidate.partai)
        if candidate.nomor_urut:
            meta_parts.append(f'Nomor Urut {candidate.nomor_urut}')
        if candidate.dapil:
            meta_parts.append(candidate.dapil)
        if meta_parts:
            story.append(Paragraph(' • '.join(meta_parts), sub_style))
        if candidate.tagline:
            story.append(Paragraph(f'"{candidate.tagline}"', body_style))

        story.append(HRFlowable(width='100%', thickness=1, color=brand, spaceAfter=12))

        # Visi
        if candidate.visi:
            story.append(Paragraph('VISI', heading_style))
            story.append(Paragraph(candidate.visi, body_style))

        # Misi
        misi = candidate.misi
        if isinstance(misi, str):
            import json
            try:
                misi = json.loads(misi)
            except Exception:
                misi = [misi]
        if misi:
            story.append(Paragraph('MISI', heading_style))
            for i, item in enumerate(misi, 1):
                story.append(Paragraph(f'{i}. {item}', bullet_style))

        # Program Unggulan
        programs = candidate.program_unggulan or []
        if programs:
            story.append(Paragraph('PROGRAM UNGGULAN', heading_style))
            for prog in programs:
                title = prog.get('title', '')
                desc = prog.get('desc', '')
                story.append(Paragraph(f'<b>{title}</b>', bullet_style))
                if desc:
                    story.append(Paragraph(desc, ParagraphStyle(
                        'ProgDesc', parent=body_style, leftIndent=16, textColor=colors.HexColor('#6B7280')
                    )))

        # Sosmed
        sosmed = candidate.sosmed or {}
        if sosmed:
            story.append(Paragraph('MEDIA SOSIAL', heading_style))
            rows = [[k.capitalize(), v] for k, v in sosmed.items() if v]
            if rows:
                t = Table(rows, colWidths=[4*cm, 12*cm])
                t.setStyle(TableStyle([
                    ('FONTSIZE', (0, 0), (-1, -1), 10),
                    ('TEXTCOLOR', (0, 0), (0, -1), brand),
                    ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
                ]))
                story.append(t)

        # Footer
        story.append(Spacer(1, 1*cm))
        story.append(HRFlowable(width='100%', thickness=0.5, color=colors.HexColor('#D1D5DB')))
        from django.utils import timezone
        story.append(Paragraph(
            f'Dicetak via KampanyeKit — {timezone.now().strftime("%d %B %Y")}',
            ParagraphStyle('Footer', parent=styles['Normal'],
                           fontSize=9, textColor=colors.HexColor('#9CA3AF'), spaceBefore=6)
        ))

        doc.build(story)
        buf.seek(0)
        return buf.getvalue()
