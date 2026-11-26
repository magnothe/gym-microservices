import { useCallback, useEffect, useState } from 'react'
import { SERVICES, health } from '../api.js'
import FlowDiagram from '../components/FlowDiagram.jsx'
import { Badge } from '../components/ui.jsx'

export default function Overview() {
  const [status, setStatus] = useState({})

  const check = useCallback(async () => {
    const entries = await Promise.all(
      Object.keys(SERVICES).map(async (key) => {
        try {
          await health(key)
          return [key, 'ok']
        } catch {
          return [key, 'down']
        }
      }),
    )
    setStatus(Object.fromEntries(entries))
  }, [])

  useEffect(() => {
    check()
    const timer = setInterval(check, 10000)
    return () => clearInterval(timer)
  }, [check])

  return (
    <section className="page">
      <div className="page-head">
        <div>
          <h1>Visão geral</h1>
          <p className="muted">
            Cada ação nas outras abas acende aqui o caminho que a requisição percorreu. Três serviços
            consultam outro antes de gravar: Attendance → Enrollment, Payment → User e Workout → Exercise.
          </p>
        </div>
        <button type="button" className="btn-ghost" onClick={check}>
          Verificar serviços
        </button>
      </div>

      <div className="health-grid">
        {Object.entries(SERVICES).map(([key, svc]) => (
          <div key={key} className="card health">
            <div>
              <strong>{svc.name}</strong>
              <p className="muted small">
                {svc.lang} · <code>{svc.base}</code>
              </p>
            </div>
            {status[key] === undefined ? (
              <Badge>verificando…</Badge>
            ) : status[key] === 'ok' ? (
              <Badge tone="ok">online</Badge>
            ) : (
              <Badge tone="error">offline</Badge>
            )}
          </div>
        ))}
      </div>

      <div className="card">
        <FlowDiagram />
      </div>

      <div className="card steps">
        <h2>Roteiro para demonstrar a comunicação</h2>
        <ol>
          <li>
            <b>Alunos:</b> cadastre um aluno marcando “matricular agora” (Enrollment Service).
          </li>
          <li>
            <b>Frequência:</b> faça o check-in desse aluno. O log mostra a chamada Attendance → Enrollment.
          </li>
          <li>
            Em <b>Alunos</b>, suspenda a matrícula e tente o check-in de novo: o Attendance recusa com 403.
          </li>
          <li>
            <b>Histórico:</b> a tela junta dados dos dois serviços (matrícula + frequência).
          </li>
          <li>
            <b>Treinos:</b> cadastre exercícios e crie uma ficha para o aluno. O Workout valida cada exercício no
            Exercise Service; ao abrir a ficha, ele busca os detalhes lá de novo.
          </li>
          <li>
            <b>Pagamentos:</b> cadastre um usuário e registre um pagamento. O Payment confirma o usuário no User
            Service; com um ID inexistente, o pagamento é recusado.
          </li>
        </ol>
      </div>
    </section>
  )
}
