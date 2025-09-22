import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { FighterCard } from '@/components/FighterCard';
import { FighterProfileForm } from '@/components/FighterProfileForm';
import { useFighterProfiles, FighterProfile } from '@/hooks/useFighterProfiles';
import { useAuth } from '@/hooks/useAuth';
import { Search, Plus, Filter, ArrowUpDown, Users, Target, Eye } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

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

const DISCIPLINES = [
  'Todas',
  'MMA',
  'Boxeo',
  'Judo',
  'JiuJitsu',
  'Kickboxing',
  'MuayThai',
  'Grappling',
  'Otro'
];

const FIGHTING_STYLES = [
  'Todos',
  'Striker',
  'Brawler/Agresivo',
  'Contra-Atacador',
  'LUDUS CERBERUS',
  'ALFA Y OMEGA MMA',
  'SCHUMMANS/COMAYAGUA',
  'TEMPLO DEL TIGRE'
];

const RECORD_TYPES = [
  'Todos',
  'Amateur',
  'Profesional'
];

export default function Fighters() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWeightClass, setSelectedWeightClass] = useState('Todos');
  const [selectedDiscipline, setSelectedDiscipline] = useState('Todas');
  const [selectedFightingStyle, setSelectedFightingStyle] = useState('Todos');
  const [selectedRecordType, setSelectedRecordType] = useState('Todos');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [readyToFightOnly, setReadyToFightOnly] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedFighter, setSelectedFighter] = useState<FighterProfile | null>(null);
  const [userProfile, setUserProfile] = useState<FighterProfile | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  
  const { fighters, loading, loadingUserProfile, getUserFighterProfile, fetchFighters, fetchFightersWithReadyStatus } = useFighterProfiles();
  const { user } = useAuth();

  const handleCreateSuccess = useCallback(() => {
    setIsCreateDialogOpen(false);
    if (user) {
      getUserFighterProfile().then(setUserProfile);
    }
  }, [user, getUserFighterProfile]);

  // Load user profile separately
  useEffect(() => {
    if (user) {
      getUserFighterProfile().then(setUserProfile);
    }
  }, [user]);

  // Initial load - only once
  useEffect(() => {
    fetchFighters(false);
  }, []);

  // Only reload when toggles change
  useEffect(() => {
    if (readyToFightOnly) {
      fetchFightersWithReadyStatus(includeInactive);
    } else {
      fetchFighters(includeInactive);
    }
    // Trigger animation when filters change
    setAnimationKey(prev => prev + 1);
  }, [includeInactive, readyToFightOnly]);

  const filteredFighters = useMemo(() => {
    return fighters
      .filter(fighter => {
        const matchesSearch = 
          fighter.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          fighter.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (fighter.nickname && fighter.nickname.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesWeightClass = 
          selectedWeightClass === 'Todos' || fighter.weight_class === selectedWeightClass;
        
        const matchesDiscipline = 
          selectedDiscipline === 'Todas' || fighter.discipline === selectedDiscipline;
        
        const matchesFightingStyle = 
          selectedFightingStyle === 'Todos' || fighter.fighting_style === selectedFightingStyle;
        
        const matchesRecordType = 
          selectedRecordType === 'Todos' || fighter.record_type === selectedRecordType;
        
        const matchesReadyToFight = 
          !readyToFightOnly || (fighter as any).ready_to_fight === true;
        
        return matchesSearch && matchesWeightClass && matchesDiscipline && 
               matchesFightingStyle && matchesRecordType && matchesReadyToFight;
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
  }, [fighters, searchTerm, selectedWeightClass, selectedDiscipline, selectedFightingStyle, selectedRecordType, includeInactive, readyToFightOnly, sortBy]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = filteredFighters.length;
    const readyToFight = filteredFighters.filter(f => (f as any).ready_to_fight).length;
    const totalWins = filteredFighters.reduce((acc, f) => acc + f.record_wins, 0);
    const disciplines = [...new Set(filteredFighters.map(f => f.discipline).filter(Boolean))].length;
    
    return { total, readyToFight, totalWins, disciplines };
  }, [filteredFighters]);

  const handleFighterClick = (fighter: FighterProfile) => {
    // Navigate to public fighter profile instead of dialog
    window.location.href = `/fighter/${fighter.id}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto p-6 pt-20">
          <div className="flex justify-between items-center mb-8">
            <div className="space-y-3">
              <Skeleton className="h-10 w-48 animate-pulse" />
              <Skeleton className="h-6 w-64 animate-pulse" />
            </div>
            <Skeleton className="h-10 w-32 animate-pulse" />
          </div>
          
          {/* Animated loading cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div 
                key={i} 
                className="animate-fade-in"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <Card className="h-64 overflow-hidden">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Skeleton className="h-12 w-12 rounded-full animate-pulse" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-24 animate-pulse" />
                          <Skeleton className="h-3 w-16 animate-pulse" />
                        </div>
                      </div>
                      <Skeleton className="h-16 w-full animate-pulse" />
                      <div className="space-y-2">
                        <Skeleton className="h-3 w-full animate-pulse" />
                        <Skeleton className="h-3 w-3/4 animate-pulse" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-7xl mx-auto p-6 pt-20">
        
        {/* Header with Create Profile */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Todos los Peleadores</h2>
            <p className="text-muted-foreground">Conoce a los atletas de la plataforma</p>
          </div>
          
          {user && !userProfile && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
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
        <div className="space-y-6 mb-8">
          {/* Search and Mobile Filter Toggle */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar peleadores por nombre o apodo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              {searchTerm && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Badge variant="secondary" className="text-xs">
                    {filteredFighters.length}
                  </Badge>
                </div>
              )}
            </div>
            
            <Button
              variant="outline"
              className="md:hidden"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filtros
              {showFilters ? ' ▲' : ' ▼'}
            </Button>
          </div>

          {/* Status Toggles */}
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${showFilters || 'hidden md:grid'}`}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <span className="text-sm font-medium">Incluir inactivos</span>
                      <p className="text-xs text-muted-foreground">Mostrar todos los peleadores</p>
                    </div>
                  </div>
                  <Switch
                    checked={includeInactive}
                    onCheckedChange={setIncludeInactive}
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Target className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <span className="text-sm font-medium">Solo listos para pelear</span>
                      <p className="text-xs text-muted-foreground">Peleadores disponibles</p>
                    </div>
                  </div>
                  <Switch
                    checked={readyToFightOnly}
                    onCheckedChange={setReadyToFightOnly}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter dropdowns */}
          <div className={`grid grid-cols-1 md:grid-cols-5 gap-4 ${showFilters || 'hidden md:grid'}`}>
            {[
              { value: selectedWeightClass, onChange: setSelectedWeightClass, options: WEIGHT_CLASSES, placeholder: "División", icon: Filter },
              { value: selectedDiscipline, onChange: setSelectedDiscipline, options: DISCIPLINES, placeholder: "Disciplina", icon: Filter },
              { value: selectedFightingStyle, onChange: setSelectedFightingStyle, options: FIGHTING_STYLES, placeholder: "Estilo", icon: Filter },
              { value: selectedRecordType, onChange: setSelectedRecordType, options: RECORD_TYPES, placeholder: "Tipo", icon: Filter },
              { value: sortBy, onChange: setSortBy, options: [{ value: 'name', label: 'Nombre' }, { value: 'wins', label: 'Victorias' }, { value: 'elo', label: 'Rating ELO' }], placeholder: "Ordenar por", icon: ArrowUpDown }
            ].map((filter, index) => (
              <div key={index}>
                <Select value={filter.value} onValueChange={filter.onChange}>
                  <SelectTrigger>
                    <filter.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder={filter.placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {filter.options.map((option: any) => (
                      <SelectItem 
                        key={typeof option === 'string' ? option : option.value} 
                        value={typeof option === 'string' ? option : option.value}
                      >
                        {typeof option === 'string' ? option : option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          {/* Results summary */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span className="font-medium">
                Mostrando {filteredFighters.length} de {fighters.length} peleadores
              </span>
            </div>
            {includeInactive && (
              <Badge variant="secondary" className="text-xs">
                Incluyendo inactivos
              </Badge>
            )}
            {readyToFightOnly && (
              <Badge variant="outline" className="text-xs">
                Solo listos para pelear
              </Badge>
            )}
            {searchTerm && (
              <Badge variant="outline" className="text-xs">
                Búsqueda: "{searchTerm}"
              </Badge>
            )}
          </div>
        </div>

        {/* Fighters Grid */}
        {filteredFighters.length === 0 ? (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No se encontraron peleadores
              </h3>
              <p className="text-muted-foreground mb-4">
                Intenta ajustar los filtros de búsqueda o explora diferentes categorías
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedWeightClass('Todos');
                  setSelectedDiscipline('Todas');
                  setSelectedFightingStyle('Todos');
                  setSelectedRecordType('Todos');
                  setIncludeInactive(false);
                  setReadyToFightOnly(false);
                }}
              >
                Limpiar filtros
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredFighters.map((fighter) => (
              <FighterCard
                key={fighter.id}
                fighter={fighter}
                onClick={() => handleFighterClick(fighter)}
              />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}