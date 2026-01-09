// Auth tests
import { describe, it, expect, beforeEach } from 'vitest'
import { login, logout, isAuthenticated, getSession, isAdmin, isUser, getLoggedMemberId } from '../app/state/auth'
import { initDbIfEmpty } from '../app/state/storage'
import { DEMO_MEMBER_ID } from '../app/data/seed'

describe('auth', () => {
  beforeEach(() => {
    localStorage.clear()
    initDbIfEmpty()
  })

  describe('login', () => {
    it('should accept admin/admin credentials', () => {
      const result = login('admin', 'admin')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.role).toBe('admin')
      }
    })

    it('should accept demo/demo credentials', () => {
      const result = login('demo', 'demo')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.role).toBe('user')
        expect(result.memberId).toBe(DEMO_MEMBER_ID)
      }
    })

    it('should reject invalid username', () => {
      const result = login('invalid', 'password')
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Usuario no existe')
      }
    })

    it('should reject invalid password for admin', () => {
      const result = login('admin', 'wrongpassword')
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Contrasena incorrecta')
      }
    })

    it('should reject invalid password for demo', () => {
      const result = login('demo', 'wrongpassword')
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Contrasena incorrecta')
      }
    })

    it('should set session after successful login', () => {
      expect(isAuthenticated()).toBe(false)
      login('admin', 'admin')
      expect(isAuthenticated()).toBe(true)
      expect(isAdmin()).toBe(true)
      expect(isUser()).toBe(false)
    })
  })

  describe('logout', () => {
    it('should clear session', () => {
      login('admin', 'admin')
      expect(isAuthenticated()).toBe(true)
      logout()
      expect(isAuthenticated()).toBe(false)
      const session = getSession()
      expect(session.username).toBe(null)
      expect(session.role).toBe(null)
    })
  })

  describe('getLoggedMemberId', () => {
    it('should return null for admin', () => {
      login('admin', 'admin')
      expect(getLoggedMemberId()).toBe(null)
    })

    it('should return memberId for demo user', () => {
      login('demo', 'demo')
      expect(getLoggedMemberId()).toBe(DEMO_MEMBER_ID)
    })
  })
})
