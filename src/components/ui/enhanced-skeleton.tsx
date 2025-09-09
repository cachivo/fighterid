import { cn } from "@/lib/utils"

interface EnhancedSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'card' | 'chart' | 'stat'
}

function EnhancedSkeleton({ className, variant = 'default', ...props }: EnhancedSkeletonProps) {
  const variants = {
    default: "animate-pulse rounded-md bg-muted",
    card: "animate-pulse rounded-lg bg-muted/50 border border-muted",
    chart: "animate-pulse rounded-lg bg-muted/30 border border-muted relative overflow-hidden",
    stat: "animate-pulse rounded-md bg-gradient-to-r from-muted/50 to-muted/30"
  }

  if (variant === 'chart') {
    return (
      <div className={cn(variants.chart, className)} {...props}>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted/20 to-transparent animate-shimmer" />
      </div>
    )
  }

  return (
    <div
      className={cn(variants[variant], className)}
      {...props}
    />
  )
}

// Predefined skeleton components for common use cases
function StatsCardSkeleton() {
  return (
    <div className="space-y-3 p-6 border rounded-lg">
      <div className="flex items-center justify-between">
        <EnhancedSkeleton variant="stat" className="h-4 w-20" />
        <EnhancedSkeleton className="h-4 w-4 rounded" />
      </div>
      <EnhancedSkeleton variant="stat" className="h-8 w-16" />
      <EnhancedSkeleton className="h-3 w-24" />
    </div>
  )
}

function ChartSkeleton({ height = "h-64" }: { height?: string }) {
  return (
    <div className={cn("w-full", height)}>
      <EnhancedSkeleton variant="chart" className="w-full h-full">
        <div className="absolute bottom-4 left-4 right-4 flex justify-between">
          {[1, 2, 3, 4, 5].map(i => (
            <EnhancedSkeleton key={i} className="w-8 bg-muted/40" style={{ height: `${20 + (i % 3) * 20}px` }} />
          ))}
        </div>
      </EnhancedSkeleton>
    </div>
  )
}

export { EnhancedSkeleton, StatsCardSkeleton, ChartSkeleton }