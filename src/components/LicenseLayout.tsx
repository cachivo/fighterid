import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Shield, QrCode, Calendar, FileText, LogOut, Menu, User, Home, LayoutGrid } from 'lucide-react';
import { NavLink, Link } from 'react-router-dom';
import { useLicenseAuth } from '@/hooks/useLicenseAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { FighterIDModal } from '@/components/FighterIDModal';
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  SidebarTrigger 
} from '@/components/ui/sidebar';

const navigation = [
  { name: 'Inicio', href: '/', icon: Home },
  { name: 'Mi Fighter ID', action: 'modal', icon: Shield },
  { name: 'Mi Perfil General', href: '/profile', icon: User },
  { name: 'Código QR', href: '/license/qr', icon: QrCode },
  { name: 'Próximas Peleas', href: '/license/fights', icon: Calendar },
  { name: 'Historial', href: '/license/history', icon: FileText },
  { name: 'Cambiar Módulo', href: '/profile/hub', icon: LayoutGrid },
];

export default function LicenseLayout() {
  const { user, licenseData, signOut } = useLicenseAuth();
  const [showFighterIDModal, setShowFighterIDModal] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-fighter-success';
      case 'SUSPENDED': return 'bg-fighter-danger';
      case 'PENDING_REVIEW': return 'bg-fighter-warning';
      case 'EXPIRED': return 'bg-muted';
      default: return 'bg-muted';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Activa';
      case 'SUSPENDED': return 'Suspendida';
      case 'PENDING_REVIEW': return 'En Revisión';
      case 'EXPIRED': return 'Expirada';
      default: return status;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background to-urban-light overflow-x-hidden">
        {/* Header with trigger */}
        <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-card/95 backdrop-blur-sm border-b border-border flex items-center px-4 pt-[env(safe-area-inset-top)] min-w-0">
          <SidebarTrigger className="text-primary shrink-0" />
          <Link to="/" className="ml-2 sm:ml-4 flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity shrink-0 min-w-0">
            <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-professional-primary" />
            <span className="font-bold text-base sm:text-lg truncate">Fighter ID</span>
          </Link>
          <div className="ml-auto flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="hidden sm:flex"
            >
              <Link to="/">
                <Home className="h-4 w-4 mr-2" />
                Inicio
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              asChild
            >
              <Link to="/profile/hub">
                <LayoutGrid className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Hub</span>
              </Link>
            </Button>
            {licenseData && (
              <Badge variant="outline" className={`${getStatusColor(licenseData.status)} text-white border-0`}>
                {getStatusText(licenseData.status)}
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={signOut}
              className="hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Salir
            </Button>
          </div>
        </header>

        <Sidebar className="mt-16">
          <SidebarContent>
            {/* User Profile */}
            <div className="p-4 border-b border-border">
              <Card className="p-4 bg-gradient-professional-light border border-professional-border/30">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-professional-accent/30">
                    <AvatarFallback className="bg-professional-primary text-professional-primary-foreground">
                      {user?.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {user?.email}
                    </p>
                    {licenseData && (
                      <p className="text-sm text-muted-foreground">
                        {licenseData.license_number}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            <SidebarGroup>
              <SidebarGroupLabel>Navegación</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigation.map((item) => (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton asChild>
                        {item.action === 'modal' ? (
                          <button
                            onClick={() => setShowFighterIDModal(true)}
                            className="flex w-full items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-muted/50 text-left"
                          >
                            <item.icon className="h-5 w-5" />
                            <span>{item.name}</span>
                          </button>
                        ) : (
                          <NavLink 
                            to={item.href}
                            className={({ isActive }) =>
                              `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                                isActive 
                                  ? 'bg-professional-primary/10 text-professional-primary border-l-2 border-professional-accent' 
                                  : 'hover:bg-muted/50'
                              }`
                            }
                          >
                            <item.icon className="h-5 w-5" />
                            <span>{item.name}</span>
                          </NavLink>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        {/* Main Content */}
        <main className="flex-1 mt-16 p-4 overflow-x-hidden w-full">
          <div className="max-w-6xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Fighter ID Modal */}
      <FighterIDModal 
        open={showFighterIDModal} 
        onOpenChange={setShowFighterIDModal} 
      />
    </SidebarProvider>
  );
}