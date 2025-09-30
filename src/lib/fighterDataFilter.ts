/**
 * Fighter Data Security Filter
 * 
 * This module defines which fighter profile fields are public vs sensitive.
 * Used to prevent accidental exposure of PII (Personal Identifiable Information).
 */

export interface PublicFighterData {
  // Basic identification (PUBLIC)
  id: string;
  first_name: string;
  last_name: string;
  nickname: string | null;
  avatar_url: string | null;
  country: string | null;
  gender: string | null;
  
  // Fighting information (PUBLIC)
  weight_class: string;
  discipline: string | null;
  fighting_style: string | null;
  stance: string | null;
  martial_arts: string[] | null;
  gym_name: string | null;
  
  // Physical stats (PUBLIC)
  height_cm: number | null;
  weight_kg: number | null;
  reach_cm: number | null;
  
  // Record (PUBLIC)
  record_wins: number;
  record_losses: number;
  record_draws: number;
  record_type: string | null;
  
  // License info (PUBLIC - basic only)
  license_number: string | null;
  license_status: string | null;
  level: string | null;
  
  // Profile info (PUBLIC)
  bio: string | null;
  boxrec_url: string | null;
  tapology_url: string | null;
  
  // Status (PUBLIC)
  active: boolean;
  created_at: string;
  updated_at: string;
  
  // Organization (PUBLIC)
  organization_id: string | null;
  primary_license_id: string | null;
}

export interface SensitiveFighterData {
  // Personal information (SENSITIVE - Owner/Admin only)
  birthdate: string | null;
  birthplace: string | null;
  blood_type: string | null;
  
  // Documents (SENSITIVE - Owner/Admin only)
  document_type: string | null;
  document_number: string | null;
  
  // Emergency contacts (SENSITIVE - Owner/Admin only)
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relation: string | null;
  
  // Medical information (SENSITIVE - Owner/Admin only)
  medical_conditions: string | null;
  medical_allergies: string | null;
  
  // Insurance (SENSITIVE - Owner/Admin only)
  insurance_company: string | null;
  insurance_policy: string | null;
  
  // License dates (SENSITIVE - Owner/Admin only)
  license_issued_date: string | null;
  license_expires_date: string | null;
}

export type CompleteFighterData = PublicFighterData & SensitiveFighterData;

/**
 * Public fields that can be safely displayed to anyone
 */
export const PUBLIC_FIGHTER_FIELDS: (keyof PublicFighterData)[] = [
  'id', 'first_name', 'last_name', 'nickname', 'avatar_url', 'country', 'gender',
  'weight_class', 'discipline', 'fighting_style', 'stance', 'martial_arts', 'gym_name',
  'height_cm', 'weight_kg', 'reach_cm',
  'record_wins', 'record_losses', 'record_draws', 'record_type',
  'license_number', 'license_status', 'level',
  'bio', 'boxrec_url', 'tapology_url',
  'active', 'created_at', 'updated_at',
  'organization_id', 'primary_license_id'
];

/**
 * Sensitive fields that should NEVER be shown publicly
 */
export const SENSITIVE_FIGHTER_FIELDS: (keyof SensitiveFighterData)[] = [
  'birthdate', 'birthplace', 'blood_type',
  'document_type', 'document_number',
  'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relation',
  'medical_conditions', 'medical_allergies',
  'insurance_company', 'insurance_policy',
  'license_issued_date', 'license_expires_date'
];

/**
 * Filters fighter data to only include public fields
 * Use this when displaying fighter data to non-owners/non-admins
 */
export function filterPublicFighterData(fighter: any): PublicFighterData {
  const publicData: any = {};
  
  PUBLIC_FIGHTER_FIELDS.forEach(field => {
    if (field in fighter) {
      publicData[field] = fighter[field];
    }
  });
  
  return publicData as PublicFighterData;
}

/**
 * Checks if a field is sensitive and should not be displayed publicly
 */
export function isSensitiveField(fieldName: string): boolean {
  return SENSITIVE_FIGHTER_FIELDS.includes(fieldName as keyof SensitiveFighterData);
}

/**
 * Gets the SQL select string for public fighter fields only
 * Use this in Supabase queries for public access
 */
export function getPublicFighterFieldsSelect(): string {
  return PUBLIC_FIGHTER_FIELDS.join(', ');
}
