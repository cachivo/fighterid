import React from 'react';
import { Button } from '@/components/ui/button';

interface SuggestionChip {
  id: string;
  label: string;
  query: string;
  icon?: string;
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
    icon: '🔍'
  },
  {
    id: '2',
    label: 'Estadísticas',
    query: 'Mostrar estadísticas del sistema',
    icon: '📊'
  },
  {
    id: '3',
    label: 'Licencias Pendientes',
    query: 'Revisar licencias pendientes de aprobación',
    icon: '📋'
  },
  {
    id: '4',
    label: 'Crear Torneo',
    query: 'Ayúdame a crear un nuevo torneo de MMA',
    icon: '🏆'
  },
  {
    id: '5',
    label: 'Reportes',
    query: 'Generar reporte mensual de actividad',
    icon: '📈'
  },
  {
    id: '6',
    label: 'Validar Fighter ID',
    query: 'Validar una licencia de peleador',
    icon: '✅'
  }
];

const SuggestionChips: React.FC<SuggestionChipsProps> = ({ 
  onSelectSuggestion, 
  isLoading = false 
}) => {
  return (
    <div className="flex flex-wrap gap-2 p-3 border-t">
      {defaultSuggestions.map((suggestion) => (
        <Button
          key={suggestion.id}
          variant="outline"
          size="sm"
          onClick={() => onSelectSuggestion(suggestion.query)}
          disabled={isLoading}
          className="text-xs h-7 px-2 py-1 rounded-full border-dashed"
        >
          <span className="mr-1">{suggestion.icon}</span>
          {suggestion.label}
        </Button>
      ))}
    </div>
  );
};

export default SuggestionChips;