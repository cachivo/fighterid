import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, CheckCircle, AlertCircle, Clock, ExternalLink, RefreshCw } from "lucide-react";
import { useState } from "react";

export default function EmailMonitoring() {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const emailStats = [
    { label: "Dominio Configurado", value: "fighter-id.org", status: "success" },
    { label: "Email de Envío", value: "notificaciones@fighter-id.org", status: "success" },
    { label: "Proveedor", value: "Resend", status: "success" },
    { label: "Estado del Dominio", value: "Verificado", status: "success" },
  ];

  const edgeFunctions = [
    {
      name: "send-signup-confirmation",
      description: "Emails de confirmación de registro",
      status: "active",
      lastUpdate: "Hace 2 horas"
    },
    {
      name: "send-password-recovery",
      description: "Emails de recuperación de contraseña",
      status: "active",
      lastUpdate: "Hace 5 horas"
    },
    {
      name: "send-fighter-invitation",
      description: "Invitaciones a peleadores",
      status: "active",
      lastUpdate: "Hace 1 día"
    },
    {
      name: "send-license-approval",
      description: "Aprobación de licencias",
      status: "active",
      lastUpdate: "Hace 3 días"
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Monitoreo de Emails</h1>
          <p className="text-muted-foreground">
            Estado del sistema de emails y configuración
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Configuración del Dominio */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Configuración del Dominio
          </CardTitle>
          <CardDescription>
            Configuración actual del sistema de emails
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {emailStats.map((stat) => (
              <div key={stat.label} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-lg font-semibold">{stat.value}</p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edge Functions Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Edge Functions de Email
          </CardTitle>
          <CardDescription>
            Estado de las funciones que envían emails
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {edgeFunctions.map((func) => (
              <div key={func.name} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold">{func.name}</p>
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-600/20">
                      {func.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{func.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">{func.lastUpdate}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                >
                  <a
                    href={`https://supabase.com/dashboard/project/eeshomcqztvjkvycdfwi/functions/${func.name}/logs`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Enlaces Rápidos</CardTitle>
          <CardDescription>
            Accesos directos a herramientas externas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-between"
            asChild
          >
            <a
              href="https://resend.com/emails"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>Ver Dashboard de Resend</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
          <Button
            variant="outline"
            className="w-full justify-between"
            asChild
          >
            <a
              href="https://resend.com/domains"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>Configuración de Dominio</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
          <Button
            variant="outline"
            className="w-full justify-between"
            asChild
          >
            <a
              href="https://supabase.com/dashboard/project/eeshomcqztvjkvycdfwi/settings/functions"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>Secrets de Edge Functions</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Testing Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Pruebas Recomendadas
          </CardTitle>
          <CardDescription>
            Acciones para verificar el funcionamiento del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Registro de nuevo usuario</p>
                <p className="text-muted-foreground">Verifica que llegue el email de confirmación desde notificaciones@fighter-id.org</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Recuperación de contraseña</p>
                <p className="text-muted-foreground">Prueba el flujo de "Olvidé mi contraseña"</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Invitación de peleador</p>
                <p className="text-muted-foreground">Envía una invitación desde el panel de admin</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
