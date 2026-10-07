import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { IconMoon, IconSun } from './Icons'

export function useTheme() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    try {
      localStorage.setItem('nec.theme', dark ? 'dark' : 'light')
    } catch {
      /* ignore */
    }
  }, [dark])
  return [dark, setDark] as const
}

export function ThemeToggle() {
  const [dark, setDark] = useTheme()
  return (
    <button
      type="button"
      onClick={() => setDark(!dark)}
      className="grid h-9 w-9 place-items-center rounded-lg text-sub hover:bg-muted hover:text-ink"
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {dark ? <IconSun /> : <IconMoon />}
    </button>
  )
}

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#1f2a44] text-[#f0b429]">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
      </span>
      <span className="leading-tight">
        NEC Mock
        <span className="hidden text-[11px] font-medium text-sub sm:block">Computer Engineering · ACtE</span>
      </span>
    </Link>
  )
}

const navCls = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-muted text-ink' : 'text-sub hover:text-ink'}`

export default function Layout() {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Logo />
          <nav className="flex items-center gap-1" aria-label="Main">
            <NavLink to="/" end className={navCls}>Home</NavLink>
            <NavLink to="/notes" className={navCls}>Notes</NavLink>
            <ThemeToggle />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:pt-10">
        <Outlet />
      </main>
    </div>
  )
}
