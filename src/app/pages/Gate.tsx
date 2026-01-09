// Gate page - flujo QR para marcar entrada/salida con validaciones
import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { nanoid } from 'nanoid'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import { login, logout, isAuthenticated, getLoggedMemberId, getSession } from '../state/auth'
import { loadDb, updateDb } from '../state/storage'
import { 
  isWithinOperatingHours, 
  canMemberCheckIn, 
  canMemberCheckOut,
  getSessionInfo 
} from '../utils/qr'
import type { AttendanceType, AttendanceEvent } from '../data/schema'

type Step = 'login' | 'confirm' | 'done' | 'error'

export default function Gate() {
  const [searchParams] = useSearchParams()
  const qrToken = searchParams.get('token')
  
  const [step, setStep] = useState<Step>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [suggestion, setSuggestion] = useState<AttendanceType>('IN')
  const [selected, setSelected] = useState<AttendanceType>('IN')
  const [registeredEvent, setRegisteredEvent] = useState<AttendanceEvent | null>(null)
  const [operatingStatus, setOperatingStatus] = useState(isWithinOperatingHours())

  // Verificar horario de operacion al cargar
  useEffect(() => {
    const status = isWithinOperatingHours()
    setOperatingStatus(status)
    
    if (!status.isOpen) {
      setError(status.message)
      setStep('error')
      return
    }
    
    // Check if already logged in
    if (isAuthenticated() && getLoggedMemberId()) {
      determineSuggestion()
      setStep('confirm')
    }
  }, [])

  const determineSuggestion = () => {
    const memberId = getLoggedMemberId()
    if (!memberId) return

    const db = loadDb()
    const sessionInfo = getSessionInfo(memberId, db.attendance)

    if (sessionInfo.hasOpenSession) {
      setSuggestion('OUT')
      setSelected('OUT')
    } else {
      setSuggestion('IN')
      setSelected('IN')
    }
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Primero verificar horario
    const status = isWithinOperatingHours()
    if (!status.isOpen) {
      setError(status.message)
      return
    }

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

    setError('')
    const db = loadDb()

    // Validaciones segun tipo de operacion
    if (selected === 'IN') {
      const checkResult = canMemberCheckIn(memberId, db.attendance, qrToken || undefined)
      if (!checkResult.allowed) {
        setError(checkResult.error || 'No se puede registrar entrada')
        return
      }
    } else {
      const checkResult = canMemberCheckOut(memberId, db.attendance)
      if (!checkResult.allowed) {
        setError(checkResult.error || 'No se puede registrar salida')
        return
      }
    }

    const event: AttendanceEvent = {
      id: nanoid(),
      memberId,
      type: selected,
      ts: new Date().toISOString(),
      source: 'QR',
      qrToken: qrToken || undefined,
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

          {/* Mensaje de error si hay */}
          {error && (
            <div style={{ 
              marginBottom: 'var(--space)', 
              padding: 'var(--space-sm)', 
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--red)',
              borderRadius: '4px',
              color: 'var(--red)',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

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

  // Step: Error (fuera de horario o QR invalido)
  if (step === 'error') {
    return (
      <div style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center' }}>
        <img
          src="./brand/americansporttalca_logo.png"
          alt="American Sport"
          style={{ height: 60, marginBottom: 'var(--space-lg)' }}
        />

        <Card>
          <div style={{ 
            fontSize: '3rem', 
            marginBottom: 'var(--space)' 
          }}>
            🚫
          </div>
          <h2
            style={{
              marginBottom: 'var(--space)',
              color: 'var(--red)',
            }}
          >
            Acceso No Disponible
          </h2>

          <p style={{ color: 'var(--muted)', marginBottom: 'var(--space-lg)' }}>
            {error || operatingStatus.message}
          </p>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-sm)',
            }}
          >
            <Link to="/">
              <Button variant="primary" fullWidth>
                Volver al Inicio
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return null
}
