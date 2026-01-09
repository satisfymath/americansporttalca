// Seed inicial para demo American Sport Gym
import { nanoid } from 'nanoid'
import { format, subMonths, subDays, addHours } from 'date-fns'
import type { GymDB, Member, Payment, AttendanceEvent, CashRow, PaymentOperationType } from './schema'

// ID fijo para el usuario demo (username "demo")
export const DEMO_MEMBER_ID = 'member_demo_001'

// Generar miembros seed con perfiles extendidos
function createSeedMembers(): Member[] {
  const now = new Date()
  return [
    {
      id: DEMO_MEMBER_ID,
      memberNo: '0001',
      name: 'Usuario Demo',
      status: 'active',
      plan: { monthlyFee: 25000, dueDay: 5, type: 'full' },
      contact: { phone: '+56912345678', email: 'demo@example.com' },
      profile: {
        rut: '12.345.678-9',
        birthDate: '1995-03-15',
        emergencyContact: '+56911111111 (Maria Demo)',
        notes: 'Usuario de demostracion del sistema',
        joinDate: subMonths(now, 8).toISOString(),
      },
    },
    {
      id: 'member_002',
      memberNo: '0002',
      name: 'Carlos Gonzalez',
      status: 'active',
      plan: { monthlyFee: 20000, dueDay: 10, type: 'estudiante' },
      contact: { phone: '+56987654321' },
      profile: {
        rut: '20.123.456-7',
        birthDate: '2002-07-20',
        notes: 'Estudiante de Ingenieria Civil, carnet vigente hasta dic 2026',
        joinDate: subMonths(now, 14).toISOString(),
      },
    },
    {
      id: 'member_003',
      memberNo: '0003',
      name: 'Maria Fernandez',
      status: 'active',
      plan: { monthlyFee: 30000, dueDay: 15, type: 'full' },
      contact: { email: 'maria@example.com' },
      profile: {
        rut: '15.678.901-2',
        birthDate: '1988-11-22',
        emergencyContact: '+56922222222 (Pedro, esposo)',
        notes: 'Prefiere clases grupales. Entrena de 7-9 AM',
        joinDate: subMonths(now, 24).toISOString(),
      },
    },
    {
      id: 'member_004',
      memberNo: '0004',
      name: 'Pedro Sanchez',
      status: 'active',
      plan: { monthlyFee: 25000, dueDay: 1, type: 'full' },
      profile: {
        rut: '14.567.890-3',
        birthDate: '1990-05-10',
        joinDate: subMonths(now, 6).toISOString(),
      },
    },
    {
      id: 'member_005',
      memberNo: '0005',
      name: 'Ana Martinez',
      status: 'paused',
      plan: { monthlyFee: 25000, dueDay: 20, type: 'full' },
      profile: {
        rut: '16.789.012-4',
        birthDate: '1992-08-05',
        notes: 'Pausada por embarazo. Retorna en marzo 2026',
        joinDate: subMonths(now, 18).toISOString(),
      },
    },
    {
      id: 'member_006',
      memberNo: '0006',
      name: 'Luis Rodriguez',
      status: 'active',
      plan: { monthlyFee: 22000, dueDay: 8, type: 'antiguo' },
      contact: { phone: '+56955555555' },
      profile: {
        rut: '10.234.567-8',
        birthDate: '1975-02-14',
        emergencyContact: '+56966666666 (Rosa, esposa)',
        notes: 'Cliente fundador desde 2019. Plan con descuento especial',
        joinDate: subMonths(now, 60).toISOString(),
      },
    },
    {
      id: 'member_007',
      memberNo: '0007',
      name: 'Claudia Vargas',
      status: 'active',
      plan: { monthlyFee: 25000, dueDay: 12, type: 'full' },
      profile: {
        rut: '17.890.123-5',
        birthDate: '1993-09-30',
        joinDate: subMonths(now, 10).toISOString(),
      },
    },
    {
      id: 'member_008',
      memberNo: '0008',
      name: 'Roberto Diaz',
      status: 'active',
      plan: { monthlyFee: 25000, dueDay: 25, type: 'full' },
      contact: { email: 'roberto@example.com' },
      profile: {
        rut: '13.456.789-0',
        birthDate: '1985-12-01',
        notes: 'Entrena principalmente en las tardes',
        joinDate: subMonths(now, 4).toISOString(),
      },
    },
    {
      id: 'member_009',
      memberNo: '0009',
      name: 'Felipe Rojas',
      status: 'active',
      plan: { monthlyFee: 20000, dueDay: 5, type: 'estudiante' },
      contact: { email: 'felipe@universidad.cl' },
      profile: {
        rut: '21.234.567-K',
        birthDate: '2003-04-18',
        notes: 'Estudiante de Medicina. Horario variable',
        joinDate: subMonths(now, 3).toISOString(),
      },
    },
    {
      id: 'member_010',
      memberNo: '0010',
      name: 'Carmen Soto',
      status: 'active',
      plan: { monthlyFee: 22000, dueDay: 15, type: 'antiguo' },
      contact: { phone: '+56977777777' },
      profile: {
        rut: '11.345.678-1',
        birthDate: '1978-06-25',
        emergencyContact: '+56988888888 (Hijo Juan)',
        notes: 'Cliente desde 2020. Siempre puntual con pagos',
        joinDate: subMonths(now, 48).toISOString(),
      },
    },
    {
      id: 'member_011',
      memberNo: '0011',
      name: 'Diego Fuentes',
      status: 'paused',
      plan: { monthlyFee: 25000, dueDay: 20, type: 'full' },
      profile: {
        rut: '18.456.789-2',
        birthDate: '1996-01-08',
        notes: 'Pausado por viaje de trabajo. Retorna en febrero',
        joinDate: subMonths(now, 12).toISOString(),
      },
    },
    {
      id: 'member_012',
      memberNo: '0012',
      name: 'Isabella Torres',
      status: 'active',
      plan: { monthlyFee: 25000, dueDay: 1, type: 'full' },
      contact: { phone: '+56999999999', email: 'isa.torres@gmail.com' },
      profile: {
        rut: '16.543.210-K',
        birthDate: '1991-10-12',
        emergencyContact: '+56900000000 (Mama Lucia)',
        notes: 'Muy comprometida. Asiste 5 veces por semana',
        joinDate: subMonths(now, 20).toISOString(),
      },
    },
    {
      id: 'member_013',
      memberNo: '0013',
      name: 'Andres Muñoz',
      status: 'active',
      plan: { monthlyFee: 20000, dueDay: 10, type: 'estudiante' },
      contact: { email: 'andres.m@uni.cl' },
      profile: {
        rut: '22.111.222-3',
        birthDate: '2004-03-22',
        notes: 'Estudiante nuevo. Interesado en pesas',
        joinDate: subMonths(now, 1).toISOString(),
      },
    },
    {
      id: 'member_014',
      memberNo: '0014',
      name: 'Patricia Vera',
      status: 'active',
      plan: { monthlyFee: 30000, dueDay: 5, type: 'full' },
      contact: { phone: '+56911122233' },
      profile: {
        rut: '12.222.333-4',
        birthDate: '1982-07-14',
        emergencyContact: '+56944455566 (Hermana Rosa)',
        notes: 'Prefiere maquinas cardiovasculares',
        joinDate: subMonths(now, 30).toISOString(),
      },
    },
    {
      id: 'member_015',
      memberNo: '0015',
      name: 'Jorge Pizarro',
      status: 'active',
      plan: { monthlyFee: 22000, dueDay: 18, type: 'antiguo' },
      profile: {
        rut: '9.876.543-2',
        birthDate: '1970-11-30',
        notes: 'Cliente veterano. Entrena desde 2018',
        joinDate: subMonths(now, 72).toISOString(),
      },
    },
  ]
}

