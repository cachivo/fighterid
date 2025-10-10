import { Monitor, Loader2 } from 'lucide-react';
import { useDeviceRestriction } from '@/hooks/useDeviceRestriction';

export function DesktopOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isDesktop, isChecking } = useDeviceRestriction();

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isDesktop) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="max-w-md text-center space-y-6">
          <Monitor className="h-20 w-20 mx-auto text-destructive" />
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-destructive">
              Acceso Restringido
            </h1>
            <p className="text-muted-foreground text-lg">
              El panel de juez solo está disponible en <strong>computadores de escritorio</strong>.
            </p>
          </div>
          
          <div className="p-6 bg-muted rounded-lg text-left space-y-4">
            <p className="font-semibold text-sm">📋 Requisitos del Sistema:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
              <li>Computador de escritorio o laptop</li>
              <li>Mouse conectado (USB o Bluetooth)</li>
              <li>Conexión Ethernet recomendada</li>
              <li>Navegador Chrome o Firefox actualizado</li>
              <li>Sin pantalla táctil (dispositivos no táctiles)</li>
            </ul>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Esta restricción garantiza precisión y latencia mínima en el registro de eventos.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
