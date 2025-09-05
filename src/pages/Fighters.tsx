import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FighterCard } from '@/components/FighterCard';
import { FighterProfileForm } from '@/components/FighterProfileForm';
import { useFighterProfiles, FighterProfile } from '@/hooks/useFighterProfiles';
import { useAuth } from '@/hooks/useAuth';
import { Search, Plus, Filter } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const WEIGHT_CLASSES = [
  'Todos',
  'Peso Mosca (125 lbs)',
  'Peso Gallo (135 lbs)', 
  'Peso Pluma (145 lbs)',
  'Peso Ligero (155 lbs)',
  'Peso Welter (170 lbs)',
  'Peso Medio (185 lbs)',
  'Peso Semipesado (205 lbs)',
  'Peso Pesado (265 lbs)',
];

export default function Fighters() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWeightClass, setSelectedWeightClass] = useState('Todos');
  const [sortBy, setSortBy] = useState('name');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedFighter, setSelectedFighter] = useState<FighterProfile | null>(null);
  const [userProfile, setUserProfile] = useState<FighterProfile | null>(null);
  
  const { fighters, loading, getUserFighterProfile } = useFighterProfiles();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      getUserFighterProfile().then(setUserProfile);
    }
  }, [user, getUserFighterProfile]);

  const filteredFighters = fighters
    .filter(fighter => {
      const matchesSearch = 
        fighter.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fighter.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (fighter.nickname && fighter.nickname.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesWeightClass = 
        selectedWeightClass === 'Todos' || fighter.weight_class === selectedWeightClass;
      
      return matchesSearch && matchesWeightClass;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.first_name.localeCompare(b.first_name);
        case 'wins':
          return b.record_wins - a.record_wins;
        default:
          return 0;
      }
    });

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false);
    if (user) {
      getUserFighterProfile().then(setUserProfile);
    }
  };

  const handleFighterClick = (fighter: FighterProfile) => {
    setSelectedFighter(fighter);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Peleadores</h1>
            <p className="text-muted-foreground">Conoce a los atletas de la plataforma</p>
          </div>
          
          {user && !userProfile && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-purple-neon-primary to-purple-neon-secondary hover:opacity-90">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Mi Perfil
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Crear Perfil de Peleador</DialogTitle>
                </DialogHeader>
                <FighterProfileForm
                  onSuccess={handleCreateSuccess}
                  onCancel={() => setIsCreateDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar peleadores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedWeightClass} onValueChange={setSelectedWeightClass}>
            <SelectTrigger>
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="División" />
            </SelectTrigger>
            <SelectContent>
              {WEIGHT_CLASSES.map(weightClass => (
                <SelectItem key={weightClass} value={weightClass}>
                  {weightClass}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              
              <SelectItem value="name">Nombre</SelectItem>
              <SelectItem value="wins">Victorias</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="text-sm text-muted-foreground flex items-center">
            Total: {filteredFighters.length} peleadores
          </div>
        </div>

        {/* Fighters Grid */}
        {filteredFighters.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No se encontraron peleadores
            </h3>
            <p className="text-muted-foreground">
              Intenta ajustar los filtros de búsqueda
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredFighters.map(fighter => (
              <FighterCard
                key={fighter.id}
                fighter={fighter}
                onClick={() => handleFighterClick(fighter)}
              />
            ))}
          </div>
        )}

        {/* Fighter Detail Dialog */}
        <Dialog open={!!selectedFighter} onOpenChange={() => setSelectedFighter(null)}>
          <DialogContent className="max-w-2xl">
            {selectedFighter && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl">
                    {selectedFighter.first_name} {selectedFighter.last_name}
                    {selectedFighter.nickname && (
                      <span className="text-purple-neon-primary ml-2">
                        "{selectedFighter.nickname}"
                      </span>
                    )}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    {selectedFighter.avatar_url ? (
                      <img 
                        src={selectedFighter.avatar_url} 
                        alt={`${selectedFighter.first_name} ${selectedFighter.last_name}`}
                        className="w-24 h-24 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-urban-gray flex items-center justify-center">
                        <span className="text-2xl font-bold text-foreground">
                          {selectedFighter.first_name[0]}{selectedFighter.last_name[0]}
                        </span>
                      </div>
                    )}
                    
                    <div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Record</p>
                          <p className="font-semibold text-foreground">
                            {selectedFighter.record_wins}-{selectedFighter.record_losses}-{selectedFighter.record_draws}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-muted-foreground text-sm">División</p>
                      <p className="font-medium">{selectedFighter.weight_class}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-sm">País</p>
                      <p className="font-medium">{selectedFighter.country}</p>
                    </div>
                    {selectedFighter.fighting_style && (
                      <div>
                        <p className="text-muted-foreground text-sm">Estilo</p>
                        <p className="font-medium">{selectedFighter.fighting_style}</p>
                      </div>
                    )}
                    {selectedFighter.height_cm && (
                      <div>
                        <p className="text-muted-foreground text-sm">Altura</p>
                        <p className="font-medium">{selectedFighter.height_cm} cm</p>
                      </div>
                    )}
                  </div>

                  {selectedFighter.bio && (
                    <div>
                      <p className="text-muted-foreground text-sm mb-2">Biografía</p>
                      <p className="text-foreground">{selectedFighter.bio}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}