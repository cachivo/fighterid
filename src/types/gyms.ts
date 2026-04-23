export interface Gym {
  id: string;
  slug: string;
  nombre: string;
  descripcion?: string;
  telefono?: string;
  whatsapp?: string;
  email?: string;
  direccion?: string;
  ciudad?: string;
  pais?: string;
  disciplinas: string[];
  logo_url?: string;
  banner_url?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  website?: string;
  owner_id?: string;
  activo: boolean;
  moderation_status?: 'approved' | 'pending' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface Coach {
  id: string;
  slug: string;
  nombre: string;
  apellidos?: string;
  bio?: string;
  telefono?: string;
  whatsapp?: string;
  email?: string;
  ciudad?: string;
  pais?: string;
  especialidades: string[];
  avatar_url?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  gym_id?: string;
  gym?: Gym;
  owner_id?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface GymWithCoaches extends Gym {
  coaches?: Coach[];
}
