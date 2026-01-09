// Auth hardcoded para demo
// Solo admin/admin y demo/demo

import type { Role, AuthSession } from '../data/schema'
import { loadDb, saveDb } from './storage'
import { DEMO_MEMBER_ID } from '../data/seed'

// Credenciales hardcodeadas
const CREDENTIALS: Record<
  string,
  { password: string; role: Role; memberId?: string }
> = {
  admin: { password: 'admin', role: 'admin' },
  demo: { password: 'demo', role: 'user', memberId: DEMO_MEMBER_ID },
}

export type LoginResult =
  | { success: true; role: Role; memberId?: string }
  | { success: false; error: string }

// Login
export function login(username: string, password: string): LoginResult {
  const cred = CREDENTIALS[username]

  if (!cred) {
    return { success: false, error: 'Usuario no existe' }
  }

  if (cred.password !== password) {
    return { success: false, error: 'Contrasena incorrecta' }
  }

  // Guardar sesion en DB
  const db = loadDb()
  db.auth.session = {
    username: username as 'admin' | 'demo',
    role: cred.role,
    createdAt: new Date().toISOString(),
  }
  saveDb(db)

  return { success: true, role: cred.role, memberId: cred.memberId }
}

// Logout
export function logout(): void {
  const db = loadDb()
  db.auth.session = {
    username: null,
    role: null,
    createdAt: null,
  }
  saveDb(db)
}

// Obtener sesion actual
export function getSession(): AuthSession {
  const db = loadDb()
  return db.auth.session
}

// Verificar si hay sesion activa
export function isAuthenticated(): boolean {
  const session = getSession()
  return session.username !== null && session.role !== null
}

// Verificar si es admin
export function isAdmin(): boolean {
  const session = getSession()
  return session.role === 'admin'
}

// Verificar si es user
export function isUser(): boolean {
  const session = getSession()
  return session.role === 'user'
}

// Obtener memberId del usuario logueado (solo para role user)
export function getLoggedMemberId(): string | null {
  const session = getSession()
  if (session.username === 'demo') {
    return DEMO_MEMBER_ID
  }
  return null
}
