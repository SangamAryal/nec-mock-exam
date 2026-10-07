export interface Question {
  id: string
  set: number
  chapter: number
  sub: string
  stem: string
  options: string[]
  answer: number
  explanation: string
  steps: string[]
  numerical: boolean
  formula?: string
}

export interface ExamItem {
  qid: string
  /** order[i] = index into Question.options shown at display position i */
  order: number[]
}

export interface Attempt {
  id: string
  startedAt: number
  endsAt: number
  durationSec: number
  mixed: boolean
  items: ExamItem[]
  /** selected display position per item, or null */
  answers: (number | null)[]
  flagged: boolean[]
  visited: boolean[]
  current: number
  submittedAt?: number
  autoSubmitted?: boolean
}

export interface AttemptSummary {
  id: string
  startedAt: number
  submittedAt: number
  score: number
  total: number
  timeTakenSec: number
}

export interface SubNote {
  sub: string
  title: string
  qa: { q: string; a: string }[]
  keyPoints: string
}
