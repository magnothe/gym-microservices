import { useState } from 'react'
import { enrollmentApi } from '../api.js'
import { Alert, Empty, StatusBadge, useFeedback, useLoader } from '../components/ui.jsx'
import { ENROLLMENT_STATUS, GOALS, LEVELS, PLANS, fmtDate } from '../labels.js'

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  birth_date: '',
  goal: 'hipertrofia',
  experience_level: 'iniciante',
  trainer_id: '',
  enroll: true,
  plan: 'mensal',
}

function toPayload(form) {
  return {
    name: form.name.trim(),
    email: form.email.trim(),
    phone: form.phone.trim() || null,
    birth_date: form.birth_date || null,
    goal: form.goal,
    experience_level: form.experience_level,
    trainer_id: form.trainer_id ? Number(form.trainer_id) : null,
  }
}

export default function StudentsPage() {
  const students = useLoader(enrollmentApi.listStudents)
  const [form, setForm] = useState(EMPTY_FORM)
  const [selectedId, setSelectedId] = useState(null)
  const [feedback, act, setFeedback] = useFeedback()

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    const created = await act(async () => {
      const student = await enrollmentApi.createStudent(toPayload(form))
      if (form.enroll) await enrollmentApi.createEnrollment(student.id, { plan: form.plan })
      return student
    }, `Aluno cadastrado${form.enroll ? ' e matriculado' : ''}.`)
    if (created) {
      setForm(EMPTY_FORM)
      setSelectedId(created.id)
      students.reload()
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Remover este aluno e todas as suas matrículas e avaliações?')) return
    await act(() => enrollmentApi.deleteStudent(id), 'Aluno removido.')
    if (selectedId === id) setSelectedId(null)
    students.reload()
  }

  const selected = students.data?.find((s) => s.id === selectedId)

  return (
    <section className="page">
      <div className="page-head">
        <div>
          <h1>Alunos</h1>
          <p className="muted">Enrollment Service · cadastro, matrícula e avaliação física</p>
        </div>
      </div>

      <Alert feedback={feedback} onClose={() => setFeedback(null)} />

      <form className="card form-grid" onSubmit={handleSubmit}>
        <h2 className="span-all">Novo aluno</h2>
        <label>
          Nome
          <input value={form.name} onChange={set('name')} required minLength={2} />
        </label>
        <label>
          E-mail
          <input type="email" value={form.email} onChange={set('email')} required />
        </label>
        <label>
          Telefone
          <input value={form.phone} onChange={set('phone')} />
        </label>
        <label>
          Nascimento
          <input type="date" value={form.birth_date} onChange={set('birth_date')} />
        </label>
        <label>
          Objetivo
          <select value={form.goal} onChange={set('goal')}>
            {Object.entries(GOALS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </label>
        <label>
          Nível
          <select value={form.experience_level} onChange={set('experience_level')}>
            {Object.entries(LEVELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </label>
        <label>
          ID do personal
          <input type="number" min="1" value={form.trainer_id} onChange={set('trainer_id')} placeholder="opcional" />
        </label>
        <div className="inline-field">
          <label className="check">
            <input type="checkbox" checked={form.enroll} onChange={set('enroll')} />
            Matricular agora
          </label>
          <select value={form.plan} onChange={set('plan')} disabled={!form.enroll} aria-label="Plano">
            {Object.entries(PLANS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div className="span-all actions">
          <button type="submit">Cadastrar aluno</button>
        </div>
      </form>

      <div className="card">
        <div className="card-head">
          <h2>Alunos cadastrados</h2>
          <button type="button" className="btn-ghost" onClick={students.reload}>Atualizar</button>
        </div>
        {students.error && <Alert feedback={{ type: 'error', text: students.error }} />}
        {students.data?.length === 0 && <Empty>Nenhum aluno cadastrado.</Empty>}
        {students.data?.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nome</th>
                  <th>Objetivo</th>
                  <th>Nível</th>
                  <th>Personal</th>
                  <th>Matrícula</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {students.data.map((s) => (
                  <tr
                    key={s.id}
                    className={s.id === selectedId ? 'selected' : ''}
                    onClick={() => setSelectedId(s.id)}
                  >
                    <td>{s.id}</td>
                    <td>
                      <strong>{s.name}</strong>
                      <div className="muted small">{s.email}</div>
                    </td>
                    <td>{GOALS[s.goal]}</td>
                    <td>{LEVELS[s.experience_level]}</td>
                    <td>{s.trainer_id ?? '—'}</td>
                    <td><StatusBadge status={s.enrollment_status} labels={ENROLLMENT_STATUS} /></td>
                    <td>
                      <button
                        type="button"
                        className="btn-ghost danger"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(s.id)
                        }}
                      >
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && <StudentDetail key={selected.id} student={selected} onChange={students.reload} />}
    </section>
  )
}

function StudentDetail({ student, onChange }) {
  const enrollments = useLoader(() => enrollmentApi.listEnrollments(student.id), [student.id])
  const assessments = useLoader(() => enrollmentApi.listAssessments(student.id), [student.id])
  const [plan, setPlan] = useState('mensal')
  const [assessment, setAssessment] = useState({ weight_kg: '', height_m: '', body_fat_pct: '', notes: '' })
  const [feedback, act, setFeedback] = useFeedback()

  async function newEnrollment(e) {
    e.preventDefault()
    const ok = await act(() => enrollmentApi.createEnrollment(student.id, { plan }), 'Matrícula criada.')
    if (ok) {
      enrollments.reload()
      onChange()
    }
  }

  async function changeStatus(id, status) {
    const ok = await act(() => enrollmentApi.setEnrollmentStatus(id, status), 'Status da matrícula atualizado.')
    if (ok) {
      enrollments.reload()
      onChange()
    }
  }

  async function newAssessment(e) {
    e.preventDefault()
    const ok = await act(
      () =>
        enrollmentApi.createAssessment(student.id, {
          weight_kg: Number(assessment.weight_kg),
          height_m: Number(assessment.height_m),
          body_fat_pct: assessment.body_fat_pct ? Number(assessment.body_fat_pct) : null,
          notes: assessment.notes || null,
          trainer_id: student.trainer_id,
        }),
      'Avaliação registrada.',
    )
    if (ok) {
      setAssessment({ weight_kg: '', height_m: '', body_fat_pct: '', notes: '' })
      assessments.reload()
    }
  }

  const setA = (field) => (e) => setAssessment((a) => ({ ...a, [field]: e.target.value }))

  return (
    <div className="detail-grid">
      <h2 className="span-all">
        {student.name} <span className="muted">#{student.id}</span>
      </h2>
      <div className="span-all">
        <Alert feedback={feedback} onClose={() => setFeedback(null)} />
      </div>

      <div className="card">
        <h3>Matrículas</h3>
        <form className="inline-form" onSubmit={newEnrollment}>
          <select value={plan} onChange={(e) => setPlan(e.target.value)} aria-label="Plano">
            {Object.entries(PLANS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <button type="submit">Nova matrícula</button>
        </form>
        {enrollments.data?.length === 0 && <Empty>Sem matrículas.</Empty>}
        <ul className="list">
          {enrollments.data?.map((en) => (
            <li key={en.id}>
              <div>
                <strong>{PLANS[en.plan]}</strong>
                <div className="muted small">
                  {fmtDate(en.start_date)} a {fmtDate(en.end_date)}
                </div>
              </div>
              <select value={en.status} onChange={(e) => changeStatus(en.id, e.target.value)} aria-label="Status">
                {Object.entries(ENROLLMENT_STATUS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h3>Avaliação física</h3>
        <form className="form-grid compact" onSubmit={newAssessment}>
          <label>
            Peso (kg)
            <input type="number" step="0.1" min="1" value={assessment.weight_kg} onChange={setA('weight_kg')} required />
          </label>
          <label>
            Altura (m)
            <input type="number" step="0.01" min="0.6" max="2.7" value={assessment.height_m} onChange={setA('height_m')} required />
          </label>
          <label>
            % gordura
            <input type="number" step="0.1" min="0" max="100" value={assessment.body_fat_pct} onChange={setA('body_fat_pct')} />
          </label>
          <label>
            Observações
            <input value={assessment.notes} onChange={setA('notes')} />
          </label>
          <div className="span-all actions">
            <button type="submit">Registrar avaliação</button>
          </div>
        </form>
        {assessments.data?.length === 0 && <Empty>Sem avaliações.</Empty>}
        <ul className="list">
          {assessments.data?.map((a) => (
            <li key={a.id}>
              <div>
                <strong>{fmtDate(a.assessed_at)}</strong>
                <div className="muted small">
                  {a.weight_kg} kg · {a.height_m} m{a.body_fat_pct != null && ` · ${a.body_fat_pct}% gordura`}
                </div>
              </div>
              <div className="right">
                <strong>IMC {a.bmi.toFixed(1)}</strong>
                <div className="muted small">{a.bmi_classification}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
