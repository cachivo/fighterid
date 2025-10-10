import { Badge } from '@/components/ui/badge';
import { Shield, Swords, Activity } from 'lucide-react';

interface FighterBadgesProps {
  recordType?: string | null;
  discipline?: string | null;
  size?: 'sm' | 'xs';
}

const DISCIPLINE_CONFIG = {
  MMA: { label: 'MMA', icon: Activity, color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
  BOXING: { label: 'Box', icon: Swords, color: 'bg-red-500/10 text-red-600 border-red-500/20' },
  MUAY_THAI: { label: 'Muay Thai', icon: Activity, color: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
  BJJ: { label: 'BJJ', icon: Shield, color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  KICKBOXING: { label: 'Kick', icon: Activity, color: 'bg-green-500/10 text-green-600 border-green-500/20' },
};

const LEVEL_CONFIG = {
  AMATEUR: { label: 'Amateur', color: 'bg-slate-500/10 text-slate-600 border-slate-500/20' },
  PROFESSIONAL: { label: 'Pro', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
};

export default function FighterBadges({ recordType, discipline, size = 'xs' }: FighterBadgesProps) {
  if (!recordType && !discipline) return null;

  const sizeClass = size === 'xs' ? 'text-[10px] px-1.5 py-0' : 'text-xs px-2 py-0.5';

  return (
    <div className="flex items-center gap-1">
      {/* Distintivo de nivel */}
      {recordType && LEVEL_CONFIG[recordType as keyof typeof LEVEL_CONFIG] && (
        <Badge 
          variant="outline" 
          className={`${LEVEL_CONFIG[recordType as keyof typeof LEVEL_CONFIG].color} ${sizeClass} font-medium`}
        >
          {LEVEL_CONFIG[recordType as keyof typeof LEVEL_CONFIG].label}
        </Badge>
      )}
      
      {/* Distintivo de disciplina */}
      {discipline && DISCIPLINE_CONFIG[discipline as keyof typeof DISCIPLINE_CONFIG] && (
        <Badge 
          variant="outline" 
          className={`${DISCIPLINE_CONFIG[discipline as keyof typeof DISCIPLINE_CONFIG].color} ${sizeClass} font-medium`}
        >
          {DISCIPLINE_CONFIG[discipline as keyof typeof DISCIPLINE_CONFIG].label}
        </Badge>
      )}
    </div>
  );
}
