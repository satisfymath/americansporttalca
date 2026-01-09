// Tests para utils/qr.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getCurrentQRToken,
  validateQRToken,
  isWithinOperatingHours,
  hasOpenSession,
  canMemberCheckIn,
  canMemberCheckOut,
  generateQRToken,
  QR_INTERVAL_MINUTES,
} from '../app/utils/qr'
import { resetDb } from '../app/state/storage'
import { nanoid } from 'nanoid'
import type { AttendanceEvent } from '../app/data/schema'

describe('QR Utils', () => {
  beforeEach(() => {
    resetDb()
  })

  describe('QR Token Generation (2-minute intervals)', () => {
    it('should generate different tokens for different slots', () => {
      // Probar directamente con diferentes slots
      const slot1 = { date: '2025-01-15', hour: 10, slot: 0 }
      const slot2 = { date: '2025-01-15', hour: 10, slot: 0 }
      const slot3 = { date: '2025-01-15', hour: 10, slot: 1 }
      
      const token1 = generateQRToken(slot1)
      const token2 = generateQRToken(slot2)
      const token3 = generateQRToken(slot3)
      
      expect(token1).toBe(token2) // Mismo slot
      expect(token1).not.toBe(token3) // Diferente slot
    })

    it('should have 2-minute interval constant', () => {
      expect(QR_INTERVAL_MINUTES).toBe(2)
    })
  })

  describe('getCurrentQRToken', () => {
    it('should return null before opening hours', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2025-01-15T07:00:00'))
      expect(getCurrentQRToken()).toBeNull()
      vi.useRealTimers()
    })

    it('should return a token during operating hours', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2025-01-15T10:30:00'))
      const token = getCurrentQRToken()
      expect(token).not.toBeNull()
      expect(token).toMatch(/^ASG[A-Z0-9]+$/)
      vi.useRealTimers()
    })

    it('should return null after closing', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2025-01-15T23:30:00'))
      expect(getCurrentQRToken()).toBeNull()
      vi.useRealTimers()
    })
  })

  describe('validateQRToken', () => {
    it('should return true for current token', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2025-01-15T14:44:00'))
      const currentToken = getCurrentQRToken()!
      expect(validateQRToken(currentToken)).toBe(true)
      vi.useRealTimers()
    })

    it('should return true for previous slot token (grace period)', () => {
      vi.useFakeTimers()
      // Generar token en minuto 2 (slot 1)
      vi.setSystemTime(new Date('2025-01-15T14:02:00'))
      const previousToken = getCurrentQRToken()!
      
      // Avanzar a minuto 4 (slot 2) - el token anterior debe seguir valido
      vi.setSystemTime(new Date('2025-01-15T14:04:00'))
      expect(validateQRToken(previousToken)).toBe(true)
      vi.useRealTimers()
    })

    it('should return false for wrong token', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2025-01-15T14:45:00'))
      expect(validateQRToken('WRONGTOKEN123')).toBe(false)
      vi.useRealTimers()
    })

    it('should return false for invalid token', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2025-01-15T14:45:00'))
      expect(validateQRToken('INVALID')).toBe(false)
      vi.useRealTimers()
    })
  })

  describe('isWithinOperatingHours', () => {
    it('should return isOpen=false before 8:30', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2025-01-15T08:00:00'))
      const result = isWithinOperatingHours()
      expect(result.isOpen).toBe(false)
      vi.useRealTimers()
    })

    it('should return isOpen=true at 8:30', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2025-01-15T08:30:00'))
      const result = isWithinOperatingHours()
      expect(result.isOpen).toBe(true)
      vi.useRealTimers()
    })

    it('should return isOpen=true at 22:59', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2025-01-15T22:59:00'))
      const result = isWithinOperatingHours()
      expect(result.isOpen).toBe(true)
      vi.useRealTimers()
    })

    it('should return isOpen=false at 23:00', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2025-01-15T23:00:00'))
      const result = isWithinOperatingHours()
      expect(result.isOpen).toBe(false)
      vi.useRealTimers()
    })
  })

  describe('hasOpenSession', () => {
    it('should return false when no attendance', () => {
      const attendance: AttendanceEvent[] = []
      expect(hasOpenSession('member-1', attendance)).toBe(false)
    })

    it('should return true when last event is IN', () => {
      const attendance: AttendanceEvent[] = [
        {
          id: nanoid(),
          memberId: 'member-1',
          ts: new Date().toISOString(),
          type: 'IN',
          source: 'ADMIN',
        }
      ]
      expect(hasOpenSession('member-1', attendance)).toBe(true)
    })

    it('should return false when last event is OUT', () => {
      const attendance: AttendanceEvent[] = [
        {
          id: nanoid(),
          memberId: 'member-1',
          ts: new Date(Date.now() - 3600000).toISOString(),
          type: 'IN',
          source: 'ADMIN',
        },
        {
          id: nanoid(),
          memberId: 'member-1',
          ts: new Date().toISOString(),
          type: 'OUT',
          source: 'ADMIN',
        }
      ]
      expect(hasOpenSession('member-1', attendance)).toBe(false)
    })
  })

  describe('canMemberCheckIn', () => {
    it('should return allowed=true with no open session and valid hours', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2025-01-15T10:00:00'))
      const attendance: AttendanceEvent[] = []
      const result = canMemberCheckIn('member-1', attendance)
      expect(result.allowed).toBe(true)
      vi.useRealTimers()
    })

    it('should return allowed=false with open session', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2025-01-15T10:00:00'))
      const attendance: AttendanceEvent[] = [
        {
          id: nanoid(),
          memberId: 'member-1',
          ts: new Date().toISOString(),
          type: 'IN',
          source: 'ADMIN',
        }
      ]
      const result = canMemberCheckIn('member-1', attendance)
      expect(result.allowed).toBe(false)
      vi.useRealTimers()
    })

    it('should return allowed=false outside hours', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2025-01-15T07:00:00'))
      const attendance: AttendanceEvent[] = []
      const result = canMemberCheckIn('member-1', attendance)
      expect(result.allowed).toBe(false)
      vi.useRealTimers()
    })
  })

  describe('canMemberCheckOut', () => {
    it('should return allowed=true with open session', () => {
      const attendance: AttendanceEvent[] = [
        {
          id: nanoid(),
          memberId: 'member-1',
          ts: new Date().toISOString(),
          type: 'IN',
          source: 'ADMIN',
        }
      ]
      const result = canMemberCheckOut('member-1', attendance)
      expect(result.allowed).toBe(true)
    })

    it('should return allowed=false with no open session', () => {
      const attendance: AttendanceEvent[] = []
      const result = canMemberCheckOut('member-1', attendance)
      expect(result.allowed).toBe(false)
    })
  })
})
