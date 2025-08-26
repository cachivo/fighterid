import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Trophy, Monitor, Settings, BarChart3, Users, Phone } from "lucide-react";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationItems = [
    { name: "Eventos Deportivos", href: "#eventos-deportivos", icon: Trophy },
    { name: "Eventos Digitales", href: "#eventos-digitales", icon: Monitor },
    { name: "Servicios", href: "#servicios", icon: Settings },
    { name: "Ranking", href: "#ranking", icon: BarChart3 },
    { name: "Comunidad", href: "#comunidad", icon: Users },
    { name: "Contacto", href: "#contacto", icon: Phone },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <img 
            src="/lovable-uploads/07f90240-de72-4763-ba2b-eb451fe8473c.png" 
            alt="Logo" 
            className="h-8 md:h-10 w-auto"
          />
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#eventos-deportivos" className="text-foreground hover:text-primary transition-colors">
            Eventos Deportivos
          </a>
          <a href="#eventos-digitales" className="text-foreground hover:text-primary transition-colors">
            Eventos Digitales
          </a>
          <a href="#servicios" className="text-foreground hover:text-primary transition-colors">
            Servicios
          </a>
          <a href="#ranking" className="text-foreground hover:text-primary transition-colors">
            Ranking
          </a>
          <a href="#comunidad" className="text-foreground hover:text-primary transition-colors">
            Comunidad
          </a>
        </nav>
        
        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Mobile Menu Trigger */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <div className="flex flex-col h-full">
                {/* Header del Sheet */}
                <div className="border-b border-border p-6">
                  <img 
                    src="/lovable-uploads/07f90240-de72-4763-ba2b-eb451fe8473c.png" 
                    alt="Logo" 
                    className="h-10 w-auto"
                  />
                </div>
                
                {/* Navigation Items */}
                <div className="flex-1 py-6">
                  <nav className="space-y-2 px-4">
                    {navigationItems.map((item) => {
                      const IconComponent = item.icon;
                      return (
                        <a
                          key={item.name}
                          href={item.href}
                          className="flex items-center gap-3 rounded-lg px-3 py-3 text-foreground hover:bg-muted hover:text-primary transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <IconComponent className="h-5 w-5 text-primary" />
                          <span className="font-medium">{item.name}</span>
                        </a>
                      );
                    })}
                  </nav>
                </div>
                
                {/* Call to Actions */}
                <div className="border-t border-border p-6 space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Acceso Organizadores
                  </Button>
                  <Button 
                    variant="default" 
                    className="w-full"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Solicitar Cotización
                  </Button>
                  <Button 
                    variant="secondary" 
                    className="w-full"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Únete como Partner
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop Actions */}
          <Button variant="outline" size="sm" className="hidden sm:flex">
            Acceso Organizadores
          </Button>
          <Button variant="default" size="sm" className="hidden md:flex">
            Solicitar Cotización
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;