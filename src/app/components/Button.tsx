// Button component - Premium style
import type { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'default' | 'primary' | 'danger' | 'secondary' | 'ghost'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  fullWidth?: boolean
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  default: {
    borderColor: 'var(--line)',
    background: 'var(--glass)',
    color: 'var(--white-90)',
  },
  secondary: {
    borderColor: 'var(--line)',
    background: 'transparent',
    color: 'var(--white-70)',
  },
  ghost: {
    borderColor: 'transparent',
    background: 'transparent',
    color: 'var(--white-70)',
  },
  primary: {
    borderColor: 'var(--royal-700)',
    background: 'var(--royal-700)',
    color: 'var(--white)',
  },
  danger: {
    borderColor: 'var(--red-600)',
    background: 'rgba(252, 2, 13, 0.15)',
    color: 'var(--red-600)',
  },
}

export default function Button({
  variant = 'default',
  fullWidth = false,
  style,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled}
      style={{
        border: '1px solid',
        padding: '10px 20px',
        borderRadius: 'var(--radius-sm)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        width: fullWidth ? '100%' : 'auto',
        fontSize: 'var(--text-sm)',
        fontWeight: 500,
        letterSpacing: '0.02em',
        transition: 'all var(--transition-fast)',
        ...variantStyles[variant],
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.opacity = '0.85'
          e.currentTarget.style.transform = 'translateY(-1px)'
        }
        props.onMouseEnter?.(e)
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.opacity = '1'
          e.currentTarget.style.transform = 'translateY(0)'
        }
        props.onMouseLeave?.(e)
      }}
    />
  )
}
