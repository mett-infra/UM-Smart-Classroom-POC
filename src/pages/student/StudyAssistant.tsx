import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { PlayCircle, RotateCcw, Send, Sparkles } from 'lucide-react'
import { Avatar, Notice, PageHead, Panel, Seg } from '../../components/ui'
import { personas } from '../../data/mock'

interface Msg {
  id: number
  from: 'me' | 'ai'
  text: string
  sources?: string[]
  cards?: { q: string; a: string }[]
}

const SUGGESTED = ['Summarise lecture 14 in five points', 'Explain the Banker’s algorithm simply', 'What is the difference between prevention and avoidance?', 'Make flashcards for deadlocks', 'Terangkan kebuntuan dalam Bahasa Melayu']

function answer(q: string): Omit<Msg, 'id' | 'from'> {
  const s = q.toLowerCase()
  if (/flash|card|revise|revision/.test(s))
    return {
      text: 'Here are four flashcards from lecture 14. Tap a card to see the answer.',
      cards: [
        { q: 'Name the four conditions for deadlock.', a: 'Mutual exclusion, hold and wait, no preemption, circular wait.' },
        { q: 'What does a safe state mean?', a: 'There is at least one order in which every process can finish with the resources available.' },
        { q: 'Prevention or avoidance: which needs to know maximum demand in advance?', a: 'Avoidance. The Banker’s algorithm uses each process’s maximum claim.' },
        { q: 'How do you detect a deadlock with single-instance resources?', a: 'Look for a cycle in the wait-for graph.' },
      ],
      sources: ['07:45', '21:30', '39:40'],
    }
  if (/melayu|terang|kebuntuan|bm\b/.test(s))
    return {
      text: 'Kebuntuan berlaku apabila setiap proses dalam satu set menunggu sumber yang dipegang oleh proses lain dalam set yang sama, jadi tiada proses dapat bergerak. Empat syarat mesti berlaku serentak: saling eksklusif, pegang dan tunggu, tiada pendahuluan dan tunggu bulat. Algoritma Banker mengelakkan kebuntuan dengan hanya meluluskan permintaan jika sistem kekal dalam keadaan selamat.',
      sources: ['03:20', '07:45', '28:05'],
    }
  if (/banker/.test(s))
    return {
      text: 'Think of the OS as a bank with a fixed amount of cash. Each process says up front the most it might ever borrow. When a process asks for more, the bank pretends to lend it and checks: could every customer still finish, one after another, with what is left? If yes, the loan is safe and granted. If not, the process waits. In the lecture example, the safe order is P1, P3, P4, P2, P0.',
      sources: ['21:30', '28:05'],
    }
  if (/prevent|avoid|difference/.test(s))
    return {
      text: 'Prevention changes the rules so one of the four conditions can never happen, for example making processes request all resources at once (removes hold and wait). Avoidance keeps the normal rules but checks each request at run time and only grants it if the system stays in a safe state. Prevention is simpler but wastes resources; avoidance is more flexible but needs to know maximum demand in advance.',
      sources: ['14:10', '21:30'],
    }
  if (/summar|summary|points|recap/.test(s))
    return {
      text: '1. A deadlock is a set of processes each waiting for something only another one in the set can provide.\n2. It needs mutual exclusion, hold and wait, no preemption and circular wait at the same time.\n3. Prevention removes one of those conditions for good.\n4. Avoidance, such as the Banker’s algorithm, grants a request only if the system stays safe.\n5. Detection lets deadlocks happen, finds cycles in a wait-for graph, then recovers by terminating or preempting processes.',
      sources: ['03:20', '07:45', '14:10', '28:05', '39:40'],
    }
  if (/assignment|due|deadline/.test(s))
    return { text: 'Assignment 2 asks you to implement the safety part of the Banker’s algorithm and test it on three scenarios. It is due Saturday 24 October at 23:59 and is worth 15% of WIA2004.', sources: ['48:15'] }
  return {
    text: 'I can only answer from the WIA2004 lecture 14 material in this demo. Try asking about deadlock conditions, the Banker’s algorithm, prevention and avoidance, or ask for flashcards.',
  }
}

