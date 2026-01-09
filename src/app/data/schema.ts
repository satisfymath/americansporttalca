// Schema de datos para American Sport Gym Demo
// Persistencia en LocalStorage key: ASG_DEMO_DB_V1

export type Role = 'admin' | 'user'

export type AuthSession = {
  username: 'admin' | 'demo' | null
  role: Role | null
  createdAt: string | null
}

export type Member = {
  id: string
  memberNo: string // "0001", "0002"...
  name: string
  status: 'active' | 'paused'
  plan: {
    monthlyFee: number
    dueDay: number // 1..28 (dia de vencimiento mensual)
  }
  contact?: {
    phone?: string
    email?: string
  }
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
}

export type AttendanceType = 'IN' | 'OUT'

export type AttendanceEvent = {
  id: string
  memberId: string
  type: AttendanceType
  ts: string // ISO date-time
  source: 'QR' | 'MANUAL'
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
}

export type GymDB = {
  meta: { version: 1; createdAt: string; updatedAt: string }
  auth: { session: AuthSession }
  members: Member[]
  payments: Payment[]
  attendance: AttendanceEvent[]
  cashSheet: CashRow[]
}

// Constantes
export const DB_KEY = 'ASG_DEMO_DB_V1'
export const DB_VERSION = 1
