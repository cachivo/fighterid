import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldX, ArrowLeft, Mail } from 'lucide-react';

export default function AccessDenied() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <ShieldX className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold">Acceso Denegado</CardTitle>
          <CardDescription>
            No tienes permisos de administrador para acceder a esta sección
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Si necesitas acceso administrativo, contacta al administrador del sistema.
          </p>
          
          <div className="flex flex-col gap-3">
            <Button asChild>
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al Inicio
              </Link>
            </Button>
            
            <Button variant="outline" asChild>
              <a href="mailto:admin@batalladegimnasios.com">
                <Mail className="mr-2 h-4 w-4" />
                Solicitar Acceso
              </a>
            </Button>
          </div>
          
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h3 className="text-sm font-medium mb-2">¿Eres administrador?</h3>
            <p className="text-xs text-muted-foreground">
              Asegúrate de usar las credenciales correctas de administrador. 
              El acceso regular a la plataforma no incluye permisos administrativos.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}