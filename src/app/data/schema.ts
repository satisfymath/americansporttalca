// Schema de datos para American Sport Gym Demo
// Persistencia en LocalStorage key: ASG_DEMO_DB_V1

export type Role = 'admin' | 'user'

export type AuthSession = {
  username: 'admin' | 'demo' | null
  role: Role | null
  createdAt: string | null
}

// Tipos de plan disponibles
export type PlanType = 'estudiante' | 'antiguo' | 'full'

// Tipo de operacion de pago
export type PaymentOperationType = 'inicio' | 'renovacion'

// Perfil extendido del miembro
export type MemberProfile = {
  photo?: string           // base64 o URL
  rut?: string
  birthDate?: string       // ISO date
  emergencyContact?: string
  notes?: string
  joinDate: string         // Fecha de inscripcion ISO
}

export type Member = {
  id: string
  memberNo: string // "0001", "0002"...
  name: string
  status: 'active' | 'paused'
  plan: {
    monthlyFee: number
    dueDay: number // 1..28 (dia de vencimiento mensual)
    type: PlanType // tipo de plan
  }
  contact?: {
    phone?: string
    email?: string
  }
  profile?: MemberProfile
}

export type PaymentMethod = 'cash' | 'card' | 'transfer'

export type Attachment = {
  name: string
  mime: string
  base64: string
}

export type Payment = {
  id: string
  memberId: string
  paidAt: string // ISO date-time
  period: string // "2026-01" (mes que cubre)
  amount: number
  method: PaymentMethod
  receiptNo?: string
  invoiceNo?: string
  attachment?: Attachment
  notes?: string
  planType?: PlanType              // tipo de plan al momento del pago
  operationType?: PaymentOperationType // inicio o renovacion
}

export type AttendanceType = 'IN' | 'OUT'

export type AttendanceEvent = {
  id: string
  memberId: string
  type: AttendanceType
  ts: string // ISO date-time
  source: 'QR' | 'MANUAL' | 'SYSTEM'
  qrToken?: string // token QR usado para esta entrada (validacion anti-fraude)
}

export type CashRow = {
  id: string
  date: string // ISO date
  memberId: string
  memberNo: string
  memberName: string
  receiptNo: string
  boleta: string
  efectivo: number
  tarjeta: number
  total: number
  linkedPaymentId?: string
  attachment?: Attachment
  planType: PlanType              // tipo de plan
  operationType: PaymentOperationType // inicio o renovacion
}

// Pago online simulado
export type OnlinePayment = {
  id: string
  memberId: string
  amount: number
  status: 'pending' | 'completed' | 'failed'
  transactionId: string       // Simulado: "WP-2026010912345"
  method: 'webpay' | 'card_online' | 'transfer'
  createdAt: string
  completedAt?: string
  period: string              // Mes que cubre
  cardLast4?: string          // Ultimos 4 digitos simulados
}

// Registro de depósito bancario diario
export type BankDeposit = {
  id: string
  date: string                // Fecha del depósito (día que se deposita el efectivo del día anterior)
  cashDate: string            // Fecha del efectivo depositado (día anterior)
  amount: number              // Monto depositado
  bankName: string            // Nombre del banco
  accountNumber?: string      // Número de cuenta (últimos 4 dígitos)
  voucherPhoto: Attachment    // Foto del boucher/comprobante
  notes?: string
  createdAt: string
  createdBy: string           // Usuario que registró
}

export type GymDB = {
  meta: { version: 1; createdAt: string; updatedAt: string }
  auth: { session: AuthSession }
  members: Member[]
  payments: Payment[]
  attendance: AttendanceEvent[]
  cashSheet: CashRow[]
  onlinePayments: OnlinePayment[]
  bankDeposits: BankDeposit[]
}

// Constantes
export const DB_KEY = 'ASG_DEMO_DB_V1'
export const DB_VERSION = 1
