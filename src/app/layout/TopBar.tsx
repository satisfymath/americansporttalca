// TopBar component - navigation header
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
        borderBottom: '1px solid var(--border)',
        padding: 'var(--space)',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space)',
          flexWrap: 'wrap',
        }}
      >
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
          }}
        >
          <img
            src="./brand/americansporttalca_logo.png"
            alt="American Sport"
            style={{ height: 36 }}
          />
        </Link>

        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space)',
            fontSize: '0.875rem',
          }}
        >
          <Link to="/">Inicio</Link>
          <Link to="/gate">Ingreso QR</Link>

          {!authenticated && <Link to="/login">Login</Link>}

          {user && <Link to="/me">Mi Cuenta</Link>}

          {admin && (
            <>
              <Link to="/admin">Admin</Link>
              <Link to="/cash">Caja</Link>
            </>
          )}

          {authenticated && (
            <>
              <span style={{ color: 'var(--muted)' }}>
                [{session.username}]
              </span>
              <button
                onClick={handleLogout}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
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
