import type { Device, DeviceType } from '../../data/smartcampus'
import { defaultDeviceState, type DeviceState } from '../../store/DemoStore'

/* Shared room-control rules used by Smart rooms, voice commands and automation. */

export const SENSORS: DeviceType[] = ['People counter', 'Motion sensor', 'Room controller']

// Never switched off by automation or broad commands (spec SC-11).
export const ALWAYS_EXCLUDED: DeviceType[] = ['Door controller', 'PTZ camera', 'People counter', 'Motion sensor', 'Room controller', 'Ceiling microphone']

export function defaultsFor(t: DeviceType): DeviceState {
  const d = defaultDeviceState()
  if (t === 'Projector') d.on = false
  if (t === 'Door controller') d.locked = false
  return d
}

export const stateOf = (all: Record<string, DeviceState>, d: Device) => all[d.id] ?? defaultsFor(d.type)

export type Scene = 'start' | 'present' | 'hybrid' | 'exam' | 'off'

export const SCENES: { id: Scene; label: string; hint: string }[] = [
  { id: 'start', label: 'Start class', hint: 'Lights 80%, display and audio on, door unlocked' },
  { id: 'present', label: 'Presentation', hint: 'Lights dimmed to 35%, projector and display on' },
  { id: 'hybrid', label: 'Hybrid', hint: 'Camera tracking, microphones live, display on' },
  { id: 'exam', label: 'Exam', hint: 'Full lights, displays and microphones off' },
  { id: 'off', label: 'Shut down room', hint: 'Switch everything off and lock the door' },
]

/** Work out the new state of every device in a room for a scene. Offline devices are skipped. */
export function sceneStates(devices: Device[], all: Record<string, DeviceState>, id: Scene) {
  const live = devices.filter((d) => d.status !== 'Offline')
  const next: Record<string, DeviceState> = {}
  live.forEach((d) => {
    const cur = { ...stateOf(all, d) }
    const t = d.type
    if (id === 'start') Object.assign(cur, t === 'Lights' ? { on: true, level: 80 } : t === 'Door controller' ? { locked: false } : t === 'Projector' ? { on: false } : { on: true })
    if (id === 'present') Object.assign(cur, t === 'Lights' ? { on: true, level: 35 } : t === 'Projector' || t === 'Interactive display' ? { on: true } : {})
    if (id === 'hybrid') Object.assign(cur, t === 'PTZ camera' || t === 'Ceiling microphone' || t === 'Interactive display' ? { on: true } : t === 'Lights' ? { on: true, level: 70 } : {})
    if (id === 'exam') Object.assign(cur, t === 'Lights' ? { on: true, level: 100 } : t === 'Interactive display' || t === 'Projector' || t === 'Ceiling microphone' ? { on: false } : {})
    if (id === 'off') Object.assign(cur, t === 'Door controller' ? { locked: true } : SENSORS.includes(t) ? {} : { on: false })
    next[d.id] = cur
  })
  return { next, live: live.length, skipped: devices.length - live.length }
}
