// Tests para utils/stats.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { calculateMember360, calculateGymStats, getMostActiveMembers } from '../app/utils/stats'
import { resetDb, loadDb } from '../app/state/storage'

describe('Stats Utils', () => {
  beforeEach(() => {
    resetDb()
  })

  describe('calculateMember360', () => {
    it('should calculate basic stats for member', () => {
      const db = loadDb()
      const member = db.members[0]
      if (!member) throw new Error('No members in seed data')

      const result = calculateMember360(member, db.payments, db.attendance)
      expect(result).not.toBeNull()
      expect(result.memberId).toBe(member.id)
      expect(result.memberName).toBeDefined()
      expect(typeof result.totalVisits).toBe('number')
      expect(typeof result.totalPayments).toBe('number')
      expect(typeof result.totalAmountPaid).toBe('number')
      expect(typeof result.monthsAsMember).toBe('number')
    })

    it('should calculate monthly visits correctly', () => {
      const db = loadDb()
      const member = db.members[0]
      if (!member) throw new Error('No members in seed data')

      const result = calculateMember360(member, db.payments, db.attendance)
      expect(result.visitsByMonth).toBeDefined()
      expect(Array.isArray(result.visitsByMonth)).toBe(true)
      expect(result.visitsByMonth.length).toBeGreaterThan(0)
    })

    it('should calculate payment status correctly', () => {
      const db = loadDb()
      const member = db.members[0]
      if (!member) throw new Error('No members in seed data')

      const result = calculateMember360(member, db.payments, db.attendance)
      expect(['al_dia', 'por_vencer', 'vencido']).toContain(result.paymentStatus)
      expect(result.paymentStatusLabel).toBeDefined()
    })

    it('should include plan info', () => {
      const db = loadDb()
      const member = db.members[0]
      if (!member) throw new Error('No members in seed data')

      const result = calculateMember360(member, db.payments, db.attendance)
      expect(result.planType).toBeDefined()
      expect(result.planTypeLabel).toBeDefined()
      expect(typeof result.monthlyFee).toBe('number')
    })

    it('should calculate visits trend', () => {
      const db = loadDb()
      const member = db.members[0]
      if (!member) throw new Error('No members in seed data')

      const result = calculateMember360(member, db.payments, db.attendance)
      expect(['up', 'down', 'stable']).toContain(result.visitsTrend)
    })
  })

  describe('calculateGymStats', () => {
    it('should return overall gym statistics', () => {
      const db = loadDb()
      const result = calculateGymStats(db.members, db.payments, db.attendance)

      expect(result).toBeDefined()
      expect(typeof result.totalMembers).toBe('number')
      expect(typeof result.activeMembers).toBe('number')
      expect(typeof result.incomeThisMonth).toBe('number')
      expect(typeof result.attendanceThisMonth).toBe('number')
    })

    it('should have consistent member counts', () => {
      const db = loadDb()
      const result = calculateGymStats(db.members, db.payments, db.attendance)

      expect(result.activeMembers).toBeLessThanOrEqual(result.totalMembers)
    })

    it('should calculate income trends', () => {
      const db = loadDb()
      const result = calculateGymStats(db.members, db.payments, db.attendance)

      expect(result.incomeTrend).toBeDefined()
      expect(['up', 'down', 'stable']).toContain(result.incomeTrend)
    })

    it('should include plan type breakdown', () => {
      const db = loadDb()
      const result = calculateGymStats(db.members, db.payments, db.attendance)

      expect(result.byPlanType).toBeDefined()
      expect(typeof result.byPlanType.full).toBe('number')
      expect(typeof result.byPlanType.estudiante).toBe('number')
      expect(typeof result.byPlanType.antiguo).toBe('number')
    })
  })

  describe('getMostActiveMembers', () => {
    it('should return array of active members', () => {
      const db = loadDb()
      const result = getMostActiveMembers(db.members, db.attendance)

      expect(Array.isArray(result)).toBe(true)
    })

    it('should respect limit parameter', () => {
      const db = loadDb()
      const result = getMostActiveMembers(db.members, db.attendance, 3)

      expect(result.length).toBeLessThanOrEqual(3)
    })

    it('should include visit count for each member', () => {
      const db = loadDb()
      const result = getMostActiveMembers(db.members, db.attendance)

      result.forEach((m) => {
        expect(m.member).toBeDefined()
        expect(typeof m.visits).toBe('number')
      })
    })

    it('should be sorted by visits descending', () => {
      const db = loadDb()
      const result = getMostActiveMembers(db.members, db.attendance)

      for (let i = 1; i < result.length; i++) {
        expect(result[i].visits).toBeLessThanOrEqual(result[i - 1].visits)
      }
    })
  })
})
