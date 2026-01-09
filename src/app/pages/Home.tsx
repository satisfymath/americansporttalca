// Home page
import { Link } from 'react-router-dom'
import Card from '../components/Card'
import Button from '../components/Button'
import QRBlock from '../components/QRBlock'

export default function Home() {
  return (
    <div>
      <h1 style={{ marginBottom: 'var(--space-lg)' }}>American Sport Talca</h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'var(--space-lg)',
        }}
      >
        <Card>
          <h2 style={{ marginBottom: 'var(--space)' }}>QR del Gimnasio</h2>
          <p
            style={{
              color: 'var(--muted)',
              fontSize: '0.875rem',
              marginBottom: 'var(--space)',
            }}
          >
            Escanea este codigo para marcar tu entrada o salida
          </p>
          <QRBlock size={180} />
        </Card>

        <Card>
          <h2 style={{ marginBottom: 'var(--space)' }}>Acceso Rapido</h2>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-sm)',
            }}
          >
            <Link to="/gate">
              <Button fullWidth variant="primary">
                Marcar Asistencia
              </Button>
            </Link>
            <Link to="/login">
              <Button fullWidth>Iniciar Sesion</Button>
            </Link>
          </div>

          <div
            style={{
              marginTop: 'var(--space-lg)',
              paddingTop: 'var(--space)',
              borderTop: '1px solid var(--border)',
              fontSize: '0.75rem',
              color: 'var(--muted)',
            }}
          >
            <p style={{ marginBottom: 'var(--space-sm)' }}>
              <strong>Demo - Credenciales:</strong>
            </p>
            <p>Usuario: demo / semo</p>
            <p>Admin: admin / admin</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
