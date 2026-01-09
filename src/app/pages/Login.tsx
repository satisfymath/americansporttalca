// Login page
import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import { login, isAdmin, isUser } from '../state/auth'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const result = login(username, password)

    if (!result.success) {
      setError(result.error)
      return
    }

    // Redirect based on role
    if (from) {
      navigate(from, { replace: true })
    } else if (isAdmin()) {
      navigate('/admin', { replace: true })
    } else if (isUser()) {
      navigate('/me', { replace: true })
    } else {
      navigate('/', { replace: true })
    }
  }

  return (
    <div
      style={{
        maxWidth: 400,
        margin: '0 auto',
      }}
    >
      <h1 style={{ marginBottom: 'var(--space-lg)' }}>Iniciar Sesion</h1>

      <Card>
        <form onSubmit={handleSubmit}>
          <Input
            label="Usuario"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoFocus
          />

          <Input
            label="Contrasena"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            error={error}
          />

          <Button type="submit" variant="primary" fullWidth>
            Entrar
          </Button>
        </form>

        <div
          style={{
            marginTop: 'var(--space-lg)',
            paddingTop: 'var(--space)',
            borderTop: '1px solid var(--border)',
            fontSize: '0.75rem',
            color: 'var(--muted)',
          }}
        >
          <p>Solo cuentas autorizadas. Este es un demo.</p>
        </div>
      </Card>
    </div>
  )
}
