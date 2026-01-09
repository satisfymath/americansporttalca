// Cash Sheet - Planilla de caja
import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { nanoid } from 'nanoid'
import { format, subDays } from 'date-fns'
import { es } from 'date-fns/locale'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import Table from '../components/Table'
import Modal from '../components/Modal'
import FilePreview from '../components/FilePreview'
import { loadDb, updateDb } from '../state/storage'
import { formatCLP } from '../utils/money'
import { formatDate } from '../utils/dates'
import type { CashRow, Attachment, PlanType, PaymentOperationType, BankDeposit } from '../data/schema'

export default function CashSheet() {
  const [db, setDb] = useState(loadDb)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'payments' | 'deposits'>('payments')
  const [filterMonth, setFilterMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [filterText, setFilterText] = useState('')
  const [form, setForm] = useState({
    memberId: '',
    receiptNo: '',
    boleta: '',
    efectivo: '',
    tarjeta: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    planType: 'full' as PlanType,
    operationType: 'renovacion' as PaymentOperationType,
  })
  const [attachment, setAttachment] = useState<Attachment | null>(null)
  
  // Estado para formulario de depósito bancario
  const [depositForm, setDepositForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    cashDate: format(subDays(new Date(), 1), 'yyyy-MM-dd'),
    amount: '',
    bankName: 'BancoEstado',
    accountNumber: '',
    notes: '',
  })
  const [depositVoucher, setDepositVoucher] = useState<Attachment | null>(null)

  // Filter cash rows
  const filteredRows = useMemo(() => {
    return db.cashSheet
      .filter((row) => {
        const matchesMonth = row.date.startsWith(filterMonth)
        const matchesText =
          !filterText ||
          row.memberName.toLowerCase().includes(filterText.toLowerCase()) ||
          row.receiptNo.includes(filterText) ||
          row.memberNo.includes(filterText)
        return matchesMonth && matchesText
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [db.cashSheet, filterMonth, filterText])

  // Calculate totals
  const totals = useMemo(() => {
    const efectivo = filteredRows.reduce((sum, row) => sum + row.efectivo, 0)
    const tarjeta = filteredRows.reduce((sum, row) => sum + row.tarjeta, 0)
    const total = filteredRows.reduce((sum, row) => sum + row.total, 0)
    return { efectivo, tarjeta, total }
  }, [filteredRows])

  // Generate month options for filter
  const monthOptions = useMemo(() => {
    const months: string[] = []
    const now = new Date()
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push(format(d, 'yyyy-MM'))
    }
    return months
  }, [])

  // Handle file input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setAttachment({
        name: file.name,
        mime: file.type,
        base64: reader.result as string,
      })
    }
    reader.readAsDataURL(file)
  }

  // Add cash row
  const handleAddRow = () => {
    if (!form.memberId) return

    const member = db.members.find((m) => m.id === form.memberId)
    if (!member) return

    const efectivo = parseInt(form.efectivo) || 0
    const tarjeta = parseInt(form.tarjeta) || 0

    const newRow: CashRow = {
      id: nanoid(),
      date: form.date,
      memberId: member.id,
      memberNo: member.memberNo,
      memberName: member.name,
      receiptNo: form.receiptNo,
      boleta: form.boleta,
      efectivo,
      tarjeta,
      total: efectivo + tarjeta,
      attachment: attachment || undefined,
      planType: form.planType,
      operationType: form.operationType,
    }

    const newDb = updateDb((d) => {
      d.cashSheet.push(newRow)
      return d
    })
    setDb(newDb)

    // Reset form
    setForm({
      memberId: '',
      receiptNo: '',
      boleta: '',
      efectivo: '',
      tarjeta: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      planType: 'full' as PlanType,
      operationType: 'renovacion' as PaymentOperationType,
    })
    setAttachment(null)
    setShowAddModal(false)
  }

  // Handle deposit voucher file
  const handleDepositVoucherChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setDepositVoucher({
        name: file.name,
        mime: file.type,
        base64: reader.result as string,
      })
    }
    reader.readAsDataURL(file)
  }

  // Add bank deposit
  const handleAddDeposit = () => {
    if (!depositVoucher) {
      alert('Debes adjuntar la foto del voucher de depósito')
      return
    }
    if (!depositForm.amount || parseInt(depositForm.amount) <= 0) {
      alert('El monto debe ser mayor a 0')
      return
    }

    const newDeposit: BankDeposit = {
      id: nanoid(),
      date: depositForm.date,
      cashDate: depositForm.cashDate,
      amount: parseInt(depositForm.amount),
      bankName: depositForm.bankName,
      accountNumber: depositForm.accountNumber || undefined,
      voucherPhoto: depositVoucher,
      notes: depositForm.notes || undefined,
      createdAt: new Date().toISOString(),
      createdBy: 'admin',
    }

    const newDb = updateDb((d) => {
      d.bankDeposits.push(newDeposit)
      return d
    })
    setDb(newDb)

    // Reset form
    setDepositForm({
      date: format(new Date(), 'yyyy-MM-dd'),
      cashDate: format(subDays(new Date(), 1), 'yyyy-MM-dd'),
      amount: '',
      bankName: 'BancoEstado',
      accountNumber: '',
      notes: '',
    })
    setDepositVoucher(null)
    setShowDepositModal(false)
  }

  // Calcular efectivo pendiente de depositar
  const pendingCashToDeposit = useMemo(() => {
    // Total efectivo recibido
    const totalCash = db.cashSheet.reduce((sum, row) => sum + row.efectivo, 0)
    // Total ya depositado
    const totalDeposited = db.bankDeposits.reduce((sum, d) => sum + d.amount, 0)
    return totalCash - totalDeposited
  }, [db.cashSheet, db.bankDeposits])

  // Filtrar depósitos por mes
  const filteredDeposits = useMemo(() => {
    return db.bankDeposits
      .filter((d) => d.date.startsWith(filterMonth))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [db.bankDeposits, filterMonth])

  // Total depositado del mes
  const monthlyDepositTotal = useMemo(() => {
    return filteredDeposits.reduce((sum, d) => sum + d.amount, 0)
  }, [filteredDeposits])

  // Table columns
  const columns = [
    {
      key: 'date',
      header: 'Fecha',
      render: (row: CashRow) => formatDate(row.date),
    },
    { key: 'memberName', header: 'Nombre Socio' },
    { key: 'memberNo', header: 'N.Socio' },
    { key: 'receiptNo', header: 'N.Recibo' },
    { key: 'boleta', header: 'Boleta' },
    {
      key: 'planType',
      header: 'Tipo Plan',
      render: (row: CashRow) => {
        const labels: Record<string, string> = {
          estudiante: 'Estudiante',
          antiguo: 'Antiguo',
          full: 'Full',
        }
        return labels[row.planType] || row.planType
      },
    },
    {
      key: 'operationType',
      header: 'Operacion',
      render: (row: CashRow) => (
        <span style={{
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '0.75rem',
          fontWeight: 600,
          background: row.operationType === 'inicio' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)',
          color: row.operationType === 'inicio' ? '#10b981' : '#3b82f6',
        }}>
          {row.operationType === 'inicio' ? 'INICIO' : 'RENOV'}
        </span>
      ),
    },
    {
      key: 'efectivo',
      header: 'Efectivo',
      render: (row: CashRow) => (row.efectivo > 0 ? formatCLP(row.efectivo) : '-'),
      align: 'right' as const,
    },
    {
      key: 'tarjeta',
      header: 'Tarjeta',
      render: (row: CashRow) => (row.tarjeta > 0 ? formatCLP(row.tarjeta) : '-'),
      align: 'right' as const,
    },
    {
      key: 'total',
      header: 'Total',
      render: (row: CashRow) => formatCLP(row.total),
      align: 'right' as const,
    },
    {
      key: 'attachment',
      header: 'Adj.',
      render: (row: CashRow) =>
        row.attachment ? (
          <button
            onClick={() => window.open(row.attachment!.base64, '_blank')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--muted)',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Ver
          </button>
        ) : (
          '-'
        ),
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space)' }}>
          <Link to="/admin">
            <Button>← Volver</Button>
          </Link>
          <h1>Planilla de Caja</h1>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space)' }}>
          {activeTab === 'payments' && (
            <Button variant="primary" onClick={() => setShowAddModal(true)}>
              + Agregar Pago
            </Button>
          )}
          {activeTab === 'deposits' && (
            <Button variant="primary" onClick={() => setShowDepositModal(true)}>
              + Registrar Depósito
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '0',
        marginBottom: 'var(--space-lg)',
        borderBottom: '2px solid var(--border)',
      }}>
        <button
          onClick={() => setActiveTab('payments')}
          style={{
            padding: 'var(--space) var(--space-lg)',
            background: activeTab === 'payments' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'payments' ? 'white' : 'var(--fg)',
            border: 'none',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          💰 Pagos del Día
        </button>
        <button
          onClick={() => setActiveTab('deposits')}
          style={{
            padding: 'var(--space) var(--space-lg)',
            background: activeTab === 'deposits' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'deposits' ? 'white' : 'var(--fg)',
            border: 'none',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
          }}
        >
          🏦 Depósitos Bancarios
          {pendingCashToDeposit > 0 && (
            <span style={{
              background: 'var(--red)',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '10px',
              fontSize: '0.7rem',
            }}>
              {formatCLP(pendingCashToDeposit)} pendiente
            </span>
          )}
        </button>
      </div>

      {/* Payments Tab Content */}
      {activeTab === 'payments' && (
        <>
          {/* Filters */}
          <Card style={{ marginBottom: 'var(--space-lg)' }}>
            <div
              style={{
                display: 'flex',
                gap: 'var(--space)',
                flexWrap: 'wrap',
                alignItems: 'flex-end',
          }}
        >
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: 'var(--space-sm)',
                fontSize: '0.875rem',
                color: 'var(--muted)',
              }}
            >
              Mes
            </label>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              style={{
                padding: '10px 12px',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--fg)',
              }}
            >
              {monthOptions.map((m) => (
                <option key={m} value={m}>
                  {format(new Date(m + '-01'), 'MMMM yyyy', { locale: es })}
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label
              style={{
                display: 'block',
                marginBottom: 'var(--space-sm)',
                fontSize: '0.875rem',
                color: 'var(--muted)',
              }}
            >
              Buscar
            </label>
            <input
              type="text"
              placeholder="Nombre, recibo, N. socio..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--fg)',
              }}
            />
          </div>
        </div>
      </Card>

      {/* Totals */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 'var(--space)',
          marginBottom: 'var(--space-lg)',
        }}
      >
        <Card>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 4 }}>
            Total Efectivo
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
            {formatCLP(totals.efectivo)}
          </div>
        </Card>
        <Card>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 4 }}>
            Total Tarjeta
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
            {formatCLP(totals.tarjeta)}
          </div>
        </Card>
        <Card>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 4 }}>
            Total General
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{formatCLP(totals.total)}</div>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <Table columns={columns} data={filteredRows} keyField="id" />
      </Card>
        </>
      )}

      {/* Deposits Tab Content */}
      {activeTab === 'deposits' && (
        <>
          {/* Filter Month */}
          <Card style={{ marginBottom: 'var(--space-lg)' }}>
            <div style={{ display: 'flex', gap: 'var(--space)', alignItems: 'flex-end' }}>
              <div>
                <label style={{ display: 'block', marginBottom: 'var(--space-sm)', fontSize: '0.875rem', color: 'var(--muted)' }}>
                  Mes
                </label>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  style={{ padding: '10px 12px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--fg)' }}
                >
                  {monthOptions.map((m) => (
                    <option key={m} value={m}>
                      {format(new Date(m + '-01'), 'MMMM yyyy', { locale: es })}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* Deposit Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space)', marginBottom: 'var(--space-lg)' }}>
            <Card>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 4 }}>Depositado este Mes</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#10b981' }}>{formatCLP(monthlyDepositTotal)}</div>
            </Card>
            <Card>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 4 }}>Pendiente de Depositar</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: pendingCashToDeposit > 0 ? 'var(--red)' : '#10b981' }}>
                {formatCLP(pendingCashToDeposit)}
              </div>
            </Card>
            <Card>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 4 }}>Depósitos Registrados</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{filteredDeposits.length}</div>
            </Card>
          </div>

          {/* Deposits List */}
          <Card>
            <h3 style={{ marginBottom: 'var(--space)' }}>Historial de Depósitos</h3>
            {filteredDeposits.length === 0 ? (
              <p style={{ color: 'var(--muted)', textAlign: 'center', padding: 'var(--space-lg)' }}>
                No hay depósitos registrados para este mes
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space)' }}>
                {filteredDeposits.map((deposit) => (
                  <div
                    key={deposit.id}
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      padding: 'var(--space)',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr auto',
                      gap: 'var(--space)',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>
                        {formatCLP(deposit.amount)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                        Depósito: {formatDate(deposit.date)} | Efectivo del: {formatDate(deposit.cashDate)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                        🏦 {deposit.bankName} {deposit.accountNumber && `(*${deposit.accountNumber})`}
                      </div>
                      {deposit.notes && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 4 }}>
                          📝 {deposit.notes}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => window.open(deposit.voucherPhoto.base64, '_blank')}
                        style={{
                          background: 'var(--primary)',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        📄 Ver Voucher
                      </button>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
                      {format(new Date(deposit.createdAt), 'dd/MM HH:mm')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}

      {/* Add Payment Modal */}
      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Agregar Registro de Caja"
      >
        <div>
          <div style={{ marginBottom: 'var(--space)' }}>
            <label
              style={{
                display: 'block',
                marginBottom: 'var(--space-sm)',
                fontSize: '0.875rem',
                color: 'var(--muted)',
              }}
            >
              Socio
            </label>
            <select
              value={form.memberId}
              onChange={(e) => setForm({ ...form, memberId: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--fg)',
              }}
            >
              <option value="">Seleccionar...</option>
              {db.members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.memberNo} - {m.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Fecha"
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />

          <Input
            label="N. Recibo"
            type="text"
            value={form.receiptNo}
            onChange={(e) => setForm({ ...form, receiptNo: e.target.value })}
          />

          <Input
            label="Boleta"
            type="text"
            value={form.boleta}
            onChange={(e) => setForm({ ...form, boleta: e.target.value })}
          />

          {/* Tipo de Plan */}
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
              value={form.planType}
              onChange={(e) => setForm({ ...form, planType: e.target.value as PlanType })}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--fg)',
              }}
            >
              <option value="full">Normal Full</option>
              <option value="estudiante">Estudiante</option>
              <option value="antiguo">Cliente Antiguo</option>
            </select>
          </div>

          {/* Tipo de Operacion */}
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
              value={form.operationType}
              onChange={(e) => setForm({ ...form, operationType: e.target.value as PaymentOperationType })}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                color: 'var(--fg)',
              }}
            >
              <option value="renovacion">Renovacion Mensual</option>
              <option value="inicio">Inicio (Primera Inscripcion)</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space)' }}>
            <Input
              label="Efectivo"
              type="number"
              value={form.efectivo}
              onChange={(e) => setForm({ ...form, efectivo: e.target.value })}
            />
            <Input
              label="Tarjeta"
              type="number"
              value={form.tarjeta}
              onChange={(e) => setForm({ ...form, tarjeta: e.target.value })}
            />
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
              Comprobante (opcional)
            </label>
            <input type="file" accept="image/*,application/pdf" onChange={handleFileChange} />
            {attachment && (
              <div style={{ marginTop: 'var(--space-sm)' }}>
                <FilePreview attachment={attachment} />
              </div>
            )}
          </div>

          <Button variant="primary" fullWidth onClick={handleAddRow}>
            Guardar
          </Button>
        </div>
      </Modal>

      {/* Add Deposit Modal */}
      <Modal
        open={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        title="Registrar Depósito Bancario"
      >
        <div>
          <div style={{ 
            background: 'rgba(59, 130, 246, 0.1)', 
            border: '1px solid var(--primary)',
            borderRadius: '8px',
            padding: 'var(--space)',
            marginBottom: 'var(--space-lg)',
          }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
              📌 Registra aquí el depósito del efectivo recaudado el día anterior.
              <br />
              <strong>Efectivo pendiente de depositar:</strong> {formatCLP(pendingCashToDeposit)}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space)' }}>
            <Input
              label="Fecha de Depósito"
              type="date"
              value={depositForm.date}
              onChange={(e) => setDepositForm({ ...depositForm, date: e.target.value })}
            />
            <Input
              label="Fecha del Efectivo"
              type="date"
              value={depositForm.cashDate}
              onChange={(e) => setDepositForm({ ...depositForm, cashDate: e.target.value })}
            />
          </div>

          <Input
            label="Monto Depositado"
            type="number"
            value={depositForm.amount}
            onChange={(e) => setDepositForm({ ...depositForm, amount: e.target.value })}
            placeholder="Ej: 150000"
          />

          <div style={{ marginBottom: 'var(--space)' }}>
            <label style={{ display: 'block', marginBottom: 'var(--space-sm)', fontSize: '0.875rem', color: 'var(--muted)' }}>
              Banco
            </label>
            <select
              value={depositForm.bankName}
              onChange={(e) => setDepositForm({ ...depositForm, bankName: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--fg)' }}
            >
              <option value="BancoEstado">BancoEstado</option>
              <option value="Banco de Chile">Banco de Chile</option>
              <option value="Banco Santander">Banco Santander</option>
              <option value="BCI">BCI</option>
              <option value="Scotiabank">Scotiabank</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          <Input
            label="Últimos 4 dígitos cuenta (opcional)"
            type="text"
            value={depositForm.accountNumber}
            onChange={(e) => setDepositForm({ ...depositForm, accountNumber: e.target.value.slice(0, 4) })}
            placeholder="1234"
            maxLength={4}
          />

          <div style={{ marginBottom: 'var(--space)' }}>
            <label style={{ display: 'block', marginBottom: 'var(--space-sm)', fontSize: '0.875rem', color: 'var(--muted)' }}>
              📷 Foto del Voucher/Comprobante *
            </label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleDepositVoucherChange}
              style={{ width: '100%' }}
            />
            {depositVoucher && (
              <div style={{ marginTop: 'var(--space-sm)' }}>
                <FilePreview attachment={depositVoucher} />
              </div>
            )}
          </div>

          <Input
            label="Notas (opcional)"
            type="text"
            value={depositForm.notes}
            onChange={(e) => setDepositForm({ ...depositForm, notes: e.target.value })}
            placeholder="Observaciones..."
          />

          <Button variant="primary" fullWidth onClick={handleAddDeposit}>
            Registrar Depósito
          </Button>
        </div>
      </Modal>
    </div>
  )
}
