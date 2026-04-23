import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Settings,
  LogOut,
  Shield,
  Mail,
  ImageIcon,
  ClipboardCheck,
  Swords,
  Target,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { useIsMobile } from '@/hooks/use-mobile';
import { useApprovalCounts } from '@/hooks/useApprovalQueue';
import { useUserDisciplineAccess } from '@/hooks/useUserDisciplineAccess';

// Cross-discipline items that exist as actual routes under /admin/*
const adminItems = [
  { title: 'Dashboard', url: '/admin', icon: LayoutDashboard },
  { title: 'Cola de Aprobación', url: '/admin/cola-aprobacion', icon: ClipboardCheck, showApprovalBadge: true },
  { title: 'Inbox de Contacto', url: '/admin/inbox', icon: Mail },
];

const superAdminItems = [
  { title: 'Assets del Sistema', url: '/admin/system-assets', icon: ImageIcon },
  { title: 'Gestión de Roles', url: '/admin/user-roles', icon: Shield },
  { title: 'Configuración', url: '/admin/configuracion', icon: Settings },
];


export function AdminSidebar() {
  const { state, setOpenMobile } = useSidebar();
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { isSuperAdmin } = useSuperAdmin();
  const isMobile = useIsMobile();
  const approval = useApprovalCounts();
  const currentPath = location.pathname;
  const collapsed = state === 'collapsed';

  // Robust: always close mobile sidebar on route change
  useEffect(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [currentPath, isMobile, setOpenMobile]);

  const handleNavClick = () => {
    setOpenMobile(false);
  };

  const isActive = (path: string) => {
    if (path === '/admin') {
      return currentPath === path;
    }
    return currentPath.startsWith(path);
  };

  const getNavCls = (path: string) => 
    isActive(path) ? 'bg-primary/15 text-primary font-medium border-l-2 border-primary' : 'hover:bg-muted/50';

  return (
    <Sidebar className={collapsed ? 'w-14' : 'w-64'} collapsible="icon">
      <SidebarHeader className="p-4">
        {!collapsed && (
          <div>
            <div className="text-lg ufc-label text-primary">
              Admin Panel
            </div>
            <div className="h-0.5 w-12 bg-primary mt-1 rounded-full" />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="ufc-label text-xs">Gestión General</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === '/admin'}
                      className={`min-h-[44px] ${getNavCls(item.url)}`}
                      onClick={handleNavClick}
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && (
                        <span className="flex-1 flex items-center justify-between">
                          <span>{item.title}</span>
                          {item.showApprovalBadge && approval.total > 0 && (
                            <Badge variant="destructive" className="h-5 px-1.5 ml-2">
                              {approval.total}
                            </Badge>
                          )}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="ufc-label text-xs">Control de Peleas</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {fightControlItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={`min-h-[44px] ${getNavCls(item.url)}`}
                      onClick={handleNavClick}
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isSuperAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="ufc-label text-xs">Cuenta Maestra</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {superAdminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        className={`min-h-[44px] ${getNavCls(item.url)}`}
                        onClick={handleNavClick}
                      >
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4">
        {!collapsed && (
          <div className="text-sm text-muted-foreground mb-2">
            {user?.email}
          </div>
        )}
        <Button 
          variant="outline" 
          size={collapsed ? "icon" : "default"}
          onClick={() => signOut()}
          className="w-full border-primary/30 hover:bg-primary/10"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Cerrar Sesión</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}