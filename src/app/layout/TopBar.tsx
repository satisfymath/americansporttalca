// TopBar component - Premium navigation header
import { Link, useNavigate } from 'react-router-dom'
import { getSession, logout, isAuthenticated, isAdmin, isUser } from '../state/auth'

export default function TopBar() {
  const navigate = useNavigate()
  const session = getSession()
  const authenticated = isAuthenticated()
  const admin = isAdmin()
  const user = isUser()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 'var(--z-header)',
        height: 'var(--header-height)',
        background: 'rgba(0, 0, 37, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div
        style={{
          height: '100%',
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space)',
          padding: '0 var(--space-lg)',
          paddingLeft: 'calc(clamp(40px, 4vw, 64px) + var(--space-lg))', // Account for cinta
        }}
      >
        {/* Logo */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
            textDecoration: 'none',
          }}
        >
          <img
            src="./brand/americansporttalca_logo.png"
            alt="American Sport"
            style={{ 
              height: 'clamp(28px, 4vw, 36px)',
              filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.15))',
            }}
          />
        </Link>

        {/* Navigation */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-lg)',
            fontSize: 'var(--text-sm)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          <NavLink to="/">Inicio</NavLink>
          <NavLink to="/gate">Ingreso</NavLink>

          {!authenticated && <NavLink to="/login">Entrar</NavLink>}

          {user && <NavLink to="/me">Mi Cuenta</NavLink>}

          {admin && (
            <>
              <NavLink to="/admin">Admin</NavLink>
              <NavLink to="/cash">Caja</NavLink>
            </>
          )}

          {authenticated && (
            <>
              {/* Role chip */}
              <span
                style={{
                  padding: '4px 12px',
                  background: admin ? 'var(--red-600)' : 'var(--royal-700)',
                  color: 'var(--white)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-full)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                {session.username}
              </span>
              <button
                onClick={handleLogout}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  fontSize: 'var(--text-xs)',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-sm)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  transition: 'all var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--red-600)'
                  e.currentTarget.style.color = 'var(--red-600)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.color = 'var(--muted)'
                }}
              >
                Salir
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}

// Navigation link with hover effect
function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      style={{
        color: 'var(--white-70)',
        textDecoration: 'none',
        padding: '8px 4px',
        position: 'relative',
        transition: 'color var(--transition-fast)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = 'var(--white)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = 'var(--white-70)'
      }}
    >
      {children}
    </Link>
  )
}
