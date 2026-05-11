import { useState } from 'react'
import { cn } from '@/lib/cn'
import { initials } from '@/utils/format'

interface AvatarProps {
  name: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  colorIndex?: number
}

const AVATAR_COLORS = [
  'bg-primary-100 text-primary-700',
  'bg-violet-100 text-violet-700',
  'bg-success-100 text-success-700',
  'bg-warning-100 text-warning-700',
  'bg-danger-100 text-danger-700',
]

const sizeStyles = {
  xs: 'w-6 h-6 text-2xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-10 h-10 text-sm',
  xl: 'w-12 h-12 text-base',
}

export function Avatar({ name, size = 'md', className, colorIndex }: AvatarProps) {
  const idx = colorIndex ?? name.charCodeAt(0) % AVATAR_COLORS.length
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold shrink-0',
        AVATAR_COLORS[idx],
        sizeStyles[size],
        className
      )}
      aria-label={name}
    >
      {initials(name)}
    </div>
  )
}

interface CompanyLogoProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  /** When provided, renders a real logo image. Falls back to initials on error. */
  logoUrl?: string
}

const logoSizeStyles = {
  sm: 'w-8 h-8 text-xs rounded-lg',
  md: 'w-10 h-10 text-sm rounded-xl',
  lg: 'w-12 h-12 text-base rounded-xl',
}

const COMPANY_COLORS: Record<string, string> = {
  Amazon: 'bg-warning-100 text-warning-700',
  MyHeritage: 'bg-success-100 text-success-700',
  Mobileye: 'bg-primary-100 text-primary-700',
  Wix: 'bg-violet-100 text-violet-700',
  Upwind: 'bg-danger-100 text-danger-700',
}

export function CompanyLogo({ name, size = 'md', className, logoUrl }: CompanyLogoProps) {
  const [imgError, setImgError] = useState(false)
  const safeName = name ?? ''
  const color = COMPANY_COLORS[safeName] ?? 'bg-slate-100 text-slate-600'
  const abbr = safeName.slice(0, 2).toUpperCase() || '?'

  // Image path: logoUrl present and not yet errored → render <img>
  if (logoUrl && !imgError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center overflow-hidden shrink-0',
          logoSizeStyles[size],
          className
        )}
      >
        <img
          src={logoUrl}
          alt={`${safeName} logo`}
          className="w-full h-full object-contain"
          onError={() => setImgError(true)}
        />
      </div>
    )
  }

  // Fallback: colored initials square (original behaviour)
  return (
    <div
      className={cn(
        'flex items-center justify-center font-bold shrink-0',
        color,
        logoSizeStyles[size],
        className
      )}
    >
      {abbr}
    </div>
  )
}
