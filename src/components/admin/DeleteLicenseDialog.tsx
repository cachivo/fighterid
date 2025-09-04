import { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFighterProfiles } from '@/hooks/useFighterProfiles';

interface DeleteLicenseDialogProps {
  licenseId: string;
  fighterName: string;
  onSuccess?: () => void;
}

export function DeleteLicenseDialog({ licenseId, fighterName, onSuccess }: DeleteLicenseDialogProps) {
  const { deleteLicense } = useFighterProfiles();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [isSecondConfirmOpen, setIsSecondConfirmOpen] = useState(false);

  const handleFirstConfirm = () => {
    setIsSecondConfirmOpen(true);
  };

  const handleSecondConfirm = async () => {
    if (confirmationText !== 'ELIMINAR') {
      return;
    }

    setIsDeleting(true);
    try {
      const success = await deleteLicense(licenseId);
      if (success) {
        setIsSecondConfirmOpen(false);
        setConfirmationText('');
        onSuccess?.();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setIsSecondConfirmOpen(false);
    setConfirmationText('');
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      
      {!isSecondConfirmOpen ? (
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              ¿Eliminar Licencia?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Estás a punto de eliminar permanentemente la licencia de{' '}
                <span className="font-semibold">{fighterName}</span>.
              </p>
              <p className="text-sm text-muted-foreground">
                Esta acción eliminará:
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>La licencia y todos sus datos</li>
                <li>Documentos asociados</li>
                <li>Certificaciones médicas</li>
                <li>Reservas de peleas pendientes</li>
                <li>Tokens de verificación</li>
              </ul>
              <p className="text-sm font-medium text-destructive">
                Esta acción no se puede deshacer.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleFirstConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      ) : (
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirmación Final
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                Para confirmar la eliminación de la licencia de{' '}
                <span className="font-semibold">{fighterName}</span>,
                escribe <code className="bg-muted px-1 py-0.5 rounded text-destructive font-mono">ELIMINAR</code> en el campo de abajo:
              </p>
              
              <div className="space-y-2">
                <Label htmlFor="confirmDelete">Confirmación:</Label>
                <Input
                  id="confirmDelete"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder="Escribe ELIMINAR para confirmar"
                  className="font-mono"
                />
              </div>
              
              <p className="text-xs text-muted-foreground">
                Una vez eliminada, no será posible recuperar esta información.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel} disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSecondConfirm}
              disabled={confirmationText !== 'ELIMINAR' || isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar Definitivamente'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      )}
    </AlertDialog>
  );
}