import { createApp } from './app'
import { ensureStore } from './store'

const port = Number(process.env.API_PORT ?? 3001)
const app = createApp()

try {
  await ensureStore()
  app.listen(port, () => console.log(`IncidentBoard API running at http://localhost:${port}`))
} catch (error) {
  console.error('Não foi possível iniciar a API: PostgreSQL indisponível ou migration ausente.', error)
  process.exitCode = 1
}
