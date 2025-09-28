import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
}

export function Breadcrumbs({ items, className, showHome = true }: BreadcrumbsProps) {
  const allItems = showHome 
    ? [{ label: 'Inicio', href: '/' }, ...items]
    : items;

  return (
    <nav className={cn('flex items-center space-x-1 text-sm text-muted-foreground', className)}>
      {allItems.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <ChevronRight className="h-4 w-4" />}
          
          <div className="flex items-center">
            {index === 0 && showHome && <Home className="h-4 w-4 mr-1" />}
            
            {item.href && !item.isActive ? (
              <Link
                to={item.href}
                className="hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className={item.isActive ? 'text-foreground font-medium' : ''}>
                {item.label}
              </span>
            )}
          </div>
        </React.Fragment>
      ))}
    </nav>
  );
}