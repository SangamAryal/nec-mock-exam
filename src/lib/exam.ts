import { CHAPTERS, EXAM, QUESTIONS, QUESTION_BY_ID } from '../data'
import type { Attempt, AttemptSummary, Question } from '../types'
import { shuffle } from './random'
import { storage } from './storage'

const byChapter = new Map<number, Question[]>()
for (const q of QUESTIONS) {
  if (!byChapter.has(q.chapter)) byChapter.set(q.chapter, [])
  byChapter.get(q.chapter)!.push(q)
}

/**
 * Draw `count` questions from one chapter: prefer questions not seen in earlier mocks,
 * and cover every sub-chapter at least once (as the official blueprint does).
 */
function drawChapter(pool: Question[], count: number, seen: Set<string>): Question[] {
  let fresh = pool.filter((q) => !seen.has(q.id))
  if (fresh.length < count) {
    // The chapter's pool is exhausted: start a new cycle for it.
    for (const q of pool) seen.delete(q.id)
    fresh = pool
  }
  const picked: Question[] = []
  const used = new Set<string>()
  const subs = shuffle([...new Set(pool.map((q) => q.sub))])
  for (const sub of subs) {
    if (picked.length >= count) break
    const candidates = fresh.filter((q) => q.sub === sub)
    if (candidates.length) {
      const q = shuffle(candidates)[0]
      picked.push(q)
      used.add(q.id)
    }
  }
  for (const q of shuffle(fresh)) {
    if (picked.length >= count) break
    if (!used.has(q.id)) {
      picked.push(q)
      used.add(q.id)
    }
  }
  return shuffle(picked)
}

export function generateAttempt(opts: { mixed: boolean; durationSec?: number }): Attempt {
  const seen = storage.getSeen()
  let qs: Question[] = []
  for (const ch of CHAPTERS) qs.push(...drawChapter(byChapter.get(ch.n) ?? [], EXAM.perChapter, seen))
  if (opts.mixed) qs = shuffle(qs)
  for (const q of qs) seen.add(q.id)
  storage.setSeen(seen)

  const now = Date.now()
  const durationSec = opts.durationSec ?? EXAM.durationSec
  const n = qs.length
  return {
    id: `${now.toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    startedAt: now,
    endsAt: now + durationSec * 1000,
    durationSec,
    mixed: opts.mixed,
    items: qs.map((q) => ({ qid: q.id, order: shuffle(q.options.map((_, i) => i)) })),
    answers: Array(n).fill(null),
    flagged: Array(n).fill(false),
    visited: Array.from({ length: n }, (_, i) => i === 0),
    current: 0,
  }
}

export interface ItemResult {
  index: number
  question: Question
  /** options in the order the candidate saw them */
  options: string[]
  correct: number
  chosen: number | null
  isCorrect: boolean
  flagged: boolean
}

export function itemResults(a: Attempt): ItemResult[] {
  return a.items.map((it, index) => {
    const question = QUESTION_BY_ID.get(it.qid)!
    const chosen = a.answers[index]
    const correct = it.order.indexOf(question.answer)
    return {
      index,
      question,
      options: it.order.map((o) => question.options[o]),
      correct,
      chosen,
      isCorrect: chosen === correct,
      flagged: a.flagged[index],
    }
  })
}

export function summarize(a: Attempt): AttemptSummary {
  const res = itemResults(a)
  const submittedAt = a.submittedAt ?? Date.now()
  return {
    id: a.id,
    startedAt: a.startedAt,
    submittedAt,
    score: res.filter((r) => r.isCorrect).length,
    total: res.length,
    timeTakenSec: Math.min(a.durationSec, Math.round((submittedAt - a.startedAt) / 1000)),
  }
}

export function formatDuration(sec: number): string {
  const s = Math.max(0, Math.floor(sec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = s % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h ? `${h}:${pad(m)}:${pad(ss)}` : `${pad(m)}:${pad(ss)}`
}

export const LETTER = ['A', 'B', 'C', 'D']
