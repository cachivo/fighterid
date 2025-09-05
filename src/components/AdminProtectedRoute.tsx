import { Navigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { Loader2 } from 'lucide-react';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export default function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { isAdmin, loading, error } = useAdmin();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <Navigate to="/access-denied" replace />;
  }

  if (isAdmin === false) {
    return <Navigate to="/access-denied" replace />;
  }

  if (isAdmin === null) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}