// Login page - Premium glass style
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
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
      }}
    >
      <Card
        variant="glass"
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: 'var(--space-xl)',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
          <h1
            style={{
              fontSize: 'var(--text-3xl)',
              marginBottom: 'var(--space-sm)',
              background: 'linear-gradient(135deg, var(--white) 0%, var(--white-70) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Bienvenido
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 'var(--text-sm)' }}>
            Ingresa a tu cuenta
          </p>
        </div>

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
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            error={error}
          />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            style={{
              marginTop: 'var(--space)',
              padding: '14px 20px',
              fontSize: 'var(--text-base)',
            }}
          >
            Entrar
          </Button>
        </form>

        <div
          style={{
            marginTop: 'var(--space-xl)',
            paddingTop: 'var(--space)',
            borderTop: '1px solid var(--line)',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--white-50)' }}>
            Demo: <strong>admin</strong> / admin123 · <strong>demo</strong> / demo123
          </p>
        </div>
      </Card>
    </div>
  )
}
