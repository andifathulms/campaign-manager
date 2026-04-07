from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from .models import ElectabilitySurvey
from .serializers import ElectabilitySurveySerializer


@extend_schema(tags=['analytics'])
class ElectabilityListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = ElectabilitySurvey.objects.filter(tenant=request.user.tenant)
        return Response(ElectabilitySurveySerializer(qs, many=True).data)

    def post(self, request):
        serializer = ElectabilitySurveySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        survey = serializer.save(tenant=request.user.tenant)
        return Response(ElectabilitySurveySerializer(survey).data, status=status.HTTP_201_CREATED)


@extend_schema(tags=['analytics'])
class ElectabilityDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get(self, request, pk):
        return get_object_or_404(ElectabilitySurvey, pk=pk, tenant=request.user.tenant)

    def patch(self, request, pk):
        survey = self._get(request, pk)
        serializer = ElectabilitySurveySerializer(survey, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        return Response(ElectabilitySurveySerializer(serializer.save()).data)

    def delete(self, request, pk):
        self._get(request, pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
