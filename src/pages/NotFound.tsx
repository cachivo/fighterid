import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Home, Search } from 'lucide-react';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-6">
      <Card className="w-full max-w-md border-border/50 shadow-lg">
        <CardContent className="text-center p-8">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-destructive/10 to-destructive/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-10 w-10 text-destructive" />
            </div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              404
            </h1>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Página no encontrada
            </h2>
            <p className="text-muted-foreground">
              La página que buscas no existe o ha sido movida.
            </p>
          </div>
          
          <div className="space-y-3">
            <BackButton 
              to="/" 
              label="Volver al inicio" 
              className="w-full justify-center bg-primary text-primary-foreground hover:bg-primary/90"
              variant="default"
            />
            
            <div className="flex gap-2">
              <Button variant="outline" asChild className="flex-1">
                <a href="/fighters">
                  <Search className="h-4 w-4 mr-2" />
                  Peleadores
                </a>
              </Button>
              <Button variant="outline" asChild className="flex-1">
                <a href="/eventos">
                  <Home className="h-4 w-4 mr-2" />
                  Eventos
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
