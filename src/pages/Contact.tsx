import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ContactForm } from '@/components/ContactForm';
import { Mail, MessageSquare, Clock } from 'lucide-react';

export default function Contact() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container py-12 md:py-20 px-4">
          {/* Hero Section */}
          <div className="text-center mb-12 max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Contacto
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              ¿Tienes preguntas sobre Fighter ID? ¿Necesitas soporte técnico? 
              ¿Quieres ser parte del equipo? Envíanos un mensaje y nuestro equipo te responderá lo antes posible.
            </p>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <div className="p-4 bg-card border rounded-lg">
                <Mail className="w-8 h-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Email</h3>
                <p className="text-sm text-muted-foreground">admin@fighter-id.org</p>
              </div>
              <div className="p-4 bg-card border rounded-lg">
                <Clock className="w-8 h-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Tiempo de respuesta</h3>
                <p className="text-sm text-muted-foreground">24-48 horas</p>
              </div>
              <div className="p-4 bg-card border rounded-lg">
                <MessageSquare className="w-8 h-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Disponibilidad</h3>
                <p className="text-sm text-muted-foreground">Lun - Vie, 9AM - 6PM</p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <ContactForm />
        </div>
      </main>
      <Footer />
    </div>
  );
}
