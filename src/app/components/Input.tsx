// Input component - Premium style
import type { InputHTMLAttributes } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
}

export default function Input({ label, error, style, ...props }: InputProps) {
  return (
    <div style={{ marginBottom: 'var(--space)' }}>
      {label && (
        <label
          style={{
            display: 'block',
            marginBottom: 'var(--space-sm)',
            fontSize: 'var(--text-sm)',
            color: 'var(--white-70)',
            letterSpacing: '0.02em',
          }}
        >
          {label}
        </label>
      )}
      <input
        {...props}
        style={{
          width: '100%',
          padding: '12px 16px',
          border: '2px solid',
          borderColor: error ? 'var(--red-600)' : 'rgba(255, 255, 255, 0.2)',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(0, 0, 50, 0.8)',
          color: 'var(--white)',
          fontSize: 'var(--text-base)',
          outline: 'none',
          transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
          ...style,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--magenta-600)'
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(190, 24, 93, 0.25)'
          props.onFocus?.(e)
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? 'var(--red-600)' : 'rgba(255, 255, 255, 0.2)'
          e.currentTarget.style.boxShadow = 'none'
          props.onBlur?.(e)
        }}
      />
      {error && (
        <p
          style={{
            marginTop: 'var(--space-sm)',
            fontSize: 'var(--text-xs)',
            color: 'var(--red-600)',
          }}
        >
          {error}
        </p>
      )}
    </div>
  )
}
