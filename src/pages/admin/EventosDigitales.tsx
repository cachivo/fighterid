import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Search, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const formSchema = z.object({
  titulo: z.string().min(1, "El título es requerido"),
  descripcion: z.string().min(1, "La descripción es requerida"),
  icono: z.string().min(1, "El icono es requerido"),
  orden: z.number().min(0, "El orden debe ser mayor o igual a 0").optional(),
  activo: z.boolean().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface EventoDigital {
  id: string;
  titulo: string;
  descripcion: string;
  icono: string;
  orden: number | null;
  activo: boolean | null;
  created_at: string;
  updated_at: string;
}

const EventosDigitales = () => {
  const [eventos, setEventos] = useState<EventoDigital[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEvento, setEditingEvento] = useState<EventoDigital | null>(null);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titulo: "",
      descripcion: "",
      icono: "",
      orden: 0,
      activo: true,
    },
  });

  const fetchEventos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("eventos_digitales")
        .select("*")
        .order("orden", { ascending: true });

      if (error) throw error;
      setEventos(data || []);
    } catch (error) {
      console.error("Error fetching eventos:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los eventos digitales.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventos();
  }, []);

  const handleCreate = async (data: FormData) => {
    try {
      const { error } = await supabase
        .from("eventos_digitales")
        .insert([data]);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Evento digital creado correctamente.",
      });
      
      setIsCreateDialogOpen(false);
      form.reset();
      fetchEventos();
    } catch (error) {
      console.error("Error creating evento:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el evento digital.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (data: FormData) => {
    if (!editingEvento) return;

    try {
      const { error } = await supabase
        .from("eventos_digitales")
        .update(data)
        .eq("id", editingEvento.id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Evento digital actualizado correctamente.",
      });
      
      setIsEditDialogOpen(false);
      setEditingEvento(null);
      form.reset();
      fetchEventos();
    } catch (error) {
      console.error("Error updating evento:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el evento digital.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("eventos_digitales")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Evento digital eliminado correctamente.",
      });
      
      fetchEventos();
    } catch (error) {
      console.error("Error deleting evento:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el evento digital.",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (evento: EventoDigital) => {
    try {
      const { error } = await supabase
        .from("eventos_digitales")
        .update({ activo: !evento.activo })
        .eq("id", evento.id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: `Evento ${!evento.activo ? 'activado' : 'desactivado'} correctamente.`,
      });
      
      fetchEventos();
    } catch (error) {
      console.error("Error toggling active:", error);
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado del evento.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (evento: EventoDigital) => {
    setEditingEvento(evento);
    form.reset({
      titulo: evento.titulo,
      descripcion: evento.descripcion,
      icono: evento.icono,
      orden: evento.orden || 0,
      activo: evento.activo || true,
    });
    setIsEditDialogOpen(true);
  };

  const filteredEventos = eventos.filter(evento =>
    evento.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    evento.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Cargando eventos digitales...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Eventos Digitales</CardTitle>
          <CardDescription>
            Administra los tipos de eventos digitales disponibles en tu plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2 flex-1 max-w-sm">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar eventos digitales..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Evento Digital
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Evento Digital</DialogTitle>
                  <DialogDescription>
                    Completa los datos del nuevo tipo de evento digital
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="titulo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ej: Streaming de Competencias" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="descripcion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descripción</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Describe el tipo de evento digital..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="icono"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Icono (Emoji)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="📹" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="orden"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Orden</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              placeholder="0" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit">Crear Evento</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Icono</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Orden</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEventos.map((evento) => (
                <TableRow key={evento.id}>
                  <TableCell className="text-2xl">{evento.icono}</TableCell>
                  <TableCell className="font-medium">{evento.titulo}</TableCell>
                  <TableCell className="max-w-md truncate">{evento.descripcion}</TableCell>
                  <TableCell>{evento.orden}</TableCell>
                  <TableCell>
                    <Badge variant={evento.activo ? "default" : "secondary"}>
                      {evento.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(evento)}
                      >
                        {evento.activo ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(evento)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Se eliminará permanentemente el evento digital "{evento.titulo}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(evento.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredEventos.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "No se encontraron eventos digitales que coincidan con la búsqueda." : "No hay eventos digitales registrados."}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Evento Digital</DialogTitle>
            <DialogDescription>
              Modifica los datos del evento digital
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEdit)} className="space-y-4">
              <FormField
                control={form.control}
                name="titulo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ej: Streaming de Competencias" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="descripcion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Describe el tipo de evento digital..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="icono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icono (Emoji)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="📹" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="orden"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Orden</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        placeholder="0" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Actualizar Evento</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventosDigitales;