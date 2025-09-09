import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRealTimeStats } from '@/hooks/useRealTimeStats';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Zap, Calendar, TrendingUp, Activity } from 'lucide-react';

export default function RealTimeStats() {
  const { stats, isLoading } = useRealTimeStats();

  if (isLoading) {
    return (
      <section className="py-16 bg-gradient-to-b from-black to-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Skeleton className="h-8 w-64 mx-auto mb-4" />
            <Skeleton className="h-4 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="bg-black/50 border-purple-500/20">
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-8 w-12 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const statsConfig = [
    {
      title: 'Peleadores Registrados',
      value: stats?.totalFighters || 0,
      icon: Users,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      suffix: ''
    },
    {
      title: 'Activos Este Mes',
      value: stats?.activeFighters || 0,
      icon: Activity,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      suffix: ''
    },
    {
      title: 'Eventos en Vivo',
      value: stats?.liveEvents?.length || 0,
      icon: Zap,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      suffix: ''
    },
    {
      title: 'Crecimiento',
      value: stats?.growthRate || 0,
      icon: TrendingUp,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      suffix: '%'
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-b from-black to-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Estadísticas en Tiempo Real
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Mantente al día con las métricas más importantes de nuestra plataforma
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {statsConfig.map((stat, index) => (
            <Card key={index} className="bg-black/50 border-purple-500/20 backdrop-blur-sm hover:border-purple-400/40 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    En vivo
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-white">
                    {stat.value.toLocaleString()}{stat.suffix}
                  </p>
                  <p className="text-sm text-gray-400">
                    {stat.title}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Live Events Section */}
        {stats?.liveEvents && stats.liveEvents.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              Eventos en Vivo Ahora
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.liveEvents.map((event) => (
                <Card key={event.id} className="bg-red-500/10 border-red-500/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white text-lg">{event.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-300">
                        <Calendar className="inline h-4 w-4 mr-1" />
                        {event.discipline}
                      </p>
                      <p className="text-sm text-gray-300">
                        📍 {event.venue || 'Venue TBD'}
                      </p>
                      <Badge variant="destructive" className="text-xs">
                        EN VIVO
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}