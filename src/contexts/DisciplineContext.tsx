import { createContext, useContext, ReactNode } from 'react';

export type AdminDiscipline = 'MMA' | 'Boxeo';

interface DisciplineContextType {
  discipline: AdminDiscipline;
}

const DisciplineContext = createContext<DisciplineContextType | null>(null);

export function DisciplineProvider({ discipline, children }: { discipline: AdminDiscipline; children: ReactNode }) {
  return (
    <DisciplineContext.Provider value={{ discipline }}>
      {children}
    </DisciplineContext.Provider>
  );
}

export function useDiscipline(): AdminDiscipline {
  const ctx = useContext(DisciplineContext);
  if (!ctx) throw new Error('useDiscipline must be used within DisciplineProvider');
  return ctx.discipline;
}

export function useDisciplineContext() {
  return useContext(DisciplineContext);
}