// Generar pagos de los ultimos 6 meses
function createSeedPayments(members: Member[]): Payment[] {
  const payments: Payment[] = []
  const now = new Date()

  // Meses: actual hasta hace 5 meses (6 total)
  const periods = Array.from({ length: 6 }, (_, i) =>
    format(subMonths(now, i), 'yyyy-MM')
  )

  // Patrones de pago para cada miembro
  const paymentPatterns: { memberId: string; paidPeriods: number[] }[] = [
    { memberId: DEMO_MEMBER_ID, paidPeriods: [0, 1, 2, 3, 4, 5] },
    { memberId: 'member_002', paidPeriods: [0, 1, 2, 3, 4, 5] },
    { memberId: 'member_003', paidPeriods: [1, 2, 3, 4, 5] },
    { memberId: 'member_004', paidPeriods: [0, 1, 2, 3, 4, 5] },
    { memberId: 'member_006', paidPeriods: [2, 3, 4, 5] },
    { memberId: 'member_007', paidPeriods: [0, 1, 2, 3, 4, 5] },
    { memberId: 'member_008', paidPeriods: [1, 2, 3] },
    { memberId: 'member_009', paidPeriods: [0, 1, 2] },
    { memberId: 'member_010', paidPeriods: [0, 1, 2, 3, 4, 5] },
    { memberId: 'member_012', paidPeriods: [0, 1, 2, 3, 4, 5] },
    { memberId: 'member_013', paidPeriods: [0] },
    { memberId: 'member_014', paidPeriods: [0, 1, 2, 3, 4, 5] },
    { memberId: 'member_015', paidPeriods: [0, 1, 2, 3, 4, 5] },
  ]

  let receiptCounter = 1000

  paymentPatterns.forEach(({ memberId, paidPeriods }) => {
    const member = members.find((m) => m.id === memberId)
    if (!member) return

    paidPeriods.forEach((periodIdx, arrayIdx) => {
      const period = periods[periodIdx]
      const paidDate = subMonths(now, periodIdx)
      paidDate.setDate(Math.min(member.plan.dueDay, 28))

      const isFirstPayment = arrayIdx === paidPeriods.length - 1 && periodIdx >= 3
      const operationType: PaymentOperationType = isFirstPayment ? 'inicio' : 'renovacion'

      payments.push({
        id: nanoid(),
        memberId,
        paidAt: paidDate.toISOString(),
        period,
        amount: member.plan.monthlyFee,
        method: periodIdx % 3 === 0 ? 'cash' : periodIdx % 3 === 1 ? 'card' : 'transfer',
        receiptNo: `R${++receiptCounter}`,
        planType: member.plan.type,
        operationType,
      })
    })
  })

  return payments
}

