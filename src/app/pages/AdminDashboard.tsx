// Admin Dashboard
import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { nanoid } from 'nanoid'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import Table from '../components/Table'
import StatTile from '../components/StatTile'
import Modal from '../components/Modal'
import Input from '../components/Input'
import FilePreview from '../components/FilePreview'
import { loadDb, updateDb, resetDb } from '../state/storage'
import { formatCLP } from '../utils/money'
import { formatDate, getNextDueDate, isOverdue, isDueSoon, isCurrentMonth, getCurrentPeriod } from '../utils/dates'
import type { Member, Payment, PaymentMethod, Attachment } from '../data/schema'

export default function AdminDashboard() {
  const [db, setDb] = useState(loadDb)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'cash' as PaymentMethod,
    receiptNo: '',
    notes: '',
  })
  const [paymentAttachment, setPaymentAttachment] = useState<Attachment | null>(null)

  // Dashboard stats
  const stats = useMemo(() => {
    const currentPeriod = getCurrentPeriod()

    // Income this month (from cashSheet)
    const monthIncome = db.cashSheet
      .filter((row) => row.date.startsWith(currentPeriod))
      .reduce((sum, row) => sum + row.total, 0)

    // Payments received this month
    const paymentsThisMonth = db.payments.filter((p) =>
      p.paidAt.startsWith(currentPeriod)
    ).length

    // Attendances this month (IN only)
    const attendanceThisMonth = db.attendance.filter(
      (a) => a.type === 'IN' && isCurrentMonth(a.ts)
    ).length

    // Overdue members
    const overdueMembers = db.members.filter((member) => {
      if (member.status !== 'active') return false
      const memberPayments = db.payments.filter((p) => p.memberId === member.id)
      const lastPaidPeriod = memberPayments.length > 0
        ? memberPayments.sort((a, b) => b.period.localeCompare(a.period))[0].period
        : null
      const nextDueDate = getNextDueDate(member.plan.dueDay, lastPaidPeriod)
      return isOverdue(nextDueDate)
    }).length

    return { monthIncome, paymentsThisMonth, attendanceThisMonth, overdueMembers }
  }, [db])

  // Member status calculation
  const getMemberStatus = (member: Member) => {
    const memberPayments = db.payments.filter((p) => p.memberId === member.id)
    const lastPaidPeriod = memberPayments.length > 0
      ? memberPayments.sort((a, b) => b.period.localeCompare(a.period))[0].period
      : null
    const nextDueDate = getNextDueDate(member.plan.dueDay, lastPaidPeriod)

    if (isOverdue(nextDueDate)) return { status: 'danger' as const, label: 'Vencido' }
    if (isDueSoon(nextDueDate)) return { status: 'warning' as const, label: 'Por Vencer' }
    return { status: 'success' as const, label: 'Al Dia' }
  }

  // Get visits this month for member
  const getVisitsThisMonth = (memberId: string) => {
    return db.attendance.filter(
      (a) => a.memberId === memberId && a.type === 'IN' && isCurrentMonth(a.ts)
    ).length
  }

  // Handle file input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setPaymentAttachment({
        name: file.name,
        mime: file.type,
        base64: reader.result as string,
      })
    }
    reader.readAsDataURL(file)
  }

  // Create payment
  const handleCreatePayment = () => {
    if (!selectedMember || !paymentForm.amount) return

    const currentPeriod = getCurrentPeriod()
    const payment: Payment = {
      id: nanoid(),
      memberId: selectedMember.id,
      paidAt: new Date().toISOString(),
      period: currentPeriod,
      amount: parseInt(paymentForm.amount),
      method: paymentForm.method,
      receiptNo: paymentForm.receiptNo || undefined,
      notes: paymentForm.notes || undefined,
      attachment: paymentAttachment || undefined,
    }

    // Also create cash row
    const cashRow = {
      id: nanoid(),
      date: new Date().toISOString().split('T')[0],
      memberId: selectedMember.id,
      memberNo: selectedMember.memberNo,
      memberName: selectedMember.name,
      receiptNo: paymentForm.receiptNo,
      boleta: '',
      efectivo: paymentForm.method === 'cash' ? parseInt(paymentForm.amount) : 0,
      tarjeta: paymentForm.method === 'card' ? parseInt(paymentForm.amount) : 0,
      total: parseInt(paymentForm.amount),
      linkedPaymentId: payment.id,
      attachment: paymentAttachment || undefined,
    }

    const newDb = updateDb((d) => {
      d.payments.push(payment)
      d.cashSheet.push(cashRow)
      return d
    })
    setDb(newDb)

    // Reset form
    setPaymentForm({ amount: '', method: 'cash', receiptNo: '', notes: '' })
    setPaymentAttachment(null)
    setShowPaymentModal(false)
  }

  // Reset demo
  const handleResetDemo = () => {
    if (confirm('Esto borrara todos los datos y restaurara el demo inicial. Continuar?')) {
      const newDb = resetDb()
      setDb(newDb)
    }
  }

  // Member columns
  const memberColumns = [
    { key: 'memberNo', header: 'N.Socio' },
    { key: 'name', header: 'Nombre' },
    {
      key: 'status',
      header: 'Estado Pago',
      render: (m: Member) => {
        const s = getMemberStatus(m)
        return <Badge variant={s.status}>{s.label}</Badge>
      },
    },
    {
      key: 'nextDue',
      header: 'Prox. Venc.',
      render: (m: Member) => {
        const memberPayments = db.payments.filter((p) => p.memberId === m.id)
        const lastPaidPeriod = memberPayments.length > 0
          ? memberPayments.sort((a, b) => b.period.localeCompare(a.period))[0].period
          : null
        const nextDueDate = getNextDueDate(m.plan.dueDay, lastPaidPeriod)
        return formatDate(nextDueDate.toISOString())
      },
    },
    {
      key: 'visits',
      header: 'Visitas Mes',
      render: (m: Member) => getVisitsThisMonth(m.id),
      align: 'center' as const,
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (m: Member) => (
        <Button
          onClick={() => setSelectedMember(m)}
          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
        >
          Ver
        </Button>
      ),
    },
  ]

  // Member detail payments
  const selectedMemberPayments = selectedMember
    ? db.payments
        .filter((p) => p.memberId === selectedMember.id)
        .sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime())
    : []

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
        <h1>Panel Administrador</h1>
        <div style={{ display: 'flex', gap: 'var(--space)' }}>
          <Link to="/cash">
            <Button>Planilla de Caja</Button>
          </Link>
          <Button variant="danger" onClick={handleResetDemo}>
            Reset Demo
          </Button>
        </div>
      </div>

      {/* Stats grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space)',
          marginBottom: 'var(--space-lg)',
        }}
      >
        <StatTile label="Ingresos del Mes" value={formatCLP(stats.monthIncome)} />
        <StatTile label="Pagos Recibidos" value={stats.paymentsThisMonth} />
        <StatTile label="Asistencias Mes" value={stats.attendanceThisMonth} />
        <StatTile label="Socios Vencidos" value={stats.overdueMembers} />
      </div>

      {/* Members table */}
      <Card>
        <h3 style={{ marginBottom: 'var(--space)' }}>Socios</h3>
        <Table columns={memberColumns} data={db.members} keyField="id" />
      </Card>

      {/* Member Detail Modal */}
      <Modal
        open={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        title={selectedMember ? `Socio: ${selectedMember.name}` : ''}
      >
        {selectedMember && (
          <div>
            <div style={{ marginBottom: 'var(--space)' }}>
              <p>
                <strong>N. Socio:</strong> {selectedMember.memberNo}
              </p>
              <p>
                <strong>Cuota:</strong> {formatCLP(selectedMember.plan.monthlyFee)}
              </p>
              <p>
                <strong>Estado:</strong>{' '}
                <Badge variant={getMemberStatus(selectedMember).status}>
                  {getMemberStatus(selectedMember).label}
                </Badge>
              </p>
            </div>

            <Button
              variant="primary"
              onClick={() => setShowPaymentModal(true)}
              style={{ marginBottom: 'var(--space)' }}
            >
              Registrar Pago
            </Button>

            <h4 style={{ marginTop: 'var(--space)', marginBottom: 'var(--space-sm)' }}>
              Pagos
            </h4>
            {selectedMemberPayments.length === 0 ? (
              <p style={{ color: 'var(--muted)' }}>Sin pagos registrados</p>
            ) : (
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {selectedMemberPayments.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      padding: 'var(--space-sm)',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{p.period}</span>
                      <span>{formatCLP(p.amount)}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                      {formatDate(p.paidAt)} - {p.method}
                      {p.receiptNo && ` - Recibo: ${p.receiptNo}`}
                    </div>
                    {p.attachment && (
                      <div style={{ marginTop: 'var(--space-sm)' }}>
                        <FilePreview attachment={p.attachment} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Payment Form Modal */}
      <Modal
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Registrar Pago"
      >
        <div>
          <Input
            label="Monto"
            type="number"
            value={paymentForm.amount}
            onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
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
              Metodo de Pago
            </label>
            <select
              value={paymentForm.method}
              onChange={(e) =>
                setPaymentForm({ ...paymentForm, method: e.target.value as PaymentMethod })
              }
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--fg)',
              }}
            >
              <option value="cash">Efectivo</option>
              <option value="card">Tarjeta</option>
              <option value="transfer">Transferencia</option>
            </select>
          </div>

          <Input
            label="N. Recibo"
            type="text"
            value={paymentForm.receiptNo}
            onChange={(e) => setPaymentForm({ ...paymentForm, receiptNo: e.target.value })}
          />

          <Input
            label="Notas"
            type="text"
            value={paymentForm.notes}
            onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
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
              Comprobante (opcional)
            </label>
            <input type="file" accept="image/*,application/pdf" onChange={handleFileChange} />
            {paymentAttachment && (
              <div style={{ marginTop: 'var(--space-sm)' }}>
                <FilePreview attachment={paymentAttachment} />
              </div>
            )}
          </div>

          <Button variant="primary" fullWidth onClick={handleCreatePayment}>
            Guardar Pago
          </Button>
        </div>
      </Modal>
    </div>
  )
}
