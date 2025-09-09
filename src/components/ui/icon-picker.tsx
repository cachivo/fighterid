import * as React from "react";
import { useState } from "react";
import { Search, Trophy, Target, Zap, Settings, Users, Activity, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as LucideIcons from "lucide-react";

interface IconPickerProps {
  value?: string;
  onSelect: (iconName: string) => void;
  placeholder?: string;
  className?: string;
}

// Categorías de iconos organizadas por tipo profesional
const iconCategories = {
  deportes: {
    name: "Deportes",
    icon: Trophy,
    icons: [
      "Trophy", "Target", "Zap", "Shield", "Award", "Medal", 
      "Sword", "Crown", "Star", "Flame", "Bolt", "Activity",
      "TrendingUp", "BarChart3", "CircleDot", "Crosshair", 
      "Flag", "MapPin", "Navigation", "Compass"
    ]
  },
  medios: {
    name: "Medios",
    icon: Activity,
    icons: [
      "Camera", "Video", "Mic", "Radio", "Monitor", "Smartphone",
      "Tv", "Speaker", "Headphones", "Volume2", "PlayCircle", "Youtube",
      "Instagram", "Facebook", "Twitter", "Wifi", "Broadcast", 
      "Signal", "Podcast", "FileVideo"
    ]
  },
  estadisticas: {
    name: "Estadísticas", 
    icon: BarChart3,
    icons: [
      "BarChart3", "TrendingUp", "TrendingDown", "PieChart", "Activity", "Users",
      "Database", "FileSpreadsheet", "Calculator", "Hash", "Percent", "DollarSign",
      "Calendar", "Clock", "Timer", "Gauge", "ChartArea", "ChartBar",
      "ChartLine", "ChartPie"
    ]
  },
  servicios: {
    name: "Servicios",
    icon: Settings,
    icons: [
      "Settings", "Wrench", "FileText", "Briefcase", "Lightbulb", "Search",
      "Cog", "Tool", "HardHat", "Package", "Box", "Archive",
      "FolderOpen", "File", "FileCheck", "Clipboard", "CheckSquare", 
      "Square", "Circle", "Diamond"
    ]
  },
  comunidad: {
    name: "Comunidad",
    icon: Users,
    icons: [
      "Users", "MessageSquare", "Handshake", "Star", "ThumbsUp", "Heart",
      "UserCheck", "UserPlus", "UsersRound", "MessageCircle", "Mail", "Bell",
      "Bookmark", "Share", "Link", "Globe", "Map", "Building",
      "Home", "Coffee"
    ]
  },
  populares: {
    name: "Populares",
    icon: Zap,
    icons: [
      "Trophy", "Zap", "Star", "Flame", "Crown", "Award",
      "ThumbsUp", "Heart", "Target", "Rocket", "Sparkles", "Diamond",
      "CheckCircle", "Play", "Pause", "Volume2", "Camera", "Eye",
      "Lock", "Unlock"
    ]
  }
};

// Iconos frecuentemente usados (profesionales y minimalistas)
const frequentIcons = ["Trophy", "BarChart3", "Target", "Zap", "Users", "Star", "Flame", "Award"];

export function IconPicker({ value, onSelect, placeholder = "Seleccionar icono", className }: IconPickerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // Filtrar iconos basado en la búsqueda
  const filteredCategories = React.useMemo(() => {
    if (!searchTerm) return iconCategories;
    
    const filtered: Partial<typeof iconCategories> = {};
    Object.entries(iconCategories).forEach(([key, category]) => {
      const filteredIcons = category.icons.filter(iconName => 
        iconName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (filteredIcons.length > 0) {
        filtered[key as keyof typeof iconCategories] = {
          ...category,
          icons: filteredIcons
        };
      }
    });
    return filtered;
  }, [searchTerm]);

  const handleIconSelect = (iconName: string) => {
    onSelect(iconName);
    setIsOpen(false);
    setSearchTerm("");
  };

  // Renderizar icono dinámicamente
  const renderIcon = (iconName: string, className?: string) => {
    const IconComponent = (LucideIcons as any)[iconName];
    if (!IconComponent) return null;
    return <IconComponent className={className} />;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-10",
            !value && "text-muted-foreground",
            className
          )}
        >
          <div className="flex items-center gap-2">
            {value ? (
              <>
                {renderIcon(value, "h-4 w-4")}
                <span className="text-sm opacity-70">({value})</span>
              </>
            ) : (
              <>
                <Settings className="h-4 w-4" />
                <span>{placeholder}</span>
              </>
            )}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-4">
          {/* Búsqueda */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar iconos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Iconos frecuentes (solo si no hay búsqueda) */}
          {!searchTerm && (
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2 text-muted-foreground">Frecuentes</h4>
              <div className="grid grid-cols-8 gap-1">
                {frequentIcons.map((iconName) => (
                  <Button
                    key={iconName}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-muted"
                    onClick={() => handleIconSelect(iconName)}
                  >
                    {renderIcon(iconName, "h-4 w-4")}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Categorías con tabs */}
          <Tabs defaultValue="populares" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-auto p-1">
              {Object.entries(filteredCategories).slice(0, 6).map(([key, category]) => {
                const IconComponent = category.icon;
                return (
                  <TabsTrigger 
                    key={key} 
                    value={key}
                    className="flex flex-col gap-1 py-2 h-auto text-xs"
                  >
                    <IconComponent className="h-3 w-3" />
                    <span>{category.name}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {Object.entries(filteredCategories).map(([key, category]) => (
              <TabsContent key={key} value={key} className="mt-4">
                <div className="max-h-48 overflow-y-auto">
                  <div className="grid grid-cols-8 gap-1">
                    {category.icons.map((iconName, index) => (
                      <Button
                        key={`${iconName}-${index}`}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-muted transition-colors"
                        onClick={() => handleIconSelect(iconName)}
                        title={iconName}
                      >
                        {renderIcon(iconName, "h-4 w-4")}
                      </Button>
                    ))}
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>

          {/* Mensaje cuando no hay resultados */}
          {searchTerm && Object.keys(filteredCategories).length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No se encontraron iconos que coincidan con "{searchTerm}"
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}