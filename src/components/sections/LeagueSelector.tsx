 import { useState, useEffect } from "react";
 import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Badge } from "@/components/ui/badge";
 import { useRankingOrganizations, RankingOrganization } from "@/hooks/useRankingOrganizations";
 import { Skeleton } from "@/components/ui/skeleton";
import { Swords } from "lucide-react";
 
 interface LeagueSelectorProps {
   value: string;
   onChange: (organizationCode: string) => void;
 }
 
 export function LeagueSelector({ value, onChange }: LeagueSelectorProps) {
   const { data: organizations, isLoading } = useRankingOrganizations();
   const [selectedDiscipline, setSelectedDiscipline] = useState<'MMA' | 'Boxeo'>('MMA');
 
   // Group organizations by discipline
   const mmaOrgs = organizations?.filter(org => org.discipline === 'MMA') || [];
   const boxeoOrgs = organizations?.filter(org => org.discipline === 'Boxeo') || [];
 
   // Set initial organization based on discipline
   useEffect(() => {
     const currentOrg = organizations?.find(org => org.code === value);
     if (currentOrg) {
       setSelectedDiscipline(currentOrg.discipline as 'MMA' | 'Boxeo');
     }
   }, [value, organizations]);
 
    // When discipline changes, select amateur org first if available
    useEffect(() => {
      const orgsForDiscipline = selectedDiscipline === 'MMA' ? mmaOrgs : boxeoOrgs;
      const currentOrg = organizations?.find(org => org.code === value);
      
      if (orgsForDiscipline.length > 0 && currentOrg?.discipline !== selectedDiscipline) {
        // Priorizar org que incluya Amateur
        const amateurOrg = orgsForDiscipline.find(org => 
          org.allowed_levels.includes('Amateur')
        );
        onChange(amateurOrg?.code || orgsForDiscipline[0].code);
      }
    }, [selectedDiscipline, mmaOrgs, boxeoOrgs, value, onChange, organizations]);
 
   if (isLoading) {
     return (
       <div className="space-y-4 mb-6">
         <Skeleton className="h-10 w-48 mx-auto" />
         <Skeleton className="h-12 w-full max-w-md mx-auto" />
       </div>
     );
   }
 
   const currentOrgs = selectedDiscipline === 'MMA' ? mmaOrgs : boxeoOrgs;
 
    return (
      <div className="space-y-3 xs:space-y-4 mb-4 xs:mb-6 px-2 xs:px-4">
        {/* Discipline Tabs - Mobile optimized */}
        <div className="flex justify-center">
          <Tabs 
            value={selectedDiscipline} 
            onValueChange={(v) => setSelectedDiscipline(v as 'MMA' | 'Boxeo')}
          >
            <TabsList className="bg-black/60 border border-purple-neon-primary/30 h-11 xs:h-12">
              <TabsTrigger 
                value="MMA"
                className="data-[state=active]:bg-purple-neon-primary data-[state=active]:text-black px-4 xs:px-6 py-2 gap-1.5 xs:gap-2 min-h-[44px] touch-manipulation text-sm xs:text-base"
              >
                <Swords className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                MMA
              </TabsTrigger>
              <TabsTrigger 
                value="Boxeo"
                className="data-[state=active]:bg-purple-neon-primary data-[state=active]:text-black px-4 xs:px-6 py-2 gap-1.5 xs:gap-2 min-h-[44px] touch-manipulation text-sm xs:text-base"
              >
                <Swords className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                BOXEO
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
  
        {/* Organization Tabs */}
        {currentOrgs.length > 1 && (
          <div className="flex justify-center overflow-x-auto no-scrollbar">
            <Tabs value={value} onValueChange={onChange}>
              <TabsList className="bg-black/40 border border-purple-neon-primary/20 flex-wrap h-auto gap-1 p-1">
                {currentOrgs.map((org) => (
                  <TabsTrigger
                    key={org.code}
                    value={org.code}
                    className="data-[state=active]:bg-purple-neon-primary/80 data-[state=active]:text-black px-3 xs:px-4 py-1.5 xs:py-2 flex flex-col items-center gap-0.5 xs:gap-1 min-h-[44px] touch-manipulation"
                  >
                    <span className="font-bold text-xs xs:text-sm">{org.short_name}</span>
                    <div className="flex gap-0.5 xs:gap-1">
                      {org.allowed_levels.map((level) => (
                        <Badge 
                          key={level} 
                          variant="outline" 
                          className="text-[8px] xs:text-[10px] px-1 py-0 border-purple-neon-primary/40"
                        >
                          {level === 'Profesional' ? 'PRO' : level === 'Semi-profesional' ? 'SEMI' : 'AM'}
                        </Badge>
                      ))}
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        )}
  
        {/* Organization Description */}
        {currentOrgs.length > 0 && (
          <p className="text-center text-gray-400 text-xs xs:text-sm px-2">
            {currentOrgs.find(org => org.code === value)?.description}
          </p>
        )}
      </div>
    );
  }
  
  export default LeagueSelector;