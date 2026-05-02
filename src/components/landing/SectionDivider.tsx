import { cn } from "@/lib/utils";

interface SectionDividerProps {
  title: string;
  subtitle?: string;
  className?: string;
}

/**
 * Unified landing-page section header. Mirrors the original Boxeo block
 * style: hairline rules flanking an uppercase title, optional uppercase
 * subtitle in muted-foreground with widest tracking.
 */
export function SectionDivider({ title, subtitle, className }: SectionDividerProps) {
  return (
    <section
      className={cn(
        "relative py-8 px-4 bg-gradient-to-b from-transparent via-primary/5 to-transparent border-y border-primary/20",
        className,
      )}
    >
      <div className="container mx-auto max-w-6xl text-center">
        <div className="flex items-center justify-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-primary/40" />
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-foreground uppercase">
            {title}
          </h2>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-primary/40" />
        </div>
        {subtitle && (
          <p className="text-sm md:text-base text-muted-foreground mt-2 uppercase tracking-widest">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}

export default SectionDivider;
