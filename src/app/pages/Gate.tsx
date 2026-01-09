// Gate page - flujo QR para marcar entrada/salida con validaciones
// ENTRADA requiere escanear QR válido, SALIDA no requiere QR
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
  getSessionInfo,
  validateQRToken 
} from '../utils/qr'
import type { AttendanceType, AttendanceEvent } from '../data/schema'

type Step = 'login' | 'scan-required' | 'confirm' | 'done' | 'error'

export default function Gate() {
  const [searchParams] = useSearchParams()
  const qrToken = searchParams.get('token')
  
  const [step, setStep] = useState<Step>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<AttendanceType>('IN')
  const [registeredEvent, setRegisteredEvent] = useState<AttendanceEvent | null>(null)
  const [operatingStatus, setOperatingStatus] = useState(isWithinOperatingHours())
  const [manualCode, setManualCode] = useState('')
  const [codeError, setCodeError] = useState('')

  // Verificar horario de operacion al cargar
  useEffect(() => {
    const status = isWithinOperatingHours()
    setOperatingStatus(status)
    
    if (!status.isOpen) {
      setError(status.message)
      setStep('error')
      return
    }
    
    // Check if already logged in - usar lógica de QR
    if (isAuthenticated() && getLoggedMemberId()) {
      determineNextStep()
    }
  }, [qrToken]) // Re-evaluar cuando cambie el token

  // Determinar siguiente paso basado en si tiene QR válido y su estado de sesión
  const determineNextStep = () => {
    const memberId = getLoggedMemberId()
    if (!memberId) return
    
    const db = loadDb()
    const sessionInfo = getSessionInfo(memberId, db.attendance)
    
    // Si tiene sesión abierta, puede marcar SALIDA sin QR
    if (sessionInfo.hasOpenSession) {
      setSelected('OUT')
      setStep('confirm')
      return
    }
    
    // Para ENTRADA, necesita QR válido
    setSelected('IN')
    
    // Verificar si tiene token QR válido
    if (qrToken && validateQRToken(qrToken)) {
      setStep('confirm')
    } else {
      // No tiene QR válido - mostrar pantalla de escanear
      setStep('scan-required')
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

    determineNextStep()
  }

  // Validar código de acceso manual
  const handleManualCode = (e: React.FormEvent) => {
    e.preventDefault()
    setCodeError('')
    
    const code = manualCode.trim().toUpperCase()
    if (!code) {
      setCodeError('Ingresa el código de acceso')
      return
    }
    
    if (validateQRToken(code)) {
      // Código válido - proceder a confirmar
      setStep('confirm')
    } else {
      setCodeError('Código inválido o expirado. Pide el código actual en recepción.')
    }
  }

  const handleConfirm = () => {
    const memberId = getLoggedMemberId()
    if (!memberId) return

    setError('')
    const db = loadDb()

    // Validaciones segun tipo de operacion - usar código manual si no hay QR
    const tokenToUse = qrToken || manualCode.trim().toUpperCase() || undefined
    
    if (selected === 'IN') {
      const checkResult = canMemberCheckIn(memberId, db.attendance, tokenToUse)
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

  // Step: Scan Required - El cliente debe escanear el QR O ingresar código manual
  if (step === 'scan-required') {
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
            Hola, {session.username}
          </p>
          
          <h2 style={{ 
            marginBottom: 'var(--space)', 
            color: 'var(--magenta-600)' 
          }}>
            Registrar Entrada
          </h2>
          
          {/* Opción 1: Escanear QR */}
          <div style={{
            padding: 'var(--space)',
            background: 'rgba(0, 200, 83, 0.1)',
            borderRadius: '8px',
            marginBottom: 'var(--space)',
            border: '1px solid rgba(0, 200, 83, 0.3)'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: 'var(--space-sm)' }}>📱</div>
            <p style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 'var(--space-xs)' }}>
              Opción 1: Escanear QR
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              Escanea el código QR en recepción con la cámara de tu celular
            </p>
          </div>

          {/* Separador */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space)',
            margin: 'var(--space) 0',
            color: 'var(--muted)'
          }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            <span style={{ fontSize: '0.8rem' }}>o</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          </div>

          {/* Opción 2: Código manual */}
          <div style={{
            padding: 'var(--space)',
            background: 'var(--bg-alt)',
            borderRadius: '8px',
            marginBottom: 'var(--space-lg)'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: 'var(--space-sm)' }}>🔑</div>
            <p style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 'var(--space)' }}>
              Opción 2: Código de Acceso
            </p>
            
            <form onSubmit={handleManualCode}>
              <Input
                label="Código de acceso"
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                placeholder="Ej: ASG1015XXXXXXXX"
                error={codeError}
                style={{ 
                  textAlign: 'center', 
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '2px',
                  textTransform: 'uppercase'
                }}
              />
              <Button type="submit" variant="primary" fullWidth>
                Validar Código
              </Button>
            </form>
            
            <p style={{ 
              fontSize: '0.75rem', 
              color: 'var(--muted)',
              marginTop: 'var(--space-sm)'
            }}>
              Pide el código al personal de recepción
            </p>
          </div>

          <div style={{
            padding: 'var(--space-sm)',
            background: 'rgba(var(--magenta-600-rgb), 0.05)',
            borderRadius: '6px',
            marginBottom: 'var(--space)'
          }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
              ⏱️ El código cambia cada 2 minutos por seguridad
            </p>
          </div>

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

  // Step: Confirm - Solo se llega aquí si:
  // - ENTRADA: tiene QR válido escaneado
  // - SALIDA: tiene sesión abierta (no necesita QR)
  if (step === 'confirm') {
    const session = getSession()
    const isEntry = selected === 'IN'
    
    return (
      <div style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center' }}>
        <img
          src="./brand/americansporttalca_logo.png"
          alt="American Sport"
          style={{ height: 60, marginBottom: 'var(--space-lg)' }}
        />

        <Card>
          <p style={{ color: 'var(--muted)', marginBottom: 'var(--space-sm)' }}>
            {isEntry ? '¡Bienvenido/a!' : 'Hasta pronto'}
          </p>
          <h2 style={{ marginBottom: 'var(--space-lg)' }}>{session.username}</h2>

          {/* Indicador visual del tipo de registro */}
          <div style={{
            padding: 'var(--space-lg)',
            marginBottom: 'var(--space-lg)',
            background: isEntry 
              ? 'linear-gradient(135deg, rgba(0, 200, 83, 0.15), rgba(0, 200, 83, 0.05))'
              : 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05))',
            borderRadius: '12px',
            border: isEntry ? '2px solid rgba(0, 200, 83, 0.3)' : '2px solid rgba(239, 68, 68, 0.3)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-sm)' }}>
              {isEntry ? '🏋️' : '👋'}
            </div>
            <h3 style={{ 
              color: isEntry ? '#00c853' : 'var(--red)',
              fontSize: '1.5rem',
              fontWeight: 700
            }}>
              {isEntry ? 'ENTRADA' : 'SALIDA'}
            </h3>
            {isEntry && qrToken && (
              <p style={{ 
                fontSize: '0.75rem', 
                color: 'var(--muted)',
                marginTop: 'var(--space-sm)'
              }}>
                ✓ QR verificado
              </p>
            )}
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

          <Button 
            variant="primary" 
            fullWidth 
            onClick={handleConfirm}
            style={{
              padding: 'var(--space-lg)',
              fontSize: '1.25rem',
              fontWeight: 700
            }}
          >
            ✓ Confirmar {isEntry ? 'Entrada' : 'Salida'}
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
