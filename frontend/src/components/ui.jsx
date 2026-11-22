import { useCallback, useEffect, useState } from 'react'

export function useLoader(fn, deps = []) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const reload = useCallback(async () => {
    setLoading(true)
    try {
      setData(await fn())
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, deps)

  useEffect(() => {
    reload()
  }, [reload])

  return { data, error, loading, reload }
}

export function useFeedback() {
  const [feedback, setFeedback] = useState(null)

  const act = useCallback(async (fn, successText) => {
    try {
      const result = await fn()
      setFeedback(successText ? { type: 'ok', text: successText } : null)
      return result
    } catch (err) {
      setFeedback({ type: 'error', text: err.message })
      return undefined
    }
  }, [])

  return [feedback, act, setFeedback]
}

export function Alert({ feedback, onClose }) {
  if (!feedback) return null
  return (
    <div className={`alert alert-${feedback.type}`} role="status">
      <span>{feedback.text}</span>
      {onClose && (
        <button type="button" className="link" onClick={onClose} aria-label="Fechar">
          ×
        </button>
      )}
    </div>
  )
}

export function Badge({ tone = 'neutral', children }) {
  return <span className={`badge badge-${tone}`}>{children}</span>
}

const STATUS_TONES = {
  ativa: 'ok',
  agendado: 'info',
  concluido: 'ok',
  suspensa: 'warn',
  faltou: 'warn',
  cancelada: 'error',
  cancelado: 'error',
  expirada: 'neutral',
}

export function StatusBadge({ status, labels }) {
  if (!status) return <Badge>Sem matrícula</Badge>
  return <Badge tone={STATUS_TONES[status] || 'neutral'}>{labels?.[status] || status}</Badge>
}

export function StudentSelect({ students, value, onChange, required = true, placeholder = 'Selecione o aluno' }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} required={required}>
      <option value="">{placeholder}</option>
      {(students || []).map((s) => (
        <option key={s.id} value={s.id}>
          #{s.id} · {s.name}
        </option>
      ))}
    </select>
  )
}

export function Empty({ children }) {
  return <p className="empty">{children}</p>
}
