import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL não configurada. Copie .env.example para .env antes de executar migrations.')

export default defineConfig({
  schema: './server/db/schema.ts',
  out: './server/db/migrations',
  dialect: 'postgresql',
  dbCredentials: { url: databaseUrl },
  strict: true,
  verbose: true,
})
