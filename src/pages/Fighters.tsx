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
import { PageHeader } from '@/components/ui/page-header';
import { useFighterProfiles, FighterProfile } from '@/hooks/useFighterProfiles';
import { useAuth } from '@/hooks/useAuth';
import { Search, Plus, Filter, ArrowUpDown, Users, Target, Eye, Trophy, CheckCircle, Gem } from 'lucide-react';
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
  const [completionFilter, setCompletionFilter] = useState('all');
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
        
        // New completion filter
        const completionScore = (fighter as any).completion_score || 0;
        const matchesCompletion = 
          completionFilter === 'all' ||
          (completionFilter === 'verified' && completionScore >= 70) ||
          (completionFilter === 'diamond' && (fighter as any).completion_level === 'DIAMOND');
        
        return matchesSearch && matchesWeightClass && matchesDiscipline && 
               matchesFightingStyle && matchesRecordType && matchesReadyToFight && matchesCompletion;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return a.first_name.localeCompare(b.first_name);
          case 'wins':
            return b.record_wins - a.record_wins;
          case 'completion':
            return ((b as any).completion_score || 0) - ((a as any).completion_score || 0);
          default:
            return 0;
        }
      });
  }, [fighters, searchTerm, selectedWeightClass, selectedDiscipline, selectedFightingStyle, selectedRecordType, includeInactive, readyToFightOnly, completionFilter, sortBy]);

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
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 pt-20">
          <div className="flex justify-between items-center mb-6 sm:mb-8">
            <div className="space-y-3">
              <Skeleton className="h-10 w-48 animate-pulse" />
              <Skeleton className="h-6 w-64 animate-pulse" />
            </div>
            <Skeleton className="h-10 w-32 animate-pulse" />
          </div>
          
          {/* Animated loading cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 font-inter">
      <Header />
      
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/2 via-transparent to-secondary/2 opacity-50"></div>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8 pt-20 relative">
          <PageHeader
            title="Todos los Peleadores"
            subtitle="Descubre y conecta con los atletas más talentosos de la plataforma. Explora perfiles, estadísticas y trayectorias profesionales."
            backTo="/"
            backLabel="Volver al inicio"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Users className="h-4 w-4" />
              {fighters.length} Atletas Registrados
            </div>
          </PageHeader>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {/* Optimized Header with Create Profile */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold text-foreground">Explorar Atletas</h2>
            <p className="text-muted-foreground">Filtra y encuentra el peleador perfecto</p>
          </div>
          
          {user && !userProfile && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300 animate-glow">
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
        <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8 animate-fade-in">
          {/* Search and Mobile Filter Toggle */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar peleadores por nombre o apodo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-card/50 backdrop-blur-sm border-border/50 focus:bg-card focus:border-primary/50 transition-all duration-300"
              />
              {searchTerm && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Badge variant="secondary" className="text-xs bg-primary/10 text-primary animate-scale-in">
                    {filteredFighters.length}
                  </Badge>
                </div>
              )}
            </div>
            
            <Button
              variant="outline"
              className="md:hidden bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filtros
              {showFilters ? ' ▲' : ' ▼'}
            </Button>
          </div>

          {/* Status Toggles */}
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${showFilters || 'hidden md:grid'}`}>
            <Card className="bg-card/80 backdrop-blur-sm border border-border/50 hover:shadow-md transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
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
            
            <Card className="bg-card/80 backdrop-blur-sm border border-border/50 hover:shadow-md transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-full bg-green-500/10">
                      <Target className="h-4 w-4 text-green-600" />
                    </div>
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
          <div className={`grid grid-cols-1 md:grid-cols-6 gap-4 ${showFilters || 'hidden md:grid'}`}>
            {[
              { value: selectedWeightClass, onChange: setSelectedWeightClass, options: WEIGHT_CLASSES, placeholder: "División", icon: Filter },
              { value: selectedDiscipline, onChange: setSelectedDiscipline, options: DISCIPLINES, placeholder: "Disciplina", icon: Filter },
              { value: selectedFightingStyle, onChange: setSelectedFightingStyle, options: FIGHTING_STYLES, placeholder: "Estilo", icon: Filter },
              { value: selectedRecordType, onChange: setSelectedRecordType, options: RECORD_TYPES, placeholder: "Tipo", icon: Filter },
              { 
                value: completionFilter, 
                onChange: setCompletionFilter, 
                options: [
                  { value: 'all', label: 'Todos los perfiles', icon: null },
                  { value: 'verified', label: 'Solo verificados (70%+)', icon: CheckCircle },
                  { value: 'diamond', label: 'Solo perfiles completos', icon: Gem }
                ], 
                placeholder: "Completitud", 
                icon: Filter 
              },
              { value: sortBy, onChange: setSortBy, options: [{ value: 'name', label: 'Nombre' }, { value: 'wins', label: 'Victorias' }, { value: 'completion', label: 'Completitud' }], placeholder: "Ordenar por", icon: ArrowUpDown }
            ].map((filter, index) => (
              <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <Select value={filter.value} onValueChange={filter.onChange}>
                  <SelectTrigger className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card transition-all duration-300">
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
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground bg-card/30 backdrop-blur-sm rounded-lg p-4 border border-border/50">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span className="font-medium">
                Mostrando {filteredFighters.length} de {fighters.length} peleadores
              </span>
            </div>
            {includeInactive && (
              <Badge variant="secondary" className="text-xs bg-secondary/50">
                Incluyendo inactivos
              </Badge>
            )}
            {readyToFightOnly && (
              <Badge variant="outline" className="text-xs border-green-500/50 text-green-600">
                Solo listos para pelear
              </Badge>
            )}
            {searchTerm && (
              <Badge variant="outline" className="text-xs border-primary/50 text-primary">
                Búsqueda: "{searchTerm}"
              </Badge>
            )}
          </div>
        </div>

        {/* Fighters Grid */}
        {filteredFighters.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full flex items-center justify-center animate-scale-in">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                No se encontraron peleadores
              </h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Intenta ajustar los filtros de búsqueda o explora diferentes categorías para encontrar atletas
              </p>
              <Button 
                variant="outline" 
                className="hover:scale-105 transition-transform duration-300"
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
            {filteredFighters.map((fighter, index) => (
              <div 
                key={fighter.id}
                className="animate-fade-in hover:scale-105 transition-transform duration-300"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <FighterCard
                  fighter={fighter}
                  onClick={() => handleFighterClick(fighter)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}