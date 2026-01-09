// Sistema de QR dinamico con restricciones horarias para American Sport Gym Demo
// Los tokens cambian cada 2 MINUTOS y solo funcionan dentro del horario de operacion

import { nanoid } from 'nanoid'
import type { AttendanceEvent, GymDB } from '../data/schema'

// Horario de operacion
export const GYM_OPEN_HOUR = 8.5   // 8:30 AM
export const GYM_CLOSE_HOUR = 23   // 11:00 PM

// Intervalo de cambio del QR en minutos
export const QR_INTERVAL_MINUTES = 2

/**
 * Obtiene el slot de tiempo actual (cada 2 minutos = nuevo slot)
 * Ejemplo: 10:00-10:01 = slot 0, 10:02-10:03 = slot 1, etc.
 */
function getCurrentTimeSlot(): { date: string; hour: number; slot: number } {
  const now = new Date()
  const date = now.toISOString().split('T')[0] // "2026-01-09"
  const hour = now.getHours()
  const minutes = now.getMinutes()
  const slot = Math.floor(minutes / QR_INTERVAL_MINUTES)
  
  return { date, hour, slot }
}

/**
 * Genera un token QR dinamico basado en fecha, hora y slot de 2 minutos
 * El token cambia cada 2 minutos automaticamente
 */
export function generateQRToken(timeSlot?: { date: string; hour: number; slot: number }): string {
  const { date, hour, slot } = timeSlot || getCurrentTimeSlot()
  
  // Token: combinacion de fecha + hora + slot + secreto
  // Formato que garantiza unicidad: incluir slot de forma prominente
  const secret = 'ASG'
  const raw = `${secret}${date}${hour.toString().padStart(2, '0')}S${slot.toString().padStart(2, '0')}`
  
  // Crear hash simple pero unico - usar toda la info
  const token = btoa(raw).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase()
  
  // Incluir slot visible en el token para debugging
  return `ASG${hour.toString().padStart(2, '0')}${slot.toString().padStart(2, '0')}${token}`
}

/**
 * Obtiene el token QR actual
 * Retorna null si estamos fuera del horario de operacion
 */
export function getCurrentQRToken(): string | null {
  const opStatus = isWithinOperatingHours()
  if (!opStatus.isOpen) return null
  
  return generateQRToken()
}

/**
 * Valida si un token QR es valido
 * Acepta el token actual Y el token del slot anterior (por si escanean justo en el cambio)
 */
export function validateQRToken(token: string): boolean {
  const currentSlot = getCurrentTimeSlot()
  
  // Token actual
  const currentToken = generateQRToken(currentSlot)
  if (token === currentToken) return true
  
  // Token del slot anterior (gracia de 2 minutos)
  const previousSlot = { ...currentSlot }
  if (previousSlot.slot === 0) {
    // Si estamos en slot 0, el anterior es el ultimo slot de la hora anterior
    previousSlot.hour = previousSlot.hour - 1
    previousSlot.slot = Math.floor(60 / QR_INTERVAL_MINUTES) - 1
  } else {
    previousSlot.slot = previousSlot.slot - 1
  }
  const previousToken = generateQRToken(previousSlot)
  
  return token === previousToken
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
 * Formatea el tiempo restante hasta el proximo cambio de QR (cada 2 minutos)
 */
export function getTimeUntilQRChange(): { minutes: number; seconds: number; text: string } {
  const now = new Date()
  const currentMinute = now.getMinutes()
  const currentSecond = now.getSeconds()
  
  // Calcular segundos hasta el proximo slot de 2 minutos
  const minuteInSlot = currentMinute % QR_INTERVAL_MINUTES
  const secondsLeftInCurrentMinute = 60 - currentSecond
  const fullMinutesLeft = (QR_INTERVAL_MINUTES - 1) - minuteInSlot
  
  const totalSecondsLeft = (fullMinutesLeft * 60) + secondsLeftInCurrentMinute
  const minutes = Math.floor(totalSecondsLeft / 60)
  const seconds = totalSecondsLeft % 60
  
  let text: string
  if (minutes === 0 && seconds <= 10) {
    text = `${seconds}s`
  } else if (minutes === 0) {
    text = `${seconds} segundos`
  } else {
    text = `${minutes}:${seconds.toString().padStart(2, '0')}`
  }
  
  return { minutes, seconds, text }
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
