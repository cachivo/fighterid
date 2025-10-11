import { Home, Users, Compass, User, Bell, Shield } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/hooks/useAuth';
import { useFighterProfiles } from '@/hooks/useFighterProfiles';
import { useEffect, useState } from 'react';

const navItems = [
  { icon: Home, label: 'Feed', path: '/social/feed', isPrimary: false },
  { icon: User, label: 'Mi Perfil', path: '/social/profile', isPrimary: true },
  { icon: Users, label: 'Amigos', path: '/social/friends', isPrimary: false },
  { icon: Compass, label: 'Descubrir', path: '/social/discover', isPrimary: false },
  { icon: Bell, label: 'Notificaciones', path: '/social/notifications', isPrimary: false }
];

export const SocialSidebar = () => {
  const location = useLocation();
  const { unreadCount } = useNotifications();
  
  return (
    <aside className="hidden lg:block w-64 border-r border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="sticky top-0 p-4 space-y-2">
        <h2 className="text-lg font-semibold mb-4 text-foreground">Red Social</h2>
        
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const showBadge = item.path === '/social/notifications' && unreadCount > 0;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all relative',
                // Mi Perfil destacado cuando activo
                isActive && item.isPrimary && 'bg-gradient-to-r from-primary/90 to-accent/90 text-white font-semibold shadow-lg hover:from-primary hover:to-accent',
                // Otros: fondo sólido cuando activos
                isActive && !item.isPrimary && 'bg-primary/10 text-primary font-medium',
                // Inactivos: texto normal sin apariencia de activo
                !isActive && 'text-foreground hover:bg-muted/50'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
              {showBadge && (
                <Badge 
                  variant="destructive" 
                  className="ml-auto h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
