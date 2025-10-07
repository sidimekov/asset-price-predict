export function parseNumber(v: string): number | null {
  const s = v.trim().replace(",", ".")
  if (s === "") return null
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

export function calculate(a: number, b: number, op: '+' | '-' | '*' | '/'): number {
  switch (op) {
    case '+': return a + b
    case '-': return a - b
    case '*': return a * b
    case '/': {
      if (b === 0) throw new Error('Division by zero')
      return a / b
    }
    default: throw new Error('Invalid operator')
  }
}
