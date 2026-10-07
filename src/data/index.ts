import questionsJson from './questions.json'
import notesJson from './notes.json'
import syllabusJson from './syllabus.json'
import type { Question, SubNote } from '../types'

export const QUESTIONS = questionsJson as Question[]
export const QUESTION_BY_ID = new Map(QUESTIONS.map((q) => [q.id, q]))
export const NOTES = notesJson as Record<string, SubNote>
export const CHAPTERS = Object.entries(syllabusJson.chapters as Record<string, string>).map(([n, title]) => ({
  n: Number(n),
  title,
}))
export const SUBS = syllabusJson.subs as Record<string, string>

export const EXAM = {
  questions: 100,
  perChapter: 10,
  durationSec: 2 * 60 * 60,
  passMark: 50,
} as const

/** Short chapter names for compact UI. */
export const CHAPTER_SHORT: Record<number, string> = {
  1: 'Electrical & Electronics',
  2: 'Digital Logic & µP',
  3: 'Programming',
  4: 'Comp. Org. & Embedded',
  5: 'Networks & Security',
  6: 'TOC & Graphics',
  7: 'DSA, DBMS & OS',
  8: 'Software Engineering',
  9: 'AI & Neural Networks',
  10: 'Project Planning',
}
