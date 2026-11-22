import { useState } from 'react'
import { attendanceApi, enrollmentApi } from '../api.js'
import { Alert, Badge, Empty, StudentSelect, useFeedback, useLoader } from '../components/ui.jsx'
import { fmtDateTime } from '../labels.js'

export default function AttendancePage() {
  const students = useLoader(enrollmentApi.listStudents)
  const checkins = useLoader(() => attendanceApi.listCheckins())
  const [studentId, setStudentId] = useState('')
  const [activity, setActivity] = useState('Musculação')
  const [feedback, act, setFeedback] = useFeedback()

  const nameOf = (id) => students.data?.find((s) => s.id === id)?.name ?? `Aluno #${id}`

  async function handleCheckIn(e) {
    e.preventDefault()
    const ok = await act(
      () => attendanceApi.checkIn({ student_id: Number(studentId), activity: activity || null }),
      `Check-in de ${nameOf(Number(studentId))} registrado. Matrícula validada no Enrollment Service.`,
    )
    if (ok) checkins.reload()
  }

  async function handleCheckOut(id) {
    const ok = await act(() => attendanceApi.checkOut(id), 'Check-out registrado.')
    if (ok) checkins.reload()
  }

  const open = checkins.data?.filter((c) => !c.check_out_at) ?? []
  const closed = checkins.data?.filter((c) => c.check_out_at) ?? []

  return (
    <section className="page">
      <div className="page-head">
        <div>
          <h1>Frequência</h1>
          <p className="muted">Attendance Service · check-in valida a matrícula no Enrollment Service</p>
        </div>
      </div>

      <Alert feedback={feedback} onClose={() => setFeedback(null)} />

      <form className="card inline-form wrap" onSubmit={handleCheckIn}>
        <StudentSelect students={students.data} value={studentId} onChange={setStudentId} />
        <input value={activity} onChange={(e) => setActivity(e.target.value)} placeholder="Atividade" aria-label="Atividade" />
        <button type="submit">Fazer check-in</button>
      </form>

      <div className="two-col">
        <div className="card">
          <div className="card-head">
            <h2>Na academia agora</h2>
            <Badge tone="info">{open.length}</Badge>
          </div>
          {open.length === 0 && <Empty>Ninguém com check-in em aberto.</Empty>}
          <ul className="list">
            {open.map((c) => (
              <li key={c.id}>
                <div>
                  <strong>{nameOf(c.student_id)}</strong>
                  <div className="muted small">
                    {c.activity || 'Sem atividade'} · entrada {fmtDateTime(c.check_in_at)}
                  </div>
                </div>
                <button type="button" className="btn-ghost" onClick={() => handleCheckOut(c.id)}>
                  Check-out
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <div className="card-head">
            <h2>Últimas presenças</h2>
            <button type="button" className="btn-ghost" onClick={checkins.reload}>Atualizar</button>
          </div>
          {checkins.error && <Alert feedback={{ type: 'error', text: checkins.error }} />}
          {closed.length === 0 && <Empty>Sem presenças encerradas.</Empty>}
          <ul className="list">
            {closed.slice(0, 15).map((c) => (
              <li key={c.id}>
                <div>
                  <strong>{nameOf(c.student_id)}</strong>
                  <div className="muted small">
                    {c.activity || 'Sem atividade'} · {fmtDateTime(c.check_in_at)}
                  </div>
                </div>
                <span className="muted small">{c.duration_minutes} min</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
