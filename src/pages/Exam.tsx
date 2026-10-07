import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import Modal from '../components/Modal'
import Palette, { Legend } from '../components/Palette'
import { IconClock, IconFlag, IconGrid, IconX } from '../components/Icons'
import { Logo, ThemeToggle } from '../components/Layout'
import { CHAPTERS, QUESTION_BY_ID, SUBS } from '../data'
import { formatDuration, LETTER, summarize } from '../lib/exam'
import { storage } from '../lib/storage'
import type { Attempt, Question } from '../types'

export default function Exam() {
  const navigate = useNavigate()
  const [attempt, setAttempt] = useState<Attempt | null>(() => {
    const a = storage.getActive()
    return a && !a.submittedAt ? a : null
  })
  const [now, setNow] = useState(Date.now())
  const [confirmSubmit, setConfirmSubmit] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const warned = useRef(new Set<number>())
  const submitted = useRef(false)
  const cardRefs = useRef<(HTMLLIElement | null)[]>([])

  const update = useCallback((fn: (a: Attempt) => Attempt) => {
    setAttempt((prev) => {
      if (!prev) return prev
      const next = fn(prev)
      if (next !== prev) storage.setActive(next)
      return next
    })
  }, [])

  const submit = useCallback(
    (auto = false) => {
      if (!attempt || submitted.current) return
      submitted.current = true
      const done: Attempt = { ...attempt, submittedAt: Math.min(Date.now(), attempt.endsAt), autoSubmitted: auto }
      storage.saveAttempt(done, summarize(done))
      storage.setActive(null)
      navigate(`/result/${done.id}`, { replace: true })
    },
    [attempt, navigate],
  )

  const remaining = attempt ? Math.max(0, (attempt.endsAt - now) / 1000) : 0

  // Clock + auto-submit + time warnings
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(t)
  }, [])
  useEffect(() => {
    if (!attempt) return
    if (remaining <= 0) submit(true)
    for (const min of [10, 5, 1]) {
      if (remaining <= min * 60 && remaining > 0 && !warned.current.has(min)) {
        warned.current.add(min)
        // don't announce every threshold at once when resuming late
        if (remaining > (min - 1) * 60) setToast(`${min} minute${min > 1 ? 's' : ''} remaining`)
      }
    }
  }, [remaining, attempt, submit])
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(t)
  }, [toast])

  const choose = useCallback(
    (index: number, pos: number | null) =>
      update((a) => {
        if (a.answers[index] === pos) return a
        const answers = a.answers.slice()
        answers[index] = pos
        return { ...a, answers }
      }),
    [update],
  )

  const toggleFlag = useCallback(
    (index: number) =>
      update((a) => {
        const flagged = a.flagged.slice()
        flagged[index] = !flagged[index]
        return { ...a, flagged }
      }),
    [update],
  )

  const registerCard = useCallback((i: number, el: HTMLLIElement | null) => {
    cardRefs.current[i] = el
  }, [])

  const jump = useCallback((i: number) => {
    setPaletteOpen(false)
    cardRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  // Track which question is in view: highlights it in the palette and marks it visited.
  const hasAttempt = !!attempt
  useEffect(() => {
    if (!hasAttempt) return
    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).map((e) => Number((e.target as HTMLElement).dataset.index))
        if (!hit.length) return
        const idx = Math.min(...hit)
        update((a) => {
          if (a.current === idx && hit.every((h) => a.visited[h])) return a
          const visited = a.visited.slice()
          for (const h of hit) visited[h] = true
          return { ...a, current: idx, visited }
        })
      },
      { rootMargin: '-30% 0px -60% 0px' },
    )
    cardRefs.current.forEach((el) => el && observer.observe(el))
    return () => observer.disconnect()
  }, [hasAttempt, update])

  // On resume, return to where the candidate left off.
  useEffect(() => {
    const i = storage.getActive()?.current ?? 0
    if (i > 0) cardRefs.current[i]?.scrollIntoView({ block: 'start' })
  }, [])

  if (!attempt) return <Navigate to="/" replace />

  const answeredCount = attempt.answers.filter((a) => a !== null).length
  const unanswered = attempt.items.length - answeredCount
  const flaggedCount = attempt.flagged.filter(Boolean).length
  const low = remaining <= 10 * 60

  return (
    <div className="min-h-dvh pb-24 lg:pb-12">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <div className="hidden sm:block"><Logo /></div>
          <div
            className={`flex items-center gap-2 rounded-xl px-3 py-1.5 font-mono text-lg font-semibold tabular-nums ${low ? 'bg-bad-soft text-bad' : 'bg-muted'}`}
            role="timer"
            aria-label={`Time remaining ${formatDuration(remaining)}`}
          >
            <IconClock width={18} height={18} />
            {formatDuration(remaining)}
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-sub md:inline">{answeredCount}/{attempt.items.length} answered</span>
            <ThemeToggle />
            <button type="button" className="btn-primary px-3 sm:px-4" onClick={() => setConfirmSubmit(true)}>
              Submit
            </button>
          </div>
        </div>
        <div className="h-1 bg-muted" aria-hidden>
          <div className="h-full bg-brand transition-[width]" style={{ width: `${answeredCount}%` }} />
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 pt-6 lg:grid-cols-[1fr_320px]">
        <section className="min-w-0" aria-label="Questions">
          <p className="mb-4 text-sm text-sub">
            All {attempt.items.length} questions are on this page. You can change any answer as many times as you like until you submit or time runs out.
          </p>
          <ol className="space-y-4">
            {attempt.items.map((item, i) => {
              const q = QUESTION_BY_ID.get(item.qid)!
              const prevQ = i > 0 ? QUESTION_BY_ID.get(attempt.items[i - 1].qid)! : null
              const newChapter = !attempt.mixed && (!prevQ || prevQ.chapter !== q.chapter)
              return (
                <QuestionCard
                  key={item.qid}
                  register={registerCard}
                  index={i}
                  q={q}
                  order={item.order}
                  chosen={attempt.answers[i]}
                  flagged={attempt.flagged[i]}
                  chapterHeading={newChapter ? `Chapter ${q.chapter} · ${CHAPTERS[q.chapter - 1].title}` : null}
                  onChoose={choose}
                  onFlag={toggleFlag}
                />
              )
            })}
          </ol>

          <div className="card mt-6 flex flex-col items-center gap-3 p-6 text-center">
            <p className="font-semibold">End of paper</p>
            <p className="text-sm text-sub">
              {answeredCount} answered · {unanswered} unanswered · {flaggedCount} marked for review
            </p>
            <button type="button" className="btn-primary px-6" onClick={() => setConfirmSubmit(true)}>Submit test</button>
          </div>
        </section>

        <aside className="hidden lg:block" aria-label="Question palette">
          <div className="card sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto p-5">
            <Legend attempt={attempt} />
            <hr className="my-4 border-line" />
            <Palette attempt={attempt} onJump={jump} />
          </div>
        </aside>
      </div>

      {/* Mobile bottom bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur lg:hidden" aria-label="Question navigation">
        <div className="mx-auto flex max-w-2xl items-center gap-2">
          <button type="button" className="btn-ghost flex-1" onClick={() => setPaletteOpen(true)}>
            <IconGrid width={18} height={18} /> Questions · {answeredCount}/{attempt.items.length} answered
          </button>
        </div>
      </nav>

      {paletteOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setPaletteOpen(false)} />
          <div role="dialog" aria-modal="true" aria-label="All questions" className="absolute inset-x-0 bottom-0 max-h-[80dvh] overflow-y-auto rounded-t-2xl bg-surface p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Jump to question</h2>
              <button type="button" className="grid h-9 w-9 place-items-center rounded-lg hover:bg-muted" onClick={() => setPaletteOpen(false)} aria-label="Close">
                <IconX />
              </button>
            </div>
            <Legend attempt={attempt} />
            <hr className="my-4 border-line" />
            <Palette attempt={attempt} onJump={jump} />
          </div>
        </div>
      )}

      {toast && (
        <div role="status" className="fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-xl bg-bad px-4 py-2.5 text-sm font-semibold text-white shadow-lg">
          ⏰ {toast}
        </div>
      )}

      <Modal
        open={confirmSubmit}
        title="Submit your test?"
        onClose={() => setConfirmSubmit(false)}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setConfirmSubmit(false)} data-autofocus>Keep working</button>
            <button className="btn-primary" onClick={() => submit(false)}>Submit test</button>
          </>
        }
      >
        <dl className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-muted p-3"><dd className="text-xl font-bold text-ink">{answeredCount}</dd><dt className="text-xs">Answered</dt></div>
          <div className="rounded-xl bg-muted p-3"><dd className={`text-xl font-bold ${unanswered ? 'text-bad' : 'text-ink'}`}>{unanswered}</dd><dt className="text-xs">Unanswered</dt></div>
          <div className="rounded-xl bg-muted p-3"><dd className="text-xl font-bold text-ink">{flaggedCount}</dd><dt className="text-xs">Marked</dt></div>
        </dl>
        <p className="mt-4">
          {unanswered > 0
            ? `There is no negative marking — consider answering the remaining ${unanswered} question${unanswered > 1 ? 's' : ''}. `
            : ''}
          You have {formatDuration(remaining)} left. Once submitted, you can't change your answers.
        </p>
      </Modal>
    </div>
  )
}

interface CardProps {
  index: number
  q: Question
  order: number[]
  chosen: number | null
  flagged: boolean
  chapterHeading: string | null
  onChoose: (index: number, pos: number | null) => void
  onFlag: (index: number) => void
  register: (index: number, el: HTMLLIElement | null) => void
}

/** One question in the scrolling paper. Memoised so answering one question doesn't re-render all 100. */
const QuestionCard = memo(function QuestionCard({
  index, q, order, chosen, flagged, chapterHeading, onChoose, onFlag, register,
}: CardProps) {
  const labelId = `q${index + 1}-stem`
  return (
    <li ref={(el) => register(index, el)} data-index={index} id={`q${index + 1}`} className="scroll-mt-24">
      {chapterHeading && (
        <h2 className="mb-3 mt-6 text-xs font-semibold uppercase tracking-[0.12em] text-accent first:mt-0">{chapterHeading}</h2>
      )}
      <div className={`card p-5 sm:p-6 ${flagged ? 'border-warn/60' : ''}`}>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-ink">Q{index + 1}</span>
          <span className="chip" title={CHAPTERS[q.chapter - 1].title}>{q.sub} · {SUBS[q.sub]}</span>
          <span className="ml-auto text-sub">1 mark</span>
        </div>
        <p id={labelId} className="mt-3 font-medium leading-relaxed sm:text-lg">{q.stem}</p>

        <div role="radiogroup" aria-labelledby={labelId} className="mt-4 grid gap-2 sm:grid-cols-2">
          {order.map((o, pos) => {
            const selected = chosen === pos
            return (
              <button
                key={pos}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onChoose(index, pos)}
                className={`group flex w-full items-start gap-3 rounded-xl border px-3.5 py-3 text-left text-sm transition-colors sm:text-[15px] ${
                  selected ? 'border-brand bg-brand/10 ring-1 ring-brand' : 'border-line hover:border-sub/50 hover:bg-muted'
                }`}
              >
                <span
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-md text-xs font-bold ${
                    selected ? 'bg-brand text-brand-ink' : 'bg-muted text-sub group-hover:bg-surface'
                  }`}
                >
                  {LETTER[pos]}
                </span>
                <span className="pt-0.5 leading-relaxed">{q.options[o]}</span>
              </button>
            )
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className={`btn-ghost px-3 py-1.5 text-xs ${flagged ? 'border-warn bg-warn-soft text-warn hover:bg-warn-soft' : ''}`}
            onClick={() => onFlag(index)}
            aria-pressed={flagged}
          >
            <IconFlag width={14} height={14} /> {flagged ? 'Marked for review' : 'Mark for review'}
          </button>
          {chosen !== null && (
            <button type="button" className="btn-ghost px-3 py-1.5 text-xs" onClick={() => onChoose(index, null)}>
              <IconX width={14} height={14} /> Clear answer
            </button>
          )}
        </div>
      </div>
    </li>
  )
})
