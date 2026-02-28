import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from './AdminSidebar';
import { Link } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="flex min-h-screen w-full overflow-hidden">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b border-primary/30 bg-background flex items-center px-4 shrink-0">
            <SidebarTrigger className="mr-2 shrink-0" />
            <Link to="/" className="mr-2 shrink-0 hover:opacity-80 transition-opacity">
              <img 
                src="/lovable-uploads/7570ef51-ab69-44ed-8ffd-ce52f760de49.png" 
                alt="Fighter ID" 
                className="h-7 w-auto"
              />
            </Link>
            <h1 className="text-base ufc-label truncate">Panel de Administración</h1>
          </header>
          <main className="flex-1 p-3 md:p-4 lg:p-5 bg-background overflow-auto">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
