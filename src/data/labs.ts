/*
  Live assignment (lab) templates and the progress simulation.
  Each student gets their own lab environment. In this demo the students' progress is simulated from a fixed
  seed, so the same student always works at the same pace. Lab time can run faster than real time for demos.
*/

export interface LabStep {
  id: string
  title: string
  detail: string
  marks: number
  evidence: string // what the student's lab shows when the step is done
}

export interface LabTemplate {
  id: string
  courseCode: string
  title: string
  summary: string
  environment: string
  minutes: number
  steps: LabStep[]
  source?: string // uploaded file name
}

export const labTemplates: LabTemplate[] = [
  {
    id: 'lab-banker',
    courseCode: 'WIA2004',
    title: 'Lab 7: Deadlock avoidance with the Banker’s algorithm',
    summary: 'Complete the safety check, run the tests, then decide whether a resource request can be granted.',
    environment: 'Ubuntu 22.04, Python 3.12, code editor in the browser',
    minutes: 45,
    steps: [
      { id: 's1', title: 'Open the starter code', detail: 'Open banker.py in your lab and read the Allocation, Max and Available tables.', marks: 2, evidence: '$ code banker.py\nOpened banker.py (64 lines)' },
      { id: 's2', title: 'Complete is_safe()', detail: 'Write the safety algorithm so it returns the safe sequence, or None if there is none.', marks: 6, evidence: 'def is_safe(alloc, need, avail):\n    work, finish = avail[:], [False] * n\n    ...\n    return sequence' },
      { id: 's3', title: 'Run the test suite', detail: 'Run pytest. All 6 tests must pass.', marks: 5, evidence: '$ pytest -q\n......  6 passed in 0.21s' },
      { id: 's4', title: 'Check the request from P1', detail: 'Use your code to decide whether request (1, 0, 2) from P1 can be granted.', marks: 4, evidence: '$ python banker.py --request P1 1 0 2\nSafe sequence: P1, P3, P4, P0, P2\nRequest granted' },
      { id: 's5', title: 'Explain your result', detail: 'Write two sentences in answer.md explaining why the request is safe or unsafe.', marks: 3, evidence: 'answer.md: “After granting the request the system can still finish every process in the order P1, P3, P4, P0, P2, so it stays in a safe state.”' },
    ],
  },
  {
    id: 'lab-sched',
    courseCode: 'WIA2004',
    title: 'Lab 8: CPU scheduling simulator',
    summary: 'Simulate FCFS, SJF and round robin for the same workload and compare waiting times.',
    environment: 'Ubuntu 22.04, Python 3.12, code editor in the browser',
    minutes: 60,
    steps: [
      { id: 's1', title: 'Load the workload', detail: 'Read jobs.csv into a list of processes.', marks: 3, evidence: '$ python sim.py --load jobs.csv\nLoaded 8 processes' },
      { id: 's2', title: 'Implement FCFS and SJF', detail: 'Complete fcfs() and sjf() and print the Gantt chart.', marks: 6, evidence: 'FCFS average wait: 11.4 ms\nSJF average wait: 6.9 ms' },
      { id: 's3', title: 'Implement round robin', detail: 'Complete rr(quantum=4).', marks: 6, evidence: 'RR (q=4) average wait: 8.1 ms' },
      { id: 's4', title: 'Compare the results', detail: 'Write which algorithm suits interactive users and why.', marks: 5, evidence: 'compare.md written (84 words)' },
    ],
  },
  {
    id: 'lab-sem',
    courseCode: 'WIA2004',
    title: 'Lab 9: Process synchronisation with semaphores',
    summary: 'Fix a producer-consumer program in C so it never loses or duplicates items.',
    environment: 'Ubuntu 22.04, gcc 13, code editor in the browser',
    minutes: 45,
    steps: [
      { id: 's1', title: 'Build and run the broken program', detail: 'Run make and observe the race condition.', marks: 2, evidence: '$ make && ./pc\nItems produced: 1000, consumed: 987' },
      { id: 's2', title: 'Add the semaphores', detail: 'Use empty, full and mutex semaphores around the buffer.', marks: 8, evidence: 'sem_wait(&empty); sem_wait(&mutex); ...' },
      { id: 's3', title: 'Prove it works', detail: 'Run the stress test 10 times without a lost item.', marks: 6, evidence: '$ ./stress.sh\n10 of 10 runs correct' },
      { id: 's4', title: 'Explain the fix', detail: 'Explain in answer.md why the mutex alone is not enough.', marks: 4, evidence: 'answer.md written (61 words)' },
    ],
  },
]

export const totalMarks = (t: Pick<LabTemplate, 'steps'>) => t.steps.reduce((n, s) => n + s.marks, 0)

/** Steps for an uploaded assessment, ready for the lecturer to edit. */
export function stepsFromUpload(fileName: string): LabTemplate {
  const base = fileName.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim() || 'Uploaded assessment'
  const title = base.charAt(0).toUpperCase() + base.slice(1)
  return {
    id: `up-${Date.now()}`,
    courseCode: 'WIA2004',
    title,
    summary: `Created from ${fileName}. Check the steps and marks before you start.`,
    environment: 'Ubuntu 22.04, Python 3.12, code editor in the browser',
    minutes: 45,
    source: fileName,
    steps: [
      { id: 's1', title: 'Read the task and open the starter files', detail: 'Everything you need is in your lab folder.', marks: 2, evidence: 'Opened the starter files' },
      { id: 's2', title: 'Complete part A', detail: 'Follow part A in the assessment file.', marks: 6, evidence: 'Part A saved' },
      { id: 's3', title: 'Complete part B', detail: 'Follow part B in the assessment file.', marks: 6, evidence: 'Part B saved' },
      { id: 's4', title: 'Run the checks', detail: 'Run the provided checks and fix any failures.', marks: 4, evidence: '$ ./check.sh\nAll checks passed' },
      { id: 's5', title: 'Write your answer', detail: 'Summarise your result in answer.md.', marks: 2, evidence: 'answer.md written' },
    ],
  }
}

