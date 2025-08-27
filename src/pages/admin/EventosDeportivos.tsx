import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface EventoDeportivo {
  id: string;
  titulo: string;
  descripcion: string;
  icono: string;
  activo: boolean;
  orden: number;
}

export default function EventosDeportivos() {
  const { toast } = useToast();
  const [eventos, setEventos] = useState<EventoDeportivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<EventoDeportivo>>({});

  useEffect(() => {
    fetchEventos();
  }, []);

  const fetchEventos = async () => {
    try {
      const { data, error } = await supabase
        .from('eventos_deportivos')
        .select('*')
        .order('orden', { ascending: true });

      if (error) throw error;
      setEventos(data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los eventos deportivos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (evento: EventoDeportivo) => {
    setEditingId(evento.id);
    setEditForm(evento);
  };

  const handleSave = async () => {
    if (!editingId || !editForm.titulo || !editForm.descripcion) return;

    try {
      const { error } = await supabase
        .from('eventos_deportivos')
        .update({
          titulo: editForm.titulo,
          descripcion: editForm.descripcion,
          icono: editForm.icono || '🏆',
          activo: editForm.activo,
          orden: editForm.orden,
        })
        .eq('id', editingId);

      if (error) throw error;

      await fetchEventos();
      setEditingId(null);
      setEditForm({});
      
      toast({
        title: 'Éxito',
        description: 'Evento deportivo actualizado correctamente',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el evento deportivo',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const toggleActivo = async (id: string, activo: boolean) => {
    try {
      const { error } = await supabase
        .from('eventos_deportivos')
        .update({ activo })
        .eq('id', id);

      if (error) throw error;

      await fetchEventos();
      
      toast({
        title: 'Éxito',
        description: `Evento ${activo ? 'activado' : 'desactivado'} correctamente`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cambiar el estado del evento',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Eventos Deportivos</h2>
          <p className="text-muted-foreground">
            Gestiona los tipos de eventos deportivos que se muestran en el sitio web
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Evento
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Eventos Deportivos</CardTitle>
          <CardDescription>
            {eventos.length} eventos configurados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Icono</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Orden</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {eventos.map((evento) => (
                <TableRow key={evento.id}>
                  <TableCell>
                    {editingId === evento.id ? (
                      <Input
                        value={editForm.icono || ''}
                        onChange={(e) => setEditForm({...editForm, icono: e.target.value})}
                        className="w-16"
                        placeholder="🏆"
                      />
                    ) : (
                      <span className="text-2xl">{evento.icono}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === evento.id ? (
                      <Input
                        value={editForm.titulo || ''}
                        onChange={(e) => setEditForm({...editForm, titulo: e.target.value})}
                        placeholder="Título del evento"
                      />
                    ) : (
                      <div className="font-medium">{evento.titulo}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === evento.id ? (
                      <Textarea
                        value={editForm.descripcion || ''}
                        onChange={(e) => setEditForm({...editForm, descripcion: e.target.value})}
                        placeholder="Descripción del evento"
                        className="min-h-[60px]"
                      />
                    ) : (
                      <div className="text-sm text-muted-foreground max-w-xs">
                        {evento.descripcion}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === evento.id ? (
                      <Switch
                        checked={editForm.activo || false}
                        onCheckedChange={(checked) => setEditForm({...editForm, activo: checked})}
                      />
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={evento.activo}
                          onCheckedChange={(checked) => toggleActivo(evento.id, checked)}
                        />
                        <Badge variant={evento.activo ? 'default' : 'secondary'}>
                          {evento.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === evento.id ? (
                      <Input
                        type="number"
                        value={editForm.orden || 0}
                        onChange={(e) => setEditForm({...editForm, orden: parseInt(e.target.value)})}
                        className="w-20"
                      />
                    ) : (
                      <span>{evento.orden}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === evento.id ? (
                      <div className="flex space-x-2">
                        <Button size="sm" onClick={handleSave}>
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancel}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(evento)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}