import type { IncidentStatus } from '../../src/types'

const allowedTransitions: Record<IncidentStatus, readonly IncidentStatus[]> = {
  open: ['investigating'],
  investigating: ['monitoring', 'resolved'],
  monitoring: ['investigating', 'resolved'],
  resolved: ['open'],
}

export const canTransition = (from: IncidentStatus, to: IncidentStatus) => allowedTransitions[from].includes(to)

export function assertTransition(from: IncidentStatus, to: IncidentStatus) {
  if (!canTransition(from, to)) throw new Error(`Transição inválida: ${from} -> ${to}`)
}

export const getAllowedTransitions = (status: IncidentStatus) => allowedTransitions[status]
