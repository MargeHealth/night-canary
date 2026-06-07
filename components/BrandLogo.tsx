import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'

type BrandLogoProps = {
  href?: string
  className?: string
  markClassName?: string
  textClassName?: string
  subtitle?: string
  compact?: boolean
}

export function BrandLogo({
  href = '/',
  className,
  markClassName,
  textClassName,
  subtitle,
  compact = false,
}: BrandLogoProps) {
  const content = (
    <>
      <span
        className={cn(
          'flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-teal-100 bg-white shadow-sm',
          compact ? 'h-8 w-8' : 'h-10 w-10',
          markClassName
        )}
      >
        <Image
          src="/brand/night-canary-mark.png"
          alt=""
          className="h-full w-full object-cover"
          width={compact ? 32 : 40}
          height={compact ? 32 : 40}
          unoptimized
        />
      </span>
      <span className={cn('min-w-0', compact ? 'leading-tight' : 'leading-tight')}>
        <span
          className={cn(
            'block font-semibold tracking-tight text-slate-950',
            compact ? 'text-sm' : 'text-[15px]',
            textClassName
          )}
        >
          NightCanary
        </span>
        {subtitle && (
          <span className="block text-[11px] font-medium text-teal-700">
            {subtitle}
          </span>
        )}
      </span>
    </>
  )

  return (
    <Link
      href={href}
      aria-label="NightCanary home"
      className={cn('inline-flex items-center gap-2.5', className)}
    >
      {content}
    </Link>
  )
}
