// ---------------------------------------------------------------------------
// InterviewFlow — BrandMark.tsx
// The app's logo, in one place so the sidebar and the auth screens can never
// drift apart.
//
// Uses the monogram crop rather than the full lockup: the wordmark underneath
// the mark is unreadable below roughly 96px and just turns to noise in a 28px
// sidebar badge. The full lockup is what ships as the PWA/app icon, where it
// gets the room it was drawn for.
// ---------------------------------------------------------------------------

import { cn } from '@/lib/cn'

const sizeStyles = {
  sm: 'w-7 h-7 rounded-lg',
  md: 'w-10 h-10 rounded-xl',
  lg: 'w-14 h-14 rounded-2xl',
} as const

export function BrandMark({
  size = 'md',
  className,
}: {
  size?: keyof typeof sizeStyles
  className?: string
}) {
  return (
    <img
      src="/logo-mark.png"
      alt="InterviewFlow"
      width={112}
      height={112}
      className={cn('object-cover shrink-0 select-none', sizeStyles[size], className)}
      draggable={false}
    />
  )
}
