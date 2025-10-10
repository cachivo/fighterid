import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, XCircle, Clock, FileText, Activity, FlaskConical } from 'lucide-react';
import { usePendingChanges } from '@/hooks/usePendingChanges';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function PendingChangesHub() {
  const {
    profileChanges,
    fighterUpdates,
    dopingTests,
    loading,
    updateProfileChangeStatus,
    moderateFighterUpdate,
    verifyDopingTest,
    totalPending
  } = usePendingChanges();

  const [selectedChange, setSelectedChange] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [dialogType, setDialogType] = useState<'profile' | 'update' | 'doping' | null>(null);

  const handleApproveProfileChange = async () => {
    if (!selectedChange) return;
    setIsProcessing(true);
    try {
      await updateProfileChangeStatus(selectedChange.id, 'APPROVED', adminNotes);
      setSelectedChange(null);
      setAdminNotes('');
      setDialogType(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectProfileChange = async () => {
    if (!selectedChange) return;
    setIsProcessing(true);
    try {
      await updateProfileChangeStatus(selectedChange.id, 'REJECTED', adminNotes);
      setSelectedChange(null);
      setAdminNotes('');
      setDialogType(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApproveFighterUpdate = async () => {
    if (!selectedChange) return;
    setIsProcessing(true);
    try {
      await moderateFighterUpdate(selectedChange.id, 'APPROVED', adminNotes);
      setSelectedChange(null);
      setAdminNotes('');
      setDialogType(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectFighterUpdate = async () => {
    if (!selectedChange) return;
    setIsProcessing(true);
    try {
      await moderateFighterUpdate(selectedChange.id, 'REJECTED', adminNotes);
      setSelectedChange(null);
      setAdminNotes('');
      setDialogType(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifyDopingTest = async (resultStatus: 'CLEAN' | 'POSITIVE') => {
    if (!selectedChange) return;
    setIsProcessing(true);
    try {
      await verifyDopingTest(selectedChange.id, resultStatus, adminNotes);
      setSelectedChange(null);
      setAdminNotes('');
      setDialogType(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderChangeDiff = (current: any, requested: any) => {
    const changes = [];
    for (const key in requested) {
      if (requested[key] !== current?.[key]) {
        changes.push(
          <div key={key} className="flex justify-between items-center py-2 border-b">
            <span className="font-medium text-sm capitalize">{key.replace(/_/g, ' ')}</span>
            <div className="flex gap-2 items-center text-sm">
              <span className="text-muted-foreground line-through">{current?.[key] || 'N/A'}</span>
              <span>→</span>
              <span className="text-primary font-medium">{requested[key]}</span>
            </div>
          </div>
        );
      }
    }
    return changes;
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            Centro de Moderación
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Revisa y aprueba cambios pendientes
          </p>
        </div>
        <Badge variant="secondary" className="text-base sm:text-lg">
          {totalPending} Pendientes
        </Badge>
      </div>

      <Tabs defaultValue="profiles" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profiles" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Perfiles</span>
            <Badge variant="secondary">{profileChanges.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="updates" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Updates</span>
            <Badge variant="secondary">{fighterUpdates.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="doping" className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4" />
            <span className="hidden sm:inline">Dopaje</span>
            <Badge variant="secondary">{dopingTests.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* Profile Changes Tab */}
        <TabsContent value="profiles" className="space-y-4">
          {profileChanges.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No hay solicitudes de cambio de perfil pendientes
              </CardContent>
            </Card>
          ) : (
            profileChanges.map((change) => (
              <Card key={change.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={change.fighter_profiles?.avatar_url} />
                        <AvatarFallback>
                          {change.fighter_profiles?.first_name?.[0]}
                          {change.fighter_profiles?.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">
                          {change.fighter_profiles?.first_name} {change.fighter_profiles?.last_name}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {format(new Date(change.created_at), "PPp", { locale: es })}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className="gap-1">
                      <Clock className="h-3 w-3" />
                      Pendiente
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      Cambios solicitados: {Object.keys(change.requested_changes).length}
                    </p>
                    <Button
                      onClick={() => {
                        setSelectedChange(change);
                        setDialogType('profile');
                      }}
                      className="w-full sm:w-auto"
                    >
                      Revisar Cambios
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Fighter Updates Tab */}
        <TabsContent value="updates" className="space-y-4">
          {fighterUpdates.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No hay actualizaciones de peleadores pendientes
              </CardContent>
            </Card>
          ) : (
            fighterUpdates.map((update) => (
              <Card key={update.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={update.fighter_profiles?.avatar_url} />
                        <AvatarFallback>
                          {update.fighter_profiles?.first_name?.[0]}
                          {update.fighter_profiles?.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">
                          {update.fighter_profiles?.first_name} {update.fighter_profiles?.last_name}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {format(new Date(update.created_at), "PPp", { locale: es })}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className="gap-1">
                      <Clock className="h-3 w-3" />
                      Pendiente
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-3 line-clamp-2">{update.content}</p>
                  {update.image_url && (
                    <img 
                      src={update.image_url} 
                      alt="Update" 
                      className="rounded-lg max-h-48 object-cover mb-3"
                    />
                  )}
                  <Button
                    onClick={() => {
                      setSelectedChange(update);
                      setDialogType('update');
                    }}
                    className="w-full sm:w-auto"
                  >
                    Moderar
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Doping Tests Tab */}
        <TabsContent value="doping" className="space-y-4">
          {dopingTests.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No hay tests de dopaje pendientes
              </CardContent>
            </Card>
          ) : (
            dopingTests.map((test) => (
              <Card key={test.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {test.fighter_licenses?.fighter_profiles?.first_name}{' '}
                        {test.fighter_licenses?.fighter_profiles?.last_name}
                      </CardTitle>
                      <CardDescription>
                        {test.test_type} - {test.testing_agency}
                      </CardDescription>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(test.test_date), "PPP", { locale: es })}
                      </p>
                    </div>
                    <Badge variant="outline" className="gap-1">
                      <Clock className="h-3 w-3" />
                      Pendiente
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => {
                      setSelectedChange(test);
                      setDialogType('doping');
                    }}
                    className="w-full sm:w-auto"
                  >
                    Verificar Test
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Profile Change Dialog */}
      <Dialog open={dialogType === 'profile'} onOpenChange={() => setDialogType(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Revisar Cambios de Perfil</DialogTitle>
            <DialogDescription>
              Revisa los cambios solicitados y aprueba o rechaza la solicitud
            </DialogDescription>
          </DialogHeader>
          {selectedChange && (
            <div className="space-y-4">
              <div className="space-y-2">
                {renderChangeDiff(
                  selectedChange.fighter_profiles,
                  selectedChange.requested_changes
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Notas del Admin</label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Agrega notas opcionales..."
                  className="mt-1"
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleRejectProfileChange}
              disabled={isProcessing}
              className="gap-2"
            >
              <XCircle className="h-4 w-4" />
              Rechazar
            </Button>
            <Button
              onClick={handleApproveProfileChange}
              disabled={isProcessing}
              className="gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Aprobar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fighter Update Dialog */}
      <Dialog open={dialogType === 'update'} onOpenChange={() => setDialogType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Moderar Actualización</DialogTitle>
            <DialogDescription>
              Revisa el contenido y decide si aprobarlo o rechazarlo
            </DialogDescription>
          </DialogHeader>
          {selectedChange && (
            <div className="space-y-4">
              <div>
                <p className="text-sm">{selectedChange.content}</p>
                {selectedChange.image_url && (
                  <img 
                    src={selectedChange.image_url} 
                    alt="Update" 
                    className="rounded-lg mt-3 max-h-64 object-cover"
                  />
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Notas del Admin</label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Agrega notas opcionales..."
                  className="mt-1"
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleRejectFighterUpdate}
              disabled={isProcessing}
              className="gap-2"
            >
              <XCircle className="h-4 w-4" />
              Rechazar
            </Button>
            <Button
              onClick={handleApproveFighterUpdate}
              disabled={isProcessing}
              className="gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Aprobar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Doping Test Dialog */}
      <Dialog open={dialogType === 'doping'} onOpenChange={() => setDialogType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verificar Test de Dopaje</DialogTitle>
            <DialogDescription>
              Revisa el test y marca el resultado
            </DialogDescription>
          </DialogHeader>
          {selectedChange && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p><span className="font-medium">Tipo:</span> {selectedChange.test_type}</p>
                <p><span className="font-medium">Agencia:</span> {selectedChange.testing_agency}</p>
                <p><span className="font-medium">Fecha:</span> {format(new Date(selectedChange.test_date), "PPP", { locale: es })}</p>
                {selectedChange.report_file_url && (
                  <a 
                    href={selectedChange.report_file_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm"
                  >
                    Ver reporte →
                  </a>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Notas</label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Agrega observaciones..."
                  className="mt-1"
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="destructive"
              onClick={() => handleVerifyDopingTest('POSITIVE')}
              disabled={isProcessing}
              className="gap-2"
            >
              <AlertCircle className="h-4 w-4" />
              Positivo
            </Button>
            <Button
              onClick={() => handleVerifyDopingTest('CLEAN')}
              disabled={isProcessing}
              className="gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Limpio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