// Generar asistencias del ultimo mes con patrones variados
function createSeedAttendance(members: Member[]): AttendanceEvent[] {
  const events: AttendanceEvent[] = []
  const now = new Date()
  const activeMembers = members.filter((m) => m.status === 'active')

  // Patrones de asistencia por miembro
  const attendancePatterns: Record<string, { minVisits: number; maxVisits: number }> = {
    [DEMO_MEMBER_ID]: { minVisits: 12, maxVisits: 18 },
    'member_002': { minVisits: 8, maxVisits: 12 },
    'member_003': { minVisits: 18, maxVisits: 22 },
    'member_004': { minVisits: 6, maxVisits: 10 },
    'member_006': { minVisits: 15, maxVisits: 20 },
    'member_007': { minVisits: 10, maxVisits: 14 },
    'member_008': { minVisits: 4, maxVisits: 8 },
    'member_009': { minVisits: 8, maxVisits: 12 },
    'member_010': { minVisits: 16, maxVisits: 20 },
    'member_012': { minVisits: 20, maxVisits: 25 },
    'member_013': { minVisits: 6, maxVisits: 10 },
    'member_014': { minVisits: 12, maxVisits: 16 },
    'member_015': { minVisits: 10, maxVisits: 14 },
  }

  activeMembers.forEach((member) => {
    const pattern = attendancePatterns[member.id] || { minVisits: 5, maxVisits: 15 }
    const visitCount = pattern.minVisits + Math.floor(Math.random() * (pattern.maxVisits - pattern.minVisits))

    for (let i = 0; i < visitCount; i++) {
      const daysAgo = Math.floor(Math.random() * 30)
      const entryDate = subDays(now, daysAgo)
      
      // Horarios realistas: picos mañana y tarde
      const hourDistribution = [6, 7, 7, 8, 8, 8, 9, 9, 17, 17, 18, 18, 18, 19, 19, 20, 20, 21]
      const randomHour = hourDistribution[Math.floor(Math.random() * hourDistribution.length)]
      entryDate.setHours(randomHour)
      entryDate.setMinutes(Math.floor(Math.random() * 60))

      // Entrada
      events.push({
        id: nanoid(),
        memberId: member.id,
        type: 'IN',
        ts: entryDate.toISOString(),
        source: Math.random() > 0.2 ? 'QR' : 'MANUAL',
      })

      // Salida (95% de las veces)
      if (Math.random() > 0.05) {
        const sessionLength = 1 + Math.floor(Math.random() * 2)
        const exitDate = addHours(entryDate, sessionLength)
        events.push({
          id: nanoid(),
          memberId: member.id,
          type: 'OUT',
          ts: exitDate.toISOString(),
          source: Math.random() > 0.2 ? 'QR' : 'MANUAL',
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
      boleta: Math.random() > 0.5 ? `B${Math.floor(Math.random() * 9000 + 1000)}` : '',
      efectivo: payment.method === 'cash' ? payment.amount : 0,
      tarjeta: payment.method === 'card' || payment.method === 'transfer' ? payment.amount : 0,
      total: payment.amount,
      linkedPaymentId: payment.id,
      planType: payment.planType || member?.plan.type || 'full',
      operationType: payment.operationType || 'renovacion',
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
    onlinePayments: [],
    bankDeposits: [],
  }
}
