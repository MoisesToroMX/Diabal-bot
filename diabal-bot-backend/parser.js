import { parse as parseCsv } from 'csv-parse/sync'
import readXlsxFile from 'read-excel-file/node'
import { PRODUCT_FIELD_KEYS, PRODUCT_FIELDS } from './schema.js'

const MAX_ROWS = 5000
const MAX_CELL_LENGTH = 1000
const HEADER_SCAN_LIMIT = 25

function cleanString(value) {
  if (value === null || value === undefined) return ''

  return String(value)
    .replace(/\u0000/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_CELL_LENGTH)
}

export function normalizeText(value) {
  return cleanString(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function tokens(value) {
  return normalizeText(value).split(' ').filter(Boolean)
}

function scoreHeader(header, field) {
  const normalizedHeader = normalizeText(header)
  const headerTokens = new Set(tokens(header))

  if (!normalizedHeader) return 0

  let bestScore = 0

  for (const synonym of [field.key, ...field.synonyms]) {
    const normalizedSynonym = normalizeText(synonym)
    const synonymTokens = tokens(synonym)

    if (normalizedHeader === normalizedSynonym) {
      bestScore = Math.max(bestScore, 1)
      continue
    }

    if (normalizedHeader.includes(normalizedSynonym)) {
      bestScore = Math.max(bestScore, 0.9)
      continue
    }

    const overlap = synonymTokens.filter((token) => headerTokens.has(token))
    const score = overlap.length / Math.max(synonymTokens.length, 1)

    bestScore = Math.max(bestScore, score * 0.75)
  }

  return bestScore
}

function detectHeaderRow(rows) {
  const scanRows = rows.slice(0, HEADER_SCAN_LIMIT)
  let bestIndex = 0
  let bestScore = -1

  for (let index = 0; index < scanRows.length; index += 1) {
    const row = scanRows[index]
    const nonEmpty = row.filter((cell) => cleanString(cell)).length

    if (!nonEmpty) continue

    const mappingScore = row.reduce((sum, cell) => {
      const cellScore = PRODUCT_FIELDS.reduce((best, field) => {
        return Math.max(best, scoreHeader(cell, field))
      }, 0)

      return sum + cellScore
    }, 0)

    const score = mappingScore + Math.min(nonEmpty, 10) * 0.05

    if (score > bestScore) {
      bestIndex = index
      bestScore = score
    }
  }

  return bestIndex
}

function uniqueHeaders(headers) {
  const counts = new Map()

  return headers.map((header, index) => {
    const cleanHeader = cleanString(header) || `Column ${index + 1}`
    const normalizedHeader = normalizeText(cleanHeader)
    const count = counts.get(normalizedHeader) ?? 0

    counts.set(normalizedHeader, count + 1)

    return count ? `${cleanHeader} ${count + 1}` : cleanHeader
  })
}

function normalizeKey(value, fallback) {
  const key = normalizeText(value).replace(/\s+/g, '_')
  const cleanKey = key.replace(/_+/g, '_').replace(/^_+|_+$/g, '')

  if (!cleanKey) return fallback

  return /^\d/.test(cleanKey) ? `column_${cleanKey}` : cleanKey
}

function uniqueKey(baseKey, usedKeys) {
  let key = baseKey
  let suffix = 2

  while (usedKeys.has(key)) {
    key = `${baseKey}_${suffix}`
    suffix += 1
  }

  usedKeys.add(key)

  return key
}

export function mapHeaders(headers) {
  const candidates = []
  const mappedIndexes = new Set()
  const mappedFields = new Set()

  PRODUCT_FIELDS.forEach((field) => {
    headers.forEach((header, index) => {
      const confidence = scoreHeader(header, field)

      if (confidence >= 0.45) {
        candidates.push({
          field,
          sourceColumn: header,
          sourceIndex: index,
          confidence
        })
      }
    })
  })

  candidates.sort((left, right) => {
    return right.confidence - left.confidence
  })

  const selected = new Map()

  candidates.forEach((candidate) => {
    if (
      mappedFields.has(candidate.field.key) ||
      mappedIndexes.has(candidate.sourceIndex)
    ) {
      return
    }

    mappedFields.add(candidate.field.key)
    mappedIndexes.add(candidate.sourceIndex)
    selected.set(candidate.field.key, candidate)
  })

  return PRODUCT_FIELDS.map((field) => {
    const candidate = selected.get(field.key)

    if (!candidate) {
      return {
        field: field.key,
        label: field.label,
        description: field.description,
        sourceColumn: null,
        sourceIndex: null,
        confidence: 0
      }
    }

    return {
      field: field.key,
      label: field.label,
      description: field.description,
      sourceColumn: candidate.sourceColumn,
      sourceIndex: candidate.sourceIndex,
      confidence: Number(candidate.confidence.toFixed(2))
    }
  })
}

function mapDynamicHeaders(headers, targetMappings) {
  const mappedIndexes = new Set(
    targetMappings
      .map((mapping) => mapping.sourceIndex)
      .filter((sourceIndex) => sourceIndex !== null)
  )
  const usedKeys = new Set(PRODUCT_FIELD_KEYS)

  return headers
    .map((header, index) => {
      if (mappedIndexes.has(index)) return null

      const baseKey = normalizeKey(header, `column_${index + 1}`)
      const fieldKey = uniqueKey(baseKey, usedKeys)

      return {
        field: fieldKey,
        label: header,
        description: 'Dynamic field imported from the source file.',
        sourceColumn: header,
        sourceIndex: index,
        confidence: 1,
        isDynamic: true
      }
    })
    .filter(Boolean)
}

function rowsToProducts(rows) {
  const headerIndex = detectHeaderRow(rows)
  const headers = uniqueHeaders(rows[headerIndex] ?? [])
  const targetMappings = mapHeaders(headers)
  const dynamicMappings = mapDynamicHeaders(headers, targetMappings)
  const mappings = [...targetMappings, ...dynamicMappings]
  const dataRows = rows.slice(headerIndex + 1, headerIndex + 1 + MAX_ROWS)
  const warnings = []
  const products = []

  if (!headers.length) {
    return {
      products,
      mappings,
      warnings: ['No header row was found.'],
      headerRow: headerIndex + 1
    }
  }

  dataRows.forEach((row) => {
    const hasValue = row.some((cell) => cleanString(cell))

    if (!hasValue) return

    const product = {}

    mappings.forEach((mapping) => {
      const rawValue =
        mapping.sourceIndex === null ? '' : row[mapping.sourceIndex]

      product[mapping.field] = cleanString(rawValue)
    })

    products.push(product)
  })

  const missingFields = mappings
    .filter((mapping) => mapping.sourceColumn === null)
    .map((mapping) => mapping.field)

  if (missingFields.length) {
    warnings.push(`Missing mapped columns: ${missingFields.join(', ')}`)
  }

  if (rows.length > headerIndex + 1 + MAX_ROWS) {
    warnings.push(`Only the first ${MAX_ROWS} data rows were imported.`)
  }

  return {
    products,
    mappings,
    warnings,
    headerRow: headerIndex + 1
  }
}

async function parseCsvBuffer(buffer) {
  return parseCsv(buffer.toString('utf8'), {
    bom: true,
    relaxColumnCount: true,
    skipEmptyLines: false
  })
}

async function parseXlsxBuffer(buffer) {
  return readXlsxFile(buffer, { trim: false })
}

function getExtension(fileName) {
  const parts = cleanString(fileName).toLowerCase().split('.')

  return parts.length > 1 ? parts.at(-1) : ''
}

export async function parseSpreadsheetBuffer({ buffer, fileName, mimeType }) {
  const extension = getExtension(fileName)
  const type = cleanString(mimeType).toLowerCase()
  let rows

  if (extension === 'csv' || type.includes('csv')) {
    rows = await parseCsvBuffer(buffer)
  } else if (
    extension === 'xlsx' ||
    type.includes('spreadsheetml') ||
    type.includes('excel')
  ) {
    rows = await parseXlsxBuffer(buffer)
  } else {
    throw new Error('Unsupported file type. Use .csv or .xlsx.')
  }

  return rowsToProducts(rows)
}
