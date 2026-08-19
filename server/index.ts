import { createApp } from './app'

const port = Number(process.env.API_PORT ?? 3001)
const app = createApp()

app.listen(port, () => console.log(`IncidentBoard API running at http://localhost:${port}`))
