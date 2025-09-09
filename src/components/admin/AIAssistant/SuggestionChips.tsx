import React from 'react';
import { Button } from '@/components/ui/button';
import { Search, BarChart3, FileText, Trophy, TrendingUp, CheckCircle } from 'lucide-react';

interface SuggestionChip {
  id: string;
  label: string;
  query: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SuggestionChipsProps {
  onSelectSuggestion: (query: string) => void;
  isLoading?: boolean;
}

const defaultSuggestions: SuggestionChip[] = [
  {
    id: '1',
    label: 'Buscar Peleadores',
    query: 'Buscar peleadores activos en Honduras',
    icon: Search
  },
  {
    id: '2',
    label: 'Estadísticas',
    query: 'Mostrar estadísticas del sistema',
    icon: BarChart3
  },
  {
    id: '3',
    label: 'Licencias Pendientes',
    query: 'Revisar licencias pendientes de aprobación',
    icon: FileText
  },
  {
    id: '4',
    label: 'Crear Torneo',
    query: 'Ayúdame a crear un nuevo torneo de MMA',
    icon: Trophy
  },
  {
    id: '5',
    label: 'Reportes',
    query: 'Generar reporte mensual de actividad',
    icon: TrendingUp
  },
  {
    id: '6',
    label: 'Validar Fighter ID',
    query: 'Validar una licencia de peleador',
    icon: CheckCircle
  }
];

const SuggestionChips: React.FC<SuggestionChipsProps> = ({ 
  onSelectSuggestion, 
  isLoading = false 
}) => {
  return (
    <div className="flex flex-wrap gap-2 p-3 border-t">
      {defaultSuggestions.map((suggestion) => {
        const IconComponent = suggestion.icon;
        return (
          <Button
            key={suggestion.id}
            variant="outline"
            size="sm"
            onClick={() => onSelectSuggestion(suggestion.query)}
            disabled={isLoading}
            className="text-xs h-7 px-2 py-1 rounded-full border-dashed"
          >
            <IconComponent className="mr-1 h-3 w-3" />
            {suggestion.label}
          </Button>
        );
      })}
    </div>
  );
};

export default SuggestionChips;