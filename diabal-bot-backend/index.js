import 'dotenv/config'
import crypto from 'crypto'
import cors from 'cors'
import express from 'express'
import http from 'http'
import multer from 'multer'
import { Server } from 'socket.io'
import {
  getFinalJson,
  getSessionSnapshot,
  loadProductsToSession,
  runCsvAgent,
  summarizeLoadedSession
} from './agent.js'
import { parseSpreadsheetBuffer } from './parser.js'

const PORT = Number(process.env.PORT ?? 3001)
const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_BYTES ?? 10 * 1024 * 1024)
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

const app = express()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES }
})

function isOriginAllowed(origin) {
  return !origin || ALLOWED_ORIGINS.includes(origin)
}

function corsOptions(req, callback) {
  const origin = req.header('Origin')

  callback(null, {
    origin: isOriginAllowed(origin),
    credentials: false
  })
}

function getSessionId(req) {
  return String(
    req.header('x-session-id') ||
    req.body?.sessionId ||
    req.query?.sessionId ||
    ''
  ).trim()
}

function safeFileName(fileName) {
  return String(fileName ?? 'products')
    .replace(/[^a-z0-9._-]+/gi, '_')
    .slice(0, 80)
}

function buildSessionResponse(sessionId, session) {
  return {
    ok: true,
    sessionId,
    ...session,
    rowCount: session.products.length,
    downloadUrl: `/api/sessions/${encodeURIComponent(sessionId)}/final-json`
  }
}

app.use(cors(corsOptions))
app.use(express.json({ limit: '1mb' }))

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'diabal-bot-backend' })
})

app.post('/api/upload', upload.single('file'), async (req, res, next) => {
  try {
    const sessionId = getSessionId(req)

    if (!sessionId) {
      return res.status(400).json({ ok: false, error: 'sessionId is required' })
    }

    if (!req.file) {
      return res.status(400).json({ ok: false, error: 'file is required' })
    }

    const parsed = await parseSpreadsheetBuffer({
      buffer: req.file.buffer,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype
    })

    const session = loadProductsToSession(sessionId, {
      ...parsed,
      originalFileName: req.file.originalname
    })

    res.status(201).json(buildSessionResponse(sessionId, session))
  } catch (error) {
    next(error)
  }
})

app.get('/api/sessions/:sessionId', (req, res) => {
  const session = getSessionSnapshot(req.params.sessionId)

  if (!session) {
    return res.status(204).send()
  }

  res.json(buildSessionResponse(req.params.sessionId, session))
})

app.get('/api/sessions/:sessionId/final-json', (req, res) => {
  const products = getFinalJson(req.params.sessionId)

  if (!products) {
    return res.status(404).json({ ok: false, error: 'session not found' })
  }

  const fileName = safeFileName(`diabal-${req.params.sessionId}.json`)

  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
  res.send(JSON.stringify(products, null, 2))
})

app.use((error, _req, res, _next) => {
  const isMulterLimit = error?.code === 'LIMIT_FILE_SIZE'
  const message = isMulterLimit
    ? `File too large. Max ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB.`
    : error?.message || 'Internal server error'
  const status = isMulterLimit ? 413 : 400

  res.status(status).json({ ok: false, error: message })
})

const server = http.createServer(app)

const socketServer = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST']
  },
  maxHttpBufferSize: 1e6
})

const rooms = new Map()

function pushRoomMessage(room, message) {
  const list = rooms.get(room) || []

  list.push(message)
  rooms.set(room, list.slice(-100))
}

socketServer.on('connection', (socket) => {
  socket.on('room:join', ({ room }) => {
    if (!room) {
      socket.emit('room:error', 'room is required')
      return
    }

    socket.join(room)

    const history = rooms.get(room) ?? []

    history.forEach((message) => socket.emit('message:new', message))
  })

  socket.on('room:leave', ({ room }) => {
    if (room) socket.leave(room)
  })

  socket.on('message:send', ({ room, text, at }, connection) => {
    try {
      if (!room || !String(text ?? '').trim()) {
        connection?.({ ok: false, error: 'room/text required' })
        return
      }

      const msg = {
        id: crypto.randomUUID(),
        from: 'admin',
        text: String(text),
        at: at || new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        })
      }

      pushRoomMessage(room, msg)
      connection?.({ ok: true, id: msg.id })
      socketServer.to(room).emit('message:new', msg)

      setTimeout(async () => {
        try {
          const result = await runCsvAgent(text, room)
          const botMsg = {
            id: crypto.randomUUID(),
            from: 'bot',
            text: result.text,
            at: new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            }),
            session: result.session ?? null
          }

          pushRoomMessage(room, botMsg)
          socketServer.to(room).emit('message:new', botMsg)
        } catch (error) {
          const errorMsg = {
            id: crypto.randomUUID(),
            from: 'bot',
            text: 'There was an error processing that message.',
            at: new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })
          }

          console.error('message processing error:', error)
          pushRoomMessage(room, errorMsg)
          socketServer.to(room).emit('message:new', errorMsg)
        }
      }, 100)
    } catch (error) {
      console.error('message:send error:', error)
      connection?.({ ok: false, error: 'internal error' })
    }
  })
})

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`)
  })
}

export { app, server, summarizeLoadedSession }
