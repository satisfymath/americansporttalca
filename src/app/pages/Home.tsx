// Home page - Premium hero layout
import { Link } from 'react-router-dom'
import Card from '../components/Card'
import Button from '../components/Button'

export default function Home() {
  return (
    <div className="page-enter">
      {/* Hero Header */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
        <h1
          style={{
            fontSize: 'clamp(2.5rem, 6vw, 4rem)',
            marginBottom: 'var(--space)',
            background: 'linear-gradient(135deg, var(--white) 0%, var(--white-70) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          American Sport Talca
        </h1>
        <p
          style={{
            color: 'var(--white-70)',
            fontSize: 'var(--text-lg)',
            maxWidth: '500px',
            margin: '0 auto',
          }}
        >
          Tu gimnasio de confianza. Entrena, mejora, transforma.
        </p>
      </div>

      {/* Main Actions */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'var(--space-lg)',
          marginBottom: 'var(--space-xl)',
        }}
      >
        {/* Primary CTA */}
        <Card variant="glass">
          <div style={{ textAlign: 'center', padding: 'var(--space-lg) 0' }}>
            <div
              style={{
                width: '80px',
                height: '80px',
                margin: '0 auto var(--space-lg)',
                background: 'var(--royal-700)',
                borderRadius: 'var(--radius-xl)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.5rem',
              }}
            >
              📱
            </div>
            <h2 style={{ marginBottom: 'var(--space-sm)' }}>Marcar Asistencia</h2>
            <p
              style={{
                color: 'var(--muted)',
                fontSize: 'var(--text-sm)',
                marginBottom: 'var(--space-lg)',
              }}
            >
              Escanea el QR del gimnasio para registrar tu entrada o salida
            </p>
            <Link to="/gate">
              <Button variant="primary" fullWidth style={{ padding: '14px 20px' }}>
                Ir al Control de Acceso
              </Button>
            </Link>
          </div>
        </Card>

        {/* Secondary Actions */}
        <Card variant="glass">
          <div style={{ padding: 'var(--space-lg) 0' }}>
            <h2 style={{ marginBottom: 'var(--space-lg)', textAlign: 'center' }}>
              Acceso Rápido
            </h2>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space)',
              }}
            >
              <Link to="/login">
                <Button fullWidth style={{ padding: '14px 20px' }}>
                  🔐 Iniciar Sesión
                </Button>
              </Link>
              <Link to="/me">
                <Button fullWidth variant="secondary" style={{ padding: '14px 20px' }}>
                  👤 Mi Cuenta
                </Button>
              </Link>
            </div>

            <div
              style={{
                marginTop: 'var(--space-xl)',
                paddingTop: 'var(--space-lg)',
                borderTop: '1px solid var(--line)',
                textAlign: 'center',
              }}
            >
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--white-50)', marginBottom: 'var(--space-sm)' }}>
                Demo — Credenciales de prueba:
              </p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--white-70)' }}>
                Usuario: <strong>demo</strong> / demo123
              </p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--white-70)' }}>
                Admin: <strong>admin</strong> / admin123
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Features */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space)',
        }}
      >
        {[
          { icon: '💪', title: 'Equipamiento', desc: 'Máquinas de última generación' },
          { icon: '🕐', title: 'Horario Amplio', desc: '8:30 AM - 11:00 PM' },
          { icon: '👥', title: 'Comunidad', desc: 'Ambiente motivador' },
        ].map((feature) => (
          <Card key={feature.title} variant="glass" style={{ padding: 'var(--space-lg)', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: 'var(--space-sm)' }}>{feature.icon}</div>
            <h3 style={{ fontSize: 'var(--text-base)', marginBottom: 'var(--space-xs)' }}>{feature.title}</h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>{feature.desc}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}
