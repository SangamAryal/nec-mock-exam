import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Modal from '../components/Modal'
import { IconBook, IconClock, IconPlay, IconRotate } from '../components/Icons'
import { CHAPTERS, EXAM, QUESTIONS } from '../data'
import { formatDuration, generateAttempt } from '../lib/exam'
import { storage } from '../lib/storage'

const FACTS = [
  { k: '100', v: 'questions' },
  { k: '1', v: 'mark each' },
  { k: '2 hrs', v: 'duration' },
  { k: '50', v: 'pass mark' },
]

export default function Home() {
  const navigate = useNavigate()
  const [active, setActive] = useState(storage.getActive)
  const [summaries, setSummaries] = useState(storage.getSummaries)
  const [mixed, setMixed] = useState(false)
  const [confirmNew, setConfirmNew] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const activeLive = active && !active.submittedAt ? active : null
  const answered = activeLive?.answers.filter((a) => a !== null).length ?? 0

  function start() {
    const attempt = generateAttempt({ mixed })
    storage.setActive(attempt)
    navigate('/exam')
  }

  function onStart() {
    if (activeLive) setConfirmNew(true)
    else start()
  }

  const best = summaries.length ? Math.max(...summaries.map((s) => s.score)) : null
  const avg = summaries.length ? Math.round(summaries.reduce((t, s) => t + s.score, 0) / summaries.length) : null

  return (
    <div className="space-y-10">
      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="card relative overflow-hidden p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/10 blur-2xl" />
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">NEC Registration Examination</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Computer Engineering mock test</h1>
          <p className="mt-3 max-w-xl text-sub">
            Sit a full-length paper under exam conditions. Every mock draws a fresh random set of 100 questions —
            10 from each syllabus chapter, covering all sub-chapters — from a bank of {QUESTIONS.length} questions.
          </p>

          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {FACTS.map((f) => (
              <div key={f.v} className="rounded-xl bg-muted px-4 py-3">
                <dt className="sr-only">{f.v}</dt>
                <dd className="text-xl font-bold">{f.k}</dd>
                <dd className="text-xs text-sub">{f.v}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
            <button type="button" className="btn-primary px-6 py-3 text-base" onClick={onStart}>
              <IconPlay width={18} height={18} /> Start new mock
            </button>
            <label className="flex cursor-pointer select-none items-center gap-3 text-sm text-sub">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={mixed}
                onChange={(e) => setMixed(e.target.checked)}
              />
              <span className="relative h-6 w-10 rounded-full bg-line transition-colors peer-checked:bg-brand peer-focus-visible:ring-2 peer-focus-visible:ring-brand after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4" />
              Mix chapter order
            </label>
          </div>
          <p className="mt-4 text-xs text-sub">No negative marking · Options are shuffled every attempt · Your progress is saved in this browser.</p>
        </div>

        <div className="flex flex-col gap-6">
          {activeLive ? (
            <div className="card border-brand/40 p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand">Test in progress</p>
              <p className="mt-2 text-2xl font-bold tabular-nums">
                {formatDuration((activeLive.endsAt - now) / 1000)} <span className="text-sm font-medium text-sub">left</span>
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
                <div className="h-full rounded-full bg-brand" style={{ width: `${answered}%` }} />
              </div>
              <p className="mt-2 text-sm text-sub">{answered} of {activeLive.items.length} answered</p>
              <Link to="/exam" className="btn-primary mt-4 w-full">
                <IconRotate width={18} height={18} /> Resume test
              </Link>
            </div>
          ) : (
            <div className="card p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-sub">Your progress</p>
              <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                <Stat label="Mocks" value={summaries.length || '—'} />
                <Stat label="Best" value={best ?? '—'} />
                <Stat label="Average" value={avg ?? '—'} />
              </div>
            </div>
          )}
          <Link to="/notes" className="card flex items-center gap-4 p-5 transition-colors hover:bg-muted">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent"><IconBook /></span>
            <span>
              <span className="block font-semibold">Quick revision notes</span>
              <span className="text-sm text-sub">300 probable Q&amp;As and key points for all 60 sub-chapters</span>
            </span>
          </Link>
        </div>
      </section>

      <section aria-labelledby="hist">
        <div className="mb-3 flex items-end justify-between">
          <h2 id="hist" className="text-lg font-semibold">Past attempts</h2>
          {summaries.length > 0 && (
            <button type="button" className="text-sm text-sub hover:text-accent" onClick={() => setConfirmClear(true)}>
              Clear history
            </button>
          )}
        </div>
        {summaries.length === 0 ? (
          <div className="card p-6 text-sm text-sub">No attempts yet. Your scores and reviews will appear here.</div>
        ) : (
          <ul className="card divide-y divide-line">
            {summaries.slice(0, 20).map((s) => {
              const pass = s.score >= EXAM.passMark
              const hasDetail = !!storage.getAttempt(s.id)
              return (
                <li key={s.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4">
                  <span className={`grid h-11 w-14 place-items-center rounded-lg text-sm font-bold ${pass ? 'bg-ok-soft text-ok' : 'bg-bad-soft text-bad'}`}>
                    {s.score}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">
                      {new Date(s.submittedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-sub">
                      <IconClock width={13} height={13} /> {formatDuration(s.timeTakenSec)} · {pass ? 'Passed' : 'Not passed'}
                    </span>
                  </span>
                  {hasDetail && (
                    <span className="flex gap-2">
                      <Link className="btn-ghost px-3 py-1.5 text-xs" to={`/result/${s.id}`}>Result</Link>
                      <Link className="btn-ghost px-3 py-1.5 text-xs" to={`/review/${s.id}`}>Review</Link>
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="bp">
        <h2 id="bp" className="mb-3 text-lg font-semibold">Exam blueprint</h2>
        <ol className="grid gap-2 sm:grid-cols-2">
          {CHAPTERS.map((c) => (
            <li key={c.n} className="card flex items-center gap-3 px-4 py-3 text-sm">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-muted text-xs font-bold text-sub">{c.n}</span>
              <span className="flex-1">{c.title}</span>
              <span className="chip">10 Q</span>
            </li>
          ))}
        </ol>
      </section>

      <p className="text-center text-xs text-sub">
        Practice questions written to the NEC ACtE syllabus — not official NEC papers. Always check the
        Nepal Engineering Council website for current notices.
      </p>

      <Modal
        open={confirmNew}
        title="Start a new mock?"
        onClose={() => setConfirmNew(false)}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setConfirmNew(false)} data-autofocus>Cancel</button>
            <button className="btn-danger" onClick={start}>Discard &amp; start new</button>
          </>
        }
      >
        You have a test in progress with {answered} answers. Starting a new mock will discard it.
      </Modal>
      <Modal
        open={confirmClear}
        title="Clear all history?"
        onClose={() => setConfirmClear(false)}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setConfirmClear(false)} data-autofocus>Cancel</button>
            <button
              className="btn-danger"
              onClick={() => {
                storage.clearHistory()
                setSummaries([])
                setActive(storage.getActive())
                setConfirmClear(false)
              }}
            >
              Clear history
            </button>
          </>
        }
      >
        This removes all past scores and reviews from this browser, and resets which questions you have already seen.
      </Modal>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl bg-muted py-3">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-sub">{label}</div>
    </div>
  )
}
