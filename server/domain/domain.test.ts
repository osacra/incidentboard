import { describe, expect, it } from 'vitest'
import { assertTransition, canTransition, getAllowedTransitions } from './incident'
import { calculateSlaState } from './sla'

const createdAt = new Date('2026-08-21T10:00:00.000Z')

 describe('incident transitions', () => {
  it('allows the operational lifecycle transitions', () => {
    expect(canTransition('open', 'investigating')).toBe(true)
    expect(canTransition('investigating', 'monitoring')).toBe(true)
    expect(canTransition('monitoring', 'resolved')).toBe(true)
    expect(canTransition('resolved', 'open')).toBe(true)
  })

  it('rejects transitions that skip the investigation', () => {
    expect(canTransition('open', 'resolved')).toBe(false)
    expect(() => assertTransition('open', 'resolved')).toThrow('Transição inválida')
    expect(getAllowedTransitions('open')).toEqual(['investigating'])
  })
})

describe('sla calculation', () => {
  it('marks an open incident as on track', () => {
    const result = calculateSlaState({ createdAt, slaHours: 8, status: 'open', now: new Date('2026-08-21T12:00:00.000Z') })
    expect(result.state).toBe('on_track')
    expect(result.remainingHours).toBe(6)
  })

  it('marks an incident as at risk near the deadline', () => {
    const result = calculateSlaState({ createdAt, slaHours: 8, status: 'investigating', now: new Date('2026-08-21T17:00:00.000Z') })
    expect(result.state).toBe('at_risk')
  })

  it('marks a late unresolved incident as breached', () => {
    const result = calculateSlaState({ createdAt, slaHours: 8, status: 'monitoring', now: new Date('2026-08-21T19:00:00.000Z') })
    expect(result.state).toBe('breached')
  })

  it('marks a resolved incident as met only when resolved before the deadline', () => {
    const met = calculateSlaState({ createdAt, slaHours: 8, status: 'resolved', now: new Date('2026-08-21T22:00:00.000Z'), resolvedAt: new Date('2026-08-21T16:00:00.000Z') })
    const breached = calculateSlaState({ createdAt, slaHours: 8, status: 'resolved', now: new Date('2026-08-21T22:00:00.000Z'), resolvedAt: new Date('2026-08-21T19:00:00.000Z') })
    expect(met.state).toBe('met')
    expect(breached.state).toBe('breached')
  })
})
