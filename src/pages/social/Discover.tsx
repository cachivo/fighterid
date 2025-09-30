import { PageHeader } from '@/components/ui/page-header';
import { SocialSidebar } from '@/components/social/SocialSidebar';
import { UserSearch } from '@/components/social/UserSearch';

const Discover = () => {
  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Descubrir Usuarios" />
      
      <div className="flex">
        <SocialSidebar />
        
        <main className="flex-1 p-6 max-w-4xl mx-auto">
          <UserSearch />
        </main>
      </div>
    </div>
  );
};

export default Discover;
