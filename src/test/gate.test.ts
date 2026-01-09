// Gate suggestion logic tests
import { describe, it, expect, beforeEach } from 'vitest'
import { nanoid } from 'nanoid'
import { initDbIfEmpty, updateDb, loadDb } from '../app/state/storage'
import { DEMO_MEMBER_ID } from '../app/data/seed'
import type { AttendanceEvent } from '../app/data/schema'

// Helper to determine suggestion (same logic as Gate component)
function getSuggestion(memberId: string): 'IN' | 'OUT' {
  const db = loadDb()
  const memberEvents = db.attendance
    .filter((e) => e.memberId === memberId)
    .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())

  const lastEvent = memberEvents[0]

  if (!lastEvent || lastEvent.type === 'OUT') {
    return 'IN'
  } else {
    return 'OUT'
  }
}

describe('gate suggestion', () => {
  beforeEach(() => {
    localStorage.clear()
    initDbIfEmpty()
    // Clear all attendance for clean tests
    updateDb((db) => {
      db.attendance = []
      return db
    })
  })

  it('should suggest IN when no previous events', () => {
    expect(getSuggestion(DEMO_MEMBER_ID)).toBe('IN')
  })

  it('should suggest OUT after an IN event', () => {
    const event: AttendanceEvent = {
      id: nanoid(),
      memberId: DEMO_MEMBER_ID,
      type: 'IN',
      ts: new Date().toISOString(),
      source: 'QR',
    }
    updateDb((db) => {
      db.attendance.push(event)
      return db
    })

    expect(getSuggestion(DEMO_MEMBER_ID)).toBe('OUT')
  })

  it('should suggest IN after an OUT event', () => {
    const inEvent: AttendanceEvent = {
      id: nanoid(),
      memberId: DEMO_MEMBER_ID,
      type: 'IN',
      ts: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      source: 'QR',
    }
    const outEvent: AttendanceEvent = {
      id: nanoid(),
      memberId: DEMO_MEMBER_ID,
      type: 'OUT',
      ts: new Date().toISOString(),
      source: 'QR',
    }
    updateDb((db) => {
      db.attendance.push(inEvent, outEvent)
      return db
    })

    expect(getSuggestion(DEMO_MEMBER_ID)).toBe('IN')
  })

  it('should suggest OUT when last event is IN even with older OUT events', () => {
    const oldOut: AttendanceEvent = {
      id: nanoid(),
      memberId: DEMO_MEMBER_ID,
      type: 'OUT',
      ts: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      source: 'QR',
    }
    const recentIn: AttendanceEvent = {
      id: nanoid(),
      memberId: DEMO_MEMBER_ID,
      type: 'IN',
      ts: new Date().toISOString(),
      source: 'QR',
    }
    updateDb((db) => {
      db.attendance.push(oldOut, recentIn)
      return db
    })

    expect(getSuggestion(DEMO_MEMBER_ID)).toBe('OUT')
  })
})
