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
        facility_contact_name: ''
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

test('confirms final JSON through chat command', async () => {
  loadTestSession('confirm-room')

  const response = await runCsvAgent('confirm', 'confirm-room')

  assert.equal(response.action, 'confirm')
  assert.match(response.text, /ready to download/)
  assert.ok(response.session.confirmedAt)
})
