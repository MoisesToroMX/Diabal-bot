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
  const targetMappings = session.mappings.filter((mapping) => {
    return !mapping.isDynamic
  })
  const dynamicCount = session.mappings.length - targetMappings.length
  const mappedCount = targetMappings.filter((mapping) => {
    return mapping.sourceColumn
  }).length
  const warningText = session.warnings.length
    ? ` Advertencias: ${session.warnings.join(' | ')}`
    : ''
  const dynamicText = dynamicCount
    ? ` Agregué ${dynamicCount} campos dinámicos al JSON.`
    : ''

  return [
    `Cargué ${session.products.length} productos desde ${session.originalFileName}.`,
    `Mapeé ${mappedCount}/${targetMappings.length} campos objetivo.`,
    'Puedes pedir "mapeo", "ver fila 1",',
    '"cambia fila 2 supplier_email a x@y.com" o "confirmar".',
    `${dynamicText}${warningText}`
  ].join(' ')
}

function formatMapping(session) {
  return session.mappings
    .map((mapping) => {
      const source = mapping.sourceColumn ?? 'sin mapear'

      return `${mapping.field}: ${source}`
    })
    .join('\n')
}

function formatProduct(product, index) {
  const lines = Object.entries(product).map(([key, value]) => {
    return `  ${key}: ${value || ''}`
  })

  return `Fila ${index + 1}\n${lines.join('\n')}`
}

function getHelpResponse() {
  return [
    'Soy Diabal Bot.',
    'Sirvo para convertir un CSV o XLSX de productos en un JSON limpio.',
    'Detecto columnas aunque vengan con nombres diferentes, agrego columnas',
    'extra como propiedades dinámicas y te dejo corregir valores por chat.',
    'Ejemplos: "mapeo", "ver fila 1",',
    '"cambia fila 2 supplier_email a qa@example.com" y "confirmar".'
  ].join(' ')
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

function getSessionFields(session) {
  const dynamicFields = session.mappings
    .filter((mapping) => mapping.isDynamic)
    .map((mapping) => ({
      key: mapping.field,
      label: mapping.label,
      synonyms: [mapping.field, mapping.label, mapping.sourceColumn].filter(
        Boolean
      )
    }))

  return [...PRODUCT_FIELDS, ...dynamicFields]
}

function findField(input, session) {
  const best = getSessionFields(session).reduce((current, field) => {
    const score = scoreField(input, field)

    return score > current.score ? { field, score } : current
  }, { field: null, score: 0 })

  return best.score >= 0.45 ? best.field.key : null
}

function parseRowNumber(input) {
  const match = normalizeText(input).match(
    /\b(?:row|fila|renglon|registro|producto)\s+(\d+)\b/
  )

  return match ? Number(match[1]) : null
}

function parseUpdate(input, session) {
  const rowNumber = parseRowNumber(input)
  const field = findField(input, session)

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
    return `La fila ${update.rowNumber} no existe.`
  }

  if (!(update.field in product)) {
    return `El campo "${update.field}" no existe en el JSON actual.`
  }

  product[update.field] = update.value.slice(0, 1000)

  return `Actualicé fila ${update.rowNumber}: ${update.field} = ${product[update.field]}`
}

function isHelpCommand(normalized) {
  const helpTerms = [
    'ayuda',
    'que haces',
    'para que',
    'como funciona',
    'que puedes hacer',
    'proposito',
    'objetivo',
    'help',
    'what do you do'
  ]

  return helpTerms.some((term) => normalized.includes(term))
}

function handleReadCommand(input, session) {
  const normalized = normalizeText(input)
  const rowNumber = parseRowNumber(input)

  if (
    normalized.includes('mapping') ||
    normalized.includes('mapa') ||
    normalized.includes('mapeo') ||
    normalized.includes('columnas')
  ) {
    return formatMapping(session)
  }

  if (rowNumber) {
    const product = session.products[rowNumber - 1]

    return product ? formatProduct(product, rowNumber - 1) : 'Fila no encontrada.'
  }

  if (
    normalized.includes('show') ||
    normalized.includes('json') ||
    normalized.includes('table') ||
    normalized.includes('tabla') ||
    normalized.includes('ver') ||
    normalized.includes('mostrar')
  ) {
    const preview = session.products.slice(0, 3)

    return `${JSON.stringify(preview, null, 2)}${
      session.products.length > 3 ? '\nMostrando las primeras 3 filas.' : ''
    }`
  }

  return null
}

export async function runCsvAgent(input, sessionId) {
  const text = String(input ?? '').trim()
  const session = sessionStore.get(sessionId)

  if (text && isHelpCommand(normalizeText(text))) {
    return {
      action: 'answer',
      text: getHelpResponse(),
      session: session ? clone(session) : null
    }
  }

  if (!session) {
    return {
      action: 'answer',
      text: 'Primero sube un archivo CSV o XLSX.'
    }
  }

  if (!text) {
    return {
      action: 'answer',
      text: 'Manda un comando o pregunta sobre los datos cargados.'
    }
  }

  const normalized = normalizeText(text)

  const update = parseUpdate(text, session)

  if (update) {
    const response = updateField(session, update)

    return {
      action: 'update',
      text: response,
      session: clone(session)
    }
  }

  if (normalized.includes('confirm') || normalized.includes('confirmar')) {
    session.confirmedAt = nowIso()

    return {
      action: 'confirm',
      text: 'Confirmado. El JSON final está listo para descargar.',
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

  return session ? summarizeSession(session) : 'No hay archivo cargado.'
}
