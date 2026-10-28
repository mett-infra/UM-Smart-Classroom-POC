import { useSyncExternalStore } from 'react'

/*
  Face sign-ups, kept in this browser only (localStorage), separate from the demo data so that
  "Reset demo data" does not remove them. Remove a face from the Face sign-up page.
*/

export interface FaceRecord {
  personId: string
  photo: string // small JPEG data URL, shown only on this device
  descriptor: number[] // 128-number face template
  source: 'Photo upload' | 'Camera'
  consentBy: string
  signedUpAt: string
}

const KEY = 'um-smart-classroom-poc:faces'
type Faces = Record<string, FaceRecord>

function read(): Faces {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Faces
  } catch {
    return {}
  }
}

let cache: Faces = read()
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())

function subscribe(l: () => void) {
  listeners.add(l)
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = read()
      l()
    }
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(l)
    window.removeEventListener('storage', onStorage)
  }
}

export function useFaces(): Faces {
  return useSyncExternalStore(subscribe, () => cache)
}

export function saveFace(rec: FaceRecord) {
  cache = { ...cache, [rec.personId]: rec }
  write()
}

export function removeFace(personId: string) {
  const next = { ...cache }
  delete next[personId]
  cache = next
  write()
}

function write() {
  try {
    localStorage.setItem(KEY, JSON.stringify(cache))
  } catch {
    /* storage full or blocked: keep in memory for this visit */
  }
  notify()
}
