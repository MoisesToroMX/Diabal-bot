import assert from 'node:assert/strict'
import test from 'node:test'
import request from 'supertest'
import { app, server } from '../index.js'

test.after(() => {
  server.close()
})

test('uploads CSV, stores session and downloads final JSON', async () => {
  const csv = [
    'Product Name,Purchase Order,Country,Vendor,Vendor Email,Internal Notes',
    'Linen Shirt,PO-22,Italy,North Mill,hello@example.com,Priority sample'
  ].join('\n')

  const uploadResponse = await request(app)
    .post('/api/upload')
    .set('x-session-id', 'test-room')
    .attach('file', Buffer.from(csv), 'products.csv')
    .expect(201)

  assert.equal(uploadResponse.body.ok, true)
  assert.equal(uploadResponse.body.rowCount, 1)
  assert.equal(uploadResponse.body.products[0].product_name, 'Linen Shirt')
  assert.equal(uploadResponse.body.products[0].internal_notes, 'Priority sample')

  const sessionResponse = await request(app)
    .get('/api/sessions/test-room')
    .expect(200)

  assert.equal(sessionResponse.body.products[0].supplier_email, 'hello@example.com')

  const jsonResponse = await request(app)
    .get('/api/sessions/test-room/final-json')
    .expect(200)

  assert.equal(jsonResponse.body[0].purchase_order, 'PO-22')
  assert.equal(jsonResponse.body[0].internal_notes, 'Priority sample')
})

test('rejects unsupported uploads', async () => {
  const response = await request(app)
    .post('/api/upload')
    .set('x-session-id', 'bad-file-room')
    .attach('file', Buffer.from('not a spreadsheet'), 'notes.txt')
    .expect(400)

  assert.match(response.body.error, /Tipo de archivo no soportado/)
})