// ---------- the running assignment ----------

export interface LiveAssignment {
  id: string
  sessionId: string
  courseCode: string
  template: LabTemplate
  studentIds: string[]
  status: 'running' | 'ended' | 'released'
  speed: number // lab minutes per real minute (1 = real time)
  labMinAtMark: number // lab minutes passed when the clock was last changed
  markTs: number // real time (ms) of that change
  extraMin: number
  endedAtLabMin?: number
  endedBy?: 'lecturer' | 'time'
  startedAt: string // clock label
  endedAt?: string
  marks: Record<string, { mark: number; feedback: string }>
  // Students working in their own lab screen (real clicks), instead of the simulation
  driven?: Record<string, DrivenLab>
}

export interface DrivenLab {
  done: number
  at: number // lab minute of the last step done (or when the lab was opened)
  log: string[] // terminal output, newest last
  help?: boolean // the student asked for help
}

/** What the student does for a step: run a command in the terminal, or save a file in the editor. */
export function actionOf(step: LabStep): { kind: 'run' | 'save'; command: string; output: string } {
  const lines = step.evidence.split('\n')
  if (lines[0].startsWith('$ ')) return { kind: 'run', command: lines[0].slice(2), output: lines.slice(1).join('\n') }
  return { kind: 'save', command: step.evidence.startsWith('answer.md') ? 'answer.md' : step.evidence.startsWith('def ') || step.evidence.includes('(') ? 'code' : 'file', output: step.evidence }
}

export const limitOf = (a: LiveAssignment) => a.template.minutes + a.extraMin

/** Lab minutes passed (stops when the assignment ends). */
export function labMinutes(a: LiveAssignment, nowMs = Date.now()) {
  if (a.status !== 'running') return a.endedAtLabMin ?? limitOf(a)
  return Math.min(limitOf(a), a.labMinAtMark + ((nowMs - a.markTs) / 60000) * a.speed)
}

const hash = (t: string) => {
  let h = 2166136261
  for (let i = 0; i < t.length; i++) {
    h ^= t.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
const unit = (t: string) => (hash(t) % 10000) / 10000

export type LabState = 'Starting' | 'Working' | 'Needs help' | 'Reconnecting' | 'Finished' | 'Submitted'

export interface StudentProgress {
  done: number // steps completed
  state: LabState
  lastActivityMin: number // lab minute of the last completed step or start
  stuckAt?: number // step index the student is stuck on
}

/** Where one student is at a given lab minute. Deterministic per assignment and student. */
export function progressOf(a: LiveAssignment, studentId: string, t: number): StudentProgress {
  const n = a.template.steps.length
  const d = a.driven?.[studentId]
  if (d) {
    const state: LabState = a.status !== 'running' ? 'Submitted' : d.done >= n ? 'Finished' : d.help ? 'Needs help' : 'Working'
    return { done: Math.min(n, d.done), state, lastActivityMin: d.at }
  }
  const key = `${a.id}|${studentId}`
  // demo participant (Pranav) works steadily and finishes
  const demo = studentId.startsWith('fp-')
  const delay = demo ? 1 : 0.5 + unit(key + 'd') * 3.5
  const per = ((a.template.minutes * 0.72) / n) * (demo ? 0.85 : 0.65 + unit(key + 'p') * 0.95)
  const stuck = !demo && unit(key + 's') < 0.14
  const stuckAt = stuck ? 1 + Math.floor(unit(key + 'k') * (n - 1)) : -1
  const stuckFor = stuck ? 9 + unit(key + 'f') * 18 : 0
  const reconnect = !demo && unit(key + 'r') < 0.05 ? { from: 6 + unit(key + 'rf') * 15, len: 3 } : null

  let tt = t - delay
  if (tt < 0) return { done: 0, state: a.status === 'running' ? 'Starting' : 'Submitted', lastActivityMin: 0 }
  // time lost while stuck
  if (stuck && tt > stuckAt * per) tt = Math.max(stuckAt * per, tt - stuckFor)
  const done = Math.min(n, Math.floor(tt / per))
  const lastActivityMin = Math.min(t, delay + done * per + (stuck && done >= stuckAt ? stuckFor : 0))
  let state: LabState = done >= n ? 'Finished' : 'Working'
  if (state === 'Working' && stuck && done === stuckAt && t - lastActivityMin > 6) state = 'Needs help'
  if (state === 'Working' && reconnect && t >= reconnect.from && t < reconnect.from + reconnect.len) state = 'Reconnecting'
  if (a.status !== 'running') state = 'Submitted'
  return { done, state, lastActivityMin, stuckAt: stuck ? stuckAt : undefined }
}

/** Suggested mark: full marks for every completed step, plus half marks for a step that was started. */
export function suggestedMark(a: LiveAssignment, p: StudentProgress) {
  const steps = a.template.steps
  const full = steps.slice(0, p.done).reduce((n, s) => n + s.marks, 0)
  const partial = p.done < steps.length && p.lastActivityMin > 0 ? Math.floor(steps[p.done].marks / 2) : 0
  return full + partial
}
