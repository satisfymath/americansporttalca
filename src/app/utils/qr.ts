// Sistema de QR dinamico con restricciones horarias para American Sport Gym Demo
// Los tokens cambian cada hora y solo funcionan dentro del horario de operacion

import { nanoid } from 'nanoid'
import type { AttendanceEvent, GymDB } from '../data/schema'

// Horario de operacion
export const GYM_OPEN_HOUR = 8.5   // 8:30 AM
export const GYM_CLOSE_HOUR = 23   // 11:00 PM

// QR tokens hardcodeados por hora (para demo sin generacion dinamica real)
// En produccion estos serian generados criptograficamente en el backend
export const HOURLY_QR_TOKENS: Record<number, string> = {
  8: 'ASG08DEMO26',
  9: 'ASG09DEMO26',
  10: 'ASG10DEMO26',
  11: 'ASG11DEMO26',
  12: 'ASG12DEMO26',
  13: 'ASG13DEMO26',
  14: 'ASG14DEMO26',
  15: 'ASG15DEMO26',
  16: 'ASG16DEMO26',
  17: 'ASG17DEMO26',
  18: 'ASG18DEMO26',
  19: 'ASG19DEMO26',
  20: 'ASG20DEMO26',
  21: 'ASG21DEMO26',
  22: 'ASG22DEMO26',
}

/**
 * Obtiene el token QR actual basado en la hora
 * Retorna null si estamos fuera del horario de operacion
 */
export function getCurrentQRToken(): string | null {
  const hour = new Date().getHours()
  return HOURLY_QR_TOKENS[hour] || null
}

/**
 * Genera un token QR dinamico basado en fecha y hora
 * Usado como alternativa al sistema hardcodeado
 */
export function generateHourlyQRToken(): string {
  const now = new Date()
  const hour = now.getHours()
  const date = now.toISOString().split('T')[0] // "2026-01-09"
  
  // Token simple: combinacion fecha + hora + secreto fijo
  const secret = 'ASG_DEMO_2026'
  const token = btoa(`${date}-${hour}-${secret}`).slice(0, 12)
  
  return token
}

/**
 * Valida si un token QR es valido para la hora actual
 * Acepta tanto tokens hardcodeados como generados dinamicamente
 */
export function validateQRToken(token: string): boolean {
  // Primero verificar tokens hardcodeados
  const currentHardcodedToken = getCurrentQRToken()
  if (currentHardcodedToken && token === currentHardcodedToken) {
    return true
  }
  
  // Luego verificar token generado dinamicamente
  const dynamicToken = generateHourlyQRToken()
  return token === dynamicToken
}

/**
 * Verifica si estamos dentro del horario de operacion del gimnasio
 */
export function isWithinOperatingHours(): { 
  isOpen: boolean
  message: string 
  nextOpenTime?: string
} {
  const now = new Date()
  const hour = now.getHours()
  const minutes = now.getMinutes()
  const currentTime = hour + (minutes / 60)
  
  if (currentTime < GYM_OPEN_HOUR) {
    return {
      isOpen: false,
      message: `El gimnasio abre a las 8:30 AM. Hora actual: ${hour}:${minutes.toString().padStart(2, '0')}`,
      nextOpenTime: '8:30 AM'
    }
  }
  
  if (currentTime >= GYM_CLOSE_HOUR) {
    return {
      isOpen: false,
      message: `El gimnasio esta cerrado. Horario: 8:30 AM - 11:00 PM`,
      nextOpenTime: '8:30 AM (mañana)'
    }
  }
  
  return { isOpen: true, message: '' }
}

/**
 * Verifica si un miembro tiene una sesion abierta (entrada sin salida)
 */
export function hasOpenSession(memberId: string, attendance: AttendanceEvent[]): boolean {
  const memberEvents = attendance
    .filter(e => e.memberId === memberId)
    .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
  
  const lastEvent = memberEvents[0]
  return lastEvent?.type === 'IN'
}

