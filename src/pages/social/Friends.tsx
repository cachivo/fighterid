import { PageHeader } from '@/components/ui/page-header';
import { SocialSidebar } from '@/components/social/SocialSidebar';
import { useFriends } from '@/hooks/useFriends';
import { UserCard } from '@/components/social/UserCard';
import { FriendRequestCard } from '@/components/social/FriendRequestCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

const Friends = () => {
  const {
    friends,
    friendRequests,
    loading,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend
  } = useFriends();

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Amigos" />
      
      <div className="flex">
        <SocialSidebar />
        
        <main className="flex-1 p-6 max-w-4xl mx-auto">
          <Tabs defaultValue="friends" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="friends">
                Mis Amigos
                <Badge variant="secondary" className="ml-2">{friends.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="requests">
                Solicitudes
                {friendRequests.length > 0 && (
                  <Badge variant="destructive" className="ml-2">{friendRequests.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="friends" className="space-y-4 mt-6">
              {loading ? (
                <p className="text-center text-muted-foreground py-8">Cargando...</p>
              ) : friends.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    Aún no tienes amigos
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Ve a la sección de Descubrir para encontrar personas
                  </p>
                </div>
              ) : (
                friends.map((friend) => (
                  <UserCard
                    key={friend.id}
                    user={friend}
                    isFriend={true}
                    onAddFriend={() => removeFriend(friend.id)}
                  />
                ))
              )}
            </TabsContent>
            
            <TabsContent value="requests" className="space-y-4 mt-6">
              {loading ? (
                <p className="text-center text-muted-foreground py-8">Cargando...</p>
              ) : friendRequests.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    No tienes solicitudes pendientes
                  </p>
                </div>
              ) : (
                friendRequests.map((request) => (
                  <FriendRequestCard
                    key={request.id}
                    request={request}
                    onAccept={acceptFriendRequest}
                    onReject={rejectFriendRequest}
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default Friends;
