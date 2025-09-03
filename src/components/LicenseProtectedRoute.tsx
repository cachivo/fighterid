import { Navigate } from 'react-router-dom';
import { useLicenseAuth } from '@/hooks/useLicenseAuth';
import { Loader2 } from 'lucide-react';

interface LicenseProtectedRouteProps {
  children: React.ReactNode;
  requireActiveLicense?: boolean;
}

export default function LicenseProtectedRoute({ 
  children, 
  requireActiveLicense = false 
}: LicenseProtectedRouteProps) {
  const { user, loading, hasActiveLicense } = useLicenseAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-neon-primary" />
          <p className="text-muted-foreground">Verificando licencia...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/license/auth" replace />;
  }

  if (requireActiveLicense && !hasActiveLicense) {
    return <Navigate to="/license/pending" replace />;
  }

  return <>{children}</>;
}