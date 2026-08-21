import type { IncidentStatus } from '../../src/types'

export type SlaState = 'on_track' | 'at_risk' | 'breached' | 'met'

export type SlaResult = {
  state: SlaState
  deadline: Date
  remainingHours: number
}

export function calculateSlaState(input: {
  createdAt: Date
  slaHours: number
  status: IncidentStatus
  now: Date
  resolvedAt?: Date
}): SlaResult {
  const deadline = new Date(input.createdAt.getTime() + input.slaHours * 60 * 60 * 1000)
  const referenceDate = input.resolvedAt ?? input.now
  const remainingHours = (deadline.getTime() - referenceDate.getTime()) / (60 * 60 * 1000)

  if (input.status === 'resolved') return { state: remainingHours >= 0 ? 'met' : 'breached', deadline, remainingHours }
  if (remainingHours <= 0) return { state: 'breached', deadline, remainingHours }
  if (remainingHours <= input.slaHours * 0.25) return { state: 'at_risk', deadline, remainingHours }
  return { state: 'on_track', deadline, remainingHours }
}
