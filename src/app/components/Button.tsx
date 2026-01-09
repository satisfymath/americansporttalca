// Button component
import type { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'default' | 'primary' | 'danger' | 'secondary'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  fullWidth?: boolean
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  default: {
    borderColor: 'var(--border)',
    background: 'transparent',
  },
  secondary: {
    borderColor: 'var(--border)',
    background: 'var(--bg)',
  },
  primary: {
    borderColor: 'var(--navy)',
    background: 'var(--navy)',
  },
  danger: {
    borderColor: 'var(--red)',
    background: 'transparent',
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
        padding: '10px 16px',
        color: 'var(--fg)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        width: fullWidth ? '100%' : 'auto',
        fontSize: '0.875rem',
        fontWeight: 500,
        transition: 'opacity 0.15s',
        ...variantStyles[variant],
        ...style,
      }}
    />
  )
}
