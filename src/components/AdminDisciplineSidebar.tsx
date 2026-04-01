import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, Monitor, Users, Settings, LogOut, Shield,
  HandHeart, Gavel, Radio, Trophy, Activity, TestTube2, Eye, Mail, Send,
  Medal, ImageIcon, Building2, Tv, Briefcase, DollarSign
} from 'lucide-react';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { useIsMobile } from '@/hooks/use-mobile';
import type { AdminDiscipline } from '@/contexts/DisciplineContext';

const sharedItems = [
  { title: 'Licencias Fighter ID', url: 'licencias', icon: Shield },
  { title: 'Monitor de Emails', url: 'email-monitoring', icon: Mail },
  { title: 'Campañas de Email', url: 'email-campaigns', icon: Mail },
  { title: 'Editor de Emails', url: 'email-campaigns/editor', icon: Send },
  { title: 'Comunidad', url: 'comunidad', icon: Users },
  { title: 'Aliados Estratégicos', url: 'aliados-estrategicos', icon: HandHeart },
  { title: 'Betting & Markets', url: 'betting', icon: DollarSign },
];

const mmaItems = [
  { title: 'Dashboard MMA', url: '', icon: LayoutDashboard },
  { title: 'Centro de Moderación', url: 'pending-changes', icon: Activity },
  { title: 'Eventos de Pelea', url: 'eventos-pelea', icon: Calendar },
  { title: 'Aprobación de Peleas', url: 'fight-approval', icon: Gavel },
  { title: 'Sanciones', url: 'sanctions', icon: Shield },
  { title: 'Organizaciones', url: 'organizations', icon: Building2 },
  { title: 'Peleadores MMA', url: 'fighters-profiles', icon: Users },
  { title: 'Rankings UCC MMA', url: 'rankings', icon: Medal },
  { title: 'Gimnasios MMA', url: 'gimnasios', icon: Briefcase },
  { title: 'Staff de Gimnasios', url: 'entrenadores', icon: Users },
];

const mmaFightControl = [
  { title: 'Oficiales del Sistema', url: 'officials', icon: Gavel },
  { title: 'Jueces (Legacy)', url: 'judges', icon: Gavel },
  { title: 'Estaciones de Scoring', url: 'scoring/stations', icon: Monitor },
  { title: 'Control de Peleas', url: 'live-events', icon: Radio },
  { title: 'Transmisiones En Vivo', url: 'live-streaming', icon: Tv },
  { title: 'Resultados & Stats', url: 'fight-results', icon: Trophy },
  { title: 'Monitor de IA', url: 'ai-strike-monitor', icon: Activity },
  { title: '🧪 Pruebas IA', url: 'ai-strike-test', icon: TestTube2 },
  { title: 'Vision Diagnostics', url: 'vision-diagnostics', icon: Eye },
];

const boxeoItems = [
  { title: 'Dashboard Boxeo', url: '', icon: LayoutDashboard },
  { title: 'Centro de Moderación', url: 'pending-changes', icon: Activity },
  { title: 'Eventos de Boxeo', url: 'eventos-pelea', icon: Calendar },
  { title: 'Aprobación de Peleas', url: 'fight-approval', icon: Gavel },
  { title: 'Sanciones', url: 'sanctions', icon: Shield },
  { title: 'Organizaciones', url: 'organizations', icon: Building2 },
  { title: 'Peleadores Boxeo', url: 'fighters-profiles', icon: Users },
  { title: 'Rankings HHF Amateur', url: 'rankings', icon: Medal },
  { title: 'Rankings FEDEHBOX', url: 'rankings', icon: Trophy },
  { title: 'Gimnasios Boxeo', url: 'gimnasios', icon: Briefcase },
  { title: 'Staff de Gimnasios', url: 'entrenadores', icon: Users },
];

const boxeoFightControl = [
  { title: 'Oficiales del Sistema', url: 'officials', icon: Gavel },
  { title: 'Jueces (Legacy)', url: 'judges', icon: Gavel },
  { title: 'Estaciones de Scoring', url: 'scoring/stations', icon: Monitor },
  { title: 'Control de Peleas', url: 'live-events', icon: Radio },
  { title: 'Transmisiones En Vivo', url: 'live-streaming', icon: Tv },
  { title: 'Resultados & Stats', url: 'fight-results', icon: Trophy },
];

const superAdminItems = [
  { title: 'Assets del Sistema', url: '/admin/system-assets', icon: ImageIcon, absolute: true },
  { title: 'Gestión de Roles', url: '/admin/user-roles', icon: Shield, absolute: true },
  { title: 'Configuración', url: '/admin/configuracion', icon: Settings, absolute: true },
];

export function AdminDisciplineSidebar({ discipline }: { discipline: AdminDiscipline }) {
  const { state, setOpenMobile } = useSidebar();
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { isSuperAdmin } = useSuperAdmin();
  const isMobile = useIsMobile();
  const currentPath = location.pathname;
  const collapsed = state === 'collapsed';
  const base = discipline === 'MMA' ? '/admin/mma' : '/admin/boxeo';

  useEffect(() => {
    if (isMobile) setOpenMobile(false);
  }, [currentPath, isMobile, setOpenMobile]);

  const handleNavClick = () => setOpenMobile(false);

  const isActive = (url: string, absolute?: boolean) => {
    const fullPath = absolute ? url : `${base}/${url}`.replace(/\/$/, '');
    if (fullPath === base) return currentPath === base || currentPath === `${base}/`;
    return currentPath.startsWith(fullPath);
  };

  const getNavCls = (url: string, absolute?: boolean) =>
    isActive(url, absolute) ? 'bg-primary/15 text-primary font-medium border-l-2 border-primary' : 'hover:bg-muted/50';

  const mainItems = discipline === 'MMA' ? mmaItems : boxeoItems;
  const fightItems = discipline === 'MMA' ? mmaFightControl : boxeoFightControl;

  return (
    <Sidebar className={collapsed ? 'w-14' : 'w-64'} collapsible="icon">
      <SidebarHeader className="p-4">
        {!collapsed && (
          <div>
            <div className="text-lg ufc-label text-primary">
              {discipline === 'MMA' ? '🥊 MMA' : '🥊 Boxeo'}
            </div>
            <div className="h-0.5 w-12 bg-primary mt-1 rounded-full" />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="ufc-label text-xs">
            {discipline === 'MMA' ? 'Gestión MMA' : 'Gestión Boxeo'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={`${base}/${item.url}`}
                      end={item.url === ''}
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

        <SidebarGroup>
          <SidebarGroupLabel className="ufc-label text-xs">Control de Peleas</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {fightItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={`${base}/${item.url}`}
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

        <SidebarGroup>
          <SidebarGroupLabel className="ufc-label text-xs">Compartido</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sharedItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={`${base}/${item.url}`}
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
                        className={`min-h-[44px] ${getNavCls(item.url, true)}`}
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
          <div className="text-sm text-muted-foreground mb-2">{user?.email}</div>
        )}
        <Button
          variant="outline"
          size={collapsed ? 'icon' : 'default'}
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
