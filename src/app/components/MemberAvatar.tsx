// MemberAvatar - Muestra foto del miembro o iniciales si no tiene foto
import type { Member } from '../data/schema'

type MemberAvatarProps = {
  member: Member
  size?: number
  showName?: boolean
}

// Colores de fondo para avatares sin foto (basado en hash del nombre)
const AVATAR_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
]

function getColorForName(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function MemberAvatar({ 
  member, 
  size = 50, 
  showName = false 
}: MemberAvatarProps) {
  const initials = getInitials(member.name)
  const bgColor = getColorForName(member.name)
  
  const avatarStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
    flexShrink: 0,
  }
  
  const content = member.profile?.photo ? (
    <img
      src={member.profile.photo}
      alt={member.name}
      style={{
        ...avatarStyle,
        objectFit: 'cover',
      }}
    />
  ) : (
    <div
      style={{
        ...avatarStyle,
        background: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 700,
        fontSize: size * 0.4,
        userSelect: 'none',
      }}
    >
      {initials}
    </div>
  )
  
  if (showName) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
        {content}
        <div>
          <div style={{ fontWeight: 600 }}>{member.name}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
            N° {member.memberNo}
          </div>
        </div>
      </div>
    )
  }
  
  return content
}

// Variante para mostrar solo el avatar pequeño con tooltip
export function MemberAvatarSmall({ member }: { member: Member }) {
  return (
    <div title={member.name}>
      <MemberAvatar member={member} size={32} />
    </div>
  )
}
