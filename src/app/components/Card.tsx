// Card component
import type { ReactNode, CSSProperties } from 'react'

type CardProps = {
  children: ReactNode
  className?: string
  style?: CSSProperties
}

export default function Card({ children, className = '', style }: CardProps) {
  return (
    <div
      className={className}
      style={{
        border: '1px solid var(--border)',
        padding: 'var(--space)',
        background: 'rgba(255, 255, 255, 0.02)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
