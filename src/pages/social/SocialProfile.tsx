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
import PostCard from '@/components/social/PostCard';
import { SocialSidebar } from '@/components/social/SocialSidebar';
import { UserProfileForm } from '@/components/UserProfileForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { User, Edit, Shield, Users, FileText, MapPin } from 'lucide-react';

export default function SocialProfile() {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const { friends } = useFriends();
  const { posts, fetchPosts, toggleLike } = useSocialPosts();
  const { getUserFighterProfile } = useFighterProfiles();
  const [fighterProfile, setFighterProfile] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    if (user && profile) {
      fetchPosts();
      getUserFighterProfile().then(setFighterProfile);
    }
  }, [user, profile, fetchPosts, getUserFighterProfile]);

  // Filter posts by current user
  const myPosts = posts.filter(post => post.author_id === profile?.id);

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

  return (
    <div className="flex min-h-screen w-full bg-background">
      <SocialSidebar />
      
      <main className="flex-1 overflow-y-auto">
        <div className="container max-w-4xl mx-auto p-6 space-y-6">
          <PageHeader 
            title="Mi Perfil Social"
            subtitle="Gestiona tu información personal y contenido"
            showBackButton={false}
          />

          {/* Profile Card */}
          <Card className="border-2">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <Avatar className="h-32 w-32 border-4 border-primary/20">
                    <AvatarImage 
                      src={profile.avatar_url || undefined} 
                      alt={profile.first_name || profile.email || 'User'}
                    />
                    <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-primary to-accent text-primary-foreground">
                      {profile.first_name?.charAt(0) || profile.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Profile Info */}
                <div className="flex-1 space-y-4">
                  <div>
                    <h2 className="text-3xl font-bold text-foreground">
                      {profile.first_name} {profile.last_name}
                    </h2>
                    {profile.email && (
                      <p className="text-lg text-muted-foreground">{profile.email}</p>
                    )}
                  </div>

                  {profile.bio && (
                    <p className="text-muted-foreground">{profile.bio}</p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {profile.country && (
                      <Badge variant="outline" className="gap-1">
                        <MapPin className="h-3 w-3" />
                        {profile.country}
                      </Badge>
                    )}
                    {profile.email && (
                      <Badge variant="outline">
                        {profile.email}
                      </Badge>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex gap-6 pt-2">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{myPosts.length}</div>
                      <div className="text-sm text-muted-foreground">Posts</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{friends.length}</div>
                      <div className="text-sm text-muted-foreground">Amigos</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3 pt-4">
                    <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="default">
                          <Edit className="h-4 w-4 mr-2" />
                          Editar Perfil
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Editar Perfil Social</DialogTitle>
                        </DialogHeader>
                        <UserProfileForm onSuccess={() => setEditDialogOpen(false)} />
                      </DialogContent>
                    </Dialog>

                    {fighterProfile && (
                      <Button variant="outline" asChild>
                        <Link to={`/fighter/${fighterProfile.id}`}>
                          <Shield className="h-4 w-4 mr-2" />
                          Ver mi Perfil de Peleador
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* My Posts Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Mis Publicaciones ({myPosts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {myPosts.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">No tienes publicaciones</h3>
                  <p className="text-muted-foreground mb-6">
                    Comienza a compartir contenido en la red social
                  </p>
                  <Button asChild>
                    <Link to="/social">
                      <Users className="h-4 w-4 mr-2" />
                      Ir al Feed
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {myPosts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onLike={() => toggleLike(post.id)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
