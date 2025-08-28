import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { 
  Eye, 
  EyeOff, 
  Edit, 
  Trash2, 
  Plus, 
  Search,
  Calendar,
  Users,
  Trophy
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Schemas
const disciplineSchema = z.object({
  slug: z.string().min(1, 'Slug requerido'),
  name: z.string().min(1, 'Nombre requerido'),
  active: z.boolean(),
});

const eventSchema = z.object({
  discipline_id: z.string().min(1, 'Disciplina requerida'),
  title: z.string().min(1, 'Título requerido'),
  description: z.string().optional(),
  starts_at: z.string().min(1, 'Fecha de inicio requerida'),
  ends_at: z.string().optional(),
  public: z.boolean(),
  allow_guest_votes: z.boolean(),
  active: z.boolean(),
});

const contestantSchema = z.object({
  event_id: z.string().min(1, 'Evento requerido'),
  name: z.string().min(1, 'Nombre requerido'),
  avatar_url: z.string().optional(),
  active: z.boolean(),
});

const roundSchema = z.object({
  event_id: z.string().min(1, 'Evento requerido'),
  name: z.string().min(1, 'Nombre requerido'),
  strategy: z.enum(['binary', 'score_10', 'ranked', 'multi']),
  strategy_config: z.object({}).optional(),
  voting_opens_at: z.string().min(1, 'Fecha de apertura requerida'),
  voting_closes_at: z.string().min(1, 'Fecha de cierre requerida'),
  active: z.boolean(),
});

// Types
type Discipline = {
  id: string;
  slug: string;
  name: string;
  active: boolean;
  created_at: string;
  updated_at: string;
};

type VotingEvent = {
  id: string;
  discipline_id: string;
  title: string;
  description?: string;
  starts_at: string;
  ends_at?: string;
  public: boolean;
  allow_guest_votes: boolean;
  created_by: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  discipline?: Discipline;
};

type Contestant = {
  id: string;
  event_id: string;
  name: string;
  avatar_url?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
};

type Round = {
  id: string;
  event_id: string;
  name: string;
  strategy: string;
  strategy_config: any;
  voting_opens_at: string;
  voting_closes_at: string;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export default function Votaciones() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('disciplines');
  
  // Data states
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [events, setEvents] = useState<VotingEvent[]>([]);
  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  
  // Dialog states
  const [disciplineDialogOpen, setDisciplineDialogOpen] = useState(false);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [contestantDialogOpen, setContestantDialogOpen] = useState(false);
  const [roundDialogOpen, setRoundDialogOpen] = useState(false);
  
  const [editingDiscipline, setEditingDiscipline] = useState<Discipline | null>(null);
  const [editingEvent, setEditingEvent] = useState<VotingEvent | null>(null);
  const [editingContestant, setEditingContestant] = useState<Contestant | null>(null);
  const [editingRound, setEditingRound] = useState<Round | null>(null);

  // Forms
  const disciplineForm = useForm({
    resolver: zodResolver(disciplineSchema),
    defaultValues: { slug: '', name: '', active: true }
  });

  const eventForm = useForm({
    resolver: zodResolver(eventSchema),
    defaultValues: { 
      discipline_id: '', 
      title: '', 
      description: '', 
      starts_at: '', 
      ends_at: '', 
      public: true, 
      allow_guest_votes: true, 
      active: true 
    }
  });

  const contestantForm = useForm({
    resolver: zodResolver(contestantSchema),
    defaultValues: { event_id: '', name: '', avatar_url: '', active: true }
  });

  const roundForm = useForm({
    resolver: zodResolver(roundSchema),
    defaultValues: { 
      event_id: '', 
      name: '', 
      strategy: 'binary' as const, 
      voting_opens_at: '', 
      voting_closes_at: '', 
      active: true 
    }
  });

  // Fetch functions
  const fetchDisciplines = async () => {
    try {
      const { data, error } = await supabase
        .from('disciplines')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setDisciplines(data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar disciplinas',
        variant: 'destructive',
      });
    }
  };

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          discipline:disciplines(*)
        `)
        .eq('created_by', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar eventos',
        variant: 'destructive',
      });
    }
  };

  const fetchContestants = async () => {
    try {
      const { data, error } = await supabase
        .from('contestants')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setContestants(data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar concursantes',
        variant: 'destructive',
      });
    }
  };

  const fetchRounds = async () => {
    try {
      const { data, error } = await supabase
        .from('rounds')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setRounds(data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar rondas',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchDisciplines(),
        fetchEvents(),
        fetchContestants(),
        fetchRounds()
      ]);
      setLoading(false);
    };
    
    if (user) {
      loadData();
    }
  }, [user]);

  // CRUD Operations for Disciplines
  const handleCreateDiscipline = async (data: any) => {
    try {
      const { error } = await supabase
        .from('disciplines')
        .insert([data]);

      if (error) throw error;

      toast({
        title: 'Éxito',
        description: 'Disciplina creada correctamente',
      });

      disciplineForm.reset();
      setDisciplineDialogOpen(false);
      fetchDisciplines();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al crear disciplina',
        variant: 'destructive',
      });
    }
  };

  // CRUD Operations for Events  
  const handleCreateEvent = async (data: any) => {
    try {
      const { error } = await supabase
        .from('events')
        .insert([{ ...data, created_by: user?.id }]);

      if (error) throw error;

      toast({
        title: 'Éxito',
        description: 'Evento creado correctamente',
      });

      eventForm.reset();
      setEventDialogOpen(false);
      fetchEvents();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al crear evento',
        variant: 'destructive',
      });
    }
  };

  const filteredDisciplines = disciplines.filter(discipline =>
    discipline.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    discipline.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Sistema de Votaciones BDG
          </CardTitle>
          <CardDescription>
            Gestiona disciplinas, eventos, concursantes y rondas de votación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="disciplines">Disciplinas</TabsTrigger>
              <TabsTrigger value="events">Eventos</TabsTrigger>
              <TabsTrigger value="contestants">Concursantes</TabsTrigger>
              <TabsTrigger value="rounds">Rondas</TabsTrigger>
            </TabsList>

            <TabsContent value="disciplines" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Disciplinas</h3>
                <Dialog open={disciplineDialogOpen} onOpenChange={setDisciplineDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Nueva Disciplina
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingDiscipline ? 'Editar Disciplina' : 'Nueva Disciplina'}
                      </DialogTitle>
                    </DialogHeader>
                    <Form {...disciplineForm}>
                      <form onSubmit={disciplineForm.handleSubmit(handleCreateDiscipline)} className="space-y-4">
                        <FormField
                          control={disciplineForm.control}
                          name="slug"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Slug</FormLabel>
                              <FormControl>
                                <Input placeholder="boxing" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={disciplineForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nombre</FormLabel>
                              <FormControl>
                                <Input placeholder="Boxeo" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={disciplineForm.control}
                          name="active"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  Activo
                                </FormLabel>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <Button type="submit" className="w-full">
                          {editingDiscipline ? 'Actualizar' : 'Crear'} Disciplina
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDisciplines.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          No se encontraron disciplinas
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDisciplines.map((discipline) => (
                        <TableRow key={discipline.id}>
                          <TableCell className="font-medium">{discipline.name}</TableCell>
                          <TableCell>
                            <code className="text-sm bg-muted px-2 py-1 rounded">
                              {discipline.slug}
                            </code>
                          </TableCell>
                          <TableCell>
                            <Badge variant={discipline.active ? "default" : "secondary"}>
                              {discipline.active ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="events" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Eventos de Votación</h3>
                <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Nuevo Evento
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Nuevo Evento de Votación</DialogTitle>
                    </DialogHeader>
                    <Form {...eventForm}>
                      <form onSubmit={eventForm.handleSubmit(handleCreateEvent)} className="space-y-4">
                        <FormField
                          control={eventForm.control}
                          name="discipline_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Disciplina</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecciona una disciplina" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {disciplines.map((discipline) => (
                                    <SelectItem key={discipline.id} value={discipline.id}>
                                      {discipline.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={eventForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Título</FormLabel>
                              <FormControl>
                                <Input placeholder="Nombre del evento" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={eventForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Descripción</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Descripción del evento..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={eventForm.control}
                            name="starts_at"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Fecha de Inicio</FormLabel>
                                <FormControl>
                                  <Input type="datetime-local" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={eventForm.control}
                            name="ends_at"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Fecha de Fin</FormLabel>
                                <FormControl>
                                  <Input type="datetime-local" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="space-y-4">
                          <FormField
                            control={eventForm.control}
                            name="public"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">
                                    Público
                                  </FormLabel>
                                  <div className="text-sm text-muted-foreground">
                                    Visible para todos los usuarios
                                  </div>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={eventForm.control}
                            name="allow_guest_votes"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">
                                    Permitir votos sin registro
                                  </FormLabel>
                                  <div className="text-sm text-muted-foreground">
                                    Los usuarios pueden votar sin crear cuenta
                                  </div>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        <Button type="submit" className="w-full">
                          Crear Evento
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Disciplina</TableHead>
                      <TableHead>Inicio</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEvents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No se encontraron eventos
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEvents.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell className="font-medium">{event.title}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {event.discipline?.name}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(event.starts_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={event.active ? "default" : "secondary"}>
                              {event.active ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm">
                                <Users className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="contestants" className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Gestión de concursantes en desarrollo</p>
              </div>
            </TabsContent>

            <TabsContent value="rounds" className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Gestión de rondas en desarrollo</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}