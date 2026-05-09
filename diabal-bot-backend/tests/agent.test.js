import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getFinalJson,
  loadProductsToSession,
  runCsvAgent
} from '../agent.js'

function loadTestSession(sessionId = 'agent-room') {
  return loadProductsToSession(sessionId, {
    originalFileName: 'products.csv',
    headerRow: 1,
    warnings: [],
    mappings: [
      {
        field: 'supplier_email',
        label: 'Supplier email',
        description: '',
        sourceColumn: 'Supplier Email',
        sourceIndex: 0,
        confidence: 1
      },
      {
        field: 'qa_owner',
        label: 'QA Owner',
        description: 'Dynamic field imported from the source file.',
        sourceColumn: 'QA Owner',
        sourceIndex: 1,
        confidence: 1,
        isDynamic: true
      }
    ],
    products: [
      {
        purchase_order: 'PO-1',
        product_name: 'Dress',
        country_of_origin: 'India',
        supplier: 'Supplier A',
        supplier_email: 'old@example.com',
        certifications: '',
        status_of_certifications: '',
        material_composition: '',
        season: '',
        sku: '',
        color: '',
        facility_name: '',
        facility_address: '',
        facility_email: '',
        facility_contact_name: '',
        qa_owner: 'Mariana'
      }
    ]
  })
}

test('updates fields through chat command', async () => {
  loadTestSession('update-room')

  const response = await runCsvAgent(
    'set row 1 supplier_email to new@example.com',
    'update-room'
  )

  assert.equal(response.action, 'update')
  assert.equal(getFinalJson('update-room')[0].supplier_email, 'new@example.com')
})

test('updates dynamic JSON fields through chat command', async () => {
  loadTestSession('dynamic-update-room')

  const response = await runCsvAgent(
    'set row 1 qa_owner to Diego',
    'dynamic-update-room'
  )

  assert.equal(response.action, 'update')
  assert.equal(getFinalJson('dynamic-update-room')[0].qa_owner, 'Diego')
})

test('accepts Spanish chat commands', async () => {
  loadTestSession('spanish-room')

  const updateResponse = await runCsvAgent(
    'cambia fila 1 supplier_email a nuevo@example.com',
    'spanish-room'
  )

  assert.equal(updateResponse.action, 'update')
  assert.match(updateResponse.text, /Actualicé fila 1/)
  assert.equal(
    getFinalJson('spanish-room')[0].supplier_email,
    'nuevo@example.com'
  )

  const rowResponse = await runCsvAgent('ver fila 1', 'spanish-room')

  assert.equal(rowResponse.action, 'answer')
  assert.match(rowResponse.text, /Fila 1/)
})

test('explains purpose in Spanish without requiring a file', async () => {
  const response = await runCsvAgent('para que sirve este bot', 'no-file-room')

  assert.equal(response.action, 'answer')
  assert.match(response.text, /convertir un CSV o XLSX de productos/)
})

test('confirms final JSON through chat command', async () => {
  loadTestSession('confirm-room')

  const response = await runCsvAgent('confirmar', 'confirm-room')

  assert.equal(response.action, 'confirm')
  assert.match(response.text, /listo para descargar/)
  assert.ok(response.session.confirmedAt)
})
