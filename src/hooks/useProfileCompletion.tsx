import { useMemo } from 'react';
import { FighterProfile } from './useFighterProfiles';
import { 
  Camera, Droplet, Shield, Ruler, Weight, 
  Maximize2, BookOpen, Link, Zap, CheckCircle, Star, Award, Calendar, User, Phone
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type CompletionLevel = 'BRONZE' | 'SILVER' | 'GOLD' | 'DIAMOND';

export interface MissingField {
  field: string;
  label: string;
  points: number;
  priority: 'high' | 'medium' | 'low';
  icon: LucideIcon;
}

export interface CompletionBadge {
  label: string;
  icon: LucideIcon;
  variant: 'default' | 'secondary' | 'outline';
}

export interface CompletionData {
  score: number;
  level: CompletionLevel;
  nextLevel: number;
  percentToNext: number;
  missingFields: MissingField[];
  badges: CompletionBadge[];
}

const FIELD_CONFIG: Record<string, Omit<MissingField, 'field'>> = {
  avatar_url: { label: 'Foto de perfil', points: 15, priority: 'high', icon: Camera },
  birthdate: { label: 'Fecha de nacimiento', points: 10, priority: 'high', icon: Calendar },
  gender: { label: 'Género', points: 10, priority: 'high', icon: User },
  phone: { label: 'Teléfono', points: 10, priority: 'high', icon: Phone },
  blood_type: { label: 'Tipo de sangre', points: 10, priority: 'high', icon: Droplet },
  emergency_contact: { label: 'Contacto de emergencia', points: 10, priority: 'high', icon: Shield },
  height_cm: { label: 'Altura', points: 5, priority: 'medium', icon: Ruler },
  weight_kg: { label: 'Peso', points: 5, priority: 'medium', icon: Weight },
  reach_cm: { label: 'Alcance', points: 5, priority: 'medium', icon: Maximize2 },
  bio: { label: 'Biografía (50+ caracteres)', points: 10, priority: 'medium', icon: BookOpen },
  martial_arts: { label: 'Artes marciales', points: 10, priority: 'medium', icon: Zap },
  recent_update: { label: 'Actualización reciente', points: 10, priority: 'low', icon: Shield },
};

const LEVEL_THRESHOLDS: Record<CompletionLevel, number> = {
  BRONZE: 0,
  SILVER: 41,
  GOLD: 71,
  DIAMOND: 91,
};

export function useProfileCompletion(profile: FighterProfile | null): CompletionData {
  return useMemo(() => {
    if (!profile) {
      return {
        score: 0,
        level: 'BRONZE',
        nextLevel: 41,
        percentToNext: 0,
        missingFields: [],
        badges: [],
      };
    }

    let score = 0;
    const missingFields: MissingField[] = [];

    // Avatar (+15)
    if (profile.avatar_url) {
      score += 15;
    } else {
      missingFields.push({ field: 'avatar_url', ...FIELD_CONFIG.avatar_url });
    }

    // Fecha de nacimiento (+10)
    if (profile.birthdate) {
      score += 10;
    } else {
      missingFields.push({ field: 'birthdate', ...FIELD_CONFIG.birthdate });
    }

    // Género (+10)
    if (profile.gender) {
      score += 10;
    } else {
      missingFields.push({ field: 'gender', ...FIELD_CONFIG.gender });
    }

    // Teléfono (+10) - desde app_user
    if ((profile as any).phone) {
      score += 10;
    } else {
      missingFields.push({ field: 'phone', ...FIELD_CONFIG.phone });
    }

    // Tipo de sangre (+10)
    if (profile.blood_type) {
      score += 10;
    } else {
      missingFields.push({ field: 'blood_type', ...FIELD_CONFIG.blood_type });
    }

    // Contacto de emergencia (+10)
    if (profile.emergency_contact_name && profile.emergency_contact_phone) {
      score += 10;
    } else {
      missingFields.push({ field: 'emergency_contact', ...FIELD_CONFIG.emergency_contact });
    }

    // Altura (+5)
    if (profile.height_cm && profile.height_cm > 0) {
      score += 5;
    } else {
      missingFields.push({ field: 'height_cm', ...FIELD_CONFIG.height_cm });
    }

    // Peso (+5)
    if (profile.weight_kg && profile.weight_kg > 0) {
      score += 5;
    } else {
      missingFields.push({ field: 'weight_kg', ...FIELD_CONFIG.weight_kg });
    }

    // Alcance (+5)
    if (profile.reach_cm && profile.reach_cm > 0) {
      score += 5;
    } else {
      missingFields.push({ field: 'reach_cm', ...FIELD_CONFIG.reach_cm });
    }

    // Bio (+10)
    if (profile.bio && profile.bio.length > 50) {
      score += 10;
    } else {
      missingFields.push({ field: 'bio', ...FIELD_CONFIG.bio });
    }

    // Links externos según disciplina (+10)
    if (profile.discipline === 'Boxeo') {
      if (profile.boxrec_url) {
        score += 10;
      } else {
        missingFields.push({ 
          field: 'external_link', 
          label: 'Link de BoxRec', 
          points: 10, 
          priority: 'low', 
          icon: Link 
        });
      }
    }
    // Para otras disciplinas no se requiere link externo

    // Artes marciales (+10)
    if (profile.martial_arts && Array.isArray(profile.martial_arts) && profile.martial_arts.length > 0) {
      score += 10;
    } else {
      missingFields.push({ field: 'martial_arts', ...FIELD_CONFIG.martial_arts });
    }

    // Cap score at 100 to prevent >100% display
    const cappedScore = Math.min(score, 100);

    // Determine level
    let level: CompletionLevel = 'BRONZE';
    let nextLevel = 41;

    if (cappedScore >= LEVEL_THRESHOLDS.DIAMOND) {
      level = 'DIAMOND';
      nextLevel = 100;
    } else if (cappedScore >= LEVEL_THRESHOLDS.GOLD) {
      level = 'GOLD';
      nextLevel = LEVEL_THRESHOLDS.DIAMOND;
    } else if (cappedScore >= LEVEL_THRESHOLDS.SILVER) {
      level = 'SILVER';
      nextLevel = LEVEL_THRESHOLDS.GOLD;
    } else {
      level = 'BRONZE';
      nextLevel = LEVEL_THRESHOLDS.SILVER;
    }

    const percentToNext = Math.min(100, Math.round((cappedScore / nextLevel) * 100));

    // Generate badges
    const badges: CompletionBadge[] = [];
    if (profile.avatar_url) {
      badges.push({ label: 'Verificado', icon: CheckCircle, variant: 'default' });
    }
    if (cappedScore >= 70) {
      badges.push({ label: 'Elite', icon: Star, variant: 'default' });
    }
    if (level === 'DIAMOND') {
      badges.push({ label: 'Perfil Completo', icon: Award, variant: 'default' });
    }

    // Sort missing fields by priority and points
    const sortedMissing = missingFields.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.points - a.points;
    });

    return {
      score: cappedScore,
      level,
      nextLevel,
      percentToNext,
      missingFields: sortedMissing,
      badges,
    };
  }, [profile]);
}
