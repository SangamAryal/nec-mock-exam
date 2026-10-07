import { Link, Navigate, useParams } from 'react-router-dom'
import { CHAPTERS, CHAPTER_SHORT, EXAM, SUBS } from '../data'
import { formatDuration, itemResults, summarize } from '../lib/exam'
import { storage } from '../lib/storage'

export default function Result() {
  const { id = '' } = useParams()
  const attempt = storage.getAttempt(id)
  if (!attempt) return <Navigate to="/" replace />

  const res = itemResults(attempt)
  const s = summarize(attempt)
  const pass = s.score >= EXAM.passMark
  const attempted = res.filter((r) => r.chosen !== null).length
  const wrong = attempted - s.score
  const accuracy = attempted ? Math.round((s.score / attempted) * 100) : 0

  const byChapter = CHAPTERS.map((c) => {
    const rs = res.filter((r) => r.question.chapter === c.n)
    return { ...c, total: rs.length, correct: rs.filter((r) => r.isCorrect).length }
  })

  const subStats = new Map<string, { total: number; correct: number }>()
  for (const r of res) {
    const st = subStats.get(r.question.sub) ?? { total: 0, correct: 0 }
    st.total++
    if (r.isCorrect) st.correct++
    subStats.set(r.question.sub, st)
  }
  const weak = [...subStats.entries()]
    .map(([sub, st]) => ({ sub, ...st, missed: st.total - st.correct }))
    .filter((x) => x.missed > 0)
    .sort((a, b) => b.missed - a.missed || a.correct / a.total - b.correct / b.total)
    .slice(0, 6)

  const R = 54
  const C = 2 * Math.PI * R

  return (
    <div className="space-y-8">
      <section className="card grid gap-8 p-6 sm:p-8 md:grid-cols-[auto_1fr] md:items-center">
        <div className="relative mx-auto h-40 w-40">
          <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90" aria-hidden>
            <circle cx="64" cy="64" r={R} fill="none" strokeWidth="12" className="stroke-muted" />
            <circle
              cx="64" cy="64" r={R} fill="none" strokeWidth="12" strokeLinecap="round"
              className={pass ? 'stroke-ok' : 'stroke-bad'}
              strokeDasharray={C} strokeDashoffset={C * (1 - s.score / s.total)}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              <div className="text-4xl font-bold tabular-nums">{s.score}</div>
              <div className="text-xs text-sub">out of {s.total}</div>
            </div>
          </div>
        </div>
        <div>
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${pass ? 'bg-ok-soft text-ok' : 'bg-bad-soft text-bad'}`}>
            {pass ? 'Passed' : 'Not passed'}
          </span>
          <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
            {pass ? 'Well done — you cleared the pass mark.' : `You need ${EXAM.passMark - s.score} more mark${EXAM.passMark - s.score > 1 ? 's' : ''} to pass.`}
          </h1>
          <p className="mt-1 text-sm text-sub">
            {new Date(s.submittedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
            {attempt.autoSubmitted && ' · auto-submitted when time ran out'}
          </p>
          <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Tile label="Correct" value={s.score} cls="text-ok" />
            <Tile label="Wrong" value={wrong} cls="text-bad" />
            <Tile label="Unanswered" value={s.total - attempted} />
            <Tile label="Time taken" value={formatDuration(s.timeTakenSec)} />
          </dl>
          <p className="mt-3 text-sm text-sub">Accuracy on attempted questions: <strong className="text-ink">{accuracy}%</strong></p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link to={`/review/${attempt.id}`} className="btn-primary">Review answers</Link>
            <Link to={`/review/${attempt.id}?f=wrong`} className="btn-ghost">Only mistakes</Link>
            <Link to="/" className="btn-ghost">Home</Link>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="card p-6" aria-labelledby="bych">
          <h2 id="bych" className="font-semibold">Score by chapter</h2>
          <ul className="mt-4 space-y-3">
            {byChapter.map((c) => {
              const pct = c.total ? c.correct / c.total : 0
              return (
                <li key={c.n}>
                  <Link to={`/review/${attempt.id}?ch=${c.n}`} className="group block">
                    <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                      <span className="truncate group-hover:text-brand" title={c.title}>
                        <span className="text-sub">{c.n}.</span> {CHAPTER_SHORT[c.n]}
                      </span>
                      <span className="shrink-0 font-semibold tabular-nums">{c.correct}/{c.total}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${pct >= 0.7 ? 'bg-ok' : pct >= 0.5 ? 'bg-warn' : 'bg-bad'}`}
                        style={{ width: `${Math.max(pct * 100, 2)}%` }}
                      />
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="card p-6" aria-labelledby="weak">
          <h2 id="weak" className="font-semibold">Revise these first</h2>
          <p className="mt-1 text-xs text-sub">Sub-chapters where you dropped the most marks.</p>
          {weak.length === 0 ? (
            <p className="mt-4 text-sm text-sub">Perfect score — nothing to revise!</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {weak.map((w) => (
                <li key={w.sub}>
                  <Link to={`/notes#n-${w.sub}`} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5 text-sm hover:bg-muted">
                    <span className="chip shrink-0">{w.sub}</span>
                    <span className="min-w-0 flex-1 truncate">{SUBS[w.sub]}</span>
                    <span className="shrink-0 text-xs font-semibold text-bad">−{w.missed}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

function Tile({ label, value, cls = '' }: { label: string; value: string | number; cls?: string }) {
  return (
    <div className="rounded-xl bg-muted px-3 py-2.5">
      <dd className={`text-lg font-bold tabular-nums ${cls}`}>{value}</dd>
      <dt className="text-xs text-sub">{label}</dt>
    </div>
  )
}
