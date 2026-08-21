import { describe, expect, it } from 'vitest'
import { getSlaProgress, getSlaState, nextIncidentId } from './storage'
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

  it('calcula estados e percentual de SLA com um relógio determinístico', () => {
    const createdAt = Date.parse('2026-01-01T00:00:00.000Z')
    const base = incident({ createdAt: new Date(createdAt).toISOString(), slaHours: 8 })

    expect(getSlaProgress(base, createdAt + 2 * 60 * 60 * 1000)).toMatchObject({ status: 'on_track', percentage: 25 })
    expect(getSlaProgress(base, createdAt + 9 * 60 * 60 * 1000)).toMatchObject({ status: 'breached', percentage: 100, remainingHours: 0 })
    expect(getSlaProgress({ ...base, status: 'resolved' }, createdAt + 2 * 60 * 60 * 1000)).toMatchObject({ status: 'met', tone: 'success' })
  })

  it('classifica o SLA em risco no último quarto do prazo', () => {
    const createdAt = Date.parse('2026-01-01T00:00:00.000Z')
    expect(getSlaProgress(incident({ createdAt: new Date(createdAt).toISOString(), slaHours: 8 }), createdAt + 7 * 60 * 60 * 1000)).toMatchObject({ status: 'at_risk', percentage: 87.5 })
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
