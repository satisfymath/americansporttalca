// User Dashboard - Mi Cuenta
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { differenceInDays, format } from 'date-fns'
import { es } from 'date-fns/locale'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Table from '../components/Table'
import StatTile from '../components/StatTile'
import { getLoggedMemberId } from '../state/auth'
import { loadDb } from '../state/storage'
import { formatCLP } from '../utils/money'
import { formatDateTime, getNextDueDate, isOverdue, isDueSoon, isCurrentMonth } from '../utils/dates'
import type { Payment, AttendanceEvent } from '../data/schema'

export default function UserDashboard() {
  const db = loadDb()
  const memberId = getLoggedMemberId()

  const member = useMemo(() => {
    return db.members.find((m) => m.id === memberId)
  }, [db.members, memberId])

  const payments = useMemo(() => {
    return db.payments
      .filter((p) => p.memberId === memberId)
      .sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime())
  }, [db.payments, memberId])

  const attendance = useMemo(() => {
    return db.attendance
      .filter((a) => a.memberId === memberId)
      .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
  }, [db.attendance, memberId])

  // Calculate stats
  const stats = useMemo(() => {
    if (!member) return null

    const lastPaidPeriod = payments.length > 0 ? payments[0].period : null
    const nextDueDate = getNextDueDate(member.plan.dueDay, lastPaidPeriod)
    const daysUntilDue = differenceInDays(nextDueDate, new Date())

    let paymentStatus: 'ok' | 'warning' | 'danger'
    let statusLabel: string

    if (isOverdue(nextDueDate)) {
      paymentStatus = 'danger'
      statusLabel = `Vencido hace ${Math.abs(daysUntilDue)} dias`
    } else if (isDueSoon(nextDueDate)) {
      paymentStatus = 'warning'
      statusLabel = `Vence en ${daysUntilDue} dias`
    } else {
      paymentStatus = 'ok'
      statusLabel = `${daysUntilDue} dias restantes`
    }

    // Visits this month
    const visitsThisMonth = attendance.filter(
      (a) => a.type === 'IN' && isCurrentMonth(a.ts)
    ).length

    // Last visit
    const lastVisit = attendance.find((a) => a.type === 'IN')

    // Open session (last event is IN without OUT after)
    const lastEvent = attendance[0]
    const hasOpenSession = lastEvent?.type === 'IN'

    return {
      nextDueDate,
      daysUntilDue,
      paymentStatus,
      statusLabel,
      visitsThisMonth,
      lastVisit,
      hasOpenSession,
      monthlyFee: member.plan.monthlyFee,
    }
  }, [member, payments, attendance])

  if (!member || !stats) {
    return <div>Error: Usuario no encontrado</div>
  }

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
    { key: 'receiptNo', header: 'Recibo' },
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

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-lg)',
          flexWrap: 'wrap',
          gap: 'var(--space)',
        }}
      >
        <h1>Mi Cuenta</h1>
        <div style={{ display: 'flex', gap: 'var(--space)' }}>
          <Link to="/pay">
            <Button>💳 Pagar Online</Button>
          </Link>
          <Link to="/gate">
            <Button variant="primary">Marcar Asistencia</Button>
          </Link>
        </div>
      </div>

      {/* Member info */}
      <Card style={{ marginBottom: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Socio N.{member.memberNo}</p>
            <h2 style={{ margin: 'var(--space-sm) 0' }}>{member.name}</h2>
            <Badge variant={member.status === 'active' ? 'success' : 'warning'}>
              {member.status === 'active' ? 'Activo' : 'Pausado'}
            </Badge>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Cuota mensual</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{formatCLP(stats.monthlyFee)}</p>
          </div>
        </div>
      </Card>

      {/* Stats grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space)',
          marginBottom: 'var(--space-lg)',
        }}
      >
        <StatTile
          label="Proximo Vencimiento"
          value={format(stats.nextDueDate, 'd MMM', { locale: es })}
          subtext={stats.statusLabel}
        />
        <StatTile
          label="Estado Pago"
          value={
            stats.paymentStatus === 'ok'
              ? 'Al Dia'
              : stats.paymentStatus === 'warning'
              ? 'Por Vencer'
              : 'Vencido'
          }
        />
        <StatTile label="Visitas del Mes" value={stats.visitsThisMonth} />
        <StatTile
          label="Ultima Visita"
          value={stats.lastVisit ? formatDateTime(stats.lastVisit.ts) : 'Sin registro'}
        />
      </div>

      {/* Open session warning */}
      {stats.hasOpenSession && (
        <Card
          style={{
            marginBottom: 'var(--space-lg)',
            borderColor: 'var(--red)',
          }}
        >
          <p style={{ color: 'var(--red)' }}>
            Tienes una sesion abierta (entrada sin salida registrada)
          </p>
        </Card>
      )}

      {/* Payments table */}
      <Card style={{ marginBottom: 'var(--space-lg)' }}>
        <h3 style={{ marginBottom: 'var(--space)' }}>Historial de Pagos</h3>
        <Table columns={paymentColumns} data={payments.slice(0, 10)} keyField="id" />
      </Card>

      {/* Attendance table */}
      <Card>
        <h3 style={{ marginBottom: 'var(--space)' }}>Historial de Asistencias</h3>
        <Table columns={attendanceColumns} data={attendance.slice(0, 20)} keyField="id" />
      </Card>
    </div>
  )
}
