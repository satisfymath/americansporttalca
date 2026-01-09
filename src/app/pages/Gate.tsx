// Gate page - flujo QR para marcar entrada/salida
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { nanoid } from 'nanoid'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import { login, logout, isAuthenticated, getLoggedMemberId, getSession } from '../state/auth'
import { loadDb, updateDb } from '../state/storage'
import type { AttendanceType, AttendanceEvent } from '../data/schema'

type Step = 'login' | 'confirm' | 'done'

export default function Gate() {
  const [step, setStep] = useState<Step>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [suggestion, setSuggestion] = useState<AttendanceType>('IN')
  const [selected, setSelected] = useState<AttendanceType>('IN')
  const [registeredEvent, setRegisteredEvent] = useState<AttendanceEvent | null>(null)

  // Check if already logged in
  useEffect(() => {
    if (isAuthenticated() && getLoggedMemberId()) {
      determineSuggestion()
      setStep('confirm')
    }
  }, [])

  const determineSuggestion = () => {
    const memberId = getLoggedMemberId()
    if (!memberId) return

    const db = loadDb()
    const memberEvents = db.attendance
      .filter((e) => e.memberId === memberId)
      .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())

    const lastEvent = memberEvents[0]

    if (!lastEvent || lastEvent.type === 'OUT') {
      setSuggestion('IN')
      setSelected('IN')
    } else {
      setSuggestion('OUT')
      setSelected('OUT')
    }
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const result = login(username, password)

    if (!result.success) {
      setError(result.error)
      return
    }

    // Solo usuarios con memberId pueden usar Gate
    if (!result.memberId) {
      setError('Solo socios pueden marcar asistencia')
      logout()
      return
    }

    determineSuggestion()
    setStep('confirm')
  }

  const handleConfirm = () => {
    const memberId = getLoggedMemberId()
    if (!memberId) return

    const event: AttendanceEvent = {
      id: nanoid(),
      memberId,
      type: selected,
      ts: new Date().toISOString(),
      source: 'QR',
    }

    updateDb((db) => {
      db.attendance.push(event)
      return db
    })

    setRegisteredEvent(event)
    setStep('done')
  }

  const handleNewSession = () => {
    logout()
    setUsername('')
    setPassword('')
    setError('')
    setStep('login')
  }

  // Step: Login
  if (step === 'login') {
    return (
      <div style={{ maxWidth: 400, margin: '0 auto', textAlign: 'center' }}>
        <img
          src="./brand/americansporttalca_logo.png"
          alt="American Sport"
          style={{ height: 60, marginBottom: 'var(--space-lg)' }}
        />
        <h1 style={{ marginBottom: 'var(--space-lg)' }}>Ingreso</h1>

        <Card>
          <form onSubmit={handleLogin}>
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
              Continuar
            </Button>
          </form>
        </Card>
      </div>
    )
  }

  // Step: Confirm
  if (step === 'confirm') {
    const session = getSession()
    return (
      <div style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center' }}>
        <img
          src="./brand/americansporttalca_logo.png"
          alt="American Sport"
          style={{ height: 60, marginBottom: 'var(--space-lg)' }}
        />

        <Card>
          <p style={{ color: 'var(--muted)', marginBottom: 'var(--space-sm)' }}>
            Bienvenido/a
          </p>
          <h2 style={{ marginBottom: 'var(--space-lg)' }}>{session.username}</h2>

          <p style={{ marginBottom: 'var(--space)', color: 'var(--muted)' }}>
            {suggestion === 'IN'
              ? 'Sugerencia: Marcar ENTRADA'
              : 'Sugerencia: Marcar SALIDA'}
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'var(--space)',
              marginBottom: 'var(--space-lg)',
            }}
          >
            <Button
              variant={selected === 'IN' ? 'primary' : 'default'}
              onClick={() => setSelected('IN')}
              style={{
                padding: 'var(--space-lg)',
                fontSize: '1.25rem',
                fontWeight: 700,
              }}
            >
              ENTRADA
            </Button>
            <Button
              variant={selected === 'OUT' ? 'primary' : 'default'}
              onClick={() => setSelected('OUT')}
              style={{
                padding: 'var(--space-lg)',
                fontSize: '1.25rem',
                fontWeight: 700,
              }}
            >
              SALIDA
            </Button>
          </div>

          <Button variant="primary" fullWidth onClick={handleConfirm}>
            Confirmar {selected === 'IN' ? 'Entrada' : 'Salida'}
          </Button>

          <div style={{ marginTop: 'var(--space)' }}>
            <button
              onClick={handleNewSession}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--muted)',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              Cambiar usuario
            </button>
          </div>
        </Card>
      </div>
    )
  }

  // Step: Done
  if (step === 'done' && registeredEvent) {
    const date = new Date(registeredEvent.ts)
    return (
      <div style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center' }}>
        <img
          src="./brand/americansporttalca_logo.png"
          alt="American Sport"
          style={{ height: 60, marginBottom: 'var(--space-lg)' }}
        />

        <Card>
          <h2
            style={{
              marginBottom: 'var(--space)',
              color: registeredEvent.type === 'IN' ? '#00cc00' : 'var(--red)',
            }}
          >
            {registeredEvent.type === 'IN' ? 'ENTRADA' : 'SALIDA'} REGISTRADA
          </h2>

          <p style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 'var(--space-sm)' }}>
            {format(date, 'HH:mm')}
          </p>
          <p style={{ color: 'var(--muted)', marginBottom: 'var(--space-lg)' }}>
            {format(date, "EEEE, d 'de' MMMM yyyy", { locale: es })}
          </p>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-sm)',
            }}
          >
            <Link to="/me">
              <Button variant="primary" fullWidth>
                Ir a Mi Cuenta
              </Button>
            </Link>
            <Button fullWidth onClick={handleNewSession}>
              Nueva Sesion
            </Button>
            <Link to="/">
              <Button fullWidth>Volver al Inicio</Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return null
}
