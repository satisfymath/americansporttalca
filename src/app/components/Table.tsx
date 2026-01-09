// Table component
import type { ReactNode } from 'react'

type Column<T> = {
  key: keyof T | string
  header: string
  render?: (row: T) => ReactNode
  align?: 'left' | 'center' | 'right'
}

type TableProps<T> = {
  columns: Column<T>[]
  data: T[]
  keyField: keyof T
}

export default function Table<T>({ columns, data, keyField }: TableProps<T>) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.875rem',
        }}
      >
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                style={{
                  padding: 'var(--space-sm) var(--space)',
                  textAlign: col.align || 'left',
                  borderBottom: '1px solid var(--border)',
                  fontWeight: 600,
                  color: 'var(--muted)',
                  whiteSpace: 'nowrap',
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={String(row[keyField])}>
              {columns.map((col) => (
                <td
                  key={String(col.key)}
                  style={{
                    padding: 'var(--space-sm) var(--space)',
                    textAlign: col.align || 'left',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  {col.render
                    ? col.render(row)
                    : String(row[col.key as keyof T] ?? '')}
                </td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  padding: 'var(--space-lg)',
                  textAlign: 'center',
                  color: 'var(--muted)',
                }}
              >
                Sin datos
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
