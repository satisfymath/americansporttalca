// Storage wrapper para LocalStorage
// Manejo robusto con fallback a seed si datos corruptos

import type { GymDB } from '../data/schema'
import { DB_KEY, DB_VERSION } from '../data/schema'
import { createSeedDB } from '../data/seed'

// Cargar DB desde LocalStorage
export function loadDb(): GymDB {
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (!raw) {
      return initDbIfEmpty()
    }
    const parsed = JSON.parse(raw) as GymDB
    // Validar version
    if (parsed.meta?.version !== DB_VERSION) {
      console.warn('DB version mismatch, resetting to seed')
      return resetDb()
    }
    return parsed
  } catch (e) {
    console.error('Error parsing DB, resetting to seed:', e)
    return resetDb()
  }
}

// Guardar DB en LocalStorage
export function saveDb(db: GymDB): void {
  db.meta.updatedAt = new Date().toISOString()
  localStorage.setItem(DB_KEY, JSON.stringify(db))
}

// Actualizar DB con una funcion
export function updateDb(fn: (db: GymDB) => GymDB): GymDB {
  const db = loadDb()
  const updated = fn(db)
  saveDb(updated)
  return updated
}

// Inicializar DB si no existe
export function initDbIfEmpty(): GymDB {
  const existing = localStorage.getItem(DB_KEY)
  if (existing) {
    try {
      return JSON.parse(existing) as GymDB
    } catch {
      // Si falla, crear seed
    }
  }
  const seed = createSeedDB()
  saveDb(seed)
  return seed
}

// Reset DB a seed (borra todo y recrea)
export function resetDb(): GymDB {
  localStorage.removeItem(DB_KEY)
  const seed = createSeedDB()
  saveDb(seed)
  return seed
}

// Exportar DB como JSON string (para descarga)
export function exportDbJson(): string {
  const db = loadDb()
  return JSON.stringify(db, null, 2)
}

// Importar DB desde JSON string
export function importDbJson(jsonStr: string): GymDB | null {
  try {
    const parsed = JSON.parse(jsonStr) as GymDB
    if (parsed.meta?.version !== DB_VERSION) {
      console.error('Invalid DB version')
      return null
    }
    saveDb(parsed)
    return parsed
  } catch (e) {
    console.error('Error importing DB:', e)
    return null
  }
}
