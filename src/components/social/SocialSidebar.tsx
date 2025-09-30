import { Home, Users, Compass, User, Bell } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: Home, label: 'Feed', path: '/social' },
  { icon: Users, label: 'Amigos', path: '/social/friends' },
  { icon: Compass, label: 'Descubrir', path: '/social/discover' },
  { icon: User, label: 'Mi Perfil', path: '/perfil' },
  { icon: Bell, label: 'Notificaciones', path: '/social/notifications' }
];

export const SocialSidebar = () => {
  const location = useLocation();

  return (
    <aside className="w-64 border-r border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="sticky top-0 p-4 space-y-2">
        <h2 className="text-lg font-semibold mb-4 text-foreground">Red Social</h2>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
