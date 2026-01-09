// FilePreview component - for attachment previews
import type { Attachment } from '../data/schema'

type FilePreviewProps = {
  attachment: Attachment
}

export default function FilePreview({ attachment }: FilePreviewProps) {
  const { name, mime, base64 } = attachment

  if (mime.startsWith('image/')) {
    return (
      <div>
        <img
          src={base64}
          alt={name}
          style={{
            maxWidth: '100%',
            maxHeight: '300px',
            border: '1px solid var(--border)',
          }}
        />
        <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 4 }}>
          {name}
        </p>
      </div>
    )
  }

  if (mime === 'application/pdf') {
    return (
      <div>
        <a
          href={base64}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            padding: '8px 12px',
            border: '1px solid var(--border)',
            color: 'var(--fg)',
          }}
        >
          Abrir PDF: {name}
        </a>
      </div>
    )
  }

  return (
    <div style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
      Archivo: {name} ({mime})
    </div>
  )
}
