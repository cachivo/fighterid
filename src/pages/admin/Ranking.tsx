import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Search, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const formSchema = z.object({
  numero: z.string().min(1, "El número es requerido"),
  descripcion: z.string().min(1, "La descripción es requerida"),
  icono: z.string().min(1, "El icono es requerido"),
  orden: z.number().min(0, "El orden debe ser mayor o igual a 0").optional(),
  activo: z.boolean().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface Estadistica {
  id: string;
  numero: string;
  descripcion: string;
  icono: string;
  orden: number | null;
  activo: boolean | null;
  created_at: string;
  updated_at: string;
}

const Ranking = () => {
  const [estadisticas, setEstadisticas] = useState<Estadistica[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEstadistica, setEditingEstadistica] = useState<Estadistica | null>(null);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      numero: "",
      descripcion: "",
      icono: "",
      orden: 0,
      activo: true,
    },
  });

  const fetchEstadisticas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("estadisticas")
        .select("*")
        .order("orden", { ascending: true });

      if (error) throw error;
      setEstadisticas(data || []);
    } catch (error) {
      console.error("Error fetching estadisticas:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las estadísticas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEstadisticas();
  }, []);

  const handleCreate = async (data: FormData) => {
    try {
      const { error } = await supabase
        .from("estadisticas")
        .insert([data]);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Estadística creada correctamente.",
      });
      
      setIsCreateDialogOpen(false);
      form.reset();
      fetchEstadisticas();
    } catch (error) {
      console.error("Error creating estadistica:", error);
      toast({
        title: "Error",
        description: "No se pudo crear la estadística.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (data: FormData) => {
    if (!editingEstadistica) return;

    try {
      const { error } = await supabase
        .from("estadisticas")
        .update(data)
        .eq("id", editingEstadistica.id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Estadística actualizada correctamente.",
      });
      
      setIsEditDialogOpen(false);
      setEditingEstadistica(null);
      form.reset();
      fetchEstadisticas();
    } catch (error) {
      console.error("Error updating estadistica:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la estadística.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("estadisticas")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Estadística eliminada correctamente.",
      });
      
      fetchEstadisticas();
    } catch (error) {
      console.error("Error deleting estadistica:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la estadística.",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (estadistica: Estadistica) => {
    try {
      const { error } = await supabase
        .from("estadisticas")
        .update({ activo: !estadistica.activo })
        .eq("id", estadistica.id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: `Estadística ${!estadistica.activo ? 'activada' : 'desactivada'} correctamente.`,
      });
      
      fetchEstadisticas();
    } catch (error) {
      console.error("Error toggling active:", error);
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado de la estadística.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (estadistica: Estadistica) => {
    setEditingEstadistica(estadistica);
    form.reset({
      numero: estadistica.numero,
      descripcion: estadistica.descripcion,
      icono: estadistica.icono,
      orden: estadistica.orden || 0,
      activo: estadistica.activo || true,
    });
    setIsEditDialogOpen(true);
  };

  const filteredEstadisticas = estadisticas.filter(estadistica =>
    estadistica.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
    estadistica.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Cargando estadísticas...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Estadísticas y Ranking</CardTitle>
          <CardDescription>
            Administra las estadísticas y métricas de rendimiento de tu empresa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2 flex-1 max-w-sm">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar estadísticas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Estadística
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Crear Nueva Estadística</DialogTitle>
                  <DialogDescription>
                    Completa los datos de la nueva métrica o estadística
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="numero"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número/Valor</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ej: 500+, 95%, 24/7" />
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
                            <Textarea {...field} placeholder="Describe lo que representa esta estadística..." />
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
                            <Input {...field} placeholder="📊" />
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
                      <Button type="submit">Crear Estadística</Button>
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
                <TableHead>Número</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Orden</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEstadisticas.map((estadistica) => (
                <TableRow key={estadistica.id}>
                  <TableCell className="text-2xl">{estadistica.icono}</TableCell>
                  <TableCell className="font-bold text-xl">{estadistica.numero}</TableCell>
                  <TableCell className="max-w-md">{estadistica.descripcion}</TableCell>
                  <TableCell>{estadistica.orden}</TableCell>
                  <TableCell>
                    <Badge variant={estadistica.activo ? "default" : "secondary"}>
                      {estadistica.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(estadistica)}
                      >
                        {estadistica.activo ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(estadistica)}
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
                              Esta acción no se puede deshacer. Se eliminará permanentemente la estadística "{estadistica.numero} - {estadistica.descripcion}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(estadistica.id)}
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

          {filteredEstadisticas.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "No se encontraron estadísticas que coincidan con la búsqueda." : "No hay estadísticas registradas."}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Estadística</DialogTitle>
            <DialogDescription>
              Modifica los datos de la estadística
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEdit)} className="space-y-4">
              <FormField
                control={form.control}
                name="numero"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número/Valor</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ej: 500+, 95%, 24/7" />
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
                      <Textarea {...field} placeholder="Describe lo que representa esta estadística..." />
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
                      <Input {...field} placeholder="📊" />
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
                <Button type="submit">Actualizar Estadística</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Ranking;