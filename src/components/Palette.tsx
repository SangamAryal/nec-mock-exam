import { CHAPTER_SHORT, QUESTION_BY_ID } from '../data'
import type { Attempt } from '../types'

interface Props {
  attempt: Attempt
  onJump: (i: number) => void
}

export function paletteState(a: Attempt, i: number) {
  if (a.flagged[i]) return 'flagged'
  if (a.answers[i] !== null) return 'answered'
  if (a.visited[i]) return 'skipped'
  return 'new'
}

const CLS: Record<string, string> = {
  answered: 'bg-brand text-brand-ink border-brand',
  flagged: 'bg-warn-soft text-warn border-warn',
  skipped: 'bg-bad-soft text-bad border-bad/40',
  new: 'bg-surface text-sub border-line',
}

export function Legend({ attempt }: { attempt: Attempt }) {
  const counts = { answered: 0, flagged: 0, skipped: 0, new: 0 } as Record<string, number>
  attempt.items.forEach((_, i) => counts[paletteState(attempt, i)]++)
  const rows = [
    ['answered', 'Answered'],
    ['flagged', 'Marked for review'],
    ['skipped', 'Not answered'],
    ['new', 'Not visited'],
  ]
  return (
    <ul className="grid grid-cols-2 gap-2 text-xs text-sub">
      {rows.map(([k, label]) => (
        <li key={k} className="flex items-center gap-2">
          <span className={`grid h-5 min-w-5 place-items-center rounded border px-1 text-[10px] font-bold ${CLS[k]}`}>{counts[k]}</span>
          {label}
        </li>
      ))}
    </ul>
  )
}

export default function Palette({ attempt, onJump }: Props) {
  // Group by chapter when the paper keeps chapter order; otherwise one block.
  const groups: { label: string | null; idx: number[] }[] = []
  attempt.items.forEach((it, i) => {
    const label = attempt.mixed ? null : `${QUESTION_BY_ID.get(it.qid)!.chapter}. ${CHAPTER_SHORT[QUESTION_BY_ID.get(it.qid)!.chapter]}`
    const last = groups[groups.length - 1]
    if (last && last.label === label) last.idx.push(i)
    else groups.push({ label, idx: [i] })
  })
  return (
    <div className="space-y-3">
      {groups.map((g, gi) => (
        <div key={gi}>
          {g.label && <p className="mb-1.5 truncate text-[11px] font-semibold uppercase tracking-wide text-sub">{g.label}</p>}
          <div className="grid grid-cols-10 gap-1">
            {g.idx.map((i) => {
              const state = paletteState(attempt, i)
              const answered = attempt.answers[i] !== null
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => onJump(i)}
                  aria-label={`Question ${i + 1}, ${state === 'new' ? 'not visited' : state}${answered && state === 'flagged' ? ', answered' : ''}`}
                  aria-current={attempt.current === i ? 'step' : undefined}
                  className={`relative aspect-square rounded-md border text-[11px] font-semibold tabular-nums transition hover:brightness-95 ${CLS[state]} ${attempt.current === i ? 'ring-2 ring-accent ring-offset-1 ring-offset-surface' : ''}`}
                >
                  {i + 1}
                  {state === 'flagged' && answered && (
                    <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-brand" aria-hidden />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
