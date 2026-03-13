import { Badge } from '@/components/ui/badge';
import { Shield, Swords, Activity } from 'lucide-react';

interface FighterBadgesProps {
  recordType?: string | null;
  discipline?: string | null;
  size?: 'sm' | 'xs';
}

const DISCIPLINE_CONFIG: Record<string, { label: string; icon: typeof Activity; color: string }> = {
  // Keys exactos del sistema
  MMA: { label: 'MMA', icon: Activity, color: 'bg-primary/10 text-primary border-primary/20' },
  Boxeo: { label: 'Boxeo', icon: Swords, color: 'bg-destructive/10 text-destructive border-destructive/20' },
  'Muay Thai': { label: 'Muay Thai', icon: Activity, color: 'bg-fighter-warning/10 text-fighter-warning border-fighter-warning/20' },
  MuayThai: { label: 'Muay Thai', icon: Activity, color: 'bg-fighter-warning/10 text-fighter-warning border-fighter-warning/20' },
  'Jiu-Jitsu': { label: 'Jiu-Jitsu', icon: Shield, color: 'bg-fighter-info/10 text-fighter-info border-fighter-info/20' },
  JiuJitsu: { label: 'Jiu-Jitsu', icon: Shield, color: 'bg-fighter-info/10 text-fighter-info border-fighter-info/20' },
  Kickboxing: { label: 'Kickboxing', icon: Activity, color: 'bg-fighter-success/10 text-fighter-success border-fighter-success/20' },
  Judo: { label: 'Judo', icon: Shield, color: 'bg-fighter-warning/10 text-fighter-warning border-fighter-warning/20' },
  Karate: { label: 'Karate', icon: Activity, color: 'bg-fighter-info/10 text-fighter-info border-fighter-info/20' },
  Taekwondo: { label: 'Taekwondo', icon: Activity, color: 'bg-primary/10 text-primary border-primary/20' },
  'Lucha Libre': { label: 'Lucha', icon: Shield, color: 'bg-fighter-warning/10 text-fighter-warning border-fighter-warning/20' },
  Grappling: { label: 'Grappling', icon: Shield, color: 'bg-fighter-success/10 text-fighter-success border-fighter-success/20' },
  Sambo: { label: 'Sambo', icon: Shield, color: 'bg-destructive/10 text-destructive border-destructive/20' },
};

const LEVEL_CONFIG = {
  AMATEUR: { label: 'Amateur', color: 'bg-muted/50 text-muted-foreground border-border' },
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
