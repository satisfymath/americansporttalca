// OnlinePayment - Simulacion de pago online
// Flujo de 3 pasos: Resumen -> Pago -> Confirmacion
import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { nanoid } from 'nanoid'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import { getLoggedMemberId } from '../state/auth'
import { loadDb, updateDb } from '../state/storage'
import { formatCLP } from '../utils/money'
import { getCurrentPeriod, getNextDueDate, isOverdue } from '../utils/dates'
import type { OnlinePayment as OnlinePaymentType, Payment } from '../data/schema'

type PaymentStep = 'summary' | 'payment' | 'processing' | 'confirmation' | 'error'

export default function OnlinePayment() {
  const [step, setStep] = useState<PaymentStep>('summary')
  const [cardForm, setCardForm] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
    name: '',
  })
  const [transactionId, setTransactionId] = useState('')
  const [, setProcessing] = useState(false)
  const [error, setError] = useState('')

  const db = loadDb()
  const memberId = getLoggedMemberId()

  const member = useMemo(() => {
    return db.members.find((m) => m.id === memberId)
  }, [db.members, memberId])

  const paymentInfo = useMemo(() => {
    if (!member) return null

    const memberPayments = db.payments.filter((p) => p.memberId === member.id)
    const lastPaidPeriod = memberPayments.length > 0
      ? [...memberPayments].sort((a, b) => b.period.localeCompare(a.period))[0].period
      : null
    
    const nextDueDate = getNextDueDate(member.plan.dueDay, lastPaidPeriod)
    const periodToPay = getCurrentPeriod()
    const isDebt = isOverdue(nextDueDate)

    return {
      amount: member.plan.monthlyFee,
      periodToPay,
      periodLabel: format(new Date(periodToPay + '-01'), 'MMMM yyyy', { locale: es }),
      nextDueDate,
      isDebt,
      lastPaidPeriod,
    }
  }, [member, db.payments])

  if (!member || !paymentInfo) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
        <h2>Error al cargar datos</h2>
        <Link to="/me">
          <Button variant="primary" style={{ marginTop: 'var(--space)' }}>
            Volver a Mi Cuenta
          </Button>
        </Link>
      </div>
    )
  }

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ''
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    return parts.length ? parts.join(' ') : v
  }

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4)
    }
    return v
  }

  const validateForm = () => {
    if (cardForm.cardNumber.replace(/\s/g, '').length < 16) {
      setError('Numero de tarjeta invalido')
      return false
    }
    if (cardForm.expiry.length < 5) {
      setError('Fecha de expiracion invalida')
      return false
    }
    if (cardForm.cvv.length < 3) {
      setError('CVV invalido')
      return false
    }
    if (cardForm.name.length < 3) {
      setError('Nombre del titular requerido')
      return false
    }
    return true
  }

  const handleProcessPayment = () => {
    if (!validateForm()) return

    setError('')
    setStep('processing')
    setProcessing(true)

    // Simular procesamiento de pago (2-3 segundos)
    setTimeout(() => {
      const txId = `WP-${Date.now().toString(36).toUpperCase()}`
      setTransactionId(txId)

      // Crear pago online
      const onlinePayment: OnlinePaymentType = {
        id: nanoid(),
        memberId: member.id,
        amount: paymentInfo.amount,
        status: 'completed',
        transactionId: txId,
        method: 'webpay',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        period: paymentInfo.periodToPay,
        cardLast4: cardForm.cardNumber.slice(-4),
      }

      // Crear pago regular tambien
      const payment: Payment = {
        id: nanoid(),
        memberId: member.id,
        paidAt: new Date().toISOString(),
        period: paymentInfo.periodToPay,
        amount: paymentInfo.amount,
        method: 'card',
        receiptNo: txId,
        notes: `Pago online - ${txId}`,
        planType: member.plan.type,
        operationType: 'renovacion',
      }

      // Actualizar DB
      updateDb((d) => {
        d.onlinePayments.push(onlinePayment)
        d.payments.push(payment)
        d.cashSheet.push({
          id: nanoid(),
          date: new Date().toISOString().split('T')[0],
          memberId: member.id,
          memberNo: member.memberNo,
          memberName: member.name,
          receiptNo: txId,
          boleta: '',
          efectivo: 0,
          tarjeta: paymentInfo.amount,
          total: paymentInfo.amount,
          linkedPaymentId: payment.id,
          planType: member.plan.type,
          operationType: 'renovacion',
        })
        return d
      })

      setProcessing(false)
      setStep('confirmation')
    }, 2500)
  }

  // Step: Summary
  if (step === 'summary') {
    return (
      <div style={{ maxWidth: 500, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space)', marginBottom: 'var(--space-lg)' }}>
          <Link to="/me">
            <Button>← Volver</Button>
          </Link>
          <h1>Pagar Online</h1>
        </div>

        <Card>
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-sm)' }}>💳</div>
            <h2>Resumen de Pago</h2>
          </div>

          <div style={{ 
            background: 'var(--bg-alt)', 
            padding: 'var(--space)', 
            borderRadius: '8px',
            marginBottom: 'var(--space-lg)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
              <span style={{ color: 'var(--muted)' }}>Socio:</span>
              <span style={{ fontWeight: 600 }}>{member.name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
              <span style={{ color: 'var(--muted)' }}>Periodo:</span>
              <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{paymentInfo.periodLabel}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
              <span style={{ color: 'var(--muted)' }}>Plan:</span>
              <span style={{ fontWeight: 600 }}>
                {member.plan.type === 'full' ? 'Normal Full' : 
                 member.plan.type === 'estudiante' ? 'Estudiante' : 'Cliente Antiguo'}
              </span>
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 'var(--space) 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>Total:</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>
                {formatCLP(paymentInfo.amount)}
              </span>
            </div>
          </div>

          {paymentInfo.isDebt && (
            <div style={{ 
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--red)',
              borderRadius: '8px',
              padding: 'var(--space)',
              marginBottom: 'var(--space-lg)',
              textAlign: 'center'
            }}>
              <p style={{ color: 'var(--red)', fontWeight: 600 }}>
                ⚠️ Tu cuenta tiene un pago pendiente
              </p>
            </div>
          )}

          <Button variant="primary" fullWidth onClick={() => setStep('payment')}>
            Continuar al Pago
          </Button>
        </Card>
      </div>
    )
  }

  // Step: Payment Form
  if (step === 'payment') {
    return (
      <div style={{ maxWidth: 500, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space)', marginBottom: 'var(--space-lg)' }}>
          <Button onClick={() => setStep('summary')}>← Volver</Button>
          <h1>Datos de Pago</h1>
        </div>

        <Card>
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
            <div style={{ fontSize: '2rem', marginBottom: 'var(--space-sm)' }}>🔒</div>
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
              Pago seguro simulado (Demo)
            </p>
          </div>

          {error && (
            <div style={{ 
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--red)',
              borderRadius: '4px',
              padding: 'var(--space-sm)',
              marginBottom: 'var(--space)',
              color: 'var(--red)',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          <Input
            label="Numero de Tarjeta"
            type="text"
            value={cardForm.cardNumber}
            onChange={(e) => setCardForm({ 
              ...cardForm, 
              cardNumber: formatCardNumber(e.target.value) 
            })}
            placeholder="4111 1111 1111 1111"
            maxLength={19}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space)' }}>
            <Input
              label="Expiracion"
              type="text"
              value={cardForm.expiry}
              onChange={(e) => setCardForm({ 
                ...cardForm, 
                expiry: formatExpiry(e.target.value) 
              })}
              placeholder="MM/AA"
              maxLength={5}
            />
            <Input
              label="CVV"
              type="text"
              value={cardForm.cvv}
              onChange={(e) => setCardForm({ 
                ...cardForm, 
                cvv: e.target.value.replace(/\D/g, '').slice(0, 4) 
              })}
              placeholder="123"
              maxLength={4}
            />
          </div>

          <Input
            label="Nombre del Titular"
            type="text"
            value={cardForm.name}
            onChange={(e) => setCardForm({ ...cardForm, name: e.target.value.toUpperCase() })}
            placeholder="JUAN PEREZ"
          />

          <div style={{ 
            background: 'var(--bg-alt)', 
            padding: 'var(--space)', 
            borderRadius: '8px',
            marginBottom: 'var(--space)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>Total a pagar:</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              {formatCLP(paymentInfo.amount)}
            </span>
          </div>

          <Button variant="primary" fullWidth onClick={handleProcessPayment}>
            Pagar {formatCLP(paymentInfo.amount)}
          </Button>

          <p style={{ 
            textAlign: 'center', 
            marginTop: 'var(--space)', 
            fontSize: '0.75rem', 
            color: 'var(--muted)' 
          }}>
            💡 Usa 4111 1111 1111 1111 para probar
          </p>
        </Card>
      </div>
    )
  }

  // Step: Processing
  if (step === 'processing') {
    return (
      <div style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center' }}>
        <Card>
          <div style={{ padding: 'var(--space-xl)' }}>
            <div style={{ 
              fontSize: '4rem', 
              marginBottom: 'var(--space-lg)',
              animation: 'spin 1s linear infinite'
            }}>
              ⏳
            </div>
            <h2 style={{ marginBottom: 'var(--space)' }}>Procesando Pago...</h2>
            <p style={{ color: 'var(--muted)' }}>
              Por favor espera mientras procesamos tu transaccion
            </p>
          </div>
        </Card>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  // Step: Confirmation
  if (step === 'confirmation') {
    return (
      <div style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center' }}>
        <Card>
          <div style={{ padding: 'var(--space-lg)' }}>
            <div style={{ fontSize: '4rem', marginBottom: 'var(--space)' }}>✅</div>
            <h2 style={{ color: '#10b981', marginBottom: 'var(--space-lg)' }}>
              ¡Pago Exitoso!
            </h2>

            <div style={{ 
              background: 'var(--bg-alt)', 
              padding: 'var(--space)', 
              borderRadius: '8px',
              marginBottom: 'var(--space-lg)',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
                <span style={{ color: 'var(--muted)' }}>N° Transaccion:</span>
                <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{transactionId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
                <span style={{ color: 'var(--muted)' }}>Monto:</span>
                <span style={{ fontWeight: 600 }}>{formatCLP(paymentInfo.amount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
                <span style={{ color: 'var(--muted)' }}>Periodo:</span>
                <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{paymentInfo.periodLabel}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
                <span style={{ color: 'var(--muted)' }}>Tarjeta:</span>
                <span style={{ fontWeight: 600 }}>**** **** **** {cardForm.cardNumber.slice(-4)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>Fecha:</span>
                <span style={{ fontWeight: 600 }}>{format(new Date(), "d MMM yyyy HH:mm", { locale: es })}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              <Link to="/me">
                <Button variant="primary" fullWidth>
                  Ir a Mi Cuenta
                </Button>
              </Link>
              <Button 
                fullWidth 
                onClick={() => alert('Comprobante enviado a tu email (simulado)')}
              >
                Enviar Comprobante por Email
              </Button>
              <Link to="/">
                <Button fullWidth>Volver al Inicio</Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return null
}
