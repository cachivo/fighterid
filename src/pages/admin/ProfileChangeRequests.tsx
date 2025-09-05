import { useState, useEffect } from 'react';
import { useProfileChangeRequests } from '@/hooks/useProfileChangeRequests';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Check, X, AlertCircle, Eye, MessageSquare, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ProfileChangeRequests() {
  const { requests, loading, fetchAllRequests, updateRequestStatus } = useProfileChangeRequests();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchAllRequests();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'APPROVED':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'REJECTED':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'REQUIRES_INFO':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pendiente';
      case 'APPROVED':
        return 'Aprobado';
      case 'REJECTED':
        return 'Rechazado';
      case 'REQUIRES_INFO':
        return 'Requiere Info';
      default:
        return status;
    }
  };

  const handleStatusUpdate = async (requestId: string, status: string) => {
    setIsProcessing(true);
    try {
      await updateRequestStatus(requestId, status, adminNotes);
      setSelectedRequest(null);
      setAdminNotes('');
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderChangesComparison = (current: any, requested: any) => {
    const changes = Object.keys(requested);
    
    return (
      <div className="space-y-4">
        {changes.map((field) => (
          <div key={field} className="border rounded-lg p-4">
            <h4 className="font-medium mb-2 capitalize">{field.replace(/_/g, ' ')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Actual:</label>
                <div className="p-2 bg-muted rounded text-sm">
                  {Array.isArray(current[field]) 
                    ? current[field]?.join(', ') || 'No especificado'
                    : current[field] || 'No especificado'
                  }
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Propuesto:</label>
                <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded text-sm">
                  {Array.isArray(requested[field])
                    ? requested[field]?.join(', ') || 'No especificado'
                    : requested[field] || 'No especificado'
                  }
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-300 rounded w-1/4"></div>
          <div className="h-64 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Solicitudes de Cambio</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona las solicitudes de cambio de perfil de los peleadores
          </p>
        </div>
        <Button onClick={fetchAllRequests} variant="outline">
          Actualizar
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requests.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              {requests.filter(r => r.status === 'PENDING').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprobadas</CardTitle>
            <Check className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {requests.filter(r => r.status === 'APPROVED').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rechazadas</CardTitle>
            <X className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {requests.filter(r => r.status === 'REJECTED').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Solicitudes de Cambio</CardTitle>
          <CardDescription>
            Lista de todas las solicitudes de cambio de perfil
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Peleador</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Campos</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {request.fighter_profiles?.first_name} {request.fighter_profiles?.last_name}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(request.status)}>
                      {getStatusText(request.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {Object.keys(request.requested_changes).length} campo(s)
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(request.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedRequest(request)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>
                            Solicitud de {selectedRequest?.fighter_profiles?.first_name} {selectedRequest?.fighter_profiles?.last_name}
                          </DialogTitle>
                          <DialogDescription>
                            Revisa los cambios solicitados y toma una decisión
                          </DialogDescription>
                        </DialogHeader>
                        
                        {selectedRequest && (
                          <div className="space-y-6">
                            {/* Changes Comparison */}
                            <div>
                              <h3 className="text-lg font-medium mb-4">Cambios Solicitados</h3>
                              {renderChangesComparison(
                                selectedRequest.fighter_profiles,
                                selectedRequest.requested_changes
                              )}
                            </div>

                            {/* Admin Notes */}
                            <div>
                              <label className="text-sm font-medium mb-2 block">
                                Notas Administrativas
                              </label>
                              <Textarea
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                placeholder="Agrega comentarios sobre esta solicitud..."
                                className="min-h-[100px]"
                              />
                            </div>

                            {/* Existing Admin Notes */}
                            {selectedRequest.admin_notes && (
                              <div className="p-4 bg-muted rounded">
                                <h4 className="font-medium mb-2">Notas Previas:</h4>
                                <p className="text-sm">{selectedRequest.admin_notes}</p>
                              </div>
                            )}

                            {/* Action Buttons */}
                            {selectedRequest.status === 'PENDING' && (
                              <div className="flex gap-2 pt-4 border-t">
                                <Button
                                  onClick={() => handleStatusUpdate(selectedRequest.id, 'APPROVED')}
                                  disabled={isProcessing}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  Aprobar
                                </Button>
                                <Button
                                  onClick={() => handleStatusUpdate(selectedRequest.id, 'REJECTED')}
                                  disabled={isProcessing}
                                  variant="destructive"
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Rechazar
                                </Button>
                                <Button
                                  onClick={() => handleStatusUpdate(selectedRequest.id, 'REQUIRES_INFO')}
                                  disabled={isProcessing}
                                  variant="outline"
                                >
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  Solicitar Info
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {requests.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No hay solicitudes de cambio</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
