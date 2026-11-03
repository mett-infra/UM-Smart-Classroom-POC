import type { LiveAssignment } from '../../data/labs'

/*
  Which live assignment the student portal shows. The student persona is Aina (st1). The demo participant
  (Pranav) also has a lab when he was marked present, so the presenter can show either one.
*/
export const STUDENT_ID = 'st1'
export const DEMO_ID = 'fp-pranav'

export function labFor(list: LiveAssignment[], id?: string) {
  const mine = list.filter((a) => a.studentIds.includes(STUDENT_ID) || a.studentIds.includes(DEMO_ID))
  if (id) return mine.find((a) => a.id === id)
  return mine.find((a) => a.status === 'running') ?? mine[0]
}

export const viewersOf = (a: LiveAssignment) => [DEMO_ID, STUDENT_ID].filter((x) => a.studentIds.includes(x))

/** A running assignment the student has no lab in (they were not marked present when it started). */
export const runningWithoutMe = (list: LiveAssignment[]) => list.find((a) => a.status === 'running' && !a.studentIds.includes(STUDENT_ID) && !a.studentIds.includes(DEMO_ID))
