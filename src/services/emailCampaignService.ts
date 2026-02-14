import { supabase } from '@/integrations/supabase/client';

export interface EmailCampaignDraft {
  id: string;
  created_by: string | null;
  nombre: string;
  asunto: string;
  preview_text: string | null;
  html_content: string | null;
  json_content: any;
  from_name: string | null;
  from_email: string | null;
  reply_to: string | null;
  estado: string;
  recipient_filter: string | null;
  metadata: any;
  total_recipients: number | null;
  total_sent: number | null;
  total_failed: number | null;
  sent_at: string | null;
  last_autosave: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignImage {
  id: string;
  campaign_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  public_url: string | null;
  created_at: string;
}

// ============ DRAFT CAMPAIGNS SERVICE ============
export class EmailCampaignService {
  static async getAll() {
    const { data, error } = await supabase
      .from('email_campaigns_v2')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as EmailCampaignDraft[];
  }

  static async getDrafts() {
    const { data, error } = await supabase
      .from('email_campaigns_v2')
      .select('*')
      .eq('estado', 'borrador')
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return data as EmailCampaignDraft[];
  }

  static async getById(id: string) {
    const { data, error } = await supabase
      .from('email_campaigns_v2')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as EmailCampaignDraft;
  }

  static async create(campaign: Partial<EmailCampaignDraft>) {
    const { data: userData } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('email_campaigns_v2')
      .insert({
        nombre: campaign.nombre || 'Sin título',
        asunto: campaign.asunto || '',
        created_by: userData.user?.id,
        ...campaign,
      })
      .select()
      .single();
    if (error) throw error;
    return data as EmailCampaignDraft;
  }

  static async update(id: string, campaign: Partial<EmailCampaignDraft>) {
    const { data, error } = await supabase
      .from('email_campaigns_v2')
      .update(campaign)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as EmailCampaignDraft;
  }

  static async autoSave(id: string, htmlContent: string, jsonContent: any) {
    const { data, error } = await supabase
      .from('email_campaigns_v2')
      .update({
        html_content: htmlContent,
        json_content: jsonContent,
        last_autosave: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as EmailCampaignDraft;
  }

  static async delete(id: string) {
    const { error } = await supabase
      .from('email_campaigns_v2')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  static async duplicate(id: string) {
    const original = await this.getById(id);
    const { data: userData } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('email_campaigns_v2')
      .insert({
        nombre: `${original.nombre} (Copia)`,
        asunto: original.asunto,
        preview_text: original.preview_text,
        html_content: original.html_content,
        json_content: original.json_content,
        from_name: original.from_name,
        from_email: original.from_email,
        reply_to: original.reply_to,
        estado: 'borrador',
        recipient_filter: original.recipient_filter,
        metadata: original.metadata,
        created_by: userData.user?.id,
      })
      .select()
      .single();
    if (error) throw error;
    return data as EmailCampaignDraft;
  }
}

// ============ CAMPAIGN IMAGES SERVICE ============
export class CampaignImageService {
  static async upload(file: File, campaignId: string): Promise<CampaignImage> {
    if (!file.type.startsWith('image/')) {
      throw new Error('El archivo debe ser una imagen');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('La imagen no puede superar los 5MB');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const { data: userData } = await supabase.auth.getUser();
    const filePath = `${userData.user?.id}/${campaignId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('email-campaign-images')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('email-campaign-images')
      .getPublicUrl(filePath);

    const dimensions = await this.getImageDimensions(file);

    const { data: imageData, error: dbError } = await supabase
      .from('email_campaign_images')
      .insert({
        campaign_id: campaignId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        width: dimensions.width,
        height: dimensions.height,
        public_url: urlData.publicUrl,
      })
      .select()
      .single();

    if (dbError) {
      await supabase.storage.from('email-campaign-images').remove([filePath]);
      throw dbError;
    }

    return imageData as CampaignImage;
  }

  private static getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      const url = URL.createObjectURL(file);
      img.onload = () => { URL.revokeObjectURL(url); resolve({ width: img.width, height: img.height }); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No se pudo cargar la imagen')); };
      img.src = url;
    });
  }

  static async getByCampaign(campaignId: string) {
    const { data, error } = await supabase
      .from('email_campaign_images')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as CampaignImage[];
  }

  static async delete(imageId: string) {
    const { data: image, error: fetchError } = await supabase
      .from('email_campaign_images')
      .select('*')
      .eq('id', imageId)
      .single();
    if (fetchError) throw fetchError;

    await supabase.storage.from('email-campaign-images').remove([image.file_path]);

    const { error: dbError } = await supabase
      .from('email_campaign_images')
      .delete()
      .eq('id', imageId);
    if (dbError) throw dbError;
  }
}
