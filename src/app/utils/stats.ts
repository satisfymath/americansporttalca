// Funciones para calcular estadisticas 360 de miembros
// Vista completa del cliente para el panel de administrador

import { differenceInMonths, parseISO, format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Member, Payment, AttendanceEvent } from '../data/schema'
import { getNextDueDate, isOverdue, isDueSoon } from './dates'

export type VisitsByMonth = {
  month: string      // "2026-01"
  monthLabel: string // "Enero"
  count: number
}

export type PaymentStatus360 = 'al_dia' | 'por_vencer' | 'vencido'

export type MemberStats360 = {
  memberId: string
  memberName: string
  memberNo: string
  memberSince: string              // Fecha de inscripcion ISO
  memberSinceLabel: string         // "Hace 8 meses"
  monthsAsMember: number           // Meses desde inscripcion
  
  // Visitas
  totalVisits: number              // Visitas totales historicas
  visitsThisMonth: number          // Visitas del mes actual
  visitsLastMonth: number          // Visitas mes anterior
  avgVisitsPerMonth: number        // Promedio visitas/mes
  visitsTrend: 'up' | 'down' | 'stable'  // Tendencia
  visitsByMonth: VisitsByMonth[]   // Ultimos 6 meses
  
  // Pagos
  totalPayments: number            // Total pagos realizados
  totalAmountPaid: number          // Monto total pagado CLP
  lastPaymentDate: string | null   // Ultimo pago
  lastPaymentDateLabel: string     // Formateado
  paymentStatus: PaymentStatus360
  paymentStatusLabel: string
  consecutiveMonthsPaid: number    // Meses consecutivos al dia
  nextDueDate: Date
  nextDueDateLabel: string
  
  // Plan
  planType: string
  planTypeLabel: string
  monthlyFee: number
}

/**
 * Calcula estadisticas 360 completas para un miembro
 */
