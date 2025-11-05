import { useState, useRef } from "react";
import AdminLayoutWithAI from "@/components/admin/AIAssistant/AdminLayoutWithAI";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  Image as ImageIcon, 
  Paperclip, 
  Send, 
  Loader2, 
  X,
  Info,
  ArrowLeft
} from "lucide-react";

export default function EmailCampaignEditor() {
  const navigate = useNavigate();
  const editorRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [subject, setSubject] = useState("");
  const [recipientFilter, setRecipientFilter] = useState<string>("all");
  const [testMode, setTestMode] = useState(true);
  const [testEmail, setTestEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState<Array<{
    name: string;
    url: string;
    size: number;
  }>>([]);

  const applyFormat = (command: string) => {
    document.execCommand(command, false);
    editorRef.current?.focus();
  };

  const handleImageInsert = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("La imagen no debe superar 2MB");
      return;
    }

    setUploading(true);
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const { error } = await supabase.storage
        .from("email-assets")
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from("email-assets")
        .getPublicUrl(fileName);

      const img = `<img src="${publicUrl}" style="max-width: 100%; height: auto; margin: 10px 0; border-radius: 4px;" alt="Imagen de campaña" />`;
      document.execCommand("insertHTML", false, img);

      toast.success("Imagen insertada correctamente");
    } catch (error: any) {
      toast.error("Error al subir imagen: " + error.message);
    } finally {
      setUploading(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    }
  };

  const handleFileAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("El archivo no debe superar 10MB");
      return;
    }

    setUploading(true);
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const { error } = await supabase.storage
        .from("email-assets")
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from("email-assets")
        .getPublicUrl(fileName);

      setAttachments([...attachments, {
        name: file.name,
        url: publicUrl,
        size: file.size
      }]);

      toast.success(`${file.name} adjuntado correctamente`);
    } catch (error: any) {
      toast.error("Error al adjuntar archivo: " + error.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSend = async () => {
    if (!subject.trim()) {
      toast.error("El asunto es obligatorio");
      return;
    }

    if (!editorRef.current?.innerText.trim()) {
      toast.error("El mensaje no puede estar vacío");
      return;
    }

    if (testMode && !testEmail.trim()) {
      toast.error("Ingresa un correo de prueba");
      return;
    }

    const confirmMessage = testMode
      ? `¿Enviar email de prueba a ${testEmail}?`
      : `¿Enviar campaña masiva a: ${recipientFilter === "all" ? "todos los usuarios" : 
          recipientFilter === "fighters_only" ? "solo peleadores" : "solo administradores"}?`;

    if (!confirm(confirmMessage)) return;

    setSending(true);
    try {
      const editorContent = editorRef.current?.innerHTML || "";

      const finalHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            ${editorContent}
            
            ${attachments.length > 0 ? `
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5;">
                <p style="font-weight: bold; margin-bottom: 10px; color: #374151;">Archivos adjuntos:</p>
                ${attachments.map(file => `
                  <div style="margin-bottom: 8px;">
                    <a href="${file.url}" style="color: #DC2626; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
                      📎 ${file.name}
                    </a>
                  </div>
                `).join('')}
              </div>
            ` : ''}
            
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; text-align: center; color: #6b7280; font-size: 12px;">
              <p>Fighter ID - Sistema de Gestión de Peleadores</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const { error } = await supabase.functions.invoke("send-mass-email", {
        body: {
          subject,
          html_content: finalHtml,
          recipient_filter: testMode ? null : recipientFilter,
          test_mode: testMode,
          test_email: testMode ? testEmail : null,
        },
      });

      if (error) throw error;

      toast.success(testMode
        ? "Email de prueba enviado correctamente"
        : "Campaña enviada exitosamente");

      if (!testMode) {
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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/email-campaigns")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Editor de Campañas</h1>
            <p className="text-muted-foreground">
              Crea y envía emails masivos de forma sencilla
            </p>
          </div>
        </div>

        {/* Guía rápida */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Guía Rápida</AlertTitle>
          <AlertDescription className="mt-2 space-y-2 text-sm">
            <p><strong>Para insertar imágenes:</strong> Click en el botón "Imagen" y selecciona un archivo (máx. 2MB)</p>
            <p><strong>Para adjuntar archivos:</strong> Click en "Adjuntar" y selecciona el archivo (máx. 10MB)</p>
            <p className="text-xs text-muted-foreground mt-2">
              💡 Tip: Siempre envía un correo de prueba antes de enviar masivamente
            </p>
          </AlertDescription>
        </Alert>

        {/* Editor principal */}
        <Card>
          <CardContent className="p-0">
            {/* Destinatarios y Asunto */}
            <div className="p-4 space-y-3 border-b">
              <div className="flex items-center gap-2">
                <Label className="w-16 text-sm">Para:</Label>
                <Select value={recipientFilter} onValueChange={setRecipientFilter}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los usuarios</SelectItem>
                    <SelectItem value="fighters_only">Solo peleadores</SelectItem>
                    <SelectItem value="admins_only">Solo administradores</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Label className="w-16 text-sm">Asunto:</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Escribe el asunto del correo..."
                  className="flex-1"
                />
              </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-1 p-2 border-b bg-muted/30">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => applyFormat("bold")}
                title="Negrita"
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => applyFormat("italic")}
                title="Cursiva"
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => applyFormat("underline")}
                title="Subrayado"
              >
                <Underline className="h-4 w-4" />
              </Button>

              <Separator orientation="vertical" className="h-6 mx-1" />

              <Button
                size="sm"
                variant="ghost"
                onClick={() => applyFormat("insertUnorderedList")}
                title="Lista"
              >
                <List className="h-4 w-4" />
              </Button>

              <Separator orientation="vertical" className="h-6 mx-1" />

              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageInsert}
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => imageInputRef.current?.click()}
                disabled={uploading}
                title="Insertar imagen"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <ImageIcon className="h-4 w-4 mr-1" />
                    Imagen
                  </>
                )}
              </Button>

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileAttach}
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                title="Adjuntar archivo"
              >
                <Paperclip className="h-4 w-4 mr-1" />
                Adjuntar
              </Button>
            </div>

            {/* Editor de contenido */}
            <div
              ref={editorRef}
              contentEditable
              className="min-h-[400px] p-4 focus:outline-none prose max-w-none"
              suppressContentEditableWarning
              style={{
                lineHeight: "1.6",
                fontSize: "14px",
              }}
            >
              <p>Escribe tu mensaje aquí...</p>
            </div>

            {/* Adjuntos */}
            {attachments.length > 0 && (
              <div className="border-t p-3 bg-muted/20">
                <p className="text-sm font-medium mb-2">Archivos adjuntos:</p>
                {attachments.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 bg-background rounded mb-1"
                  >
                    <div className="flex items-center gap-2">
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setAttachments(attachments.filter((_, i) => i !== idx))
                      }
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Footer: Opciones de envío */}
            <div className="border-t p-4 bg-muted/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="test-mode"
                      checked={testMode}
                      onCheckedChange={(checked) => setTestMode(checked as boolean)}
                    />
                    <Label htmlFor="test-mode" className="text-sm cursor-pointer">
                      Modo Prueba
                    </Label>
                  </div>

                  {testMode && (
                    <Input
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="correo@prueba.com"
                      className="w-64"
                    />
                  )}
                </div>

                <Button
                  size="lg"
                  onClick={handleSend}
                  disabled={sending || !subject || !editorRef.current?.innerText.trim()}
                >
                  {sending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-5 w-5" />
                      {testMode ? "Enviar Prueba" : "Enviar Campaña"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayoutWithAI>
  );
}
