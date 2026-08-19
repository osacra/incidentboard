import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import type { Incident } from '../src/types'
import { demoIncidents } from '../src/storage'

const dataPath = resolve(process.cwd(), 'server/data/incidents.json')

export async function ensureStore() {
  await mkdir(dirname(dataPath), { recursive: true })
  try {
    await readFile(dataPath, 'utf8')
  } catch {
    await writeFile(dataPath, JSON.stringify(demoIncidents, null, 2), 'utf8')
  }
}

export async function getIncidents(): Promise<Incident[]> {
  await ensureStore()
  return JSON.parse(await readFile(dataPath, 'utf8')) as Incident[]
}

export async function saveIncidents(incidents: Incident[]) {
  await ensureStore()
  await writeFile(dataPath, JSON.stringify(incidents, null, 2), 'utf8')
}

export async function getIncident(id: string) {
  return (await getIncidents()).find((incident) => incident.id === id) ?? null
}
