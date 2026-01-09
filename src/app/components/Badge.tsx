// Badge component
type BadgeVariant = 'default' | 'success' | 'warning' | 'danger'

type BadgeProps = {
  children: React.ReactNode
  variant?: BadgeVariant
}

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  default: {
    background: 'var(--border)',
    color: 'var(--fg)',
  },
  success: {
    background: 'rgba(0, 180, 0, 0.2)',
    color: '#00cc00',
  },
  warning: {
    background: 'rgba(255, 200, 0, 0.2)',
    color: '#ffcc00',
  },
  danger: {
    background: 'rgba(255, 0, 0, 0.2)',
    color: 'var(--red)',
  },
}

export default function Badge({ children, variant = 'default' }: BadgeProps) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        fontSize: '0.75rem',
        fontWeight: 500,
        whiteSpace: 'nowrap',
        ...variantStyles[variant],
      }}
    >
      {children}
    </span>
  )
}
