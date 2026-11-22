import { useState } from 'react'
import { attendanceApi, enrollmentApi } from '../api.js'
import { Alert, Empty, StatusBadge, StudentSelect, useFeedback, useLoader } from '../components/ui.jsx'
import { APPOINTMENT_STATUS, fmtDateTime } from '../labels.js'

function defaultDateTime() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(9, 0, 0, 0)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T09:00`
}

const EMPTY = { student_id: '', trainer_id: '', scheduled_at: defaultDateTime(), duration_minutes: 60, notes: '' }

export default function SchedulePage() {
  const students = useLoader(enrollmentApi.listStudents)
  const [trainerFilter, setTrainerFilter] = useState('')
  const appointments = useLoader(
    () => attendanceApi.listAppointments(trainerFilter ? `?trainer_id=${trainerFilter}` : ''),
    [trainerFilter],
  )
  const [form, setForm] = useState(EMPTY)
  const [feedback, act, setFeedback] = useFeedback()

  const nameOf = (id) => students.data?.find((s) => s.id === id)?.name ?? `Aluno #${id}`
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  function pickStudent(id) {
    const student = students.data?.find((s) => s.id === Number(id))
    setForm((f) => ({ ...f, student_id: id, trainer_id: student?.trainer_id ? String(student.trainer_id) : f.trainer_id }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const ok = await act(
      () =>
        attendanceApi.createAppointment({
          student_id: Number(form.student_id),
          trainer_id: Number(form.trainer_id),
          scheduled_at: form.scheduled_at,
          duration_minutes: Number(form.duration_minutes),
          notes: form.notes || null,
        }),
      'Atendimento agendado. Matrícula validada no Enrollment Service.',
    )
    if (ok) {
      setForm({ ...EMPTY, scheduled_at: form.scheduled_at })
      appointments.reload()
    }
  }

  async function changeStatus(id, status) {
    const ok = await act(() => attendanceApi.setAppointmentStatus(id, status), 'Status atualizado.')
    if (ok) appointments.reload()
  }

  return (
    <section className="page">
      <div className="page-head">
        <div>
          <h1>Agenda do personal</h1>
          <p className="muted">Attendance Service · verifica matrícula, vínculo com o personal e conflito de horário</p>
        </div>
      </div>

      <Alert feedback={feedback} onClose={() => setFeedback(null)} />

      <form className="card form-grid" onSubmit={handleSubmit}>
        <h2 className="span-all">Novo atendimento</h2>
        <label>
          Aluno
          <StudentSelect students={students.data} value={form.student_id} onChange={pickStudent} />
        </label>
        <label>
          ID do personal
          <input type="number" min="1" value={form.trainer_id} onChange={set('trainer_id')} required />
        </label>
        <label>
          Data e hora
          <input type="datetime-local" value={form.scheduled_at} onChange={set('scheduled_at')} required />
        </label>
        <label>
          Duração (min)
          <input type="number" min="15" max="240" step="15" value={form.duration_minutes} onChange={set('duration_minutes')} required />
        </label>
        <label className="span-all">
          Observações
          <input value={form.notes} onChange={set('notes')} />
        </label>
        <div className="span-all actions">
          <button type="submit">Agendar</button>
        </div>
      </form>

      <div className="card">
        <div className="card-head">
          <h2>Atendimentos</h2>
          <input
            type="number"
            min="1"
            className="narrow"
            value={trainerFilter}
            onChange={(e) => setTrainerFilter(e.target.value)}
            placeholder="Filtrar por personal"
            aria-label="Filtrar por personal"
          />
        </div>
        {appointments.error && <Alert feedback={{ type: 'error', text: appointments.error }} />}
        {appointments.data?.length === 0 && <Empty>Nenhum atendimento.</Empty>}
        {appointments.data?.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Quando</th>
                  <th>Aluno</th>
                  <th>Personal</th>
                  <th>Duração</th>
                  <th>Status</th>
                  <th>Alterar</th>
                </tr>
              </thead>
              <tbody>
                {appointments.data.map((a) => (
                  <tr key={a.id}>
                    <td>{fmtDateTime(a.scheduled_at)}</td>
                    <td>
                      {nameOf(a.student_id)}
                      {a.notes && <div className="muted small">{a.notes}</div>}
                    </td>
                    <td>#{a.trainer_id}</td>
                    <td>{a.duration_minutes} min</td>
                    <td><StatusBadge status={a.status} labels={APPOINTMENT_STATUS} /></td>
                    <td>
                      <select value={a.status} onChange={(e) => changeStatus(a.id, e.target.value)} aria-label="Status">
                        {Object.entries(APPOINTMENT_STATUS).map(([v, l]) => (
                          <option key={v} value={v}>{l}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
