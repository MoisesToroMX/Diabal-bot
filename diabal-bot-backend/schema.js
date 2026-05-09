export const PRODUCT_FIELDS = [
  {
    key: 'purchase_order',
    label: 'Purchase order',
    description: 'Purchase order number or item ID.',
    synonyms: [
      'purchase order',
      'purchase order number',
      'po',
      'po number',
      'order number',
      'order id',
      'purchase id',
      'orden de compra',
      'numero de orden',
      'numero de compra',
      'pedido'
    ]
  },
  {
    key: 'product_name',
    label: 'Product name',
    description: 'Name or description of the product.',
    synonyms: [
      'product',
      'product name',
      'product style name',
      'style name',
      'item name',
      'description',
      'product description',
      'producto',
      'nombre del producto',
      'descripcion',
      'descripcion del producto'
    ]
  },
  {
    key: 'country_of_origin',
    label: 'Country of origin',
    description: 'Country where the product was made.',
    synonyms: [
      'country',
      'country of origin',
      'origin',
      'origin country',
      'made in',
      'coo',
      'pais',
      'pais de origen',
      'origen',
      'hecho en'
    ]
  },
  {
    key: 'supplier',
    label: 'Supplier',
    description: 'Supplier or manufacturer name.',
    synonyms: [
      'supplier',
      'supplier name',
      'vendor',
      'vendor name',
      'manufacturer',
      'factory owner',
      'proveedor',
      'nombre del proveedor',
      'fabricante'
    ]
  },
  {
    key: 'supplier_email',
    label: 'Supplier email',
    description: 'Supplier contact email.',
    synonyms: [
      'supplier email',
      'supplier contact email',
      'vendor email',
      'manufacturer email',
      'contact email',
      'correo del proveedor',
      'email del proveedor',
      'correo de contacto'
    ]
  },
  {
    key: 'certifications',
    label: 'Certifications',
    description: 'Relevant certifications such as GOTS or FSC.',
    synonyms: [
      'certification',
      'certifications',
      'certificate',
      'certificates',
      'cert',
      'certificacion',
      'certificaciones',
      'certificado',
      'certificados'
    ]
  },
  {
    key: 'status_of_certifications',
    label: 'Status of certifications',
    description: 'Whether certifications are valid, expired or missing.',
    synonyms: [
      'certification status',
      'status of certifications',
      'status of certification',
      'cert status',
      'certificate status',
      'validity',
      'estado de certificaciones',
      'estado de certificacion',
      'vigencia',
      'validez'
    ]
  },
  {
    key: 'material_composition',
    label: 'Material composition',
    description: 'Main materials used in the product.',
    synonyms: [
      'material',
      'materials',
      'material composition',
      'composition',
      'fabric',
      'fabric content',
      'fiber content',
      'material',
      'materiales',
      'composicion',
      'composicion del material',
      'tela'
    ]
  },
  {
    key: 'season',
    label: 'Season',
    description: 'Seasonal designation.',
    synonyms: [
      'season',
      'collection',
      'seasonal designation',
      'drop',
      'temporada',
      'coleccion'
    ]
  },
  {
    key: 'sku',
    label: 'SKU',
    description: 'Stock keeping unit or variant code.',
    synonyms: [
      'sku',
      'style code',
      'item code',
      'product code',
      'variant code',
      'codigo sku',
      'codigo de producto',
      'codigo de articulo'
    ]
  },
  {
    key: 'color',
    label: 'Color',
    description: 'Product color or colorway.',
    synonyms: [
      'color',
      'colour',
      'colorway',
      'shade',
      'color',
      'tono'
    ]
  },
  {
    key: 'facility_name',
    label: 'Facility name',
    description: 'Factory or facility name.',
    synonyms: [
      'facility',
      'facility name',
      'factory',
      'factory name',
      'mill',
      'production facility',
      'planta',
      'nombre de planta',
      'fabrica',
      'nombre de fabrica'
    ]
  },
  {
    key: 'facility_address',
    label: 'Facility address',
    description: 'Factory or facility address.',
    synonyms: [
      'facility address',
      'factory address',
      'address',
      'production address',
      'site address',
      'direccion de planta',
      'direccion de fabrica',
      'direccion'
    ]
  },
  {
    key: 'facility_email',
    label: 'Facility email',
    description: 'Factory or facility email.',
    synonyms: [
      'facility email',
      'factory email',
      'site email',
      'production email',
      'correo de planta',
      'email de planta',
      'correo de fabrica'
    ]
  },
  {
    key: 'facility_contact_name',
    label: 'Facility contact name',
    description: 'Factory or facility contact name.',
    synonyms: [
      'facility contact',
      'facility contact name',
      'factory contact',
      'factory contact name',
      'contact name',
      'representative',
      'contacto de planta',
      'nombre de contacto',
      'representante'
    ]
  }
]

export const PRODUCT_FIELD_KEYS = PRODUCT_FIELDS.map((field) => field.key)
