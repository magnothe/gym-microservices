import { useEffect, useState } from 'react'
import { attendanceApi, enrollmentApi } from '../api.js'
import { Alert, Badge, Empty, StatusBadge, StudentSelect, useLoader } from '../components/ui.jsx'
import { ENROLLMENT_STATUS, GOALS, LEVELS, PLANS, fmtDate, fmtDateTime } from '../labels.js'

export default function HistoryPage() {
  const students = useLoader(enrollmentApi.listStudents)
  const [studentId, setStudentId] = useState('')
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!studentId) {
      setData(null)
      return
    }
    let cancelled = false
    setError(null)
    // Composição no frontend: dados de dois microsserviços em paralelo
    Promise.all([
      enrollmentApi.enrollmentStatus(studentId),
      attendanceApi.summary(studentId, 30),
      attendanceApi.history(studentId),
    ])
      .then(([enrollment, summary, history]) => !cancelled && setData({ enrollment, summary, history }))
      .catch((err) => !cancelled && setError(err.message))
    return () => {
      cancelled = true
    }
  }, [studentId])

  const student = students.data?.find((s) => s.id === Number(studentId))

  return (
    <section className="page">
      <div className="page-head">
        <div>
          <h1>Histórico do aluno</h1>
          <p className="muted">Junta Enrollment (matrícula) e Attendance (frequência e atendimentos)</p>
        </div>
        <StudentSelect students={students.data} value={studentId} onChange={setStudentId} required={false} />
      </div>

      {error && <Alert feedback={{ type: 'error', text: error }} />}
      {!studentId && <Empty>Selecione um aluno.</Empty>}

      {data && student && (
        <>
          <div className="stats">
            <div className="card stat">
              <span className="muted small">Matrícula</span>
              <StatusBadge status={data.enrollment.status} labels={ENROLLMENT_STATUS} />
              <span className="small">
                {data.enrollment.plan ? `${PLANS[data.enrollment.plan]} até ${fmtDate(data.enrollment.end_date)}` : '—'}
              </span>
            </div>
            <div className="card stat">
              <span className="muted small">Presenças (30 dias)</span>
              <strong className="big">{data.summary.days_attended}</strong>
              <span className="small">{data.summary.total_checkins} check-ins</span>
            </div>
            <div className="card stat">
              <span className="muted small">Duração média</span>
              <strong className="big">
                {data.summary.avg_duration_minutes != null ? `${Math.round(data.summary.avg_duration_minutes)} min` : '—'}
              </strong>
              <span className="small">último: {fmtDateTime(data.summary.last_check_in)}</span>
            </div>
            <div className="card stat">
              <span className="muted small">Perfil</span>
              <strong>{GOALS[student.goal]}</strong>
              <span className="small">{LEVELS[student.experience_level]}</span>
            </div>
          </div>

          <div className="card">
            <h2>Atividades</h2>
            {data.history.length === 0 && <Empty>Sem atividades registradas.</Empty>}
            <ol className="timeline">
              {data.history.map((item) => (
                <li key={`${item.type}-${item.reference_id}`}>
                  <Badge tone={item.type === 'checkin' ? 'ok' : 'info'}>
                    {item.type === 'checkin' ? 'Check-in' : 'Atendimento'}
                  </Badge>
                  <span>{item.description}</span>
                  <span className="muted small">{fmtDateTime(item.at)}</span>
                </li>
              ))}
            </ol>
          </div>
        </>
      )}
    </section>
  )
}
