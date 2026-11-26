// Gateway (Vercel) para os serviços Java do Artur.
// As URLs vêm das variáveis de ambiente EXERCISE_URL e WORKOUT_URL do projeto na Vercel.
const services = {
  exercise: { env: 'EXERCISE_URL', resource: 'exercises' },
  workout: { env: 'WORKOUT_URL', resource: 'workouts' },
}

async function forward(request) {
  const { pathname, searchParams } = new URL(request.url)
  const original = /^\/api\/(exercise|workout)\/([^?]+)$/.exec(pathname)
  const service = original ? original[1] : searchParams.get('service')
  const route = original ? original[2] : searchParams.get('route')
  const config = Object.hasOwn(services, service) && services[service]
  const valid = config && route && new RegExp('^' + config.resource + '(/[1-9][0-9]{0,9})?$').test(route)
  if (!valid) return Response.json({ detail: 'Rota inexistente.' }, { status: 404 })

  const base = process.env[config.env]
  if (!base) {
    return Response.json({ detail: 'Serviço ainda sem endereço configurado no gateway.' }, { status: 503 })
  }

  const target = new URL('/' + route, base)
  const userId = searchParams.get('userId')
  if (userId && /^[1-9][0-9]{0,9}$/.test(userId)) target.searchParams.set('userId', userId)

  try {
    const headers = new Headers()
    let body
    if (request.method === 'POST' || request.method === 'PUT') {
      headers.set('Content-Type', 'application/json')
      body = await request.text()
      if (Buffer.byteLength(body) > 8192) {
        return Response.json({ detail: 'Corpo da requisição muito grande.' }, { status: 413 })
      }
    }
    const response = await fetch(target, {
      method: request.method,
      headers,
      body,
      redirect: 'error',
      signal: AbortSignal.timeout(15000),
    })
    const forwarded = new Headers({ 'Cache-Control': 'no-store' })
    const type = response.headers.get('Content-Type')
    if (type) forwarded.set('Content-Type', type)
    return new Response(response.body, { status: response.status, headers: forwarded })
  } catch {
    return Response.json({ detail: 'Serviço indisponível no gateway.' }, { status: 502 })
  }
}

export { forward as GET, forward as POST, forward as PUT, forward as DELETE }
