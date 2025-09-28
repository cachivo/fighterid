import { ReactNode } from 'react';
import { BackButton } from './back-button';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  backTo?: string;
  backLabel?: string;
  className?: string;
  children?: ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  showBackButton = true,
  backTo = '/',
  backLabel = 'Volver al inicio',
  className,
  children
}: PageHeaderProps) {
  return (
    <div className={cn('space-y-4 mb-8', className)}>
      {showBackButton && (
        <div className="animate-fade-in">
          <BackButton to={backTo} label={backLabel} />
        </div>
      )}
      
      <div className="space-y-2 animate-fade-in-up">
        <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg text-muted-foreground max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>
      
      {children && (
        <div className="animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
}