import { useSystemAssets } from "@/hooks/useSystemAssets";
import { Link } from "react-router-dom";

const Footer = () => {
  const { logoUrl } = useSystemAssets();
  return (
    <footer className="bg-primary text-primary-foreground py-6 sm:py-8 md:py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 sm:gap-6 md:gap-8">
          <div className="sm:col-span-2 md:col-span-2">
            <div className="mb-4">
              <img 
                src={logoUrl} 
                alt="Fighter ID" 
                className="h-6 sm:h-8 w-auto"
              />
            </div>
            <p className="text-gray-300 mb-4 text-sm sm:text-base">
              Plataforma profesional de certificación y gestión de peleadores.
              Tu identidad deportiva verificada y protegida.
            </p>
            <div className="flex gap-3 sm:gap-4">
              <div className="w-11 h-11 bg-accent rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform touch-manipulation">
                <span className="text-xs font-bold">IG</span>
              </div>
              <div className="w-11 h-11 bg-accent rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform touch-manipulation">
                <span className="text-xs font-bold">YT</span>
              </div>
              <div className="w-11 h-11 bg-accent rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform touch-manipulation">
                <span className="text-xs font-bold">TW</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-accent">Eventos</h4>
            <ul className="space-y-2 text-gray-300">
              <li><Link to="/eventos" className="hover:text-accent transition-colors text-sm sm:text-base touch-manipulation">Próximas Batallas</Link></li>
              <li><Link to="/eventos" className="hover:text-accent transition-colors text-sm sm:text-base touch-manipulation">Calendario</Link></li>
              <li><Link to="/resultados" className="hover:text-accent transition-colors text-sm sm:text-base touch-manipulation">Resultados</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-accent">Comunidad</h4>
            <ul className="space-y-2 text-gray-300">
              <li><Link to="/license/auth" className="hover:text-accent transition-colors text-sm sm:text-base touch-manipulation">Licencia de Peleador</Link></li>
              <li><Link to="/contacto" className="hover:text-accent transition-colors text-sm sm:text-base touch-manipulation">Ser Jurado</Link></li>
              <li><Link to="/contacto" className="hover:text-accent transition-colors text-sm sm:text-base touch-manipulation">Contacto</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-gray-400">
          <p className="text-xs sm:text-sm">&copy; 2025. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;