export function calculateMember360(
  member: Member,
  allPayments: Payment[],
  allAttendance: AttendanceEvent[]
): MemberStats360 {
  const now = new Date()
  
  // Filtrar datos del miembro
  const memberPayments = allPayments.filter(p => p.memberId === member.id)
  const memberAttendance = allAttendance.filter(a => 
    a.memberId === member.id && a.type === 'IN'
  )
  
  // Fecha de inscripcion
  const joinDate = member.profile?.joinDate 
    ? parseISO(member.profile.joinDate) 
    : subMonths(now, 1) // fallback a hace 1 mes
  
  const monthsAsMember = Math.max(1, differenceInMonths(now, joinDate))
  
  // Calcular visitas por mes (ultimos 6 meses)
  const visitsByMonth: VisitsByMonth[] = []
  for (let i = 0; i < 6; i++) {
    const monthDate = subMonths(now, i)
    const monthStr = format(monthDate, 'yyyy-MM')
    const monthLabel = format(monthDate, 'MMMM', { locale: es })
    const start = startOfMonth(monthDate)
    const end = endOfMonth(monthDate)
    
    const count = memberAttendance.filter(a => {
      const d = parseISO(a.ts)
      return d >= start && d <= end
    }).length
    
    visitsByMonth.push({ month: monthStr, monthLabel, count })
  }
  
  const visitsThisMonth = visitsByMonth[0]?.count || 0
  const visitsLastMonth = visitsByMonth[1]?.count || 0
  const totalVisits = memberAttendance.length
  const avgVisitsPerMonth = monthsAsMember > 0 
    ? Math.round(totalVisits / monthsAsMember) 
    : totalVisits
  
  // Tendencia de visitas
  let visitsTrend: 'up' | 'down' | 'stable' = 'stable'
  if (visitsLastMonth > 0) {
    if (visitsThisMonth > visitsLastMonth * 1.2) visitsTrend = 'up'
    else if (visitsThisMonth < visitsLastMonth * 0.8) visitsTrend = 'down'
  }
  
  // Estadisticas de pagos
  const totalPayments = memberPayments.length
  const totalAmountPaid = memberPayments.reduce((sum, p) => sum + p.amount, 0)
  const sortedPayments = [...memberPayments].sort(
    (a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime()
  )
  const lastPaymentDate = sortedPayments[0]?.paidAt || null
  const lastPaidPeriod = sortedPayments[0]?.period || null
  
  // Estado de pago
  const nextDueDate = getNextDueDate(member.plan.dueDay, lastPaidPeriod)
  let paymentStatus: PaymentStatus360 = 'al_dia'
  let paymentStatusLabel = 'Al dia'
  
  if (isOverdue(nextDueDate)) {
    paymentStatus = 'vencido'
    paymentStatusLabel = 'Vencido'
  } else if (isDueSoon(nextDueDate)) {
    paymentStatus = 'por_vencer'
    paymentStatusLabel = 'Por vencer'
  }
  
  // Meses consecutivos pagados (simplificado)
  const consecutiveMonthsPaid = calculateConsecutiveMonths(memberPayments)
  
  // Labels de tipo de plan
  const planTypeLabels: Record<string, string> = {
    'full': 'Normal Full',
    'estudiante': 'Estudiante',
    'antiguo': 'Cliente Antiguo',
  }
  
  return {
    memberId: member.id,
    memberName: member.name,
    memberNo: member.memberNo,
    memberSince: joinDate.toISOString(),
    memberSinceLabel: `Hace ${monthsAsMember} ${monthsAsMember === 1 ? 'mes' : 'meses'}`,
    monthsAsMember,
    
    totalVisits,
    visitsThisMonth,
    visitsLastMonth,
    avgVisitsPerMonth,
    visitsTrend,
    visitsByMonth,
    
    totalPayments,
    totalAmountPaid,
    lastPaymentDate,
    lastPaymentDateLabel: lastPaymentDate 
      ? format(parseISO(lastPaymentDate), 'd MMM yyyy', { locale: es })
      : 'Sin pagos',
    paymentStatus,
    paymentStatusLabel,
    consecutiveMonthsPaid,
    nextDueDate,
    nextDueDateLabel: format(nextDueDate, 'd MMM yyyy', { locale: es }),
    
    planType: member.plan.type,
    planTypeLabel: planTypeLabels[member.plan.type] || member.plan.type,
    monthlyFee: member.plan.monthlyFee,
  }
}

/**
 * Calcula meses consecutivos pagados
 */
function calculateConsecutiveMonths(payments: Payment[]): number {
  if (payments.length === 0) return 0
  
  // Ordenar por periodo descendente
  const sortedByPeriod = [...payments]
    .sort((a, b) => b.period.localeCompare(a.period))
  
  // Contar meses consecutivos
  let consecutive = 1
  for (let i = 1; i < sortedByPeriod.length; i++) {
    const currentPeriod = sortedByPeriod[i - 1].period
    const prevPeriod = sortedByPeriod[i].period
    
    // Verificar si son meses consecutivos
    const [currYear, currMonth] = currentPeriod.split('-').map(Number)
    const [prevYear, prevMonth] = prevPeriod.split('-').map(Number)
    
    const currMonths = currYear * 12 + currMonth
    const prevMonths = prevYear * 12 + prevMonth
    
    if (currMonths - prevMonths === 1) {
      consecutive++
    } else {
      break
    }
  }
  
  return consecutive
}

/**
 * Genera estadisticas agregadas de todos los miembros (para dashboard admin)
 */
export function calculateGymStats(
  members: Member[],
  payments: Payment[],
  attendance: AttendanceEvent[]
) {
  const now = new Date()
  const currentPeriod = format(now, 'yyyy-MM')
  const lastPeriod = format(subMonths(now, 1), 'yyyy-MM')
  
  // Miembros activos
  const activeMembers = members.filter(m => m.status === 'active').length
  const pausedMembers = members.filter(m => m.status === 'paused').length
  
  // Ingresos
  const incomeThisMonth = payments
    .filter(p => p.paidAt.startsWith(currentPeriod))
    .reduce((sum, p) => sum + p.amount, 0)
  
  const incomeLastMonth = payments
    .filter(p => p.paidAt.startsWith(lastPeriod))
    .reduce((sum, p) => sum + p.amount, 0)
  
  // Asistencias
  const start = startOfMonth(now)
  const end = endOfMonth(now)
  const attendanceThisMonth = attendance.filter(a => {
    const d = parseISO(a.ts)
    return a.type === 'IN' && d >= start && d <= end
  }).length
  
  const startLast = startOfMonth(subMonths(now, 1))
  const endLast = endOfMonth(subMonths(now, 1))
  const attendanceLastMonth = attendance.filter(a => {
    const d = parseISO(a.ts)
    return a.type === 'IN' && d >= startLast && d <= endLast
  }).length
  
  // Miembros con deuda
  const membersWithDebt = members.filter(m => {
    if (m.status !== 'active') return false
    const memberPayments = payments.filter(p => p.memberId === m.id)
    const lastPaidPeriod = memberPayments.length > 0
      ? [...memberPayments].sort((a, b) => b.period.localeCompare(a.period))[0].period
      : null
    const nextDueDate = getNextDueDate(m.plan.dueDay, lastPaidPeriod)
    return isOverdue(nextDueDate)
  }).length
  
  // Por tipo de plan
  const byPlanType = {
    full: members.filter(m => m.plan.type === 'full').length,
    estudiante: members.filter(m => m.plan.type === 'estudiante').length,
    antiguo: members.filter(m => m.plan.type === 'antiguo').length,
  }
  
  return {
    totalMembers: members.length,
    activeMembers,
    pausedMembers,
    incomeThisMonth,
    incomeLastMonth,
    incomeTrend: incomeThisMonth >= incomeLastMonth ? 'up' : 'down',
    attendanceThisMonth,
    attendanceLastMonth,
    attendanceTrend: attendanceThisMonth >= attendanceLastMonth ? 'up' : 'down',
    membersWithDebt,
    byPlanType,
  }
}

/**
 * Obtiene ranking de miembros mas activos
 */
export function getMostActiveMembers(
  members: Member[],
  attendance: AttendanceEvent[],
  limit: number = 5
): { member: Member; visits: number }[] {
  const now = new Date()
  const start = startOfMonth(now)
  const end = endOfMonth(now)
  
  const visitsPerMember = new Map<string, number>()
  
  attendance
    .filter(a => {
      const d = parseISO(a.ts)
      return a.type === 'IN' && d >= start && d <= end
    })
    .forEach(a => {
      visitsPerMember.set(a.memberId, (visitsPerMember.get(a.memberId) || 0) + 1)
    })
  
  return [...visitsPerMember.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([memberId, visits]) => ({
      member: members.find(m => m.id === memberId)!,
      visits,
    }))
    .filter(item => item.member)
}
