import { describe, it, expect } from 'vitest'
import { parseNumber, calculate } from './calculator'

describe('parseNumber', () => {
  it('возвращает null для пустой строки', () => {
    expect(parseNumber('')).toBeNull()
  })

  it('заменяет запятую на точку', () => {
    expect(parseNumber('1,5')).toBe(1.5)
  })

  it('возвращает число для корректного ввода', () => {
    expect(parseNumber('42')).toBe(42)
  })

  it('возвращает null для некорректного ввода', () => {
    expect(parseNumber('abc')).toBeNull()
  })
})

describe('calculate', () => {
  it('складывает', () => expect(calculate(2,3,'+')).toBe(5))
  it('вычитает', () => expect(calculate(5,3,'-')).toBe(2))
  it('умножает', () => expect(calculate(2,4,'*')).toBe(8))
  it('делит', () => expect(calculate(8,2,'/')).toBe(4))
  it('деление на ноль выбрасывает ошибку', () => {
    expect(() => calculate(10, 0, '/')).toThrow('ошибка при делении на ноль')
  })
})

