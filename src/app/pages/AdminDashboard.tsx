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
import QRBlock from '../components/QRBlock'
import { loadDb, updateDb, resetDb } from '../state/storage'
import { formatCLP } from '../utils/money'
import { formatDate, getNextDueDate, isOverdue, isDueSoon, isCurrentMonth, getCurrentPeriod } from '../utils/dates'
import type { Member, Payment, PaymentMethod, Attachment, PlanType, PaymentOperationType } from '../data/schema'

// Secciones del admin
type AdminSection = 'resumen' | 'buscar' | 'ingresar' | 'modificar' | 'renovar' | 'eliminar'

export default function AdminDashboard() {
  const [db, setDb] = useState(loadDb)
  const [activeSection, setActiveSection] = useState<AdminSection>('resumen')
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  // New member form
  const [newMemberForm, setNewMemberForm] = useState({
    name: '',
    email: '',
    phone: '',
    rut: '',
    monthlyFee: '35000',
    dueDay: '5',
    planType: 'full' as PlanType,
  })
  
  // Edit member form
  const [editMemberForm, setEditMemberForm] = useState({
    name: '',
    email: '',
    phone: '',
    monthlyFee: '',
    dueDay: '',
  })
  
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'cash' as PaymentMethod,
    receiptNo: '',
    notes: '',
    planType: 'full' as PlanType,
    operationType: 'renovacion' as PaymentOperationType,
  })
  const [paymentAttachment, setPaymentAttachment] = useState<Attachment | null>(null)

  // Dashboard stats
  const stats = useMemo(() => {
    const currentPeriod = getCurrentPeriod()

    // Income this month (from cashSheet) - with fallback
    const monthIncome = (db.cashSheet || [])
      .filter((row) => row.date.startsWith(currentPeriod))
      .reduce((sum, row) => sum + row.total, 0)

    // Payments received this month - with fallback
    const paymentsThisMonth = (db.payments || []).filter((p) =>
      p.paidAt.startsWith(currentPeriod)
    ).length

    // Attendances this month (IN only) - with fallback
    const attendanceThisMonth = (db.attendance || []).filter(
      (a) => a.type === 'IN' && isCurrentMonth(a.ts)
    ).length

    // Overdue members - with fallback
    const overdueMembers = (db.members || []).filter((member) => {
      if (member.status !== 'active') return false
      const memberPayments = (db.payments || []).filter((p) => p.memberId === member.id)
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
    const memberPayments = (db.payments || []).filter((p) => p.memberId === member.id)
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
      planType: paymentForm.planType,
      operationType: paymentForm.operationType,
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
      planType: paymentForm.planType,
      operationType: paymentForm.operationType,
    }

    const newDb = updateDb((d) => {
      d.payments.push(payment)
      d.cashSheet.push(cashRow)
      return d
    })
    setDb(newDb)

    // Reset form
    setPaymentForm({ amount: '', method: 'cash', receiptNo: '', notes: '', planType: 'full', operationType: 'renovacion' })
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

  // Filter members by search - with fallback
  const filteredMembers = useMemo(() => {
    const members = db.members || []
    if (!searchQuery.trim()) return members
    const q = searchQuery.toLowerCase()
    return members.filter(
      m => m.name.toLowerCase().includes(q) ||
           m.memberNo.toLowerCase().includes(q) ||
           m.profile?.rut?.toLowerCase().includes(q) ||
           m.contact?.email?.toLowerCase().includes(q)
    )
  }, [db.members, searchQuery])

  // Create new member
  const handleCreateMember = () => {
    if (!newMemberForm.name.trim()) return

    const newMember: Member = {
      id: nanoid(),
      memberNo: `S${String((db.members || []).length + 1).padStart(3, '0')}`,
      name: newMemberForm.name.trim(),
      status: 'active',
      plan: {
        monthlyFee: parseInt(newMemberForm.monthlyFee) || 35000,
        dueDay: parseInt(newMemberForm.dueDay) || 5,
        type: newMemberForm.planType,
      },
      contact: {
        email: newMemberForm.email || undefined,
        phone: newMemberForm.phone || undefined,
      },
      profile: {
        rut: newMemberForm.rut || undefined,
        joinDate: new Date().toISOString(),
      },
    }

    const newDb = updateDb((d) => {
      d.members.push(newMember)
      return d
    })
    setDb(newDb)
    setNewMemberForm({ name: '', email: '', phone: '', rut: '', monthlyFee: '35000', dueDay: '5', planType: 'full' })
    setActiveSection('buscar')
  }

  // Update member
  const handleUpdateMember = () => {
    if (!selectedMember || !editMemberForm.name.trim()) return

    const newDb = updateDb((d) => {
      const idx = d.members.findIndex(m => m.id === selectedMember.id)
      if (idx !== -1) {
        d.members[idx] = {
          ...d.members[idx],
          name: editMemberForm.name.trim(),
          contact: {
            ...d.members[idx].contact,
            email: editMemberForm.email || undefined,
            phone: editMemberForm.phone || undefined,
          },
          plan: {
            ...d.members[idx].plan,
            monthlyFee: parseInt(editMemberForm.monthlyFee) || d.members[idx].plan.monthlyFee,
            dueDay: parseInt(editMemberForm.dueDay) || d.members[idx].plan.dueDay,
          },
        }
      }
      return d
    })
    setDb(newDb)
    setShowEditModal(false)
    setSelectedMember(null)
  }

  // Delete member
  const handleDeleteMember = () => {
    if (!selectedMember) return

    const newDb = updateDb((d) => {
      d.members = d.members.filter(m => m.id !== selectedMember.id)
      d.payments = d.payments.filter(p => p.memberId !== selectedMember.id)
      d.attendance = d.attendance.filter(a => a.memberId !== selectedMember.id)
      return d
    })
    setDb(newDb)
    setShowDeleteConfirm(false)
    setSelectedMember(null)
  }

  // Open edit modal
  const openEditModal = (member: Member) => {
    setSelectedMember(member)
    setEditMemberForm({
      name: member.name,
      email: member.contact?.email || '',
      phone: member.contact?.phone || '',
      monthlyFee: String(member.plan.monthlyFee),
      dueDay: String(member.plan.dueDay),
    })
    setShowEditModal(true)
  }

  // Open delete confirm
  const openDeleteConfirm = (member: Member) => {
    setSelectedMember(member)
    setShowDeleteConfirm(true)
  }

  // Open renewal (payment modal)
  const openRenewal = (member: Member) => {
    setSelectedMember(member)
    setPaymentForm({
      ...paymentForm,
      amount: String(member.plan.monthlyFee),
      operationType: 'renovacion',
    })
    setShowPaymentModal(true)
  }

  // Member columns - dynamic based on section
  const getMemberColumns = (section: AdminSection) => {
    const baseColumns = [
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
    ]

    const actionColumn = {
      key: 'actions',
      header: 'Acciones',
      render: (m: Member) => {
        if (section === 'eliminar') {
          return (
            <Button variant="danger" onClick={() => openDeleteConfirm(m)} style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
              🗑️ Eliminar
            </Button>
          )
        }
        if (section === 'modificar') {
          return (
            <Button onClick={() => openEditModal(m)} style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
              ✏️ Modificar
            </Button>
          )
        }
        if (section === 'renovar') {
          return (
            <Button variant="primary" onClick={() => openRenewal(m)} style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
              💳 Renovar
            </Button>
          )
        }
        // Default: buscar section
        return (
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            <Button onClick={() => setSelectedMember(m)} style={{ padding: '4px 8px', fontSize: '0.75rem' }}>Ver</Button>
            <Link to={`/member/${m.id}`}>
              <Button style={{ padding: '4px 8px', fontSize: '0.75rem' }}>360</Button>
            </Link>
            <Button onClick={() => openEditModal(m)} style={{ padding: '4px 6px', fontSize: '0.75rem' }}>✏️</Button>
            <Button variant="primary" onClick={() => openRenewal(m)} style={{ padding: '4px 6px', fontSize: '0.75rem' }}>💳</Button>
          </div>
        )
      },
    }

    return [...baseColumns, actionColumn]
  }

  // Legacy columns for overview
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
        <div style={{ display: 'flex', gap: '4px' }}>
          <Button
            onClick={() => setSelectedMember(m)}
            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
          >
            Ver
          </Button>
          <Link to={`/member/${m.id}`}>
            <Button style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
              360
            </Button>
          </Link>
        </div>
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

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-sm)',
          marginBottom: 'var(--space-lg)',
          flexWrap: 'wrap',
          borderBottom: '2px solid var(--border)',
          paddingBottom: 'var(--space)',
        }}
      >
        {[
          { key: 'resumen', label: '📊 Resumen', icon: '📊' },
          { key: 'buscar', label: '🔍 Buscar Cliente', icon: '🔍' },
          { key: 'ingresar', label: '➕ Ingresar Cliente', icon: '➕' },
          { key: 'modificar', label: '✏️ Modificar Datos', icon: '✏️' },
          { key: 'renovar', label: '💳 Renovar Plan', icon: '💳' },
          { key: 'eliminar', label: '🗑️ Eliminar Cliente', icon: '🗑️' },
        ].map((tab) => (
          <Button
            key={tab.key}
            variant={activeSection === tab.key ? 'primary' : 'secondary'}
            onClick={() => setActiveSection(tab.key as AdminSection)}
            style={{ 
              padding: '8px 16px',
              fontSize: '0.875rem',
              borderRadius: 'var(--radius)',
            }}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* RESUMEN Section */}
      {activeSection === 'resumen' && (
        <>
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

          {/* QR Code for scanning - Admin Only */}
          <Card style={{ marginBottom: 'var(--space-lg)', textAlign: 'center' }}>
            <h3 style={{ marginBottom: 'var(--space)' }}>📱 QR de Entrada - Mostrar a Socios</h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: 'var(--space)' }}>
              Los socios deben escanear este código QR <strong>presencialmente</strong> para marcar asistencia.
              <br />
              El código cambia cada hora para evitar fraudes.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <QRBlock size={180} showDebugInfo />
            </div>
          </Card>

          {/* Members table */}
          <Card>
            <h3 style={{ marginBottom: 'var(--space)' }}>Socios ({(db.members || []).length})</h3>
            <Table columns={memberColumns} data={db.members || []} keyField="id" />
          </Card>
        </>
      )}

      {/* BUSCAR Section */}
      {activeSection === 'buscar' && (
        <Card>
          <h3 style={{ marginBottom: 'var(--space)' }}>🔍 Buscar Cliente</h3>
          <Input
            label="Buscar por nombre, N° socio, RUT o email"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ej: Juan Perez, S001, 12345678-9..."
          />
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: 'var(--space)' }}>
            {filteredMembers.length} resultado(s) encontrado(s)
          </p>
          <Table columns={getMemberColumns('buscar')} data={filteredMembers} keyField="id" />
        </Card>
      )}

      {/* INGRESAR Section */}
      {activeSection === 'ingresar' && (
        <Card>
          <h3 style={{ marginBottom: 'var(--space)' }}>➕ Ingresar Nuevo Cliente</h3>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: 'var(--space-lg)' }}>
            Complete los datos para registrar un nuevo socio en el sistema.
          </p>
          
          <div style={{ maxWidth: '500px' }}>
            <Input
              label="Nombre Completo *"
              type="text"
              value={newMemberForm.name}
              onChange={(e) => setNewMemberForm({ ...newMemberForm, name: e.target.value })}
              placeholder="Ej: Juan Perez"
            />
            <Input
              label="RUT"
              type="text"
              value={newMemberForm.rut}
              onChange={(e) => setNewMemberForm({ ...newMemberForm, rut: e.target.value })}
              placeholder="Ej: 12345678-9"
            />
            <Input
              label="Email"
              type="email"
              value={newMemberForm.email}
              onChange={(e) => setNewMemberForm({ ...newMemberForm, email: e.target.value })}
              placeholder="Ej: juan@email.com"
            />
            <Input
              label="Teléfono"
              type="tel"
              value={newMemberForm.phone}
              onChange={(e) => setNewMemberForm({ ...newMemberForm, phone: e.target.value })}
              placeholder="Ej: +56912345678"
            />
            <Input
              label="Cuota Mensual"
              type="number"
              value={newMemberForm.monthlyFee}
              onChange={(e) => setNewMemberForm({ ...newMemberForm, monthlyFee: e.target.value })}
            />
            <Input
              label="Día de Vencimiento"
              type="number"
              value={newMemberForm.dueDay}
              onChange={(e) => setNewMemberForm({ ...newMemberForm, dueDay: e.target.value })}
            />
            
            <Button 
              variant="primary" 
              onClick={handleCreateMember}
              disabled={!newMemberForm.name.trim()}
              style={{ marginTop: 'var(--space)' }}
            >
              ➕ Registrar Nuevo Socio
            </Button>
          </div>
        </Card>
      )}

      {/* MODIFICAR Section */}
      {activeSection === 'modificar' && (
        <Card>
          <h3 style={{ marginBottom: 'var(--space)' }}>✏️ Modificar Datos de Cliente</h3>
          <Input
            label="Buscar cliente a modificar"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, N° socio..."
          />
          <Table columns={getMemberColumns('modificar')} data={filteredMembers} keyField="id" />
        </Card>
      )}

      {/* RENOVAR Section */}
      {activeSection === 'renovar' && (
        <Card>
          <h3 style={{ marginBottom: 'var(--space)' }}>💳 Renovar Plan de Cliente</h3>
          <Input
            label="Buscar cliente para renovar"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, N° socio..."
          />
          <Table columns={getMemberColumns('renovar')} data={filteredMembers} keyField="id" />
        </Card>
      )}

      {/* ELIMINAR Section */}
      {activeSection === 'eliminar' && (
        <Card>
          <h3 style={{ marginBottom: 'var(--space)', color: 'var(--danger)' }}>🗑️ Eliminar Cliente</h3>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: 'var(--space)' }}>
            ⚠️ Cuidado: Eliminar un cliente borrará todos sus datos, pagos y asistencias.
          </p>
          <Input
            label="Buscar cliente a eliminar"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, N° socio..."
          />
          <Table columns={getMemberColumns('eliminar')} data={filteredMembers} keyField="id" />
        </Card>
      )}

      {/* Member Detail Modal */}
      <Modal
        open={!!selectedMember && !showEditModal && !showDeleteConfirm && !showPaymentModal}
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

      {/* Edit Member Modal */}
      <Modal
        open={showEditModal}
        onClose={() => { setShowEditModal(false); setSelectedMember(null); }}
        title={selectedMember ? `✏️ Modificar: ${selectedMember.name}` : ''}
      >
        <div>
          <Input
            label="Nombre Completo"
            type="text"
            value={editMemberForm.name}
            onChange={(e) => setEditMemberForm({ ...editMemberForm, name: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            value={editMemberForm.email}
            onChange={(e) => setEditMemberForm({ ...editMemberForm, email: e.target.value })}
          />
          <Input
            label="Teléfono"
            type="tel"
            value={editMemberForm.phone}
            onChange={(e) => setEditMemberForm({ ...editMemberForm, phone: e.target.value })}
          />
          <Input
            label="Cuota Mensual"
            type="number"
            value={editMemberForm.monthlyFee}
            onChange={(e) => setEditMemberForm({ ...editMemberForm, monthlyFee: e.target.value })}
          />
          <Input
            label="Día de Vencimiento"
            type="number"
            value={editMemberForm.dueDay}
            onChange={(e) => setEditMemberForm({ ...editMemberForm, dueDay: e.target.value })}
          />
          <div style={{ display: 'flex', gap: 'var(--space)', marginTop: 'var(--space)' }}>
            <Button variant="secondary" onClick={() => { setShowEditModal(false); setSelectedMember(null); }}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleUpdateMember}>
              💾 Guardar Cambios
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setSelectedMember(null); }}
        title="⚠️ Confirmar Eliminación"
      >
        {selectedMember && (
          <div>
            <p style={{ marginBottom: 'var(--space)' }}>
              ¿Está seguro que desea eliminar al socio <strong>{selectedMember.name}</strong> (N° {selectedMember.memberNo})?
            </p>
            <p style={{ color: 'var(--danger)', fontSize: '0.875rem', marginBottom: 'var(--space-lg)' }}>
              Esta acción eliminará todos los datos del socio, incluyendo pagos y registros de asistencia. Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space)' }}>
              <Button variant="secondary" onClick={() => { setShowDeleteConfirm(false); setSelectedMember(null); }}>
                Cancelar
              </Button>
              <Button variant="danger" onClick={handleDeleteMember}>
                🗑️ Eliminar Definitivamente
              </Button>
            </div>
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
            >
              <option value="cash">Efectivo</option>
              <option value="card">Tarjeta</option>
              <option value="transfer">Transferencia</option>
            </select>
          </div>

          <div style={{ marginBottom: 'var(--space)' }}>
            <label
              style={{
                display: 'block',
                marginBottom: 'var(--space-sm)',
                fontSize: '0.875rem',
                color: 'var(--muted)',
              }}
            >
              Tipo de Plan
            </label>
            <select
              value={paymentForm.planType}
              onChange={(e) =>
                setPaymentForm({ ...paymentForm, planType: e.target.value as PlanType })
              }
            >
              <option value="full">Normal Full</option>
              <option value="estudiante">Estudiante</option>
              <option value="antiguo">Cliente Antiguo</option>
            </select>
          </div>

          <div style={{ marginBottom: 'var(--space)' }}>
            <label
              style={{
                display: 'block',
                marginBottom: 'var(--space-sm)',
                fontSize: '0.875rem',
                color: 'var(--muted)',
              }}
            >
              Tipo de Operacion
            </label>
            <select
              value={paymentForm.operationType}
              onChange={(e) =>
                setPaymentForm({ ...paymentForm, operationType: e.target.value as PaymentOperationType })
              }
            >
              <option value="inicio">Inicio de Plan</option>
              <option value="renovacion">Renovacion</option>
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
