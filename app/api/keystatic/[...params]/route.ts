export const dynamic = 'force-dynamic'

type RouteHandler = {
  GET: (req: Request, ctx: unknown) => Promise<Response>
  POST: (req: Request, ctx: unknown) => Promise<Response>
}

let _handler: RouteHandler | null = null

async function getHandler(): Promise<RouteHandler> {
  if (!_handler) {
    const [{ makeRouteHandler }, { default: config }] = await Promise.all([
      import('@keystatic/next/route-handler'),
      import('../../../../keystatic.config'),
    ])
    _handler = makeRouteHandler({ config }) as RouteHandler
  }
  return _handler
}

export async function GET(req: Request, ctx: unknown) {
  const handler = await getHandler()
  return handler.GET(req, ctx)
}

export async function POST(req: Request, ctx: unknown) {
  const handler = await getHandler()
  return handler.POST(req, ctx)
}
