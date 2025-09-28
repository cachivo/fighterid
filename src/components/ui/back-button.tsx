import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BackButtonProps {
  to?: string;
  label?: string;
  className?: string;
  variant?: 'default' | 'ghost' | 'outline';
}

export function BackButton({ 
  to, 
  label = 'Volver', 
  className,
  variant = 'ghost' 
}: BackButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <Button
      variant={variant}
      onClick={handleClick}
      className={cn(
        'flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors',
        className
      )}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  );
}