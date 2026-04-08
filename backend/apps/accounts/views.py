from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from drf_spectacular.utils import extend_schema
from .serializers import LoginSerializer, RegisterSerializer, UserSerializer, TokenResponseSerializer


class LoginView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(request=LoginSerializer, responses={200: TokenResponseSerializer})
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
        })


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={204: None})
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
        except TokenError:
            pass
        return Response(status=status.HTTP_204_NO_CONTENT)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(request=RegisterSerializer, responses={201: TokenResponseSerializer})
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
        }, status=status.HTTP_201_CREATED)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: UserSerializer})
    def get(self, request):
        return Response(UserSerializer(request.user).data)

    @extend_schema(request=UserSerializer, responses={200: UserSerializer})
    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        old_password = request.data.get('old_password', '')
        new_password = request.data.get('new_password', '')

        if not request.user.check_password(old_password):
            return Response({'detail': 'Password lama tidak sesuai.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(new_password) < 8:
            return Response({'detail': 'Password baru minimal 8 karakter.'}, status=status.HTTP_400_BAD_REQUEST)

        request.user.set_password(new_password)
        request.user.save(update_fields=['password'])
        return Response({'detail': 'Password berhasil diubah.'})


class TenantSettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from .serializers import TenantSerializer
        tenant = request.user.tenant
        if not tenant:
            return Response({'detail': 'No tenant.'}, status=404)
        return Response(TenantSerializer(tenant).data)

    def patch(self, request):
        from .serializers import TenantSerializer
        tenant = request.user.tenant
        if not tenant:
            return Response({'detail': 'No tenant.'}, status=404)
        # Only allow updating name and custom_domain
        allowed = {k: v for k, v in request.data.items() if k in ('name', 'custom_domain')}
        serializer = TenantSerializer(tenant, data=allowed, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


# --------------- WhatsApp OTP ---------------

class OTPRequestView(APIView):
    """Request a WhatsApp OTP for phone-based login."""
    permission_classes = [AllowAny]

    def post(self, request):
        import random
        from django.utils import timezone
        from datetime import timedelta
        from .models import OTPCode

        phone = request.data.get('phone', '').strip().replace(' ', '').replace('-', '')
        if not phone:
            return Response({'detail': 'Nomor HP diperlukan.'}, status=status.HTTP_400_BAD_REQUEST)

        # Normalize phone
        if phone.startswith('0'):
            phone = '62' + phone[1:]
        elif phone.startswith('+'):
            phone = phone[1:]

        # Rate limit: max 3 OTPs per phone per hour
        one_hour_ago = timezone.now() - timedelta(hours=1)
        recent_count = OTPCode.objects.filter(
            phone=phone, created_at__gte=one_hour_ago
        ).count()
        if recent_count >= 3:
            return Response(
                {'detail': 'Terlalu banyak permintaan OTP. Coba lagi dalam 1 jam.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        code = f"{random.randint(100000, 999999)}"
        OTPCode.objects.create(
            phone=phone, code=code,
            expires_at=timezone.now() + timedelta(minutes=10),
        )

        # Send via WhatsApp
        from .whatsapp import get_whatsapp_backend
        backend = get_whatsapp_backend()
        backend.send_otp(phone, code)

        return Response({'detail': 'OTP telah dikirim via WhatsApp.', 'phone': phone})


class OTPVerifyView(APIView):
    """Verify OTP and return JWT tokens. Creates user if not exists."""
    permission_classes = [AllowAny]

    def post(self, request):
        from django.utils import timezone
        from .models import OTPCode, User

        phone = request.data.get('phone', '').strip().replace(' ', '').replace('-', '')
        code = request.data.get('code', '').strip()

        if not phone or not code:
            return Response({'detail': 'Phone dan code diperlukan.'}, status=status.HTTP_400_BAD_REQUEST)

        if phone.startswith('0'):
            phone = '62' + phone[1:]
        elif phone.startswith('+'):
            phone = phone[1:]

        otp = OTPCode.objects.filter(
            phone=phone, code=code, is_used=False,
            expires_at__gt=timezone.now(),
        ).order_by('-created_at').first()

        if not otp:
            return Response({'detail': 'OTP tidak valid atau sudah kadaluarsa.'}, status=status.HTTP_400_BAD_REQUEST)

        otp.is_used = True
        otp.save(update_fields=['is_used'])

        # Find or create user
        user = User.objects.filter(phone=phone).first()
        if not user:
            import secrets
            user = User.objects.create_user(
                username=f'wa_{phone}',
                phone=phone,
                role='relawan',
                password=secrets.token_urlsafe(16),
            )

        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
            'is_new_user': not user.last_login,
        })
