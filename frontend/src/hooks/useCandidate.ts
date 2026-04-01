import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { CandidateProfile } from '@/types';

export function useCandidate() {
  return useQuery({
    queryKey: ['candidate'],
    queryFn: () => api.get<CandidateProfile>('/candidates/me/').then(r => r.data),
  });
}

export function useUpdateCandidate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: FormData | Partial<CandidateProfile>) => {
      const isFormData = data instanceof FormData;
      return api.put<CandidateProfile>('/candidates/me/', data, {
        headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
      }).then(r => r.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidate'] });
    },
  });
}
