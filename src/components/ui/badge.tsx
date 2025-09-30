import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground border-border",
        // Professional variants for sober, elegant look
        professional: "border-transparent bg-professional-primary text-professional-primary-foreground",
        "professional-outline": "border-professional-border text-professional-primary bg-transparent",
        success: "border-transparent bg-fighter-success text-white",
        warning: "border-transparent bg-fighter-warning text-white",
        danger: "border-transparent bg-fighter-danger text-white",
        info: "border-transparent bg-fighter-info text-white",
        // Professional Urban variants - matte finish
        neon: "border-transparent bg-purple-neon-primary text-white",
        cyber: "border-transparent bg-purple-neon-secondary text-white",
        glow: "border-transparent bg-purple-neon-glow text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
