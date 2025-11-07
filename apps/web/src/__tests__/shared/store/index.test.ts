import { describe, it, expect } from 'vitest'
import { store } from '@/shared/store'
import { marketApi } from '@/shared/api/marketApi'
import { backendApi } from '@/shared/api/backendApi'
import { expectTypeOf } from 'vitest'

describe('store configuration', () => {
  it('registers RTK Query reducers', () => {
    const state = store.getState()
    expect(state).toHaveProperty(marketApi.reducerPath)
    expect(state).toHaveProperty(backendApi.reducerPath)
  })

  it('dispatch is a function', () => {
    expect(typeof store.dispatch).toBe('function')
  })

  it('types are exported correctly (compile-time check)', () => {
    expectTypeOf(store.dispatch).toBeFunction()
  })
})
