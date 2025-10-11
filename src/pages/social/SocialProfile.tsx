import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useFriends } from '@/hooks/useFriends';
import { useSocialPosts } from '@/hooks/useSocialPosts';
import { useFighterProfiles } from '@/hooks/useFighterProfiles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PostCard from '@/components/social/PostCard';
import { SocialSidebar } from '@/components/social/SocialSidebar';
import { UserProfileForm } from '@/components/UserProfileForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { User, Edit, Shield, Users, MessageCircle, MapPin, Trophy, Target, TrendingUp, Calendar, Sword, Camera } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import CreatePostForm from '@/components/social/CreatePostForm';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function SocialProfile() {
  const { user } = useAuth();
  const { profile, loading: profileLoading, refetch: refetchProfile } = useUserProfile();
  const { friends } = useFriends();
  const { posts, fetchPosts, toggleLike, deletePost, createPost } = useSocialPosts();
  const { getUserFighterProfile } = useFighterProfiles();
  const [fighterProfile, setFighterProfile] = useState<any>(null);
  const [fighterHistory, setFighterHistory] = useState<any[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (user && profile) {
        fetchPosts();
        const fighter = await getUserFighterProfile();
        setFighterProfile(fighter);

        // Check admin status
        const { data: adminStatus } = await supabase.rpc('is_admin');
        setIsAdmin(adminStatus || false);

        // Fetch fighter history if is fighter
        if (fighter) {
          const { data: historyData } = await supabase
            .from('fights_history')
            .select('*')
            .or(`red_fighter_id.eq.${fighter.id},blue_fighter_id.eq.${fighter.id}`)
            .order('event_date', { ascending: false })
            .limit(10);
          
          setFighterHistory(historyData || []);
        }
      }
    };

    loadData();
  }, [user, profile, fetchPosts, getUserFighterProfile]);

  // Filter posts by current user
  const myPosts = posts.filter(post => 
    (post.author_type === 'user' && post.author_id === profile?.id) ||
    (post.author_type === 'fighter' && post.author_id === fighterProfile?.id) ||
    (post.author_type === 'admin' && isAdmin)
  );

  const handleCreatePost = async (postData: any) => {
    if (!user || !profile) {
      toast.error('Debes iniciar sesión para publicar');
      return;
    }

    let authorType: 'admin' | 'fighter' | 'user';
    let authorId: string;

    if (isAdmin && postData.postAsAdmin) {
      authorType = 'admin';
      authorId = profile.id;
    } else if (fighterProfile) {
      authorType = 'fighter';
      authorId = fighterProfile.id;
    } else {
      authorType = 'user';
      authorId = profile.id;
    }

    const result = await createPost(postData, authorType, authorId);
    
    if (result) {
      setShowCreatePost(false);
      fetchPosts();
      toast.success('Publicación creada');
    }
  };

  const getAuthorInfo = () => {
    if (fighterProfile) {
      return {
        name: `${fighterProfile.first_name} ${fighterProfile.last_name}`,
        nickname: fighterProfile.nickname,
        avatar: fighterProfile.avatar_url,
        type: 'fighter' as const
      };
    } else if (profile) {
      return {
        name: profile.first_name && profile.last_name
          ? `${profile.first_name} ${profile.last_name}`
          : profile.email?.split('@')[0] || 'Usuario',
        nickname: undefined,
        avatar: profile.avatar_url,
        type: 'user' as const
      };
    }
    return null;
  };

  const totalFights = fighterProfile ? (fighterProfile.record_wins || 0) + (fighterProfile.record_losses || 0) + (fighterProfile.record_draws || 0) : 0;
  const winRate = totalFights > 0 ? ((fighterProfile?.record_wins || 0) / totalFights * 100).toFixed(0) : '0';

  const authorInfo = getAuthorInfo();
  const displayName = authorInfo?.name || 'Usuario';

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Acceso Restringido</h2>
            <p className="text-muted-foreground mb-6">Debes iniciar sesión para ver tu perfil.</p>
            <Button asChild>
              <Link to="/auth">Iniciar Sesión</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (profileLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  const getInitials = () => {
    if (fighterProfile) {
      return (fighterProfile.first_name?.[0] || '') + (fighterProfile.last_name?.[0] || '');
    }
    return (profile.first_name?.[0] || '') + (profile.last_name?.[0] || '') || profile.email?.[0] || 'U';
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <SocialSidebar />
      
      <div className="flex-1">
        <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <PageHeader 
              title="Mi Perfil Social"
              subtitle="Gestiona tu información y contenido"
              showBackButton={false}
            />
          </div>
        </div>

        <main className="container mx-auto p-6 max-w-6xl space-y-6">
          {/* Hero Card with Cover */}
          <Card className="overflow-hidden border-2">
            {/* Cover Photo */}
            {fighterProfile && (
              <div className="h-32 bg-gradient-to-r from-purple-neon-primary/20 to-cyan-neon/20 relative group">
                <div className="absolute inset-0 bg-[url('/lovable-uploads/octagon-background.png')] opacity-20 bg-cover bg-center"></div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Cambiar portada
                </Button>
              </div>
            )}
            
            <CardContent className={fighterProfile ? "-mt-16 relative" : "pt-8"}>
              <div className="flex flex-col md:flex-row gap-6">
                {/* Avatar with Edit */}
                <div className="flex-shrink-0 relative group">
                  <Avatar className={`${fighterProfile ? 'w-32 h-32 border-4' : 'w-24 h-24 border-2'} border-background shadow-xl`}>
                    <AvatarImage 
                      src={fighterProfile?.avatar_url || profile.avatar_url || undefined} 
                      alt={displayName} 
                    />
                    <AvatarFallback className="text-3xl bg-gradient-to-br from-primary to-accent text-primary-foreground">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>

                {/* Info */}
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex items-start justify-between flex-wrap gap-3">
                      <div>
                        <h1 className="text-3xl font-bold text-foreground">
                          {fighterProfile ? `${fighterProfile.first_name} ${fighterProfile.last_name}` : displayName}
                        </h1>
                        {fighterProfile?.nickname && (
                          <p className="text-xl text-purple-neon-primary font-semibold">
                            "{fighterProfile.nickname}"
                          </p>
                        )}
                        {profile.email && !fighterProfile && (
                          <p className="text-muted-foreground">{profile.email}</p>
                        )}
                      </div>
                      
                      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="default" size="lg">
                            <Edit className="h-5 w-5 mr-2" />
                            Editar Perfil
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Editar Perfil Social</DialogTitle>
                          </DialogHeader>
                          <UserProfileForm onSuccess={() => {
                            setEditDialogOpen(false);
                            refetchProfile();
                          }} />
                        </DialogContent>
                      </Dialog>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {fighterProfile ? (
                        <>
                          {fighterProfile.license_status && (
                            <Badge variant="default" className="gap-1">
                              <Shield className="h-3 w-3" />
                              Licencia Activa
                            </Badge>
                          )}
                          {fighterProfile.weight_class && (
                            <Badge variant="outline">{fighterProfile.weight_class}</Badge>
                          )}
                          {fighterProfile.country && (
                            <Badge variant="outline" className="gap-1">
                              <MapPin className="h-3 w-3" />
                              {fighterProfile.country}
                            </Badge>
                          )}
                          {fighterProfile.gym_name && (
                            <Badge variant="secondary">{fighterProfile.gym_name}</Badge>
                          )}
                        </>
                      ) : (
                        <>
                          {profile.country && (
                            <Badge variant="outline" className="gap-1">
                              <MapPin className="h-3 w-3" />
                              {profile.country}
                            </Badge>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {(fighterProfile?.bio || profile.bio) && (
                    <p className="text-foreground text-lg">{fighterProfile?.bio || profile.bio}</p>
                  )}

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                    {fighterProfile ? (
                      <>
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <div className="text-3xl font-bold text-primary">
                            {fighterProfile.record_wins || 0}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                            <Trophy className="h-3 w-3" />
                            Victorias
                          </div>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <div className="text-3xl font-bold text-destructive">
                            {fighterProfile.record_losses || 0}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                            <Target className="h-3 w-3" />
                            Derrotas
                          </div>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <div className="text-3xl font-bold text-accent">
                            {fighterProfile.record_draws || 0}
                          </div>
                          <div className="text-sm text-muted-foreground">Empates</div>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <div className="text-3xl font-bold text-purple-neon-primary">
                            {winRate}%
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            Win Rate
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <div className="text-3xl font-bold text-primary">{myPosts.length}</div>
                          <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            Posts
                          </div>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <div className="text-3xl font-bold text-accent">{friends.length}</div>
                          <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                            <Users className="h-3 w-3" />
                            Amigos
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Fighter Physical Stats */}
                  {fighterProfile && (
                    <div className="flex flex-wrap gap-6 text-sm text-muted-foreground pt-2 border-t">
                      {fighterProfile.height_cm && (
                        <div>
                          <span className="font-semibold text-foreground">Altura:</span> {fighterProfile.height_cm} cm
                        </div>
                      )}
                      {fighterProfile.weight_kg && (
                        <div>
                          <span className="font-semibold text-foreground">Peso:</span> {fighterProfile.weight_kg} kg
                        </div>
                      )}
                      {fighterProfile.reach_cm && (
                        <div>
                          <span className="font-semibold text-foreground">Alcance:</span> {fighterProfile.reach_cm} cm
                        </div>
                      )}
                      {fighterProfile.fighting_style && (
                        <div>
                          <span className="font-semibold text-foreground">Estilo:</span> {fighterProfile.fighting_style}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="flex flex-wrap gap-3 pt-2">
                    {fighterProfile && (
                      <Button variant="outline" asChild size="sm">
                        <Link to="/license/dashboard">
                          <Shield className="h-4 w-4 mr-2" />
                          Ver Fighter ID
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Create Post Section */}
          {authorInfo && (
            <Card className="border-border/50">
              <CardContent className="p-4">
                {showCreatePost ? (
                  <CreatePostForm
                    onSubmit={handleCreatePost}
                    authorName={authorInfo.name}
                    authorNickname={authorInfo.nickname}
                    authorAvatar={authorInfo.avatar}
                    authorType={authorInfo.type}
                    loading={false}
                    canToggleAuthor={isAdmin && !!fighterProfile}
                    postAsAdmin={false}
                    onToggleAuthor={() => {}}
                  />
                ) : (
                  <div 
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors"
                    onClick={() => setShowCreatePost(true)}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={authorInfo.avatar} alt={authorInfo.name} />
                      <AvatarFallback>{getInitials()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-muted-foreground">
                      ¿Qué está pasando en el ring?
                    </div>
                    <Button size="sm" variant="ghost" className="text-primary">
                      <Edit className="h-5 w-5" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tabs Content */}
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:w-auto">
              <TabsTrigger value="posts" className="gap-2">
                <MessageCircle className="h-4 w-4" />
                Mis Publicaciones
              </TabsTrigger>
              {fighterProfile && fighterHistory.length > 0 && (
                <TabsTrigger value="fights" className="gap-2">
                  <Sword className="h-4 w-4" />
                  Historial de Peleas
                </TabsTrigger>
              )}
            </TabsList>

            {/* Posts Tab */}
            <TabsContent value="posts" className="space-y-4 mt-6">
              {myPosts.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">No tienes publicaciones</h3>
                    <p className="text-muted-foreground mb-6">
                      Comienza a compartir contenido con la comunidad
                    </p>
                    <Button onClick={() => setShowCreatePost(true)}>
                      Crear Publicación
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                myPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onLike={toggleLike}
                    onDelete={deletePost}
                    isOwner={true}
                  />
                ))
              )}
            </TabsContent>

            {/* Fights History Tab */}
            {fighterProfile && fighterHistory.length > 0 && (
              <TabsContent value="fights" className="space-y-4 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sword className="h-5 w-5" />
                      Historial de Combates ({fighterHistory.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {fighterHistory.map((fight) => {
                        const isRedFighter = fight.red_fighter_id === fighterProfile.id;
                        const wonFight = (isRedFighter && fight.result === 'red_win') || 
                                       (!isRedFighter && fight.result === 'blue_win');
                        const drawFight = fight.result === 'draw';
                        
                        return (
                          <div 
                            key={fight.id} 
                            className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center justify-between flex-wrap gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                  {wonFight ? (
                                    <Badge variant="default" className="bg-green-600">Victoria</Badge>
                                  ) : drawFight ? (
                                    <Badge variant="secondary">Empate</Badge>
                                  ) : (
                                    <Badge variant="destructive">Derrota</Badge>
                                  )}
                                  {fight.event_date && (
                                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {format(new Date(fight.event_date), 'dd MMM yyyy', { locale: es })}
                                    </span>
                                  )}
                                </div>
                                <div className="space-y-1">
                                  <p className="font-semibold text-foreground">{fight.event_name || 'Evento sin nombre'}</p>
                                  {fight.method && (
                                    <p className="text-sm text-muted-foreground">
                                      {fight.method}
                                      {fight.round && ` - Round ${fight.round}`}
                                      {fight.time_in_round && ` - ${fight.time_in_round}`}
                                    </p>
                                  )}
                                  {fight.weight_class && (
                                    <Badge variant="outline" className="text-xs">
                                      {fight.weight_class}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </main>
      </div>
    </div>
  );
}
