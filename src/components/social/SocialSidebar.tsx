import { Home, Users, Compass, User, Bell, Shield } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/hooks/useAuth';
import { useFighterProfiles } from '@/hooks/useFighterProfiles';
import { useEffect, useState } from 'react';

const navItems = [
  { icon: Home, label: 'Feed', path: '/' },
  { icon: Users, label: 'Amigos', path: '/social/friends' },
  { icon: Compass, label: 'Descubrir', path: '/social/discover' },
  { icon: Bell, label: 'Notificaciones', path: '/social/notifications' }
];

export const SocialSidebar = () => {
  const location = useLocation();
  const { unreadCount } = useNotifications();
  const { user } = useAuth();
  const { getUserFighterProfile } = useFighterProfiles();
  const [hasFighterProfile, setHasFighterProfile] = useState(false);

  useEffect(() => {
    if (user) {
      getUserFighterProfile().then(profile => {
        setHasFighterProfile(!!profile);
      });
    }
  }, [user, getUserFighterProfile]);

  return (
    <aside className="w-64 border-r border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent text-muted-foreground hover:text-foreground'
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

        <div className="pt-4 border-t border-border mt-4 space-y-2">
          <Link
            to={hasFighterProfile ? "/license/dashboard" : "/license/welcome"}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
              location.pathname.startsWith('/license')
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent text-muted-foreground hover:text-foreground'
            )}
          >
            <Shield className="w-5 h-5" />
            <span className="font-medium">Fighter ID</span>
          </Link>
          
          <Link
            to="/profile"
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
              location.pathname === '/profile'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent text-muted-foreground hover:text-foreground'
            )}
          >
            <User className="w-5 h-5" />
            <span className="font-medium">Mi Perfil</span>
          </Link>
        </div>
      </nav>
    </aside>
  );
};
