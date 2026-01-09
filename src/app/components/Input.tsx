// Input component
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
            fontSize: '0.875rem',
            color: 'var(--muted)',
          }}
        >
          {label}
        </label>
      )}
      <input
        {...props}
        style={{
          width: '100%',
          padding: '10px 12px',
          border: '1px solid',
          borderColor: error ? 'var(--red)' : 'var(--border)',
          background: 'var(--bg)',
          color: 'var(--fg)',
          fontSize: '1rem',
          outline: 'none',
          ...style,
        }}
      />
      {error && (
        <p
          style={{
            marginTop: 'var(--space-sm)',
            fontSize: '0.75rem',
            color: 'var(--red)',
          }}
        >
          {error}
        </p>
      )}
    </div>
  )
}
