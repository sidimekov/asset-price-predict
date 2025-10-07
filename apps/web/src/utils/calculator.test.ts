import { expect, test } from 'vitest'
import { parseNumber, calculate } from './calculator'

describe('parseNumber', () => {
  test('парсит корректное число', () => {
    expect(parseNumber('123')).toBe(123)
    expect(parseNumber('-12.5')).toBe(-12.5)
    expect(parseNumber('12,34')).toBe(12.34)
  })

  test('возвращает null для некорректных входных данных', () => {
    expect(parseNumber('')).toBeNull()
    expect(parseNumber('abc')).toBeNull()
    expect(parseNumber('12.34.56')).toBeNull()
    expect(parseNumber('Infinity')).toBeNull()
  })
})

describe('calculate', () => {
  test('выполняет сложение', () => {
    expect(calculate(2, 3, '+')).toBe(5)
  })

  test('выполняет вычитание', () => {
    expect(calculate(5, 3, '-')).toBe(2)
  })

  test('выполняет умножение', () => {
    expect(calculate(2, 4, '*')).toBe(8)
  })

  test('выполняет деление', () => {
    expect(calculate(10, 2, '/')).toBe(5)
  })

  test('выбрасывает ошибку при делении на ноль', () => {
    expect(() => calculate(10, 0, '/')).toThrow('Division by zero')
  })

  test('выбрасывает ошибку для некорректного оператора', () => {
    expect(() => calculate(2, 3, '%' as any)).toThrow('Invalid operator')
  })
})
