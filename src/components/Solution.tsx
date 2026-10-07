import { Link } from 'react-router-dom'
import { NOTES } from '../data'
import type { Question } from '../types'
import { IconCalc } from './Icons'

/** Explanation, formula and step-by-step working for one question. */
export default function Solution({ q }: { q: Question }) {
  return (
    <div className="space-y-3 rounded-xl bg-muted/70 p-4 text-sm leading-relaxed">
      {q.numerical && (
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sub">
            <IconCalc width={15} height={15} /> Step-by-step solution
          </p>
          {q.formula && (
            <div className="mb-3 rounded-lg border border-brand/30 bg-surface px-3 py-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-brand">Formula</span>
              <p className="mt-0.5 font-mono text-[13px] text-ink">{q.formula}</p>
            </div>
          )}
          <ol className="space-y-2">
            {q.steps.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand text-[11px] font-bold text-brand-ink">{i + 1}</span>
                <span className="pt-0.5 font-mono text-[13px] text-ink">{s}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
      {q.explanation && (
        <div>
          {!q.numerical && <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-sub">Explanation</p>}
          <p className="text-ink">{q.explanation}</p>
        </div>
      )}
      {NOTES[q.sub] && (
        <Link to={`/notes#n-${q.sub}`} className="inline-block text-xs font-medium text-brand hover:underline">
          Revise {q.sub} {NOTES[q.sub].title} →
        </Link>
      )}
    </div>
  )
}
