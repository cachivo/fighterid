import { PageHeader } from '@/components/ui/page-header';
import { SocialSidebar } from '@/components/social/SocialSidebar';
import { UnifiedSearch } from '@/components/social/UnifiedSearch';

export default function Discover() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <SocialSidebar />
      
      <div className="flex-1">
        <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <PageHeader 
              title="Descubrir"
              subtitle="Encuentra nuevos usuarios y contenido interesante"
              showBackButton={false}
            />
          </div>
        </div>

        <main className="container max-w-4xl mx-auto p-6">
          <UnifiedSearch />
        </main>
      </div>
    </div>
  );
}
