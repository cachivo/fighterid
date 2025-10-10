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

    // Verificar si el usuario tiene rol de juez
    const checkJudgeRole = async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'judge')
        .maybeSingle();
      
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
