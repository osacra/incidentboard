import { createApp } from './app'
import { pool } from './db/client'
import { ensureStore } from './store'

const port = Number(process.env.API_PORT ?? 3001)
const app = createApp()

try {
  await ensureStore()
  const server = app.listen(port, () => console.log(`IncidentBoard API running at http://localhost:${port}`))
  const shutdown = async (signal: string) => {
    console.log(`Recebido ${signal}; encerrando a API...`)
    server.close(async () => {
      await pool.end()
      process.exit(0)
    })
  }
  process.once('SIGTERM', () => void shutdown('SIGTERM'))
  process.once('SIGINT', () => void shutdown('SIGINT'))
} catch (error) {
  console.error('Não foi possível iniciar a API: PostgreSQL indisponível ou migration ausente.', error)
  await pool.end()
  process.exitCode = 1
}
