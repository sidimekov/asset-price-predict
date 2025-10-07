"use client"

import { useState } from "react"

type Op = "+" | "-" | "*" | "/"

function parseNumber(v: string): number | null {
  const s = v.trim().replace(",", ".")
  if (s === "") return null
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

export default function Home() {
  const [a, setA] = useState("")
  const [b, setB] = useState("")
  const [op, setOp] = useState<Op>("+")
  const [result, setResult] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCalculate = () => {
    setError(null)
    setResult(null)

    const numA = parseNumber(a)
    const numB = parseNumber(b)

    if (numA === null || numB === null) {
      setError("Ошибка: введите корректные числа (пример: 12, -3.5).")
      return
    }

    if (op === "/" && numB === 0) {
      setError("0")
      return
    }

    let res: number
    switch (op) {
      case "+": res = numA + numB; break
      case "-": res = numA - numB; break
      case "*": res = numA * numB; break
      case "/": res = numA / numB; break
    }
    setResult(res)
  }

  return (
      <main className="min-h-screen grid place-items-center p-8">
        <div className="w-full max-w-md space-y-4">
          <h1 className="text-2xl font-semibold">Calculator</h1>

          <input
              aria-label="Число A"
              placeholder="Число A"
              className="w-full rounded border px-3 py-2"
              value={a}
              onChange={(e) => setA(e.target.value)}
          />

          <select
              aria-label="Операция"
              className="w-full rounded border px-3 py-2"
              value={op}
              onChange={(e) => setOp(e.target.value as Op)}
          >
            <option value="+">Сложить</option>
            <option value="-">Вычесть</option>
            <option value="*">Умножить</option>
            <option value="/">Поделить</option>
          </select>

          <input
              aria-label="Число B"
              placeholder="Число B"
              className="w-full rounded border px-3 py-2"
              value={b}
              onChange={(e) => setB(e.target.value)}
          />

          <button
              className="w-full rounded bg-black text-white py-2 hover:opacity-90"
              onClick={handleCalculate}
          >
            Посчитать
          </button>

          {error && (
              <p role="alert" className="text-red-600">
                {error}
              </p>
          )}
          {result !== null && !error && (
              <p className="text-lg">Результат: {result}</p>
          )}
        </div>
      </main>
  )
}