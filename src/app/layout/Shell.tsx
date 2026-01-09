// Shell layout - Premium brutalista with background rails
import type { ReactNode } from 'react'
import TopBar from './TopBar'
import BackgroundRails from './BackgroundRails'
import Chevrons from './Chevrons'

type ShellProps = {
  children: ReactNode
}

export default function Shell({ children }: ShellProps) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Background decorative elements */}
      <BackgroundRails />

      {/* Header */}
      <TopBar />

      {/* Main content - centered with padding */}
      <main
        style={{
          flex: 1,
          position: 'relative',
          zIndex: 'var(--z-content)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: 'var(--space-lg) clamp(16px, 5vw, 40px)',
          paddingLeft: 'calc(clamp(40px, 4vw, 64px) + clamp(16px, 3vw, 40px))', // Account for cinta
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '900px',
          }}
        >
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          position: 'relative',
          zIndex: 'var(--z-content)',
          borderTop: '1px solid var(--border)',
          padding: 'var(--space)',
          textAlign: 'center',
          fontSize: 'var(--text-xs)',
          color: 'var(--muted)',
          background: 'rgba(0, 0, 37, 0.5)',
          backdropFilter: 'blur(8px)',
        }}
      >
        American Sport Talca — Demo 2026
      </footer>

      {/* Animated chevrons */}
      <Chevrons />
    </div>
  )
}
