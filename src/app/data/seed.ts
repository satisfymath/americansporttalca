// Seed inicial para demo American Sport Gym
import { nanoid } from 'nanoid'
import { format, subMonths, subDays, addHours } from 'date-fns'
import type { GymDB, Member, Payment, AttendanceEvent, CashRow } from './schema'

// ID fijo para el usuario demo (username "demo")
export const DEMO_MEMBER_ID = 'member_demo_001'

// Generar miembros seed
function createSeedMembers(): Member[] {
  return [
    {
      id: DEMO_MEMBER_ID,
      memberNo: '0001',
      name: 'Usuario Demo',
      status: 'active',
      plan: { monthlyFee: 25000, dueDay: 5 },
      contact: { phone: '+56912345678', email: 'demo@example.com' },
    },
    {
      id: 'member_002',
      memberNo: '0002',
      name: 'Carlos Gonzalez',
      status: 'active',
      plan: { monthlyFee: 25000, dueDay: 10 },
      contact: { phone: '+56987654321' },
    },
    {
      id: 'member_003',
      memberNo: '0003',
      name: 'Maria Fernandez',
      status: 'active',
      plan: { monthlyFee: 30000, dueDay: 15 },
      contact: { email: 'maria@example.com' },
    },
    {
      id: 'member_004',
      memberNo: '0004',
      name: 'Pedro Sanchez',
      status: 'active',
      plan: { monthlyFee: 25000, dueDay: 1 },
    },
    {
      id: 'member_005',
      memberNo: '0005',
      name: 'Ana Martinez',
      status: 'paused',
      plan: { monthlyFee: 25000, dueDay: 20 },
    },
    {
      id: 'member_006',
      memberNo: '0006',
      name: 'Luis Rodriguez',
      status: 'active',
      plan: { monthlyFee: 30000, dueDay: 8 },
      contact: { phone: '+56955555555' },
    },
    {
      id: 'member_007',
      memberNo: '0007',
      name: 'Claudia Vargas',
      status: 'active',
      plan: { monthlyFee: 25000, dueDay: 12 },
    },
    {
      id: 'member_008',
      memberNo: '0008',
      name: 'Roberto Diaz',
      status: 'active',
      plan: { monthlyFee: 25000, dueDay: 25 },
      contact: { email: 'roberto@example.com' },
    },
  ]
}

// Generar pagos de los ultimos 3 meses
function createSeedPayments(members: Member[]): Payment[] {
  const payments: Payment[] = []
  const now = new Date()

  // Meses: actual, anterior, hace 2 meses
  const periods = [
    format(now, 'yyyy-MM'),
    format(subMonths(now, 1), 'yyyy-MM'),
    format(subMonths(now, 2), 'yyyy-MM'),
  ]

  // Algunos miembros tienen pagos completos, otros parciales
  const paymentData: { memberId: string; paidPeriods: number[] }[] = [
    { memberId: DEMO_MEMBER_ID, paidPeriods: [0, 1, 2] }, // Demo al dia
    { memberId: 'member_002', paidPeriods: [0, 1, 2] },
    { memberId: 'member_003', paidPeriods: [1, 2] }, // Debe mes actual
    { memberId: 'member_004', paidPeriods: [0, 1, 2] },
    { memberId: 'member_006', paidPeriods: [2] }, // Debe 2 meses
    { memberId: 'member_007', paidPeriods: [0, 1, 2] },
    { memberId: 'member_008', paidPeriods: [1, 2] }, // Debe mes actual
  ]

  let receiptCounter = 1000

  paymentData.forEach(({ memberId, paidPeriods }) => {
    const member = members.find((m) => m.id === memberId)
    if (!member) return

    paidPeriods.forEach((periodIdx) => {
      const period = periods[periodIdx]
      const paidDate = subMonths(now, periodIdx)
      paidDate.setDate(member.plan.dueDay > 28 ? 28 : member.plan.dueDay)

      payments.push({
        id: nanoid(),
        memberId,
        paidAt: paidDate.toISOString(),
        period,
        amount: member.plan.monthlyFee,
        method: periodIdx % 2 === 0 ? 'cash' : 'card',
        receiptNo: `R${++receiptCounter}`,
      })
    })
  })

  return payments
}

// Generar asistencias del ultimo mes
function createSeedAttendance(members: Member[]): AttendanceEvent[] {
  const events: AttendanceEvent[] = []
  const now = new Date()
  const activeMembers = members.filter((m) => m.status === 'active')

  // Generar visitas aleatorias para cada miembro activo
  activeMembers.forEach((member) => {
    // Entre 5 y 15 visitas en el ultimo mes
    const visitCount = 5 + Math.floor(Math.random() * 10)

    for (let i = 0; i < visitCount; i++) {
      const daysAgo = Math.floor(Math.random() * 28)
      const entryDate = subDays(now, daysAgo)
      entryDate.setHours(7 + Math.floor(Math.random() * 12)) // 7am - 7pm
      entryDate.setMinutes(Math.floor(Math.random() * 60))

      // Entrada
      events.push({
        id: nanoid(),
        memberId: member.id,
        type: 'IN',
        ts: entryDate.toISOString(),
        source: Math.random() > 0.3 ? 'QR' : 'MANUAL',
      })

      // Salida (90% de las veces, para simular sesiones incompletas)
      if (Math.random() > 0.1) {
        const exitDate = addHours(entryDate, 1 + Math.floor(Math.random() * 2))
        events.push({
          id: nanoid(),
          memberId: member.id,
          type: 'OUT',
          ts: exitDate.toISOString(),
          source: Math.random() > 0.3 ? 'QR' : 'MANUAL',
        })
      }
    }
  })

  // Ordenar por timestamp
  return events.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime())
}

// Generar registros de caja basados en pagos
function createSeedCashSheet(
  payments: Payment[],
  members: Member[]
): CashRow[] {
  return payments.map((payment) => {
    const member = members.find((m) => m.id === payment.memberId)
    return {
      id: nanoid(),
      date: payment.paidAt.split('T')[0],
      memberId: payment.memberId,
      memberNo: member?.memberNo || '----',
      memberName: member?.name || 'Desconocido',
      receiptNo: payment.receiptNo || '',
      boleta: '',
      efectivo: payment.method === 'cash' ? payment.amount : 0,
      tarjeta: payment.method === 'card' ? payment.amount : 0,
      total: payment.amount,
      linkedPaymentId: payment.id,
    }
  })
}

// Crear seed completo
export function createSeedDB(): GymDB {
  const now = new Date().toISOString()
  const members = createSeedMembers()
  const payments = createSeedPayments(members)
  const attendance = createSeedAttendance(members)
  const cashSheet = createSeedCashSheet(payments, members)

  return {
    meta: {
      version: 1,
      createdAt: now,
      updatedAt: now,
    },
    auth: {
      session: {
        username: null,
        role: null,
        createdAt: null,
      },
    },
    members,
    payments,
    attendance,
    cashSheet,
  }
}
