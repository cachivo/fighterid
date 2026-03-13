import { Badge } from '@/components/ui/badge';
import { Shield, Swords, Activity } from 'lucide-react';

interface FighterBadgesProps {
  recordType?: string | null;
  discipline?: string | null;
  size?: 'sm' | 'xs';
}

const DISCIPLINE_CONFIG: Record<string, { label: string; icon: typeof Activity; color: string }> = {
  // Keys exactos del sistema
  MMA: { label: 'MMA', icon: Activity, color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
  Boxeo: { label: 'Boxeo', icon: Swords, color: 'bg-red-500/10 text-red-600 border-red-500/20' },
  'Muay Thai': { label: 'Muay Thai', icon: Activity, color: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
  MuayThai: { label: 'Muay Thai', icon: Activity, color: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
  'Jiu-Jitsu': { label: 'Jiu-Jitsu', icon: Shield, color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  JiuJitsu: { label: 'Jiu-Jitsu', icon: Shield, color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  Kickboxing: { label: 'Kickboxing', icon: Activity, color: 'bg-green-500/10 text-green-600 border-green-500/20' },
  Judo: { label: 'Judo', icon: Shield, color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
  Karate: { label: 'Karate', icon: Activity, color: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20' },
  Taekwondo: { label: 'Taekwondo', icon: Activity, color: 'bg-pink-500/10 text-pink-600 border-pink-500/20' },
  'Lucha Libre': { label: 'Lucha', icon: Shield, color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  Grappling: { label: 'Grappling', icon: Shield, color: 'bg-teal-500/10 text-teal-600 border-teal-500/20' },
  Sambo: { label: 'Sambo', icon: Shield, color: 'bg-rose-500/10 text-rose-600 border-rose-500/20' },
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
