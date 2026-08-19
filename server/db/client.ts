import 'dotenv/config'
import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import * as schema from './schema'

const { Pool } = pg
const connectionString = process.env.DATABASE_URL

if (!connectionString) throw new Error('DATABASE_URL não configurada. Copie .env.example para .env antes de iniciar a API PostgreSQL.')

export const pool = new Pool({ connectionString })
export const db = drizzle(pool, { schema })
