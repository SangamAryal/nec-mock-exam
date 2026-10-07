import type { Attempt, AttemptSummary } from '../types'

const K = {
  active: 'nec.active',
  attempts: 'nec.attempts',
  summaries: 'nec.summaries',
  seen: 'nec.seen',
}
const MAX_SAVED = 20

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage full or blocked: app still works for this session */
  }
}

function remove(key: string) {
  try {
    localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

export const storage = {
  getActive: () => read<Attempt | null>(K.active, null),
  setActive: (a: Attempt | null) => (a ? write(K.active, a) : remove(K.active)),

  getAttempts: () => read<Record<string, Attempt>>(K.attempts, {}),
  getAttempt: (id: string) => read<Record<string, Attempt>>(K.attempts, {})[id] ?? null,
  saveAttempt(a: Attempt, summary: AttemptSummary) {
    const summaries = [summary, ...read<AttemptSummary[]>(K.summaries, []).filter((s) => s.id !== a.id)]
    const attempts = read<Record<string, Attempt>>(K.attempts, {})
    attempts[a.id] = a
    // Keep full detail only for the most recent attempts; summaries are kept longer.
    const keep = new Set(summaries.slice(0, MAX_SAVED).map((s) => s.id))
    for (const id of Object.keys(attempts)) if (!keep.has(id)) delete attempts[id]
    write(K.attempts, attempts)
    write(K.summaries, summaries.slice(0, 100))
  },
  getSummaries: () => read<AttemptSummary[]>(K.summaries, []),
  clearHistory() {
    for (const key of [K.attempts, K.summaries, K.seen]) remove(key)
  },

  getSeen: () => new Set(read<string[]>(K.seen, [])),
  setSeen: (s: Set<string>) => write(K.seen, [...s]),
}
