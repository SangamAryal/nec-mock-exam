import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { CHAPTERS, NOTES } from '../data'

export default function Notes() {
  const { hash } = useLocation()
  const initialCh = hash.startsWith('#n-') ? Number(hash.slice(3).split('.')[0]) : 1
  const [ch, setCh] = useState(initialCh || 1)

  useEffect(() => {
    const c = Number(hash.slice(3).split('.')[0])
    if (c) setCh(c)
  }, [hash])
  // Scroll once the target chapter has rendered.
  useEffect(() => {
    if (hash) document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ block: 'start' })
  }, [hash, ch])

  const subs = Object.values(NOTES).filter((n) => n.sub.split('.')[0] === String(ch))

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <h1 className="text-2xl font-bold tracking-tight">Revision notes</h1>
        <p className="mt-1 text-sm text-sub">Probable questions and key points for each sub-chapter.</p>
        <label className="mt-4 block lg:hidden">
          <span className="sr-only">Chapter</span>
          <select value={ch} onChange={(e) => setCh(Number(e.target.value))} className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm">
            {CHAPTERS.map((c) => <option key={c.n} value={c.n}>{c.n}. {c.title}</option>)}
          </select>
        </label>
        <nav className="mt-4 hidden space-y-1 lg:block" aria-label="Chapters">
          {CHAPTERS.map((c) => (
            <button
              key={c.n}
              type="button"
              onClick={() => { setCh(c.n); window.scrollTo({ top: 0 }) }}
              aria-current={ch === c.n ? 'page' : undefined}
              className={`flex w-full gap-2 rounded-lg px-3 py-2 text-left text-sm ${ch === c.n ? 'bg-muted font-semibold text-ink' : 'text-sub hover:text-ink'}`}
            >
              <span className="w-5 shrink-0 text-sub">{c.n}</span>{c.title}
            </button>
          ))}
        </nav>
      </aside>

      <div className="space-y-5">
        <h2 className="text-lg font-semibold">{ch}. {CHAPTERS[ch - 1]?.title}</h2>
        {subs.map((n) => (
          <section key={n.sub} id={`n-${n.sub}`} className="card scroll-mt-24 p-5 sm:p-6">
            <h3 className="font-semibold"><span className="chip mr-2">{n.sub}</span>{n.title}</h3>
            <ol className="mt-4 space-y-3">
              {n.qa.map((qa, i) => (
                <li key={i} className="text-sm leading-relaxed">
                  <p className="font-medium">{i + 1}. {qa.q}</p>
                  <p className="mt-0.5 text-sub"><span className="font-semibold text-ok">Ans:</span> {qa.a}</p>
                </li>
              ))}
            </ol>
            {n.keyPoints && (
              <div className="mt-4 rounded-xl border-l-4 border-accent bg-accent/5 px-4 py-3 text-sm">
                <span className="font-semibold text-accent">Key points: </span>{n.keyPoints}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  )
}
