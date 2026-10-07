import { useMemo } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import Solution from '../components/Solution'
import { IconCheck, IconFlag, IconX } from '../components/Icons'
import { CHAPTERS, CHAPTER_SHORT, SUBS } from '../data'
import { itemResults, LETTER, summarize, type ItemResult } from '../lib/exam'
import { storage } from '../lib/storage'

const FILTERS = [
  ['all', 'All'],
  ['wrong', 'Wrong'],
  ['skipped', 'Unanswered'],
  ['correct', 'Correct'],
  ['flagged', 'Marked'],
  ['numerical', 'Numerical'],
] as const

const match: Record<string, (r: ItemResult) => boolean> = {
  all: () => true,
  wrong: (r) => r.chosen !== null && !r.isCorrect,
  skipped: (r) => r.chosen === null,
  correct: (r) => r.isCorrect,
  flagged: (r) => r.flagged,
  numerical: (r) => r.question.numerical,
}

export default function Review() {
  const { id = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const attempt = useMemo(() => storage.getAttempt(id), [id])
  const results = useMemo(() => (attempt ? itemResults(attempt) : []), [attempt])
  if (!attempt) return <Navigate to="/" replace />

  const f = params.get('f') ?? 'all'
  const ch = Number(params.get('ch') ?? 0)
  const set = (k: string, v: string | null) => {
    const p = new URLSearchParams(params)
    if (v === null || v === 'all' || v === '0') p.delete(k)
    else p.set(k, v)
    setParams(p, { replace: true })
  }
  const shown = results.filter((r) => (match[f] ?? match.all)(r) && (!ch || r.question.chapter === ch))
  const s = summarize(attempt)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link to={`/result/${attempt.id}`} className="text-sm text-sub hover:text-ink">← Back to result</Link>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Answer review</h1>
          <p className="text-sm text-sub">Score {s.score}/{s.total} · showing {shown.length} question{shown.length === 1 ? '' : 's'}</p>
        </div>
        <label className="text-sm">
          <span className="sr-only">Chapter</span>
          <select
            value={ch}
            onChange={(e) => set('ch', e.target.value)}
            className="rounded-xl border border-line bg-surface px-3 py-2.5 text-sm"
          >
            <option value={0}>All chapters</option>
            {CHAPTERS.map((c) => (
              <option key={c.n} value={c.n}>{c.n}. {CHAPTER_SHORT[c.n]}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="-mx-4 overflow-x-auto px-4" role="tablist" aria-label="Filter questions">
        <div className="flex w-max gap-2">
          {FILTERS.map(([k, label]) => {
            const count = results.filter((r) => match[k](r) && (!ch || r.question.chapter === ch)).length
            const active = f === k
            return (
              <button
                key={k}
                role="tab"
                aria-selected={active}
                onClick={() => set('f', k)}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium ${active ? 'border-brand bg-brand text-brand-ink' : 'border-line bg-surface text-sub hover:text-ink'}`}
              >
                {label} <span className="opacity-70">{count}</span>
              </button>
            )
          })}
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="card p-8 text-center text-sub">No questions match this filter.</div>
      ) : (
        <ol className="space-y-4">
          {shown.map((r) => (
            <ReviewCard key={r.index} r={r} />
          ))}
        </ol>
      )}
    </div>
  )
}

function ReviewCard({ r }: { r: ItemResult }) {
  const q = r.question
  const status = r.chosen === null ? 'skipped' : r.isCorrect ? 'correct' : 'wrong'
  const badge = {
    correct: ['bg-ok-soft text-ok', 'Correct'],
    wrong: ['bg-bad-soft text-bad', 'Wrong'],
    skipped: ['bg-muted text-sub', 'Not answered'],
  }[status]
  return (
    <li className="card p-5 sm:p-6" id={`q${r.index + 1}`}>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-bold text-ink">Q{r.index + 1}</span>
        <span className={`rounded-full px-2.5 py-0.5 font-semibold ${badge[0]}`}>{badge[1]}</span>
        {r.flagged && <span className="flex items-center gap-1 text-warn"><IconFlag width={13} height={13} /> Marked</span>}
        <span className="chip ml-auto" title={CHAPTERS[q.chapter - 1].title}>{q.sub} · {SUBS[q.sub]}</span>
      </div>
      <p className="mt-3 font-medium leading-relaxed">{q.stem}</p>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {r.options.map((opt, pos) => {
          const isCorrect = pos === r.correct
          const isChosen = pos === r.chosen
          const cls = isCorrect
            ? 'border-ok bg-ok-soft'
            : isChosen
              ? 'border-bad bg-bad-soft'
              : 'border-line'
          return (
            <li key={pos} className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-sm ${cls}`}>
              <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-md text-xs font-bold ${isCorrect ? 'bg-ok text-white' : isChosen ? 'bg-bad text-white' : 'bg-muted text-sub'}`}>
                {isCorrect ? <IconCheck width={14} height={14} /> : isChosen ? <IconX width={14} height={14} /> : LETTER[pos]}
              </span>
              <span className="pt-0.5">
                {opt}
                {isChosen && <span className="sr-only"> (your answer)</span>}
                {isCorrect && <span className="sr-only"> (correct answer)</span>}
              </span>
            </li>
          )
        })}
      </ul>
      <p className="mt-3 text-sm">
        {r.chosen === null ? (
          <span className="text-sub">You did not answer. </span>
        ) : !r.isCorrect ? (
          <span className="text-bad">Your answer: {LETTER[r.chosen]}. </span>
        ) : null}
        <span className="font-semibold text-ok">Correct answer: {LETTER[r.correct]} — {r.options[r.correct]}</span>
      </p>
      <div className="mt-4">
        <Solution q={q} />
      </div>
    </li>
  )
}
