// QRBlock component - displays QR code for gym entrance
import { QRCodeSVG } from 'qrcode.react'

type QRBlockProps = {
  size?: number
}

export default function QRBlock({ size = 200 }: QRBlockProps) {
  // Build the gate URL dynamically
  const gateUrl =
    window.location.origin +
    (import.meta.env.BASE_URL || '/') +
    '#/gate'

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
        }}
      >
        <QRCodeSVG value={gateUrl} size={size} level="M" />
      </div>
      <div
        style={{
          fontSize: '0.75rem',
          color: 'var(--muted)',
          textAlign: 'center',
          wordBreak: 'break-all',
          maxWidth: size + 40,
        }}
      >
        {gateUrl}
      </div>
    </div>
  )
}
