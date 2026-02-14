import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  EmailCampaignService,
  CampaignImageService,
  type EmailCampaignDraft,
} from '@/services/emailCampaignService';

const KEYS = {
  drafts: ['email-campaign-drafts'] as const,
  draft: (id: string) => ['email-campaign-drafts', id] as const,
  images: (id: string) => ['email-campaign-images', id] as const,
};

export function useEmailCampaignDrafts() {
  return useQuery({
    queryKey: KEYS.drafts,
    queryFn: () => EmailCampaignService.getDrafts(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useEmailCampaignDraft(id: string | undefined) {
  return useQuery({
    queryKey: KEYS.draft(id!),
    queryFn: () => EmailCampaignService.getById(id!),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateCampaignDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (campaign: Partial<EmailCampaignDraft>) =>
      EmailCampaignService.create(campaign),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.drafts });
      toast.success('Borrador creado');
    },
    onError: (error: any) => {
      toast.error(`Error al crear borrador: ${error.message}`);
    },
  });
}

export function useUpdateCampaignDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EmailCampaignDraft> }) =>
      EmailCampaignService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: KEYS.drafts });
      queryClient.invalidateQueries({ queryKey: KEYS.draft(id) });
    },
    onError: (error: any) => {
      toast.error(`Error al actualizar: ${error.message}`);
    },
  });
}

export function useAutoSaveCampaignDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, html, json }: { id: string; html: string; json: any }) =>
      EmailCampaignService.autoSave(id, html, json),
    onSuccess: (data, { id }) => {
      queryClient.setQueryData(KEYS.draft(id), data);
    },
    onError: (error: any) => {
      console.error('Error en auto-guardado:', error);
    },
  });
}

export function useDeleteCampaignDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => EmailCampaignService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.drafts });
      toast.success('Borrador eliminado');
    },
    onError: (error: any) => {
      toast.error(`Error al eliminar: ${error.message}`);
    },
  });
}

export function useDuplicateCampaignDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => EmailCampaignService.duplicate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.drafts });
      toast.success('Borrador duplicado');
    },
    onError: (error: any) => {
      toast.error(`Error al duplicar: ${error.message}`);
    },
  });
}

export function useUploadCampaignImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, campaignId }: { file: File; campaignId: string }) =>
      CampaignImageService.upload(file, campaignId),
    onSuccess: (_, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: KEYS.images(campaignId) });
    },
    onError: (error: any) => {
      toast.error(`Error al subir imagen: ${error.message}`);
    },
  });
}
