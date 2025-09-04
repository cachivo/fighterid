import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Calendar, Monitor, Briefcase, TrendingUp, Users, Settings, Download } from 'lucide-react';
import { useSystemStats } from '@/hooks/useSystemStats';
import { useSystemStatus } from '@/hooks/useSystemStatus';

export default function Dashboard() {
  const { stats, isLoading } = useSystemStats();
  const { dbConnected, authActive, lastUpdate } = useSystemStatus();

  const statsConfig = [
    {
      title: 'Eventos Deportivos',
      value: stats?.eventosDeportivos?.toString() || '0',
      description: 'Tipos de eventos activos',
      icon: Calendar,
    },
    {
      title: 'Eventos Digitales',
      value: stats?.eventosDigitales?.toString() || '0',
      description: 'Servicios digitales disponibles',
      icon: Monitor,
    },
    {
      title: 'Servicios',
      value: stats?.servicios?.toString() || '0',
      description: 'Servicios principales',
      icon: Briefcase,
    },
    {
      title: 'Estadísticas',
      value: stats?.estadisticas?.toString() || '0',
      description: 'Métricas en el ranking',
      icon: TrendingUp,
    },
  ];
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Resumen general del contenido del sitio web
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsConfig.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? '...' : stat.value}
              </div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>
              Accesos directos a las funciones más utilizadas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4 rounded-md border p-4">
              <Download className="h-5 w-5" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">
                  Importar Batalla de Gimnasios #1
                </p>
                <p className="text-sm text-muted-foreground">
                  Cargar evento completo con 36 peleadores
                </p>
              </div>
              <Button asChild size="sm">
                <Link to="/import-event">Importar</Link>
              </Button>
            </div>
            <div className="flex items-center space-x-4 rounded-md border p-4">
              <Calendar className="h-5 w-5" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">
                  Gestionar Eventos Deportivos
                </p>
                <p className="text-sm text-muted-foreground">
                  Añadir, editar o eliminar tipos de eventos
                </p>
              </div>
              <Button asChild size="sm">
                <Link to="/admin/eventos-deportivos">Gestionar</Link>
              </Button>
            </div>
            <div className="flex items-center space-x-4 rounded-md border p-4">
              <Monitor className="h-5 w-5" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">
                  Servicios Digitales
                </p>
                <p className="text-sm text-muted-foreground">
                  Configurar eventos y servicios digitales
                </p>
              </div>
              <Button asChild size="sm">
                <Link to="/admin/eventos-digitales">Configurar</Link>
              </Button>
            </div>
            <div className="flex items-center space-x-4 rounded-md border p-4">
              <TrendingUp className="h-5 w-5" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">
                  Actualizar Ranking
                </p>
                <p className="text-sm text-muted-foreground">
                  Modificar estadísticas y eventos destacados
                </p>
              </div>
              <Button asChild size="sm">
                <Link to="/admin/ranking">Actualizar</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estado del Sistema</CardTitle>
            <CardDescription>
              Información general del sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm">Base de Datos</span>
              <span className={`text-sm ${
                dbConnected === null 
                  ? 'text-yellow-600' 
                  : dbConnected 
                    ? 'text-green-600' 
                    : 'text-red-600'
              }`}>
                {dbConnected === null ? 'Verificando...' : dbConnected ? 'Conectada' : 'Desconectada'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Autenticación</span>
              <span className={`text-sm ${authActive ? 'text-green-600' : 'text-red-600'}`}>
                {authActive ? 'Activa' : 'Inactiva'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Última actualización</span>
              <span className="text-sm text-muted-foreground">{lastUpdate}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}