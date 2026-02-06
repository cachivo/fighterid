import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Shield, Award, MapPin, Calendar, CheckCircle2 } from 'lucide-react';

interface FighterProfile {
  id: string;
  first_name: string;
  last_name: string;
  nickname?: string;
  country?: string;
  avatar_url?: string;
  weight_class?: string;
  discipline?: string;
  level?: string;
  record_wins: number;
  record_losses: number;
  record_draws: number;
  license_number?: string;
  license_issue_date?: string;
  license_expiry_date?: string;
  license_state?: string;
  active?: boolean;
}

interface DigitalFighterTokenProps {
  profile: FighterProfile;
}

export function DigitalFighterToken({ profile }: DigitalFighterTokenProps) {
  const getStatusColor = (state?: string) => {
    switch (state?.toLowerCase()) {
      case 'active': return 'bg-fighter-success';
      case 'pending': return 'bg-fighter-warning';
      case 'expired': return 'bg-fighter-danger';
      default: return 'bg-fighter-accent';
    }
  };

  const getLevelVariant = (level?: string) => {
    switch (level?.toLowerCase()) {
      case 'profesional': return 'default';
      case 'semi-profesional': return 'secondary';
      case 'amateur': return 'outline';
      default: return 'outline';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: '2-digit',
      month: '2-digit'
    });
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return 'ID';
    const initials = [];
    if (firstName) initials.push(firstName[0]);
    if (lastName) initials.push(lastName[0]);
    return initials.join('').toUpperCase().slice(0, 2);
  };

  const getFullName = (firstName?: string, lastName?: string) => {
    const parts = [];
    if (firstName) parts.push(firstName);
    if (lastName) parts.push(lastName);
    return parts.length > 0 ? parts.join(' ') : 'Nombre no disponible';
  };

  return (
    <div className="relative w-full max-w-[95vw] sm:max-w-md lg:max-w-lg mx-auto">
      {/* Main Token Card - Fixed height instead of aspect-ratio to prevent layout shift */}
      <div className="relative min-h-[280px] sm:min-h-[220px] lg:min-h-[240px] w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl overflow-hidden border border-slate-700/50 shadow-2xl">
        
        {/* Holographic overlay effect - hidden on mobile for performance */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10 opacity-60 hidden sm:block" />
        
        {/* Grid pattern overlay - hidden on mobile for performance */}
        <div 
          className="absolute inset-0 opacity-[0.03] hidden sm:block"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
            backgroundSize: '20px 20px'
          }}
        />
        {/* Content Container */}
        <div className="relative h-full p-4 sm:p-5 lg:p-6 flex flex-col">
          
          {/* Header Section */}
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            {/* Avatar and Basic Info */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="relative shrink-0">
                <Avatar className="h-14 w-14 sm:h-16 sm:w-16 lg:h-20 lg:w-20 border-2 border-slate-600/50 ring-2 ring-purple-500/20">
                  <AvatarImage 
                    src={profile.avatar_url} 
                    alt={getFullName(profile.first_name, profile.last_name)}
                    loading="eager"
                  />
                  <AvatarFallback className="bg-slate-700 text-slate-200 font-semibold text-sm sm:text-base">
                    {getInitials(profile.first_name, profile.last_name)}
                  </AvatarFallback>
                </Avatar>
                
                {/* Status indicator */}
                <div className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full ${getStatusColor(profile.license_state)} border-2 border-slate-900 shadow-lg ${profile.license_state?.toLowerCase() === 'active' ? 'ring-2 ring-green-400/30 shadow-green-400/20' : ''}`}>
                  <CheckCircle2 className="h-2 w-2 sm:h-2.5 sm:w-2.5 text-white absolute top-0.5 left-0.5" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="flex items-center space-x-1 sm:space-x-2 mb-0.5">
                  <h2 className="text-white font-bold text-sm sm:text-base lg:text-lg leading-tight truncate max-w-[140px] sm:max-w-full">
                    {getFullName(profile.first_name, profile.last_name)}
                  </h2>
                  {profile.country && (
                    <span className="text-sm sm:text-base lg:text-lg opacity-60 shrink-0">
                      {profile.country === 'Colombia' && '🇨🇴'}
                      {profile.country === 'Venezuela' && '🇻🇪'}
                      {profile.country === 'Mexico' && '🇲🇽'}
                      {profile.country === 'Argentina' && '🇦🇷'}
                    </span>
                  )}
                </div>
                {profile.nickname && (
                  <p className="text-purple-300 text-[11px] sm:text-xs lg:text-sm font-medium truncate">
                    "{profile.nickname}"
                  </p>
                )}
              </div>
            </div>

            {/* Active Status Badge */}
            <Badge 
              variant={profile.active ? 'default' : 'secondary'}
              className={`bg-slate-800/80 border-green-500/30 px-1 py-0.5 sm:px-2 sm:py-1 text-[9px] sm:text-xs font-medium shrink-0 ${
                profile.active ? 'text-green-400' : 'text-gray-400'
              }`}
            >
              <CheckCircle2 className="h-2 w-2 sm:h-3 sm:w-3 mr-0.5" />
              <span className="hidden sm:inline">{profile.active ? 'Active' : 'Inactive'}</span>
              <span className="sm:hidden">{profile.active ? '✓' : '✗'}</span>
            </Badge>
          </div>

          {/* Stats Row */}
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            {/* Fighting Record */}
            <div className="flex items-center space-x-1.5 sm:space-x-3 lg:space-x-4">
              <div className="text-center">
                <div className="text-green-400 text-base sm:text-lg lg:text-xl font-bold leading-none">
                  {profile.record_wins}
                </div>
                <div className="text-slate-400 text-[9px] sm:text-[10px] lg:text-xs uppercase tracking-wide">W</div>
              </div>
              <div className="text-slate-600 text-base sm:text-lg lg:text-xl font-thin">-</div>
              <div className="text-center">
                <div className="text-red-400 text-base sm:text-lg lg:text-xl font-bold leading-none">
                  {profile.record_losses}
                </div>
                <div className="text-slate-400 text-[9px] sm:text-[10px] lg:text-xs uppercase tracking-wide">L</div>
              </div>
              <div className="text-slate-600 text-base sm:text-lg lg:text-xl font-thin">-</div>
              <div className="text-center">
                <div className="text-yellow-400 text-base sm:text-lg lg:text-xl font-bold leading-none">
                  {profile.record_draws}
                </div>
                <div className="text-slate-400 text-[9px] sm:text-[10px] lg:text-xs uppercase tracking-wide">D</div>
              </div>
            </div>

            {/* Weight, Discipline & Level */}
            <div className="text-right min-w-0 max-w-[120px] sm:max-w-none">
              {profile.level && (
                <div className="text-purple-300 text-[10px] sm:text-xs lg:text-sm font-medium mb-0.5 truncate">
                  <Award className="h-2.5 w-2.5 sm:h-3 sm:w-3 inline mr-0.5" />
                  <span className="hidden sm:inline">{profile.level}</span>
                  <span className="sm:hidden">{profile.level?.substring(0, 4)}</span>
                </div>
              )}
              {profile.weight_class && (
                <div className="text-slate-300 text-[10px] sm:text-xs lg:text-sm font-medium truncate">
                  {profile.weight_class}
                </div>
              )}
              {profile.discipline && (
                <div className="text-slate-500 text-[9px] sm:text-[10px] lg:text-xs uppercase tracking-wide truncate">
                  {profile.discipline}
                </div>
              )}
            </div>
          </div>

          {/* License Section */}
          <div className="mt-auto min-h-[2.5rem] sm:min-h-[3rem] lg:min-h-[3.5rem]">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <Shield className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 text-purple-400" />
                <span className="text-slate-400 text-[9px] sm:text-[10px] lg:text-xs uppercase tracking-wider">
                  License
                </span>
              </div>
              
              {profile.license_expiry_date && (
                <div className="flex items-center space-x-0.5 text-slate-500 text-[9px] sm:text-[10px] lg:text-xs">
                  <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  <span>Exp: {formatDate(profile.license_expiry_date)}</span>
                </div>
              )}
            </div>
            
            {/* License Number */}
            <div className="mt-1 sm:mt-1.5 lg:mt-2 font-mono text-purple-300 text-xs sm:text-sm lg:text-base font-bold tracking-wider truncate">
              {profile.license_number || 'No asignado'}
            </div>
          </div>

          {/* Decorative elements - hidden on mobile for performance */}
          <div className="absolute top-4 right-4 opacity-10 hidden sm:block">
            <div className="w-16 h-16 border border-purple-500 rounded-full" />
            <div className="absolute top-2 left-2 w-12 h-12 border border-blue-400 rounded-full" />
          </div>
          
          {/* Bottom decorative line */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
        </div>
      </div>

      {/* Glow effect - disabled on mobile to prevent GPU lag */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-600/20 via-transparent to-blue-600/20 opacity-30 sm:opacity-100 sm:blur-xl -z-10 hidden sm:block" />
      
      {/* QR Code indicator - smaller on mobile */}
      <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 bg-slate-800 border border-slate-600 rounded-lg p-1.5 sm:p-2">
        <div className="w-4 h-4 sm:w-6 sm:h-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-sm flex items-center justify-center">
          <div className="w-2.5 h-2.5 sm:w-4 sm:h-4 bg-white/20 rounded-sm" />
        </div>
      </div>
    </div>
  );
}