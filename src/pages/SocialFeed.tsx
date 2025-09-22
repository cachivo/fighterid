import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Heart, MessageCircle, TrendingUp, Users, Star } from 'lucide-react';
import PostCard from '@/components/social/PostCard';
import CreatePostForm from '@/components/social/CreatePostForm';
import { useSocialPosts } from '@/hooks/useSocialPosts';
import { useAuth } from '@/hooks/useAuth';
import { useFighterProfiles } from '@/hooks/useFighterProfiles';
import { supabase } from '@/integrations/supabase/client';

export default function SocialFeed() {
  const [activeTab, setActiveTab] = useState('all');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const { posts, loading, createPost, toggleLike, deletePost, fetchPosts } = useSocialPosts();
  const { user } = useAuth();
  const { getUserFighterProfile } = useFighterProfiles();
  const [userFighter, setUserFighter] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkUserType = async () => {
      if (user) {
        // Check if user is admin
        const { data: appUser } = await supabase
          .from('app_user')
          .select('is_admin')
          .eq('auth_user_id', user.id)
          .single();
        
        setIsAdmin(appUser?.is_admin || false);

        // Check if user has fighter profile
        const fighterProfile = await getUserFighterProfile();
        setUserFighter(fighterProfile);
      }
    };

    checkUserType();
  }, [user]);

  const handleCreatePost = async (postData: any) => {
    if (!user) return;

    if (isAdmin) {
      // Admin post
      const { data: adminUser } = await supabase
        .from('app_user')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();
      
      if (adminUser) {
        await createPost(postData, 'admin', adminUser.id);
        setShowCreatePost(false);
      }
    } else if (userFighter) {
      // Fighter post
      await createPost(postData, 'fighter', userFighter.id);
      setShowCreatePost(false);
    }
  };

  const filteredPosts = posts.filter(post => {
    if (activeTab === 'all') return true;
    if (activeTab === 'fighters') return post.author_type === 'fighter';
    if (activeTab === 'news') return post.author_type === 'admin';
    if (activeTab === 'featured') return post.featured;
    return true;
  });

  const canCreatePost = user && (isAdmin || userFighter);

  const getAuthorInfo = () => {
    if (isAdmin) {
      return {
        name: 'Batalla de Gallos',
        nickname: undefined,
        avatar: undefined,
        type: 'admin' as const
      };
    } else if (userFighter) {
      return {
        name: `${userFighter.first_name} ${userFighter.last_name}`,
        nickname: userFighter.nickname,
        avatar: userFighter.avatar_url,
        type: 'fighter' as const
      };
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-primary/20 via-primary/10 to-transparent py-16">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Heart className="h-8 w-8 text-primary" />
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Red Social
              </h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Conecta con peleadores, sigue las últimas noticias y mantente al día con la comunidad de combate
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 -mt-8 relative z-10">

        {/* Create Post Section */}
        {canCreatePost && (
          <div className="mb-8">
            {showCreatePost ? (
            <CreatePostForm
              onSubmit={handleCreatePost}
              authorName={getAuthorInfo()!.name}
              authorNickname={getAuthorInfo()!.nickname}
              authorAvatar={getAuthorInfo()!.avatar}
              authorType={getAuthorInfo()!.type}
              loading={loading}
            />
            ) : (
              <Card className="bg-card/80 backdrop-blur-sm border-border/50">
                <CardContent className="p-6">
                  <Button
                    onClick={() => setShowCreatePost(true)}
                    className="w-full h-12 text-left justify-start bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
                    variant="ghost"
                  >
                    <MessageCircle className="h-5 w-5 mr-3" />
                    {isAdmin ? '¿Qué novedades hay?' : '¿Cómo va tu entrenamiento?'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Filters */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-4 bg-card/50 backdrop-blur-sm">
            <TabsTrigger value="all" className="text-sm">
              Todos
            </TabsTrigger>
            <TabsTrigger value="fighters" className="text-sm">
              Peleadores
            </TabsTrigger>
            <TabsTrigger value="news" className="text-sm">
              Noticias
            </TabsTrigger>
            <TabsTrigger value="featured" className="text-sm">
              Destacados
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Posts Feed */}
        <div className="space-y-6">
          {loading && posts.length === 0 ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : filteredPosts.length === 0 ? (
            <Card className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardContent className="p-12 text-center">
                <div className="text-6xl mb-4">📱</div>
                <h3 className="text-xl font-semibold mb-2">No hay posts disponibles</h3>
                <p className="text-muted-foreground mb-4">
                  {activeTab === 'all' && 'Sé el primero en publicar algo'}
                  {activeTab === 'fighters' && 'No hay publicaciones de peleadores aún'}
                  {activeTab === 'news' && 'No hay noticias publicadas'}
                  {activeTab === 'featured' && 'No hay posts destacados'}
                </p>
                {canCreatePost && !showCreatePost && (
                  <Button onClick={() => setShowCreatePost(true)}>
                    Crear primer post
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLike={toggleLike}
                onDelete={deletePost}
                isOwner={
                  (user && isAdmin && post.author_type === 'admin') ||
                  (user && userFighter && post.author_id === userFighter.id)
                }
              />
            ))
          )}
        </div>

        {/* Load More */}
        {filteredPosts.length > 0 && !loading && (
          <div className="flex justify-center mt-8">
            <Button
              variant="outline"
              onClick={() => fetchPosts(20, posts.length)}
              className="bg-card/80 backdrop-blur-sm border-border/50"
            >
              Cargar más posts
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}