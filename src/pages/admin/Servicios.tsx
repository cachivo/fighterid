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
  items: z.array(z.string()).min(1, "Debe haber al menos un elemento"),
  orden: z.number().min(0, "El orden debe ser mayor o igual a 0").optional(),
  activo: z.boolean().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface Servicio {
  id: string;
  titulo: string;
  descripcion: string;
  icono: string;
  items: string[];
  orden: number | null;
  activo: boolean | null;
  created_at: string;
  updated_at: string;
}

const Servicios = () => {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingServicio, setEditingServicio] = useState<Servicio | null>(null);
  const [itemsText, setItemsText] = useState("");
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titulo: "",
      descripcion: "",
      icono: "",
      items: [],
      orden: 0,
      activo: true,
    },
  });

  const fetchServicios = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("servicios")
        .select("*")
        .order("orden", { ascending: true });

      if (error) throw error;
      setServicios(data || []);
    } catch (error) {
      console.error("Error fetching servicios:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los servicios.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServicios();
  }, []);

  const handleCreate = async (data: FormData) => {
    try {
      const items = itemsText.split('\n').filter(item => item.trim() !== '');
      const { error } = await supabase
        .from("servicios")
        .insert([{ ...data, items }]);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Servicio creado correctamente.",
      });
      
      setIsCreateDialogOpen(false);
      form.reset();
      setItemsText("");
      fetchServicios();
    } catch (error) {
      console.error("Error creating servicio:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el servicio.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (data: FormData) => {
    if (!editingServicio) return;

    try {
      const items = itemsText.split('\n').filter(item => item.trim() !== '');
      const { error } = await supabase
        .from("servicios")
        .update({ ...data, items })
        .eq("id", editingServicio.id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Servicio actualizado correctamente.",
      });
      
      setIsEditDialogOpen(false);
      setEditingServicio(null);
      form.reset();
      setItemsText("");
      fetchServicios();
    } catch (error) {
      console.error("Error updating servicio:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el servicio.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("servicios")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Servicio eliminado correctamente.",
      });
      
      fetchServicios();
    } catch (error) {
      console.error("Error deleting servicio:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el servicio.",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (servicio: Servicio) => {
    try {
      const { error } = await supabase
        .from("servicios")
        .update({ activo: !servicio.activo })
        .eq("id", servicio.id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: `Servicio ${!servicio.activo ? 'activado' : 'desactivado'} correctamente.`,
      });
      
      fetchServicios();
    } catch (error) {
      console.error("Error toggling active:", error);
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado del servicio.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (servicio: Servicio) => {
    setEditingServicio(servicio);
    form.reset({
      titulo: servicio.titulo,
      descripcion: servicio.descripcion,
      icono: servicio.icono,
      items: servicio.items,
      orden: servicio.orden || 0,
      activo: servicio.activo || true,
    });
    setItemsText(servicio.items.join('\n'));
    setIsEditDialogOpen(true);
  };

  const filteredServicios = servicios.filter(servicio =>
    servicio.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    servicio.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Cargando servicios...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Servicios</CardTitle>
          <CardDescription>
            Administra los servicios que ofrece tu empresa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2 flex-1 max-w-sm">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar servicios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Servicio
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Servicio</DialogTitle>
                  <DialogDescription>
                    Completa los datos del nuevo servicio
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
                            <Input {...field} placeholder="Ej: Producción de Eventos" />
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
                            <Textarea {...field} placeholder="Describe el servicio..." />
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
                            <Input {...field} placeholder="🎬" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="space-y-2">
                      <Label htmlFor="items">Características del Servicio</Label>
                      <Textarea
                        id="items"
                        value={itemsText}
                        onChange={(e) => setItemsText(e.target.value)}
                        placeholder="Escribe cada característica en una línea nueva..."
                        rows={4}
                      />
                    </div>
                    
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
                      <Button type="submit">Crear Servicio</Button>
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
                <TableHead>Items</TableHead>
                <TableHead>Orden</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredServicios.map((servicio) => (
                <TableRow key={servicio.id}>
                  <TableCell className="text-2xl">{servicio.icono}</TableCell>
                  <TableCell className="font-medium">{servicio.titulo}</TableCell>
                  <TableCell className="max-w-md truncate">{servicio.descripcion}</TableCell>
                  <TableCell className="max-w-xs">
                    <Badge variant="outline">{servicio.items.length} items</Badge>
                  </TableCell>
                  <TableCell>{servicio.orden}</TableCell>
                  <TableCell>
                    <Badge variant={servicio.activo ? "default" : "secondary"}>
                      {servicio.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(servicio)}
                      >
                        {servicio.activo ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(servicio)}
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
                              Esta acción no se puede deshacer. Se eliminará permanentemente el servicio "{servicio.titulo}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(servicio.id)}
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

          {filteredServicios.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "No se encontraron servicios que coincidan con la búsqueda." : "No hay servicios registrados."}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Servicio</DialogTitle>
            <DialogDescription>
              Modifica los datos del servicio
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
                      <Input {...field} placeholder="Ej: Producción de Eventos" />
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
                      <Textarea {...field} placeholder="Describe el servicio..." />
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
                      <Input {...field} placeholder="🎬" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-2">
                <Label htmlFor="items-edit">Características del Servicio</Label>
                <Textarea
                  id="items-edit"
                  value={itemsText}
                  onChange={(e) => setItemsText(e.target.value)}
                  placeholder="Escribe cada característica en una línea nueva..."
                  rows={4}
                />
              </div>
              
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
                <Button type="submit">Actualizar Servicio</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Servicios;