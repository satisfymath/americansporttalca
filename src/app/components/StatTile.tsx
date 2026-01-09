// StatTile component - for dashboard metrics
type StatTileProps = {
  label: string
  value: string | number
  subtext?: string
}

export default function StatTile({ label, value, subtext }: StatTileProps) {
  return (
    <div
      style={{
        border: '1px solid var(--border)',
        padding: 'var(--space)',
        background: 'rgba(255, 255, 255, 0.02)',
      }}
    >
      <div
        style={{
          fontSize: '0.75rem',
          color: 'var(--muted)',
          marginBottom: 'var(--space-sm)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '1.75rem',
          fontWeight: 700,
        }}
      >
        {value}
      </div>
      {subtext && (
        <div
          style={{
            fontSize: '0.75rem',
            color: 'var(--muted)',
            marginTop: 'var(--space-sm)',
          }}
        >
          {subtext}
        </div>
      )}
    </div>
  )
}
