import { useState } from 'react';
import AdminLayoutWithAI from '@/components/admin/AIAssistant/AdminLayoutWithAI';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, MailOpen, Archive, Trash2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ContactInbox() {
  const { toast } = useToast();
  const [filter, setFilter] = useState<'all' | 'pending' | 'read' | 'archived'>('all');

  const { data: messages, refetch, isLoading } = useQuery({
    queryKey: ['contact-messages', filter],
    queryFn: async () => {
      let query = supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    }
  });

  const handleMarkAsRead = async (id: string) => {
    const { error } = await supabase
      .from('contact_messages')
      .update({ status: 'read' })
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo marcar como leído",
        variant: "destructive"
      });
      return;
    }

    toast({ title: "Marcado como leído" });
    refetch();
  };

  const handleArchive = async (id: string) => {
    const { error } = await supabase
      .from('contact_messages')
      .update({ status: 'archived' })
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo archivar",
        variant: "destructive"
      });
      return;
    }

    toast({ title: "Mensaje archivado" });
    refetch();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este mensaje?')) return;

    const { error } = await supabase
      .from('contact_messages')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar",
        variant: "destructive"
      });
      return;
    }

    toast({ title: "Mensaje eliminado" });
    refetch();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'destructive';
      case 'read': return 'secondary';
      case 'replied': return 'default';
      case 'archived': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'read': return 'Leído';
      case 'replied': return 'Respondido';
      case 'archived': return 'Archivado';
      default: return status;
    }
  };

  return (
    <AdminLayoutWithAI>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Mail className="w-8 h-8 text-primary" />
              Inbox de Contacto
            </h1>
            <p className="text-muted-foreground mt-1">
              Mensajes recibidos desde el formulario web
            </p>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            size="sm"
          >
            Todos {filter === 'all' && `(${messages?.length || 0})`}
          </Button>
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            onClick={() => setFilter('pending')}
            size="sm"
          >
            Pendientes
          </Button>
          <Button
            variant={filter === 'read' ? 'default' : 'outline'}
            onClick={() => setFilter('read')}
            size="sm"
          >
            Leídos
          </Button>
          <Button
            variant={filter === 'archived' ? 'default' : 'outline'}
            onClick={() => setFilter('archived')}
            size="sm"
          >
            Archivados
          </Button>
        </div>

        {/* Messages List */}
        <div className="grid gap-4">
          {isLoading ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Cargando mensajes...
              </CardContent>
            </Card>
          ) : messages && messages.length > 0 ? (
            messages.map((msg) => (
              <Card key={msg.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {msg.status === 'pending' && (
                          <Mail className="w-4 h-4 text-destructive" />
                        )}
                        {msg.subject || 'Sin asunto'}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <span className="font-medium">{msg.name}</span>
                        <span>•</span>
                        <a 
                          href={`mailto:${msg.email}`}
                          className="hover:text-primary underline"
                        >
                          {msg.email}
                        </a>
                        <span>•</span>
                        <span>
                          {format(new Date(msg.created_at), "PPp", { locale: es })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusColor(msg.status)}>
                        {getStatusLabel(msg.status)}
                      </Badge>
                      <div className="flex gap-1">
                        {msg.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMarkAsRead(msg.id)}
                            title="Marcar como leído"
                          >
                            <MailOpen className="w-4 h-4" />
                          </Button>
                        )}
                        {msg.status !== 'archived' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleArchive(msg.id)}
                            title="Archivar"
                          >
                            <Archive className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(msg.id)}
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="whitespace-pre-wrap text-sm">{msg.message}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No hay mensajes en esta categoría</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminLayoutWithAI>
  );
}
