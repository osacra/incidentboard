import { describe, expect, it } from 'vitest'
import { getSlaState, nextIncidentId } from './storage'
import type { Incident } from './types'

const incident = (overrides: Partial<Incident> = {}): Incident => ({
  id: 'INC-1048', title: 'Teste', description: 'Descrição', severity: 'medium', status: 'open', assignee: 'Pessoa', service: 'Platform',
  createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(), updatedAt: new Date().toISOString(), slaHours: 8, comments: [], ...overrides,
})

describe('regras de incidentes', () => {
  it('gera o próximo identificador a partir do maior incidente', () => {
    expect(nextIncidentId([incident({ id: 'INC-1048' }), incident({ id: 'INC-1099' })])).toBe('INC-1100')
  })

  it('informa quando o SLA foi encerrado em incidentes resolvidos', () => {
    expect(getSlaState(incident({ status: 'resolved' }))).toEqual({ label: 'Encerrado', tone: 'success' })
  })

  it('informa quando o SLA foi estourado', () => {
    expect(getSlaState(incident({ createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), slaHours: 8 }))).toEqual({ label: 'SLA estourado', tone: 'danger' })
  })

  it('salva e carrega incidentes do armazenamento local', async () => {
    const { loadIncidents, saveIncidents } = await import('./storage')
    const records = [incident({ id: 'INC-1200' })]
    saveIncidents(records)
    expect(loadIncidents()).toEqual(records)
  })

  it('retorna os dados de demonstração quando o JSON local é inválido', async () => {
    const { demoIncidents, loadIncidents } = await import('./storage')
    window.localStorage.setItem('incidentboard:incidents', '{invalid-json')
    expect(loadIncidents()).toEqual(demoIncidents)
  })
})
