import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export function JudgeProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isJudge, setIsJudge] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) {
      setIsJudge(false);
      return;
    }

    // Verificar si el usuario existe en la tabla judges
    const checkJudgeRole = async () => {
      console.log('[JUDGE AUTH] Verificando acceso de juez para:', user.email);
      
      const { data, error } = await supabase
        .from('judges')
        .select('id, active')
        .eq('email', user.email)
        .eq('active', true)
        .maybeSingle();
      
      console.log('[JUDGE AUTH] Resultado:', { data, error });
      setIsJudge(!!data);
    };

    checkJudgeRole();
  }, [user]);

  if (isJudge === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isJudge) {
    return <Navigate to="/access-denied" />;
  }
  
  return <>{children}</>;
}
