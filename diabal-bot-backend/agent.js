import { PRODUCT_FIELDS } from './schema.js'
import { normalizeText } from './parser.js'

const sessionStore = new Map()

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function nowIso() {
  return new Date().toISOString()
}

function createSessionPayload(payload) {
  return {
    originalFileName: payload.originalFileName,
    uploadedAt: nowIso(),
    confirmedAt: null,
    products: payload.products,
    mappings: payload.mappings,
    warnings: payload.warnings,
    headerRow: payload.headerRow
  }
}

export function loadProductsToSession(sessionId, payload) {
  const session = createSessionPayload(payload)

  sessionStore.set(sessionId, session)

  return clone(session)
}

export function getSessionSnapshot(sessionId) {
  const session = sessionStore.get(sessionId)

  return session ? clone(session) : null
}

export function getFinalJson(sessionId) {
  const session = sessionStore.get(sessionId)

  return session ? clone(session.products) : null
}

function summarizeSession(session) {
  const mappedCount = session.mappings.filter((mapping) => {
    return mapping.sourceColumn
  }).length
  const warningText = session.warnings.length
    ? ` Warnings: ${session.warnings.join(' | ')}`
    : ''

  return [
    `Loaded ${session.products.length} products from ${session.originalFileName}.`,
    `Mapped ${mappedCount}/${session.mappings.length} target fields.`,
    'Ask for "mapping", "show row 1", "set row 2 supplier_email to x@y.com",',
    `or "confirm".${warningText}`
  ].join(' ')
}

function formatMapping(session) {
  return session.mappings
    .map((mapping) => {
      const source = mapping.sourceColumn ?? 'not mapped'

      return `${mapping.field}: ${source}`
    })
    .join('\n')
}

function formatProduct(product, index) {
  const lines = Object.entries(product).map(([key, value]) => {
    return `  ${key}: ${value || ''}`
  })

  return `Row ${index + 1}\n${lines.join('\n')}`
}

function normalizeFieldText(value) {
  return normalizeText(value).replace(/\s+/g, '_')
}

function scoreField(input, field) {
  const normalizedInput = normalizeText(input)
  const joinedInput = normalizeFieldText(input)

  if (!normalizedInput) return 0
  if (joinedInput.includes(field.key)) {
    return field.key.includes('_') ? 1 : 0.85
  }

  return [field.key, ...field.synonyms].reduce((best, synonym) => {
    const normalizedSynonym = normalizeText(synonym)
    const joinedSynonym = normalizeFieldText(synonym)
    const synonymTokens = normalizedSynonym.split(' ').filter(Boolean)

    if (
      synonymTokens.length > 1 &&
      normalizedInput.includes(normalizedSynonym)
    ) {
      return Math.max(best, 0.95)
    }

    if (synonymTokens.length > 1 && joinedInput.includes(joinedSynonym)) {
      return Math.max(best, 0.95)
    }

    const inputTokens = new Set(normalizedInput.split(' ').filter(Boolean))
    const overlap = synonymTokens.filter((token) => inputTokens.has(token))
    const score = overlap.length / Math.max(synonymTokens.length, 1)

    return Math.max(best, score * 0.7)
  }, 0)
}

function findField(input) {
  const best = PRODUCT_FIELDS.reduce((current, field) => {
    const score = scoreField(input, field)

    return score > current.score ? { field, score } : current
  }, { field: null, score: 0 })

  return best.score >= 0.45 ? best.field.key : null
}

function parseRowNumber(input) {
  const match = normalizeText(input).match(/\b(?:row|fila)\s+(\d+)\b/)

  return match ? Number(match[1]) : null
}

function parseUpdate(input) {
  const rowNumber = parseRowNumber(input)
  const field = findField(input)

  if (!rowNumber || !field) return null

  const valuePatterns = [
    /\b(?:to|a|=)\s*(.+)$/i,
    /\b(?:por|como)\s+(.+)$/i
  ]

  for (const pattern of valuePatterns) {
    const match = input.match(pattern)

    if (match?.[1]) {
      return {
        rowNumber,
        field,
        value: String(match[1]).trim()
      }
    }
  }

  return null
}

function updateField(session, update) {
  const rowIndex = update.rowNumber - 1
  const product = session.products[rowIndex]

  if (!product) {
    return `Row ${update.rowNumber} does not exist.`
  }

  if (!(update.field in product)) {
    return `Field "${update.field}" does not exist in target schema.`
  }

  product[update.field] = update.value.slice(0, 1000)

  return `Updated row ${update.rowNumber}: ${update.field} = ${product[update.field]}`
}

function handleReadCommand(input, session) {
  const normalized = normalizeText(input)
  const rowNumber = parseRowNumber(input)

  if (normalized.includes('mapping') || normalized.includes('mapa')) {
    return formatMapping(session)
  }

  if (rowNumber) {
    const product = session.products[rowNumber - 1]

    return product ? formatProduct(product, rowNumber - 1) : 'Row not found.'
  }

  if (
    normalized.includes('show') ||
    normalized.includes('json') ||
    normalized.includes('table') ||
    normalized.includes('tabla') ||
    normalized.includes('ver')
  ) {
    const preview = session.products.slice(0, 3)

    return `${JSON.stringify(preview, null, 2)}${
      session.products.length > 3 ? '\nShowing first 3 rows.' : ''
    }`
  }

  return null
}

export async function runCsvAgent(input, sessionId) {
  const text = String(input ?? '').trim()
  const session = sessionStore.get(sessionId)

  if (!session) {
    return {
      action: 'answer',
      text: 'Upload a CSV or XLSX file first.'
    }
  }

  if (!text) {
    return {
      action: 'answer',
      text: 'Send a command or question about the uploaded data.'
    }
  }

  const update = parseUpdate(text)

  if (update) {
    const response = updateField(session, update)

    return {
      action: 'update',
      text: response,
      session: clone(session)
    }
  }

  const normalized = normalizeText(text)

  if (normalized.includes('confirm') || normalized.includes('confirmar')) {
    session.confirmedAt = nowIso()

    return {
      action: 'confirm',
      text: 'Confirmed. Final JSON is ready to download.',
      session: clone(session)
    }
  }

  const readResponse = handleReadCommand(text, session)

  if (readResponse) {
    return {
      action: 'answer',
      text: readResponse,
      session: clone(session)
    }
  }

  return {
    action: 'answer',
    text: summarizeSession(session),
    session: clone(session)
  }
}

export function summarizeLoadedSession(sessionId) {
  const session = sessionStore.get(sessionId)

  return session ? summarizeSession(session) : 'No file loaded.'
}
