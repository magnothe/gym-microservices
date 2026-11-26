import { useState } from 'react'
import { enrollmentApi, exerciseApi, workoutApi } from '../api.js'
import { Alert, Badge, Empty, StudentSelect, useFeedback, useLoader } from '../components/ui.jsx'

const MUSCLE_GROUPS = ['Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps', 'Pernas', 'Glúteos', 'Abdômen', 'Cardio']
const SPLITS = ['Treino A', 'Treino B', 'Treino C', 'Treino D']

export default function WorkoutsPage() {
  const students = useLoader(enrollmentApi.listStudents)
  const exercises = useLoader(exerciseApi.list)
  const workouts = useLoader(() => workoutApi.list())
  const [feedback, act, setFeedback] = useFeedback()

  const [exercise, setExercise] = useState({ nome: '', grupoMuscular: MUSCLE_GROUPS[0], descricao: '' })
  const [studentId, setStudentId] = useState('')
  const [nome, setNome] = useState(SPLITS[0])
  const [selected, setSelected] = useState([])
  const [detail, setDetail] = useState(null)

  const nameOf = (id) => students.data?.find((s) => s.id === id)?.name ?? `Aluno #${id}`

  async function handleExercise(e) {
    e.preventDefault()
    const ok = await act(() => exerciseApi.create(exercise), `Exercício “${exercise.nome}” cadastrado.`)
    if (ok) {
      setExercise({ ...exercise, nome: '', descricao: '' })
      exercises.reload()
    }
  }

  async function removeExercise(id) {
    const ok = await act(() => exerciseApi.remove(id), 'Exercício removido.')
    if (ok !== undefined) exercises.reload()
  }

  function toggle(id) {
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))
  }

  async function handleWorkout(e) {
    e.preventDefault()
    if (selected.length === 0) {
      setFeedback({ type: 'error', text: 'Escolha pelo menos um exercício.' })
      return
    }
    const ok = await act(
      () => workoutApi.create({ userId: Number(studentId), nome, exerciseIds: selected }),
      `${nome} criado para ${nameOf(Number(studentId))}. Exercícios validados no Exercise Service.`,
    )
    if (ok) {
      setSelected([])
      workouts.reload()
    }
  }

  async function showDetail(id) {
    const data = await act(() => workoutApi.detail(id))
    if (data) setDetail(data)
  }

  async function removeWorkout(id) {
    const ok = await act(() => workoutApi.remove(id), 'Treino removido.')
    if (ok !== undefined) {
      if (detail?.id === id) setDetail(null)
      workouts.reload()
    }
  }

  return (
    <section className="page">
      <div className="page-head">
        <div>
          <h1>Treinos</h1>
          <p className="muted">
            Workout Service e Exercise Service · ao criar ou abrir uma ficha, o Workout consulta o Exercise
          </p>
        </div>
      </div>

      <Alert feedback={feedback} onClose={() => setFeedback(null)} />

      <div className="two-col">
        <div className="card">
          <div className="card-head">
            <h2>Catálogo de exercícios</h2>
            <Badge tone="info">{exercises.data?.length ?? 0}</Badge>
          </div>
          <form className="form-grid compact" onSubmit={handleExercise}>
            <label>
              Nome
              <input
                value={exercise.nome}
                onChange={(e) => setExercise({ ...exercise, nome: e.target.value })}
                placeholder="Supino reto"
                required
              />
            </label>
            <label>
              Grupo muscular
              <select
                value={exercise.grupoMuscular}
                onChange={(e) => setExercise({ ...exercise, grupoMuscular: e.target.value })}
              >
                {MUSCLE_GROUPS.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </label>
            <label className="span-all">
              Execução
              <input
                value={exercise.descricao}
                onChange={(e) => setExercise({ ...exercise, descricao: e.target.value })}
                placeholder="Como executar o movimento"
              />
            </label>
            <div className="actions span-all">
              <button type="submit">Cadastrar exercício</button>
            </div>
          </form>
          {exercises.error && <Alert feedback={{ type: 'error', text: exercises.error }} />}
          {exercises.data?.length === 0 && <Empty>Nenhum exercício cadastrado.</Empty>}
          <ul className="list">
            {(exercises.data || []).map((x) => (
              <li key={x.id}>
                <div>
                  <strong>{x.nome}</strong>
                  <div className="muted small">
                    {x.grupoMuscular}
                    {x.descricao && ` · ${x.descricao}`}
                  </div>
                </div>
                <button type="button" className="btn-ghost danger" onClick={() => removeExercise(x.id)}>
                  Remover
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h2>Nova ficha de treino</h2>
          <form onSubmit={handleWorkout}>
            <div className="form-grid compact">
              <label>
                Aluno
                <StudentSelect students={students.data} value={studentId} onChange={setStudentId} />
              </label>
              <label>
                Divisão
                <select value={nome} onChange={(e) => setNome(e.target.value)}>
                  {SPLITS.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
            </div>
            <p className="muted small">Exercícios da ficha</p>
            {exercises.data?.length === 0 && <Empty>Cadastre exercícios no catálogo primeiro.</Empty>}
            <div className="check-grid">
              {(exercises.data || []).map((x) => (
                <label key={x.id} className="check">
                  <input type="checkbox" checked={selected.includes(x.id)} onChange={() => toggle(x.id)} />
                  {x.nome} <span className="muted small">({x.grupoMuscular})</span>
                </label>
              ))}
            </div>
            <div className="actions">
              <button type="submit">Criar ficha</button>
            </div>
          </form>
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card-head">
            <h2>Fichas cadastradas</h2>
            <button type="button" className="btn-ghost" onClick={workouts.reload}>
              Atualizar
            </button>
          </div>
          {workouts.error && <Alert feedback={{ type: 'error', text: workouts.error }} />}
          {workouts.data?.length === 0 && <Empty>Nenhuma ficha criada.</Empty>}
          <ul className="list">
            {(workouts.data || []).map((w) => (
              <li key={w.id}>
                <div>
                  <strong>{w.nome}</strong>
                  <div className="muted small">
                    {nameOf(w.userId)} · {w.exerciseIds?.length ?? 0} exercício(s)
                  </div>
                </div>
                <div>
                  <button type="button" className="btn-ghost" onClick={() => showDetail(w.id)}>
                    Abrir
                  </button>
                  <button type="button" className="btn-ghost danger" onClick={() => removeWorkout(w.id)}>
                    Remover
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h2>Detalhe da ficha</h2>
          {!detail && <Empty>Abra uma ficha para ver os exercícios buscados no Exercise Service.</Empty>}
          {detail && (
            <>
              <p>
                <strong>{detail.nome}</strong> · {nameOf(detail.userId)}
              </p>
              {detail.exercicios.length === 0 && <Empty>Os exercícios desta ficha não existem mais.</Empty>}
              <ul className="list">
                {detail.exercicios.map((x) => (
                  <li key={x.id}>
                    <div>
                      <strong>{x.nome}</strong>
                      <div className="muted small">{x.descricao || 'Sem descrição'}</div>
                    </div>
                    <Badge>{x.grupoMuscular}</Badge>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
