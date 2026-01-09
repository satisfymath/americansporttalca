// Storage tests
import { describe, it, expect, beforeEach } from 'vitest'
import { loadDb, saveDb, initDbIfEmpty, resetDb } from '../app/state/storage'
import { DB_KEY, DB_VERSION } from '../app/data/schema'

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('initDbIfEmpty', () => {
    it('should create seed data when localStorage is empty', () => {
      expect(localStorage.getItem(DB_KEY)).toBe(null)
      const db = initDbIfEmpty()
      expect(db.meta.version).toBe(DB_VERSION)
      expect(db.members.length).toBeGreaterThan(0)
      expect(db.payments.length).toBeGreaterThan(0)
      expect(db.attendance.length).toBeGreaterThan(0)
      expect(localStorage.getItem(DB_KEY)).not.toBe(null)
    })

    it('should not overwrite existing data', () => {
      initDbIfEmpty()
      const firstDb = loadDb()
      const originalMemberCount = firstDb.members.length

      // Modify the member count
      firstDb.members = firstDb.members.slice(0, 3)
      saveDb(firstDb)

      // Init again should not reset
      initDbIfEmpty()
      const secondDb = loadDb()
      expect(secondDb.members.length).toBe(3)
      expect(secondDb.members.length).not.toBe(originalMemberCount)
    })
  })

  describe('resetDb', () => {
    it('should restore seed data', () => {
      initDbIfEmpty()
      const originalDb = loadDb()
      const originalMemberCount = originalDb.members.length

      // Modify data
      originalDb.members = []
      originalDb.payments = []
      saveDb(originalDb)

      expect(loadDb().members.length).toBe(0)

      // Reset
      resetDb()
      const restoredDb = loadDb()
      expect(restoredDb.members.length).toBe(originalMemberCount)
      expect(restoredDb.payments.length).toBeGreaterThan(0)
    })
  })

  describe('loadDb with corrupted data', () => {
    it('should reset to seed when data is corrupted', () => {
      localStorage.setItem(DB_KEY, 'invalid json {{{')
      const db = loadDb()
      expect(db.meta.version).toBe(DB_VERSION)
      expect(db.members.length).toBeGreaterThan(0)
    })

    it('should reset to seed when version mismatches', () => {
      const badDb = { meta: { version: 999 } }
      localStorage.setItem(DB_KEY, JSON.stringify(badDb))
      const db = loadDb()
      expect(db.meta.version).toBe(DB_VERSION)
    })
  })
})
