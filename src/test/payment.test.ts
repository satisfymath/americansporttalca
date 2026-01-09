// Tests para pagos online
import { describe, it, expect, beforeEach } from 'vitest'
import { resetDb, updateDb, loadDb } from '../app/state/storage'
import { nanoid } from 'nanoid'
import type { OnlinePayment, Payment } from '../app/data/schema'

describe('Online Payment', () => {
  beforeEach(() => {
    resetDb()
  })

  describe('OnlinePayment type', () => {
    it('should allow creating a valid online payment', () => {
      const db = loadDb()
      const memberId = db.members[0]?.id
      if (!memberId) throw new Error('No members in seed data')

      const onlinePayment: OnlinePayment = {
        id: nanoid(),
        memberId,
        amount: 25000,
        status: 'completed',
        transactionId: 'WP-TEST123',
        method: 'webpay',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        period: '2025-01',
        cardLast4: '1234',
      }

      expect(onlinePayment.id).toBeDefined()
      expect(onlinePayment.status).toBe('completed')
      expect(onlinePayment.method).toBe('webpay')
    })

    it('should persist online payment to storage', () => {
      const db = loadDb()
      const memberId = db.members[0]?.id
      if (!memberId) throw new Error('No members in seed data')

      const onlinePayment: OnlinePayment = {
        id: nanoid(),
        memberId,
        amount: 25000,
        status: 'completed',
        transactionId: 'WP-TEST456',
        method: 'webpay',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        period: '2025-01',
        cardLast4: '5678',
      }

      updateDb((d) => {
        d.onlinePayments.push(onlinePayment)
        return d
      })

      const newDb = loadDb()
      expect(newDb.onlinePayments.length).toBeGreaterThan(0)

      const saved = newDb.onlinePayments.find((p) => p.id === onlinePayment.id)
      expect(saved).toBeDefined()
      expect(saved?.transactionId).toBe('WP-TEST456')
    })
  })

  describe('Payment with planType and operationType', () => {
    it('should create payment with plan type estudiante', () => {
      const db = loadDb()
      const memberId = db.members[0]?.id
      if (!memberId) throw new Error('No members in seed data')

      const payment: Payment = {
        id: nanoid(),
        memberId,
        paidAt: new Date().toISOString(),
        period: '2025-01',
        amount: 20000,
        method: 'cash',
        planType: 'estudiante',
        operationType: 'inicio',
      }

      updateDb((d) => {
        d.payments.push(payment)
        return d
      })

      const newDb = loadDb()
      const saved = newDb.payments.find((p) => p.id === payment.id)
      expect(saved?.planType).toBe('estudiante')
      expect(saved?.operationType).toBe('inicio')
    })

    it('should create payment with plan type antiguo', () => {
      const db = loadDb()
      const memberId = db.members[0]?.id
      if (!memberId) throw new Error('No members in seed data')

      const payment: Payment = {
        id: nanoid(),
        memberId,
        paidAt: new Date().toISOString(),
        period: '2025-01',
        amount: 22000,
        method: 'card',
        planType: 'antiguo',
        operationType: 'renovacion',
      }

      updateDb((d) => {
        d.payments.push(payment)
        return d
      })

      const newDb = loadDb()
      const saved = newDb.payments.find((p) => p.id === payment.id)
      expect(saved?.planType).toBe('antiguo')
      expect(saved?.operationType).toBe('renovacion')
    })

    it('should create payment with plan type full', () => {
      const db = loadDb()
      const memberId = db.members[0]?.id
      if (!memberId) throw new Error('No members in seed data')

      const payment: Payment = {
        id: nanoid(),
        memberId,
        paidAt: new Date().toISOString(),
        period: '2025-01',
        amount: 30000,
        method: 'transfer',
        planType: 'full',
        operationType: 'renovacion',
      }

      updateDb((d) => {
        d.payments.push(payment)
        return d
      })

      const newDb = loadDb()
      const saved = newDb.payments.find((p) => p.id === payment.id)
      expect(saved?.planType).toBe('full')
    })
  })

  describe('Integration: Online payment creates regular payment', () => {
    it('should create both online payment and regular payment', () => {
      const db = loadDb()
      const memberId = db.members[0]?.id
      if (!memberId) throw new Error('No members in seed data')

      const txId = `WP-${Date.now().toString(36).toUpperCase()}`

      // Simulate what the OnlinePayment page does
      const onlinePayment: OnlinePayment = {
        id: nanoid(),
        memberId,
        amount: 25000,
        status: 'completed',
        transactionId: txId,
        method: 'webpay',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        period: '2025-01',
        cardLast4: '1111',
      }

      const payment: Payment = {
        id: nanoid(),
        memberId,
        paidAt: new Date().toISOString(),
        period: '2025-01',
        amount: 25000,
        method: 'card',
        receiptNo: txId,
        notes: `Pago online - ${txId}`,
        planType: 'full',
        operationType: 'renovacion',
      }

      updateDb((d) => {
        d.onlinePayments.push(onlinePayment)
        d.payments.push(payment)
        d.cashSheet.push({
          id: nanoid(),
          date: new Date().toISOString().split('T')[0],
          memberId,
          memberNo: d.members.find((m) => m.id === memberId)!.memberNo,
          memberName: d.members.find((m) => m.id === memberId)!.name,
          receiptNo: txId,
          boleta: '',
          efectivo: 0,
          tarjeta: 25000,
          total: 25000,
          linkedPaymentId: payment.id,
          planType: 'full',
          operationType: 'renovacion',
        })
        return d
      })

      const newDb = loadDb()

      // Verify all were created
      const savedOnline = newDb.onlinePayments.find((p) => p.transactionId === txId)
      const savedPayment = newDb.payments.find((p) => p.receiptNo === txId)
      const savedCash = newDb.cashSheet.find((c) => c.receiptNo === txId)

      expect(savedOnline).toBeDefined()
      expect(savedPayment).toBeDefined()
      expect(savedCash).toBeDefined()

      expect(savedOnline?.status).toBe('completed')
      expect(savedPayment?.notes).toContain('Pago online')
      expect(savedCash?.tarjeta).toBe(25000)
    })
  })
})
