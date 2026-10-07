/** Uniform random integer in [0, n) using the crypto RNG. */
export function randInt(n: number): number {
  const buf = new Uint32Array(1)
  const limit = Math.floor(0x100000000 / n) * n
  let x: number
  do {
    crypto.getRandomValues(buf)
    x = buf[0]
  } while (x >= limit)
  return x % n
}

/** Fisher–Yates shuffle, returns a new array. */
export function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(i + 1)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
