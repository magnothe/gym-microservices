import { useEffect, useState } from 'react'
import { useCommunicationLog } from '../api.js'

// Os seis serviços em uma linha; quem se chama fica lado a lado.
const ORDER = [
  ['attendance', 'Attendance', 'Python'],
  ['enrollment', 'Enrollment', 'Python'],
  ['payment', 'Payment', 'Node.js'],
  ['user', 'User', 'Node.js'],
  ['workout', 'Workout', 'Java'],
  ['exercise', 'Exercise', 'Java'],
]
const W = 112
const GAP = 14
const X0 = 12
const SVC_Y = 176
const DB_Y = 296
const NODE_H = 52
const CENTER = 380

const NODES = {
  frontend: { x: CENTER - 100, y: 12, w: 200, title: 'Frontend', sub: 'React' },
  gateway: { x: CENTER - 100, y: 94, w: 200, title: 'API Gateway', sub: 'Vercel / Nginx' },
}
const EDGES = { 'frontend-gateway': [CENTER, 64, CENTER, 94] }

ORDER.forEach(([key, title, sub], i) => {
  const x = X0 + i * (W + GAP)
  const mid = x + W / 2
  NODES[key] = { x, y: SVC_Y, w: W, title, sub }
  NODES[`${key}_db`] = { x: x + 8, y: DB_Y, w: W - 16, title: 'MySQL', sub: `${key}_db`, db: true }
  EDGES[`gateway-${key}`] = [CENTER + (mid - CENTER) * 0.25, 146, mid, SVC_Y]
  EDGES[`${key}-db`] = [mid, SVC_Y + NODE_H, mid, DB_Y]
})

// Chamadas entre serviços: setas curtas entre vizinhos
const CALLS = [
  ['attendance', 'enrollment', 'valida matrícula'],
  ['payment', 'user', 'valida usuário'],
  ['workout', 'exercise', 'busca exercícios'],
]
for (const [from, to] of CALLS) {
  const a = NODES[from]
  EDGES[`${from}-${to}`] = [a.x + W, SVC_Y + 26, NODES[to].x, SVC_Y + 26]
}

// O Workout não envia o header X-Upstream-Calls; a chamada ao Exercise é deduzida pela rota.
function implicitCalls(entry) {
  if (entry.service !== 'workout' || entry.upstream.length) return entry.upstream
  const callsExercise =
    ['POST', 'PUT'].includes(entry.method) || (entry.method === 'GET' && /^\/workouts\/\d+/.test(entry.path))
  return callsExercise && entry.status && entry.status < 500 ? [{ service: 'exercise-service', status: 200 }] : []
}

function activeFor(entry) {
  const nodes = new Set(['frontend', 'gateway', entry.service])
  const edges = new Set(['frontend-gateway', `gateway-${entry.service}`])
  if (entry.status && entry.status < 500) {
    nodes.add(`${entry.service}_db`)
    edges.add(`${entry.service}-db`)
  }
  for (const call of implicitCalls(entry)) {
    const service = call.service.replace(/-service$/, '')
    nodes.add(service)
    edges.add(`${entry.service}-${service}`)
    if (call.status && call.status < 500) {
      nodes.add(`${service}_db`)
      edges.add(`${service}-db`)
    }
  }
  const failed = !entry.status || entry.status >= 500
  return { nodes, edges, failed, calls: implicitCalls(entry) }
}

export default function FlowDiagram() {
  const log = useCommunicationLog()
  const latest = log[0]
  const [active, setActive] = useState(null)

  useEffect(() => {
    if (!latest) return undefined
    setActive(activeFor(latest))
    const timer = setTimeout(() => setActive(null), 1800)
    return () => clearTimeout(timer)
  }, [latest])

  const cls = (kind, key) => (active?.[kind].has(key) ? `active${active.failed ? ' failed' : ''}` : '')
  const called = latest ? activeFor(latest).calls : []
  const callText = called
    .map((c) => CALLS.find(([from, to]) => from === latest.service && `${to}-service` === c.service))
    .filter(Boolean)
    .map(([from, to]) => ` · o ${NODES[from].title} chamou o ${NODES[to].title}`)
    .join('')

  return (
    <figure className="flow">
      <svg viewBox="0 0 760 372" role="img" aria-label="Fluxo de comunicação entre os seis microsserviços">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" className="arrowhead" />
          </marker>
        </defs>

        <rect x="4" y="276" width="752" height="90" rx="12" className="mysql-box" />
        <text x="16" y="360" className="mysql-label">MySQL · um banco por serviço</text>

        {Object.entries(EDGES).map(([key, [x1, y1, x2, y2]]) => (
          <line key={key} x1={x1} y1={y1} x2={x2} y2={y2} markerEnd="url(#arrow)" className={`edge ${cls('edges', key)}`} />
        ))}

        {Object.entries(NODES).map(([key, n]) => (
          <g key={key} className={`node ${n.db ? 'db' : ''} ${cls('nodes', key)}`}>
            <rect x={n.x} y={n.y} width={n.w} height={n.db ? 44 : NODE_H} rx={n.db ? 8 : 10} />
            <text x={n.x + n.w / 2} y={n.y + (n.db ? 19 : 22)} textAnchor="middle" className="node-title">{n.title}</text>
            <text x={n.x + n.w / 2} y={n.y + (n.db ? 35 : 40)} textAnchor="middle" className="node-sub">{n.sub}</text>
          </g>
        ))}
      </svg>
      <figcaption>
        {latest ? (
          <>
            Última requisição: <code>{latest.method} {latest.path}</code> → {latest.status ?? 'sem resposta'}
            {callText}
          </>
        ) : (
          'Faça uma ação em qualquer aba para ver o caminho da requisição.'
        )}
      </figcaption>
    </figure>
  )
}
