import { useEffect, useState } from 'react';
import AdminLayoutWithAI from '@/components/admin/AIAssistant/AdminLayoutWithAI';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Mail, CheckCircle2, XCircle, TestTube2, Plus, Users, CheckCircle, FileEdit, Trash2, Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useEmailCampaignDrafts, useDeleteCampaignDraft, useDuplicateCampaignDraft } from '@/hooks/useEmailCampaignEditor';

interface EmailCampaign {
  id: string;
  sent_by: string;
  subject: string;
  recipient_filter: string;
  total_sent: number;
  total_failed: number;
  test_mode: boolean;
  created_at: string;
  metadata?: any;
}

export default function EmailCampaigns() {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalSent: 0, thisMonth: 0, thisWeek: 0 });
  const navigate = useNavigate();

  // Draft hooks
  const { data: drafts, isLoading: draftsLoading } = useEmailCampaignDrafts();
  const deleteDraft = useDeleteCampaignDraft();
  const duplicateDraft = useDuplicateCampaignDraft();

  useEffect(() => {
    fetchCampaigns();
    fetchStats();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('email_campaign_log')
        .select('id, sent_by, subject, recipient_filter, total_sent, total_failed, test_mode, created_at, metadata')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      setCampaigns((data || []) as EmailCampaign[]);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast.error('Error al cargar campañas');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await supabase.from('email_campaign_log').select('total_sent');
      const totalSent = data?.reduce((s, c) => s + (c.total_sent || 0), 0) || 0;
      const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0);
      const { data: monthData } = await supabase.from('email_campaign_log').select('total_sent').gte('created_at', startOfMonth.toISOString());
      const thisMonth = monthData?.reduce((s, c) => s + (c.total_sent || 0), 0) || 0;
      const startOfWeek = new Date(); startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); startOfWeek.setHours(0,0,0,0);
      const { data: weekData } = await supabase.from('email_campaign_log').select('total_sent').gte('created_at', startOfWeek.toISOString());
      const thisWeek = weekData?.reduce((s, c) => s + (c.total_sent || 0), 0) || 0;
      setStats({ totalSent, thisMonth, thisWeek });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const getFilterLabel = (campaign: EmailCampaign) => {
    const filter = campaign.recipient_filter;
    if (filter === 'fighters_segment') {
      return campaign.metadata?.segment?.description || 'Peleadores por Segmento';
    }
    switch (filter) {
      case 'all': return 'Todos los usuarios';
      case 'fighters_only': return 'Solo peleadores';
      case 'admins_only': return 'Solo administradores';
      case 'custom': return 'Selección manual';
      default: return filter;
    }
  };

  return (
    <AdminLayoutWithAI>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Campañas de Email</h1>
            <p className="text-muted-foreground">Gestiona y crea campañas de correo masivas</p>
          </div>
          <Button size="lg" onClick={() => navigate('/admin/email-campaigns/editor')} className="gap-2">
            <Plus className="h-5 w-5" />
            Crear Nueva Campaña
          </Button>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">Total Enviados</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalSent.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Todos los tiempos</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">Este Mes</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.thisMonth.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Emails enviados</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.thisWeek.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Emails enviados</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs: Drafts & Sent */}
        <Tabs defaultValue="borradores">
          <TabsList>
            <TabsTrigger value="borradores" className="gap-2">
              <FileEdit className="h-4 w-4" />
              Borradores {drafts && drafts.length > 0 && <Badge variant="secondary" className="ml-1">{drafts.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="enviadas" className="gap-2">
              <Mail className="h-4 w-4" />
              Campañas Enviadas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="borradores" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Borradores</CardTitle>
                <CardDescription>Campañas en edición con auto-guardado</CardDescription>
              </CardHeader>
              <CardContent>
                {draftsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : !drafts || drafts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay borradores. Crea una nueva campaña para empezar.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {drafts.map((d) => (
                      <div
                        key={d.id}
                        className="border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer flex items-center justify-between"
                        onClick={() => navigate(`/admin/email-campaigns/editor/${d.id}`)}
                      >
                        <div>
                          <h3 className="font-semibold">{d.nombre}</h3>
                          <p className="text-sm text-muted-foreground">
                            {d.asunto || 'Sin asunto'} · Editado {formatDistanceToNow(new Date(d.updated_at), { addSuffix: true, locale: es })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" onClick={() => duplicateDraft.mutate(d.id)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { if (confirm('¿Eliminar borrador?')) deleteDraft.mutate(d.id); }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="enviadas" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Campañas Recientes
                </CardTitle>
                <CardDescription>Historial de correos masivos enviados</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : campaigns.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No hay campañas enviadas</div>
                ) : (
                  <div className="space-y-4">
                    {campaigns.map((campaign) => (
                      <div
                        key={campaign.id}
                        className="border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/admin/email-campaigns/${campaign.id}`)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{campaign.subject}</h3>
                              {campaign.test_mode && (
                                <Badge variant="outline" className="text-xs">
                                  <TestTube2 className="h-3 w-3 mr-1" />Prueba
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>{formatDistanceToNow(new Date(campaign.created_at), { addSuffix: true, locale: es })}</span>
                              <span>•</span>
                              <span>{getFilterLabel(campaign)}</span>
                            </div>
                          </div>
                          <div className="flex gap-3 items-center">
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle2 className="h-4 w-4" />
                              <span className="font-medium">{campaign.total_sent}</span>
                            </div>
                            {campaign.total_failed > 0 && (
                              <div className="flex items-center gap-1 text-destructive">
                                <XCircle className="h-4 w-4" />
                                <span className="font-medium">{campaign.total_failed}</span>
                              </div>
                            )}
                            <Badge variant="outline" className="ml-2">Ver detalle →</Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayoutWithAI>
  );
}
