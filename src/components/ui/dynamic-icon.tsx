import React from 'react';
import * as LucideIcons from 'lucide-react';
import { Trophy } from 'lucide-react';

interface DynamicIconProps {
  name: string;
  className?: string;
  fallback?: React.ComponentType<{ className?: string }>;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({ 
  name, 
  className = "h-4 w-4", 
  fallback: FallbackIcon = Trophy 
}) => {
  // Get the icon component dynamically
  const IconComponent = (LucideIcons as any)[name];
  
  // If the icon exists, render it; otherwise render the fallback
  if (IconComponent) {
    return <IconComponent className={className} />;
  }
  
  return <FallbackIcon className={className} />;
};

export default DynamicIcon;