import { useState, useEffect } from "react";
import AdminLayoutWithAI from "@/components/admin/AIAssistant/AdminLayoutWithAI";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";
import { Send, Loader2, ArrowLeft, FileText, Settings } from "lucide-react";
import EmailRecipientSelector from "@/components/admin/EmailRecipientSelector";
import FighterSegmentSelector from "@/components/admin/FighterSegmentSelector";
import { EmailTipTapEditor } from "@/components/email/EmailTipTapEditor";
import {
  useEmailCampaignDraft,
  useCreateCampaignDraft,
  useUpdateCampaignDraft,
  useAutoSaveCampaignDraft,
} from "@/hooks/useEmailCampaignEditor";

interface Recipient {
  email: string;
  name?: string;
  avatarUrl?: string;
  isExternal?: boolean;
}

export default function EmailCampaignEditor() {
  const navigate = useNavigate();
  const { id: draftId } = useParams<{ id: string }>();

  const [subject, setSubject] = useState("");
  const [recipientFilter, setRecipientFilter] = useState<string>("all");
  const [customRecipients, setCustomRecipients] = useState<Recipient[]>([]);
  const [testMode, setTestMode] = useState(true);
  const [testEmail, setTestEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | undefined>(draftId);

  // Segment state
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [segmentCount, setSegmentCount] = useState<number>(0);

  // Draft hooks
  const { data: draft } = useEmailCampaignDraft(currentDraftId);
  const createDraft = useCreateCampaignDraft();
  const updateDraft = useUpdateCampaignDraft();
  const autoSaveDraft = useAutoSaveCampaignDraft();

  // Create draft on mount if no draftId
  useEffect(() => {
    if (!draftId && !currentDraftId) {
      createDraft.mutate({ nombre: 'Nueva Campaña' }, {
        onSuccess: (data) => {
          setCurrentDraftId(data.id);
          navigate(`/admin/email-campaigns/editor/${data.id}`, { replace: true });
        },
      });
    }
  }, [draftId]);

  // Load draft data
  useEffect(() => {
    if (draft) {
      setSubject(draft.asunto || '');
      setRecipientFilter(draft.recipient_filter || 'all');
    }
  }, [draft]);

  const handleAutoSave = (html: string, json: any) => {
    if (currentDraftId) {
      autoSaveDraft.mutate({ id: currentDraftId, html, json });
    }
  };

  const handleSave = async (html: string, json: any) => {
    if (currentDraftId) {
      await updateDraft.mutateAsync({
        id: currentDraftId,
        data: {
          html_content: html,
          json_content: json,
          asunto: subject,
          recipient_filter: recipientFilter,
          metadata: recipientFilter === 'fighters_segment'
            ? { segment: { disciplines: selectedDisciplines, levels: selectedLevels } }
            : {},
        },
      });
    }
  };

  const handleSend = async () => {
    if (!subject.trim()) { toast.error("El asunto es obligatorio"); return; }
    if (testMode && !testEmail.trim()) { toast.error("Ingresa un correo de prueba"); return; }
    if (recipientFilter === "custom" && customRecipients.length === 0 && !testMode) { toast.error("Selecciona al menos un destinatario"); return; }
    if (recipientFilter === "fighters_segment" && !testMode) {
      if (selectedDisciplines.length === 0) { toast.error("Selecciona al menos una disciplina"); return; }
      if (selectedLevels.length === 0) { toast.error("Selecciona al menos un nivel"); return; }
      if (segmentCount === 0) { toast.error("No hay peleadores en el segmento seleccionado"); return; }
    }

    const getRecipientDescription = () => {
      switch (recipientFilter) {
        case "all": return "todos los usuarios";
        case "fighters_only": return "solo peleadores";
        case "admins_only": return "solo administradores";
        case "custom": return `${customRecipients.length} destinatario(s)`;
        case "fighters_segment": return `${segmentCount} peleador(es)`;
        default: return "destinatarios";
      }
    };

    if (!confirm(testMode ? `¿Enviar prueba a ${testEmail}?` : `¿Enviar campaña a: ${getRecipientDescription()}?`)) return;

    setSending(true);
    try {
      const editorContent = draft?.html_content || '';
      const finalHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;"><div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">${editorContent}<div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; text-align: center; color: #6b7280; font-size: 12px;"><p>Fighter ID - Sistema de Gestión de Peleadores</p></div></div></body></html>`;

      const { error } = await supabase.functions.invoke("send-mass-email", {
        body: {
          subject,
          html_content: finalHtml,
          recipient_filter: testMode ? null : recipientFilter,
          custom_emails: recipientFilter === "custom" && !testMode ? customRecipients.map((r) => r.email) : undefined,
          segment_disciplines: recipientFilter === "fighters_segment" && !testMode ? selectedDisciplines : undefined,
          segment_levels: recipientFilter === "fighters_segment" && !testMode ? selectedLevels : undefined,
          test_mode: testMode,
          test_email: testMode ? testEmail : null,
        },
      });
      if (error) throw error;

      toast.success(testMode ? "Email de prueba enviado" : "Campaña enviada exitosamente");

      // Mark draft as sent
      if (!testMode && currentDraftId) {
        await updateDraft.mutateAsync({ id: currentDraftId, data: { estado: 'enviada', sent_at: new Date().toISOString() } });
        navigate("/admin/email-campaigns");
      }
    } catch (error: any) {
      toast.error("Error al enviar: " + error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <AdminLayoutWithAI>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/email-campaigns")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Editor de Campañas</h1>
            <p className="text-muted-foreground">Editor profesional con auto-guardado</p>
          </div>
        </div>

        <Tabs defaultValue="contenido" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="contenido" className="gap-2"><FileText className="h-4 w-4" />Contenido</TabsTrigger>
            <TabsTrigger value="configuracion" className="gap-2"><Settings className="h-4 w-4" />Configuración y Envío</TabsTrigger>
          </TabsList>

          <TabsContent value="contenido" className="mt-4">
            {currentDraftId ? (
              <EmailTipTapEditor
                campaignId={currentDraftId}
                initialContent={draft?.html_content || ''}
                initialJsonContent={draft?.json_content}
                onSave={handleSave}
                onAutoSave={handleAutoSave}
              />
            ) : (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
          </TabsContent>

          <TabsContent value="configuracion" className="mt-4">
            <Card>
              <CardContent className="p-6 space-y-6">
                {/* Recipients */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Label className="w-20 text-sm">Para:</Label>
                    <Select value={recipientFilter} onValueChange={setRecipientFilter}>
                      <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los usuarios</SelectItem>
                        <SelectItem value="fighters_only">Solo peleadores</SelectItem>
                        <SelectItem value="admins_only">Solo administradores</SelectItem>
                        <SelectItem value="fighters_segment">Peleadores por Segmento</SelectItem>
                        <SelectItem value="custom">Selección Manual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {recipientFilter === "fighters_segment" && (
                    <div className="pl-20">
                      <FighterSegmentSelector
                        selectedDisciplines={selectedDisciplines}
                        onDisciplinesChange={setSelectedDisciplines}
                        selectedLevels={selectedLevels}
                        onLevelsChange={setSelectedLevels}
                        onCountUpdate={setSegmentCount}
                      />
                    </div>
                  )}

                  {recipientFilter === "custom" && (
                    <div className="pl-20">
                      <EmailRecipientSelector
                        selectedRecipients={customRecipients}
                        onRecipientsChange={setCustomRecipients}
                      />
                    </div>
                  )}
                </div>

                {/* Subject */}
                <div className="flex items-center gap-2">
                  <Label className="w-20 text-sm">Asunto:</Label>
                  <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Escribe el asunto del correo..." className="flex-1" />
                </div>

                {/* Test mode & Send */}
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Checkbox id="test-mode" checked={testMode} onCheckedChange={(c) => setTestMode(c as boolean)} />
                        <Label htmlFor="test-mode" className="text-sm cursor-pointer">Modo Prueba</Label>
                      </div>
                      {testMode && (
                        <Input type="email" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="correo@prueba.com" className="w-64" />
                      )}
                    </div>
                    <Button size="lg" onClick={handleSend} disabled={sending || !subject}>
                      {sending ? (<><Loader2 className="mr-2 h-5 w-5 animate-spin" />Enviando...</>) : (<><Send className="mr-2 h-5 w-5" />{testMode ? "Enviar Prueba" : "Enviar Campaña"}</>)}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayoutWithAI>
  );
}
