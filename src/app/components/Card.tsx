// Card component - Glass style
import type { ReactNode, CSSProperties } from 'react'

type CardProps = {
  children: ReactNode
  className?: string
  style?: CSSProperties
  variant?: 'default' | 'glass' | 'solid'
}

export default function Card({ children, className = '', style, variant = 'glass' }: CardProps) {
  const variants: Record<string, CSSProperties> = {
    default: {
      border: '1px solid var(--border)',
      background: 'rgba(255, 255, 255, 0.02)',
    },
    glass: {
      border: '1px solid var(--line)',
      background: 'var(--glass)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
    },
    solid: {
      border: '1px solid var(--line)',
      background: 'var(--navy-900)',
    },
  }

  return (
    <div
      className={className}
      style={{
        padding: 'var(--space-lg)',
        borderRadius: 'var(--radius-lg)',
        ...variants[variant],
        ...style,
      }}
    >
      {children}
    </div>
  )
}