function Flashcard({ q, a }: { q: string; a: string }) {
  const [flip, setFlip] = useState(false)
  return (
    <button className={`flash ${flip ? 'flip' : ''}`} onClick={() => setFlip((f) => !f)} aria-label={flip ? 'Show question' : 'Show answer'}>
      <span className="xs">{flip ? 'Answer' : 'Question'}</span>
      <p>{flip ? a : q}</p>
    </button>
  )
}

export default function StudyAssistant() {
  const me = personas.student
  const [scope, setScope] = useState<'lecture' | 'course'>('lecture')
  const [msgs, setMsgs] = useState<Msg[]>([{ id: 0, from: 'ai', text: 'Hi Aina. I have read the slides, transcript and readings for WIA2004 lecture 14 on deadlocks. Ask me anything about it, in English or Malay.' }])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const end = useRef<HTMLDivElement>(null)

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [msgs, busy])

  const ask = (q: string) => {
    const t = q.trim()
    if (!t || busy) return
    setMsgs((m) => [...m, { id: Date.now(), from: 'me', text: t }])
    setText('')
    setBusy(true)
    setTimeout(() => {
      setMsgs((m) => [...m, { id: Date.now() + 1, from: 'ai', ...answer(t) }])
      setBusy(false)
    }, 900)
  }

  return (
    <>
      <PageHead title="AI study assistant" sub="Ask questions about your lecture content. Answers point back to the exact moment in the recording." actions={<Seg value={scope} onChange={setScope} options={[{ id: 'lecture', label: 'Lecture 14' }, { id: 'course', label: 'Whole course' }]} />} />
      <div className="grid g-main-side">
        <Panel className="assistant" bodyClass="assistant-body">
          <div className="assistant-msgs">
            {msgs.map((m) => (
              <div key={m.id} className={`amsg ${m.from}`}>
                {m.from === 'ai' ? (
                  <span className="ai-av">
                    <Sparkles size={16} />
                  </span>
                ) : (
                  <Avatar name={me.name} color={me.color} size="sm" />
                )}
                <div className="amsg-bubble">
                  {m.text.split('\n').map((l, i) => (
                    <p key={i}>{l}</p>
                  ))}
                  {m.cards && (
                    <div className="flash-grid">
                      {m.cards.map((c) => (
                        <Flashcard key={c.q} {...c} />
                      ))}
                    </div>
                  )}
                  {m.sources && (
                    <div className="sources">
                      <span className="xs muted">Sources in the recording:</span>
                      {m.sources.map((s) => (
                        <Link key={s} to="/student/recordings?play=r1" className="source-chip">
                          <PlayCircle size={12} /> {s}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {busy && (
              <div className="amsg ai">
                <span className="ai-av">
                  <Sparkles size={16} />
                </span>
                <div className="amsg-bubble typing">
                  <i />
                  <i />
                  <i />
                </div>
              </div>
            )}
            <div ref={end} />
          </div>
          <form
            className="assistant-compose"
            onSubmit={(e) => {
              e.preventDefault()
              ask(text)
            }}
          >
            <input className="input" placeholder="Ask about deadlocks, the Banker’s algorithm or Assignment 2" value={text} onChange={(e) => setText(e.target.value)} aria-label="Ask the assistant" />
            <button className="btn" type="submit" disabled={!text.trim() || busy}>
              <Send size={15} /> Ask
            </button>
          </form>
        </Panel>
        <div className="stack">
          <Panel title="Try asking">
            <div className="stack" style={{ gap: 8 }}>
              {SUGGESTED.map((s) => (
                <button key={s} className="suggest" onClick={() => ask(s)}>
                  {s}
                </button>
              ))}
            </div>
            <button className="link-btn mt-2 row" style={{ gap: 6 }} onClick={() => setMsgs((m) => m.slice(0, 1))}>
              <RotateCcw size={13} /> Start a new conversation
            </button>
          </Panel>
          <Notice>Simulated assistant. Answers come from a fixed script based on sample lecture content. A production version would use a university-approved AI service over authorised course material only.</Notice>
        </div>
      </div>
    </>
  )
}
