// ---------------------------------------------------------------------------
// InterviewFlow — vite-dev-api.ts
// Serves the Vercel serverless functions in api/ from the Vite dev server.
//
// Without this, `npm run dev` serves the SPA but nothing under /api/. Every
// AI request fell through to the SPA fallback, got index.html back, and died
// in `res.json()` — which the UI reported as a generic network problem. That
// is why every AI tool looked broken locally while the code was fine.
//
// The adapter is deliberately thin: it maps a URL to a file, gives the handler
// the small slice of the Vercel req/res surface the handlers actually use, and
// leans on Vite's own module graph so edits to api/ hot-reload like any other
// source file.
// ---------------------------------------------------------------------------

import fs from 'node:fs'
import path from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'

/** Bodies carry base64 CV uploads, so the cap is well above Vercel's 4.5 MB. */
const MAX_BODY_BYTES = 12 * 1024 * 1024

function resolveHandlerFile(root: string, pathname: string): string | null {
  const rel = pathname.replace(/^\/api\/?/, '').replace(/\/+$/, '')
  if (!rel) return null

  // Reject traversal before touching the filesystem.
  if (rel.split('/').some(seg => seg === '..' || seg === '')) return null

  const candidates = [
    `api/${rel}.ts`,
    `api/${rel}/index.ts`,
    `api/${rel}.js`,
    `api/${rel}/index.js`,
  ]
  for (const c of candidates) {
    const abs = path.resolve(root, c)
    if (abs.startsWith(path.resolve(root, 'api')) && fs.existsSync(abs)) return abs
  }
  return null
}

function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let size = 0
    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        reject(new Error('Request body too large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

/** The subset of VercelResponse the handlers call. */
function decorateResponse(res: ServerResponse) {
  const r = res as ServerResponse & {
    status: (code: number) => typeof r
    json:   (body: unknown) => typeof r
    send:   (body: string) => typeof r
  }
  r.status = (code: number) => { r.statusCode = code; return r }
  r.json = (body: unknown) => {
    if (!r.headersSent) r.setHeader('content-type', 'application/json; charset=utf-8')
    r.end(JSON.stringify(body))
    return r
  }
  r.send = (body: string) => { r.end(body); return r }
  return r
}

export function devApiPlugin(): Plugin {
  return {
    name: 'interviewflow-dev-api',
    apply: 'serve',

    configureServer(server) {
      const root = server.config.root

      server.middlewares.use(async (req, res, next) => {
        const rawUrl = req.url ?? ''
        if (!rawUrl.startsWith('/api/')) return next()

        const [pathname, search = ''] = rawUrl.split('?')
        const file = resolveHandlerFile(root, pathname)
        const out  = decorateResponse(res)

        if (!file) {
          out.status(404).json({ ok: false, error: `No API route matches ${pathname}` })
          return
        }

        try {
          const raw = await readBody(req)
          const contentType = String(req.headers['content-type'] ?? '')

          let body: unknown = undefined
          if (raw.length > 0) {
            if (contentType.includes('application/json')) {
              try { body = JSON.parse(raw.toString('utf8')) }
              catch {
                out.status(400).json({ ok: false, error: 'Request body is not valid JSON' })
                return
              }
            } else {
              body = raw.toString('utf8')
            }
          }

          // ssrLoadModule transpiles the TS handler and keeps it in Vite's
          // module graph, so saving a file in api/ takes effect immediately.
          const mod = await server.ssrLoadModule(file) as {
            default?: (rq: unknown, rs: unknown) => unknown | Promise<unknown>
          }
          const handler = mod.default
          if (typeof handler !== 'function') {
            out.status(500).json({
              ok: false,
              error: `${path.relative(root, file)} has no default export handler`,
            })
            return
          }

          const vercelReq = Object.assign(req, {
            body,
            query: Object.fromEntries(new URLSearchParams(search)),
            cookies: {} as Record<string, string>,
          })

          await handler(vercelReq, out)
          if (!out.writableEnded) out.end()
        } catch (err) {
          // The stack is the whole point of running locally — print it, then
          // hand the browser the same message the deployed function would.
          server.config.logger.error(
            `[dev-api] ${pathname} failed:\n${err instanceof Error ? (err.stack ?? err.message) : String(err)}`,
          )
          if (!out.headersSent) {
            out.status(500).json({
              ok:    false,
              error: err instanceof Error ? err.message : 'Unexpected error in dev API handler',
            })
          } else if (!out.writableEnded) {
            out.end()
          }
        }
      })
    },
  }
}
