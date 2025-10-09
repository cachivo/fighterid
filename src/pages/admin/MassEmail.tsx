import { useState } from 'react';
import AdminLayoutWithAI from '@/components/admin/AIAssistant/AdminLayoutWithAI';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Mail, Send, Users, Shield, TestTube2, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function MassEmail() {
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [recipientFilter, setRecipientFilter] = useState<'all' | 'fighters_only' | 'admins_only'>('all');
  const [testMode, setTestMode] = useState(true);
  const [testEmail, setTestEmail] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!subject.trim() || !htmlContent.trim()) {
      toast.error('Por favor completa el asunto y el contenido del correo');
      return;
    }

    if (testMode && !testEmail.trim()) {
      toast.error('Por favor ingresa un correo para el modo de prueba');
      return;
    }

    const confirmed = confirm(
      testMode
        ? `¿Enviar correo de prueba a ${testEmail}?`
        : `¿Estás seguro de enviar este correo a todos los ${recipientFilter === 'all' ? 'usuarios' : recipientFilter === 'fighters_only' ? 'peleadores' : 'administradores'}? Esta acción no se puede deshacer.`
    );

    if (!confirmed) return;

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-mass-email', {
        body: {
          subject,
          html_content: htmlContent,
          recipient_filter: recipientFilter,
          test_mode: testMode,
          test_email: testEmail
        }
      });

      if (error) throw error;

      if (data.success) {
        toast.success(
          `Correos enviados exitosamente. ✅ ${data.results.success} exitosos, ❌ ${data.results.failed} fallidos`
        );
        
        // Limpiar formulario si fue exitoso
        if (data.results.failed === 0) {
          setSubject('');
          setHtmlContent('');
          setTestEmail('');
        }
      } else {
        throw new Error(data.error || 'Error desconocido');
      }
    } catch (error: any) {
      console.error('Error sending mass email:', error);
      toast.error('Error al enviar correos: ' + (error.message || 'Error desconocido'));
    } finally {
      setSending(false);
    }
  };

  const insertTemplate = (template: string) => {
    const templates: Record<string, string> = {
      welcome: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #DC2626;">¡Bienvenido a Fighter ID!</h1>
          <p>Estimado usuario,</p>
          <p>Es un placer tenerte como parte de nuestra comunidad de atletas profesionales.</p>
          <p>Tu perfil está siendo revisado y pronto recibirás tu licencia oficial.</p>
          <br>
          <p>Saludos cordiales,</p>
          <p><strong>El equipo de Fighter ID</strong></p>
        </div>
      `,
      event: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #DC2626;">Nuevo Evento Próximamente</h1>
          <p>Estimado peleador,</p>
          <p>Te informamos sobre un próximo evento que podría interesarte:</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0;">Nombre del Evento</h2>
            <p><strong>Fecha:</strong> [FECHA]</p>
            <p><strong>Lugar:</strong> [LUGAR]</p>
            <p><strong>Categorías:</strong> [CATEGORÍAS]</p>
          </div>
          <p>Para más información, visita <a href="https://fighter-id.org">fighter-id.org</a></p>
          <br>
          <p>Saludos,</p>
          <p><strong>El equipo de Fighter ID</strong></p>
        </div>
      `,
      reminder: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #DC2626;">Recordatorio Importante</h1>
          <p>Estimado usuario,</p>
          <p>Te recordamos que es importante mantener tu perfil actualizado:</p>
          <ul>
            <li>Verificar tu información personal</li>
            <li>Actualizar tu récord de peleas</li>
            <li>Mantener vigentes tus certificaciones médicas</li>
          </ul>
          <p>Puedes actualizar tu perfil en <a href="https://fighter-id.org">fighter-id.org</a></p>
          <br>
          <p>Gracias,</p>
          <p><strong>El equipo de Fighter ID</strong></p>
        </div>
      `
    };

    setHtmlContent(templates[template] || '');
  };

  return (
    <AdminLayoutWithAI>
      <div className="space-y-6">
        <Alert>
          <Mail className="h-4 w-4" />
          <AlertDescription>
            Esta herramienta permite enviar correos electrónicos a todos los usuarios registrados o grupos específicos.
            Siempre realiza una prueba antes de enviar a toda la base de datos.
          </AlertDescription>
        </Alert>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Configuración del Correo
              </CardTitle>
              <CardDescription>
                Configura el contenido y destinatarios del correo masivo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Asunto del Correo</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ej: Actualización importante de Fighter ID"
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground">
                  {subject.length}/200 caracteres
                </p>
              </div>

              <div className="space-y-2">
                <Label>Plantilla Rápida</Label>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => insertTemplate('welcome')}
                  >
                    Bienvenida
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => insertTemplate('event')}
                  >
                    Evento
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => insertTemplate('reminder')}
                  >
                    Recordatorio
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Contenido HTML</Label>
                <Textarea
                  id="content"
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  placeholder="Escribe el contenido en HTML..."
                  className="min-h-[300px] font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipients">Destinatarios</Label>
                <Select value={recipientFilter} onValueChange={(v: any) => setRecipientFilter(v)}>
                  <SelectTrigger id="recipients">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Todos los usuarios
                      </div>
                    </SelectItem>
                    <SelectItem value="fighters_only">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Solo peleadores
                      </div>
                    </SelectItem>
                    <SelectItem value="admins_only">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Solo administradores
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="test-mode"
                  checked={testMode}
                  onCheckedChange={(checked) => setTestMode(checked as boolean)}
                />
                <Label htmlFor="test-mode" className="flex items-center gap-2 cursor-pointer">
                  <TestTube2 className="h-4 w-4" />
                  Modo de prueba (enviar solo a un correo)
                </Label>
              </div>

              {testMode && (
                <div className="space-y-2">
                  <Label htmlFor="test-email">Correo de Prueba</Label>
                  <Input
                    id="test-email"
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                  />
                </div>
              )}

              <Button
                onClick={handleSend}
                disabled={sending}
                className="w-full"
                size="lg"
              >
                {sending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    {testMode ? 'Enviar Prueba' : 'Enviar a Todos'}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vista Previa</CardTitle>
              <CardDescription>
                Así se verá el correo que enviarás
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-white">
                <div className="border-b pb-3 mb-3">
                  <p className="text-sm text-muted-foreground">Asunto:</p>
                  <p className="font-semibold">{subject || '(Sin asunto)'}</p>
                </div>
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: htmlContent || '<p class="text-muted-foreground">(Sin contenido)</p>' }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayoutWithAI>
  );
}
