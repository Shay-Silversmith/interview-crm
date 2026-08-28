import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
  /** 'ai' adds a subtle violet→blue gradient tint to visually distinguish
   *  AI surfaces from regular CRM cards. Fallback to 'default' everywhere else. */
  variant?: 'default' | 'ai'
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ hover, padding = 'md', variant = 'default', className, children, ...props }, ref) => {
    const padStyles = {
      none: '',
      sm: 'p-4',
      md: 'p-5',
      lg: 'p-6',
    }
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl border shadow-card',
          // Base vs AI surface background + border
          variant === 'ai'
            ? 'bg-ai-gradient border-violet-200/50'
            : 'bg-surface border-slate-200/80',
          // Hover lift. `lift-on-hover` carries the transform, the entrance
          // easing, and the reduced-motion opt-out from one place in index.css.
          hover && 'lift-on-hover cursor-pointer',
          padStyles[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Card.displayName = 'Card'

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-sm font-semibold text-slate-800', className)} {...props}>
      {children}
    </h3>
  )
}
