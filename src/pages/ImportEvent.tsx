import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EventImporter from '@/components/EventImporter';

const ImportEvent = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="border-b border-border/50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Admin
              </Link>
            </Button>
          </div>
          
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Importar Evento
            </h1>
            <p className="text-lg text-muted-foreground">
              Herramienta para importar eventos masivamente con todos los peleadores y peleas
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <EventImporter />
        </div>
      </section>
    </div>
  );
};

export default ImportEvent;