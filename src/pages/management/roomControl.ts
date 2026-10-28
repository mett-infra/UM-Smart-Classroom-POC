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

export type Scene = 'on' | 'off'

// Review 2: rooms are controlled device by device. The only room-wide actions are "All on" and "All off".
// Doors are never changed by these; they have their own lock, unlock and timer.
export const SCENES: { id: Scene; label: string; hint: string }[] = [
  { id: 'on', label: 'All on', hint: 'Switch on every display, light, fan, air-con, camera and microphone' },
  { id: 'off', label: 'All off', hint: 'Switch off every display, light, fan, air-con, camera and microphone' },
]

/** Devices with a simple on/off switch (everything except doors and sensors). */
export const isSwitch = (t: DeviceType) => t !== 'Door controller' && !SENSORS.includes(t)

/** Work out the new state of every device in a room for All on / All off. Offline devices are skipped. */
export function sceneStates(devices: Device[], all: Record<string, DeviceState>, id: Scene) {
  const live = devices.filter((d) => d.status !== 'Offline' && isSwitch(d.type))
  const next: Record<string, DeviceState> = {}
  live.forEach((d) => {
    next[d.id] = { ...stateOf(all, d), on: id === 'on', ...(d.type === 'Lights' && id === 'on' ? { level: 100 } : {}) }
  })
  return { next, live: live.length, skipped: devices.filter((d) => d.status === 'Offline' && isSwitch(d.type)).length }
}
