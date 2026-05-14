import * as React from "react"
import { cn } from "@/lib/utils"
import { BUTTONS } from "@/config/ui"
import { designPrimitive } from "@/lib/design-system"

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          designPrimitive.badgeBase,
          designPrimitive.focus,
          BUTTONS.badges[variant],
          className
        )}
        {...props}
      />
    )
  }
)
Badge.displayName = "Badge"

export { Badge }
