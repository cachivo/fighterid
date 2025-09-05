import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from './AdminSidebar';
import { Link } from 'react-router-dom';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b bg-background flex items-center px-6">
            <SidebarTrigger className="mr-4" />
            <Link to="/" className="mr-4 hover:opacity-80 transition-opacity">
              <img 
                src="/lovable-uploads/07f90240-de72-4763-ba2b-eb451fe8473c.png" 
                alt="Batalla de Gimnasios" 
                className="h-8 w-auto"
              />
            </Link>
            <h1 className="text-lg font-semibold">Panel de Administración</h1>
          </header>
          <main className="flex-1 p-6 bg-muted/10">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}