/**
 * Obtiene informacion de la sesion actual del miembro
 */
export function getSessionInfo(memberId: string, attendance: AttendanceEvent[]): {
  hasOpenSession: boolean
  lastEvent: AttendanceEvent | null
  lastEntryTime: string | null
} {
  const memberEvents = attendance
    .filter(e => e.memberId === memberId)
    .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
  
  const lastEvent = memberEvents[0] || null
  const lastEntry = memberEvents.find(e => e.type === 'IN')
  
  return {
    hasOpenSession: lastEvent?.type === 'IN',
    lastEvent,
    lastEntryTime: lastEntry?.ts || null
  }
}

/**
 * Cierra todas las sesiones abiertas (para ejecutar al cierre del gimnasio)
 * Retorna la DB modificada
 */
export function closeAllOpenSessions(db: GymDB): GymDB {
  const now = new Date()
  
  // Encontrar miembros con sesion abierta
  const openSessions = new Map<string, AttendanceEvent>()
  
  // Ordenar eventos por tiempo
  const sortedEvents = [...db.attendance].sort(
    (a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime()
  )
  
  // Rastrear estado de cada miembro
  sortedEvents.forEach(event => {
    if (event.type === 'IN') {
      openSessions.set(event.memberId, event)
    } else {
      openSessions.delete(event.memberId)
    }
  })
  
  // Crear eventos de salida automatica para sesiones abiertas
  const autoExitEvents: AttendanceEvent[] = []
  openSessions.forEach((_entryEvent, memberId) => {
    autoExitEvents.push({
      id: nanoid(),
      memberId,
      type: 'OUT',
      ts: now.toISOString(),
      source: 'SYSTEM', // Marcado como cierre automatico del sistema
    })
  })
  
  // Agregar eventos de salida a la DB
  return {
    ...db,
    attendance: [...db.attendance, ...autoExitEvents]
  }
}

/**
 * Formatea el tiempo restante hasta el proximo cambio de QR
 */
export function getTimeUntilQRChange(): string {
  const now = new Date()
  const minutesLeft = 60 - now.getMinutes()
  
  if (minutesLeft <= 1) {
    return 'menos de 1 minuto'
  }
  
  return `${minutesLeft} minutos`
}

/**
 * Obtiene la URL completa del gate con el token actual
 */
export function getGateUrlWithToken(baseUrl: string): string | null {
  const token = getCurrentQRToken()
  if (!token) return null
  
  return `${baseUrl}#/gate?token=${token}`
}

/**
 * Valida si un miembro puede registrar entrada
 * Retorna objeto con resultado y mensaje de error si aplica
 */
export function canMemberCheckIn(
  memberId: string, 
  attendance: AttendanceEvent[],
  qrToken?: string
): { allowed: boolean; error?: string } {
  // 1. Validar horario
  const opStatus = isWithinOperatingHours()
  if (!opStatus.isOpen) {
    return { allowed: false, error: opStatus.message }
  }
  
  // 2. Validar token QR si se proporciona
  if (qrToken && !validateQRToken(qrToken)) {
    return { 
      allowed: false, 
      error: 'Codigo QR expirado o invalido. Escanea el QR actual en recepcion.' 
    }
  }
  
  // 3. Verificar que no tenga sesion abierta
  if (hasOpenSession(memberId, attendance)) {
    return { 
      allowed: false, 
      error: 'Ya tienes una entrada registrada. Debes marcar salida primero.' 
    }
  }
  
  return { allowed: true }
}

/**
 * Valida si un miembro puede registrar salida
 */
export function canMemberCheckOut(
  memberId: string, 
  attendance: AttendanceEvent[]
): { allowed: boolean; error?: string } {
  // Verificar que tenga sesion abierta
  if (!hasOpenSession(memberId, attendance)) {
    return { 
      allowed: false, 
      error: 'No tienes entrada registrada para marcar salida.' 
    }
  }
  
  return { allowed: true }
}
