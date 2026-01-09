// MemberProfile360 - Vista 360 completa del miembro
// Estadisticas, historial de pagos, asistencias y perfil
import { useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Table from '../components/Table'
import StatTile from '../components/StatTile'
import Modal from '../components/Modal'
import Input from '../components/Input'
import MemberAvatar from '../components/MemberAvatar'
import { loadDb, updateDb } from '../state/storage'
import { formatCLP } from '../utils/money'
import { formatDateTime } from '../utils/dates'
import { calculateMember360 } from '../utils/stats'
import type { Payment, AttendanceEvent } from '../data/schema'

export default function MemberProfile360() {
  const { id } = useParams<{ id: string }>()
  const [db, setDb] = useState(loadDb)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({
    rut: '',
    birthDate: '',
    emergencyContact: '',
    notes: '',
  })

  const member = useMemo(() => {
    return db.members.find((m) => m.id === id)
  }, [db.members, id])

  const stats = useMemo(() => {
    if (!member) return null
    return calculateMember360(member, db.payments, db.attendance)
  }, [member, db.payments, db.attendance])

  const payments = useMemo(() => {
    return db.payments
      .filter((p) => p.memberId === id)
      .sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime())
  }, [db.payments, id])

  const attendance = useMemo(() => {
    return db.attendance
      .filter((a) => a.memberId === id)
      .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
  }, [db.attendance, id])

  if (!member || !stats) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
        <h2>Miembro no encontrado</h2>
        <Link to="/admin">
          <Button variant="primary" style={{ marginTop: 'var(--space)' }}>
            Volver al Panel
          </Button>
        </Link>
      </div>
    )
  }

  const handleOpenEdit = () => {
    setEditForm({
      rut: member.profile?.rut || '',
      birthDate: member.profile?.birthDate || '',
      emergencyContact: member.profile?.emergencyContact || '',
      notes: member.profile?.notes || '',
    })
    setShowEditModal(true)
  }

  const handleSaveProfile = () => {
    const newDb = updateDb((d) => {
      const idx = d.members.findIndex((m) => m.id === member.id)
      if (idx >= 0) {
        d.members[idx] = {
          ...d.members[idx],
          profile: {
            ...d.members[idx].profile,
            joinDate: d.members[idx].profile?.joinDate || new Date().toISOString(),
            rut: editForm.rut || undefined,
            birthDate: editForm.birthDate || undefined,
            emergencyContact: editForm.emergencyContact || undefined,
            notes: editForm.notes || undefined,
          },
        }
      }
      return d
    })
    setDb(newDb)
    setShowEditModal(false)
  }

  // Columnas para tablas
  const paymentColumns = [
    { key: 'period', header: 'Periodo', render: (p: Payment) => p.period },
    {
      key: 'paidAt',
      header: 'Fecha Pago',
      render: (p: Payment) => formatDateTime(p.paidAt),
    },
    {
      key: 'amount',
      header: 'Monto',
      render: (p: Payment) => formatCLP(p.amount),
      align: 'right' as const,
    },
    {
      key: 'method',
      header: 'Metodo',
      render: (p: Payment) =>
        p.method === 'cash' ? 'Efectivo' : p.method === 'card' ? 'Tarjeta' : 'Transferencia',
    },
    {
      key: 'operationType',
      header: 'Tipo',
      render: (p: Payment) => (
        <Badge variant={p.operationType === 'inicio' ? 'success' : 'default'}>
          {p.operationType === 'inicio' ? 'Inicio' : 'Renov'}
        </Badge>
      ),
    },
  ]

  const attendanceColumns = [
    {
      key: 'ts',
      header: 'Fecha/Hora',
      render: (a: AttendanceEvent) => formatDateTime(a.ts),
    },
    {
      key: 'type',
      header: 'Tipo',
      render: (a: AttendanceEvent) => (
        <Badge variant={a.type === 'IN' ? 'success' : 'default'}>
          {a.type === 'IN' ? 'Entrada' : 'Salida'}
        </Badge>
      ),
    },
    {
      key: 'source',
      header: 'Origen',
      render: (a: AttendanceEvent) => a.source,
    },
  ]

  // Grafico simple de barras de visitas por mes
  const maxVisits = Math.max(...stats.visitsByMonth.map((v) => v.count), 1)

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 'var(--space-lg)',
          flexWrap: 'wrap',
          gap: 'var(--space)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space)' }}>
          <Link to="/admin">
            <Button>← Volver</Button>
          </Link>
          <h1>Vista 360</h1>
        </div>
        <Button onClick={handleOpenEdit}>Editar Perfil</Button>
      </div>

      {/* Member Card */}
      <Card style={{ marginBottom: 'var(--space-lg)' }}>
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-lg)',
            flexWrap: 'wrap',
            alignItems: 'flex-start',
          }}
        >
          <MemberAvatar member={member} size={100} />
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
              <h2>{member.name}</h2>
              <Badge variant={member.status === 'active' ? 'success' : 'warning'}>
                {member.status === 'active' ? 'Activo' : 'Pausado'}
              </Badge>
            </div>
            <p style={{ color: 'var(--muted)', marginBottom: 'var(--space-sm)' }}>
              Socio N° {member.memberNo} · {stats.planTypeLabel}
            </p>
            <p style={{ fontSize: '0.875rem', marginBottom: 'var(--space-sm)' }}>
              <strong>Miembro desde:</strong> {stats.memberSinceLabel}
            </p>
            {member.profile?.rut && (
              <p style={{ fontSize: '0.875rem' }}>
                <strong>RUT:</strong> {member.profile.rut}
              </p>
            )}
            {member.contact?.phone && (
              <p style={{ fontSize: '0.875rem' }}>
                <strong>Telefono:</strong> {member.contact.phone}
              </p>
            )}
            {member.contact?.email && (
              <p style={{ fontSize: '0.875rem' }}>
                <strong>Email:</strong> {member.contact.email}
              </p>
            )}
            {member.profile?.emergencyContact && (
              <p style={{ fontSize: '0.875rem' }}>
                <strong>Emergencia:</strong> {member.profile.emergencyContact}
              </p>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Cuota mensual</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{formatCLP(stats.monthlyFee)}</p>
            <Badge variant={
              stats.paymentStatus === 'al_dia' ? 'success' :
              stats.paymentStatus === 'por_vencer' ? 'warning' : 'danger'
            }>
              {stats.paymentStatusLabel}
            </Badge>
          </div>
        </div>
        {member.profile?.notes && (
          <div style={{ 
            marginTop: 'var(--space)', 
            padding: 'var(--space-sm)', 
            background: 'var(--bg-alt)',
            borderRadius: '4px',
            fontSize: '0.875rem'
          }}>
            <strong>Notas:</strong> {member.profile.notes}
          </div>
        )}
      </Card>

      {/* Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 'var(--space)',
          marginBottom: 'var(--space-lg)',
        }}
      >
        <StatTile 
          label="Meses Inscrito" 
          value={stats.monthsAsMember} 
        />
        <StatTile 
          label="Visitas Totales" 
          value={stats.totalVisits} 
        />
        <StatTile 
          label="Visitas Este Mes" 
          value={stats.visitsThisMonth}
          subtext={
            stats.visitsTrend === 'up' ? '↑ Subiendo' :
            stats.visitsTrend === 'down' ? '↓ Bajando' : '→ Estable'
          }
        />
        <StatTile 
          label="Promedio Mensual" 
          value={stats.avgVisitsPerMonth}
          subtext="visitas/mes"
        />
        <StatTile 
          label="Total Pagado" 
          value={formatCLP(stats.totalAmountPaid)} 
        />
        <StatTile 
          label="Pagos Realizados" 
          value={stats.totalPayments} 
        />
        <StatTile 
          label="Meses Consecutivos" 
          value={stats.consecutiveMonthsPaid} 
          subtext="al dia"
        />
        <StatTile 
          label="Proximo Vencimiento" 
          value={stats.nextDueDateLabel}
        />
      </div>

      {/* Grafico de visitas por mes */}
      <Card style={{ marginBottom: 'var(--space-lg)' }}>
        <h3 style={{ marginBottom: 'var(--space)' }}>Visitas Ultimos 6 Meses</h3>
        <div style={{ display: 'flex', gap: 'var(--space)', alignItems: 'flex-end', height: 150 }}>
          {stats.visitsByMonth.slice().reverse().map((v) => (
            <div
              key={v.month}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--space-xs)',
              }}
            >
              <div
                style={{
                  width: '100%',
                  maxWidth: 40,
                  height: `${(v.count / maxVisits) * 100}px`,
                  minHeight: v.count > 0 ? 10 : 2,
                  background: v.count > 0 ? 'var(--primary)' : 'var(--border)',
                  borderRadius: '4px 4px 0 0',
                }}
              />
              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{v.count}</span>
              <span style={{ fontSize: '0.625rem', color: 'var(--muted)', textTransform: 'capitalize' }}>
                {v.monthLabel.slice(0, 3)}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Historial de Pagos */}
      <Card style={{ marginBottom: 'var(--space-lg)' }}>
        <h3 style={{ marginBottom: 'var(--space)' }}>Historial de Pagos</h3>
        {payments.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>Sin pagos registrados</p>
        ) : (
          <Table columns={paymentColumns} data={payments.slice(0, 12)} keyField="id" />
        )}
      </Card>

      {/* Historial de Asistencias */}
      <Card>
        <h3 style={{ marginBottom: 'var(--space)' }}>Ultimas Asistencias</h3>
        {attendance.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>Sin asistencias registradas</p>
        ) : (
          <Table columns={attendanceColumns} data={attendance.slice(0, 20)} keyField="id" />
        )}
      </Card>

      {/* Modal Editar Perfil */}
      <Modal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar Perfil"
      >
        <div>
          <Input
            label="RUT"
            type="text"
            value={editForm.rut}
            onChange={(e) => setEditForm({ ...editForm, rut: e.target.value })}
            placeholder="12.345.678-9"
          />
          <Input
            label="Fecha de Nacimiento"
            type="date"
            value={editForm.birthDate}
            onChange={(e) => setEditForm({ ...editForm, birthDate: e.target.value })}
          />
          <Input
            label="Contacto de Emergencia"
            type="text"
            value={editForm.emergencyContact}
            onChange={(e) => setEditForm({ ...editForm, emergencyContact: e.target.value })}
            placeholder="+56912345678 (Nombre)"
          />
          <div style={{ marginBottom: 'var(--space)' }}>
            <label
              style={{
                display: 'block',
                marginBottom: 'var(--space-sm)',
                fontSize: '0.875rem',
                color: 'var(--muted)',
              }}
            >
              Notas
            </label>
            <textarea
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--fg)',
                resize: 'vertical',
              }}
            />
          </div>
          <Button variant="primary" fullWidth onClick={handleSaveProfile}>
            Guardar Cambios
          </Button>
        </div>
      </Modal>
    </div>
  )
}
