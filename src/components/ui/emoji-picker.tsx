import * as React from "react";
import { useState } from "react";
import { Search, Smile, Heart, Star, Zap, Target, Users, Gamepad2, Music, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EmojiPickerProps {
  value?: string;
  onSelect: (emoji: string) => void;
  placeholder?: string;
  className?: string;
}

// Categorías de emojis organizadas por tipo
const emojiCategories = {
  deportes: {
    name: "Deportes",
    icon: Gamepad2,
    emojis: [
      "🏆", "⚽", "🏀", "🎾", "🏐", "🏈", "⚾", "🥊", "🏋️‍♂️", "🤸‍♂️",
      "🏃‍♂️", "🚴‍♂️", "🏊‍♂️", "🏄‍♂️", "⛷️", "🏒", "🏓", "🏸", "🥅", "🎯"
    ]
  },
  medios: {
    name: "Medios",
    icon: Camera,
    emojis: [
      "📹", "🎬", "🎥", "📺", "🎙️", "🎧", "📻", "🔴", "📱", "💻",
      "🖥️", "⌨️", "🖱️", "📡", "📢", "📯", "🔊", "🎵", "🎶", "🎤"
    ]
  },
  estadisticas: {
    name: "Estadísticas",
    icon: Target,
    emojis: [
      "📊", "📈", "📉", "🔢", "🏆", "🥇", "🥈", "🥉", "⭐", "📋",
      "📌", "📍", "🎯", "💯", "🔥", "⚡", "💪", "🚀", "✨", "💎"
    ]
  },
  servicios: {
    name: "Servicios",
    icon: Zap,
    emojis: [
      "🎬", "🛠️", "⚙️", "🔧", "📝", "📂", "💼", "🎯", "🚀", "✨",
      "💡", "🎨", "🖌️", "✏️", "📐", "📏", "🔍", "🔎", "⚗️", "🧪"
    ]
  },
  comunidad: {
    name: "Comunidad",
    icon: Users,
    emojis: [
      "👥", "🤝", "💬", "📢", "🌟", "🎉", "🔥", "❤️", "👍", "🙌",
      "👏", "💪", "🎊", "🎈", "🎁", "🌈", "☀️", "⭐", "✨", "💖"
    ]
  },
  populares: {
    name: "Populares",
    icon: Star,
    emojis: [
      "🎉", "🚀", "⭐", "🔥", "💎", "🏆", "👍", "❤️", "💯", "✨",
      "🎯", "💪", "🌟", "⚡", "🎊", "🙌", "👏", "💖", "🎁", "🌈"
    ]
  }
};

// Emojis frecuentemente usados (se puede hacer dinámico más adelante)
const frequentEmojis = ["🎬", "🏆", "📊", "🎯", "🚀", "⭐", "🔥", "💎"];

export function EmojiPicker({ value, onSelect, placeholder = "Seleccionar emoji", className }: EmojiPickerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // Filtrar emojis basado en la búsqueda
  const filteredCategories = React.useMemo(() => {
    if (!searchTerm) return emojiCategories;
    
    const filtered: Partial<typeof emojiCategories> = {};
    Object.entries(emojiCategories).forEach(([key, category]) => {
      const filteredEmojis = category.emojis.filter(emoji => 
        emoji.includes(searchTerm) || 
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (filteredEmojis.length > 0) {
        filtered[key as keyof typeof emojiCategories] = {
          ...category,
          emojis: filteredEmojis
        };
      }
    });
    return filtered;
  }, [searchTerm]);

  const handleEmojiSelect = (emoji: string) => {
    onSelect(emoji);
    setIsOpen(false);
    setSearchTerm("");
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
                <span className="text-lg">{value}</span>
                <span className="text-sm opacity-70">({value})</span>
              </>
            ) : (
              <>
                <Smile className="h-4 w-4" />
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
              placeholder="Buscar emojis..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Emojis frecuentes (solo si no hay búsqueda) */}
          {!searchTerm && (
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2 text-muted-foreground">Frecuentes</h4>
              <div className="grid grid-cols-8 gap-1">
                {frequentEmojis.map((emoji) => (
                  <Button
                    key={emoji}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-muted text-lg"
                    onClick={() => handleEmojiSelect(emoji)}
                  >
                    {emoji}
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
                    {category.emojis.map((emoji, index) => (
                      <Button
                        key={`${emoji}-${index}`}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-muted text-lg transition-colors"
                        onClick={() => handleEmojiSelect(emoji)}
                        title={emoji}
                      >
                        {emoji}
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
              No se encontraron emojis que coincidan con "{searchTerm}"
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}