export const GOALS = {
  emagrecimento: 'Emagrecimento',
  hipertrofia: 'Hipertrofia',
  condicionamento: 'Condicionamento',
  forca: 'Força',
  saude: 'Saúde',
  reabilitacao: 'Reabilitação',
}

export const LEVELS = {
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
}

export const PLANS = {
  mensal: 'Mensal',
  trimestral: 'Trimestral',
  semestral: 'Semestral',
  anual: 'Anual',
}

export const ENROLLMENT_STATUS = {
  ativa: 'Ativa',
  suspensa: 'Suspensa',
  cancelada: 'Cancelada',
  expirada: 'Expirada',
}

export const APPOINTMENT_STATUS = {
  agendado: 'Agendado',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
  faltou: 'Faltou',
}

export const fmtDate = (value) => (value ? new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR') : '—')

export const fmtDateTime = (value) =>
  value
    ? new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
    : '—'
