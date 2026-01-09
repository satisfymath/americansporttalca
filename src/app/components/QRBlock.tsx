// QRBlock component - displays dynamic QR code for gym entrance
// QR changes every hour and only works during operating hours
import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { 
  getCurrentQRToken, 
  isWithinOperatingHours, 
  getTimeUntilQRChange 
} from '../utils/qr'
import Card from './Card'

type QRBlockProps = {
  size?: number
  showDebugInfo?: boolean
}

export default function QRBlock({ size = 200, showDebugInfo = false }: QRBlockProps) {
  const [currentToken, setCurrentToken] = useState(getCurrentQRToken())
  const [operatingStatus, setOperatingStatus] = useState(isWithinOperatingHours())
  const [timeUntilChange, setTimeUntilChange] = useState(getTimeUntilQRChange())
  const [currentTime, setCurrentTime] = useState(new Date())
  
  // Actualizar cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentToken(getCurrentQRToken())
      setOperatingStatus(isWithinOperatingHours())
      setTimeUntilChange(getTimeUntilQRChange())
      setCurrentTime(new Date())
    }, 30000) // cada 30 segundos
    
    return () => clearInterval(interval)
  }, [])
  
  // Mostrar mensaje si estamos fuera del horario
  if (!operatingStatus.isOpen) {
    return (
      <Card style={{ textAlign: 'center', maxWidth: size + 40 }}>
        <div style={{ 
          fontSize: '3rem', 
          marginBottom: 'var(--space)' 
        }}>
          🚫
        </div>
        <h3 style={{ 
          color: 'var(--red)', 
          marginBottom: 'var(--space-sm)' 
        }}>
          Gimnasio Cerrado
        </h3>
        <p style={{ 
          color: 'var(--muted)', 
          fontSize: '0.875rem',
          marginBottom: 'var(--space-sm)'
        }}>
          {operatingStatus.message}
        </p>
        {operatingStatus.nextOpenTime && (
          <p style={{ 
            fontSize: '0.75rem',
            color: 'var(--muted)'
          }}>
            Proxima apertura: {operatingStatus.nextOpenTime}
          </p>
        )}
      </Card>
    )
  }
  
  // Si no hay token disponible
  if (!currentToken) {
    return (
      <Card style={{ textAlign: 'center', maxWidth: size + 40 }}>
        <p style={{ color: 'var(--muted)' }}>
          QR no disponible en este horario
        </p>
      </Card>
    )
  }
  
  // Build the gate URL with token
  const gateUrl =
    window.location.origin +
    (import.meta.env.BASE_URL || '/') +
    `#/gate?token=${currentToken}`

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--space)',
      }}
    >
      <div
        style={{
          padding: 'var(--space)',
          background: '#fff',
          display: 'inline-block',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <QRCodeSVG value={gateUrl} size={size} level="M" />
      </div>
      
      {/* Token info */}
      <div
        style={{
          fontSize: '0.875rem',
          color: 'var(--muted)',
          textAlign: 'center',
        }}
      >
        <p style={{ marginBottom: 'var(--space-xs)' }}>
          🕐 Valido hasta las {currentTime.getHours() + 1}:00
        </p>
        <p style={{ fontSize: '0.75rem' }}>
          Cambia en {timeUntilChange}
        </p>
      </div>
      
      {/* Debug info (solo en desarrollo) */}
      {showDebugInfo && (
        <div
          style={{
            fontSize: '0.625rem',
            color: 'var(--muted)',
            textAlign: 'center',
            wordBreak: 'break-all',
            maxWidth: size + 40,
            padding: 'var(--space-sm)',
            background: 'var(--bg-alt)',
            borderRadius: '4px',
          }}
        >
          <div>Token: {currentToken}</div>
          <div style={{ marginTop: '4px' }}>{gateUrl}</div>
        </div>
      )}
    </div>
  )
}
