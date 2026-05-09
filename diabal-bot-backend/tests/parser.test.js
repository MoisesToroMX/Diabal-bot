import assert from 'node:assert/strict'
import test from 'node:test'
import { parseSpreadsheetBuffer } from '../parser.js'

test('parses CSV and maps known product columns', async () => {
  const csv = [
    'Product Style Name,Purchase Order Number,Season,SKU,Color,Material Composition,Certifications,Supplier Name,Country of Origin,Facility Name,Facility Address,Facility Email,Facility Contact Name',
    'Isla Organic Sun Dress,PO20878799,Spring 2027,D001-WHT-S,White,100% Organic Cotton,"GOTS, OEKO-TEX 100",GreenThreads Co.,India,GreenThreads Knits Unit,"Plot 42, Tiruppur",contact@greenthreads.co.in,Ravi Kumar'
  ].join('\n')

  const result = await parseSpreadsheetBuffer({
    buffer: Buffer.from(csv),
    fileName: 'products.csv',
    mimeType: 'text/csv'
  })

  assert.equal(result.products.length, 1)
  assert.equal(result.products[0].product_name, 'Isla Organic Sun Dress')
  assert.equal(result.products[0].purchase_order, 'PO20878799')
  assert.equal(result.products[0].country_of_origin, 'India')
  assert.equal(result.products[0].supplier_email, '')
  assert.equal(result.products[0].facility_email, 'contact@greenthreads.co.in')
})

test('detects unstructured header row and variant column names', async () => {
  const csv = [
    'Spring supplier export',
    '',
    'Item Description,PO Number,Origin Country,Vendor Email,Fabric Content',
    'Noa Tee,PO-1,Portugal,vendor@example.com,100% cotton'
  ].join('\n')

  const result = await parseSpreadsheetBuffer({
    buffer: Buffer.from(csv),
    fileName: 'variant.csv',
    mimeType: 'text/csv'
  })

  assert.equal(result.headerRow, 3)
  assert.equal(result.products[0].product_name, 'Noa Tee')
  assert.equal(result.products[0].purchase_order, 'PO-1')
  assert.equal(result.products[0].country_of_origin, 'Portugal')
  assert.equal(result.products[0].supplier_email, 'vendor@example.com')
  assert.equal(result.products[0].material_composition, '100% cotton')
})
