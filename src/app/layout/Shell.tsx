// Shell layout - wraps pages with TopBar
import type { ReactNode } from 'react'
import TopBar from './TopBar'

type ShellProps = {
  children: ReactNode
}

export default function Shell({ children }: ShellProps) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TopBar />
      <main
        className="container"
        style={{
          flex: 1,
          padding: 'var(--space-lg) var(--space)',
        }}
      >
        {children}
      </main>
      <footer
        style={{
          borderTop: '1px solid var(--border)',
          padding: 'var(--space)',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: 'var(--muted)',
        }}
      >
        American Sport Talca - Demo
      </footer>
    </div>
  )
}
