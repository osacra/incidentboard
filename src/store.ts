import { create } from 'zustand'
import type { IncidentFilters } from './types'

const emptyFilters: IncidentFilters = { search: '', status: 'all', severity: 'all', service: 'all' }

type IncidentUiStore = {
  filters: IncidentFilters
  selectedId: string | null
  setFilters: (filters: IncidentFilters) => void
  setSelectedId: (id: string | null) => void
  resetFilters: () => void
}

export const useIncidentUiStore = create<IncidentUiStore>((set) => ({
  filters: emptyFilters,
  selectedId: null,
  setFilters: (filters) => set({ filters }),
  setSelectedId: (selectedId) => set({ selectedId }),
  resetFilters: () => set({ filters: emptyFilters }),
}))

export { emptyFilters }
