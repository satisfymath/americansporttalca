// Tests para utils/qr.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getCurrentQRToken,
  validateQRToken,
  isWithinOperatingHours,
  hasOpenSession,
  canMemberCheckIn,
  canMemberCheckOut,
  HOURLY_QR_TOKENS,
} from '../app/utils/qr'
import { resetDb } from '../app/state/storage'
import { nanoid } from 'nanoid'
import type { AttendanceEvent } from '../app/data/schema'

describe('QR Utils', () => {
  beforeEach(() => {
    resetDb()
  })

  describe('HOURLY_QR_TOKENS', () => {
    it('should have tokens for hours 8-22', () => {
      expect(HOURLY_QR_TOKENS[8]).toBe('ASG08DEMO26')
      expect(HOURLY_QR_TOKENS[12]).toBe('ASG12DEMO26')
      expect(HOURLY_QR_TOKENS[22]).toBe('ASG22DEMO26')
    })

    it('should not have tokens before 8 or after 22', () => {
      expect(HOURLY_QR_TOKENS[7]).toBeUndefined()
      expect(HOURLY_QR_TOKENS[23]).toBeUndefined()
    })
  })

  describe('getCurrentQRToken', () => {
    it('should return null before opening hours', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2025-01-15T07:00:00'))
      expect(getCurrentQRToken()).toBeNull()
      vi.useRealTimers()
    })

    it('should return correct token during operating hours', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2025-01-15T10:30:00'))
      expect(getCurrentQRToken()).toBe('ASG10DEMO26')
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
    it('should return true for current hour token', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2025-01-15T14:45:00'))
      expect(validateQRToken('ASG14DEMO26')).toBe(true)
      vi.useRealTimers()
    })

    it('should return false for wrong token', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2025-01-15T14:45:00'))
      expect(validateQRToken('ASG10DEMO26')).toBe(false)
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
