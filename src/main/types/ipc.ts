export const IPC_CHANNELS = {
  // Sync
  SYNC_START: 'sync:start',
  SYNC_STATUS: 'sync:status',
  SYNC_HISTORY: 'sync:history',

  // Invoices
  INVOICES_GET_ALL: 'invoices:getAll',
  INVOICES_GET_BY_ID: 'invoices:getById',
  INVOICES_GET_BY_CUSTOMER: 'invoices:getByCustomer',
  INVOICES_GET_SUMMARY: 'invoices:getSummary',

  // Customers
  CUSTOMERS_GET_ALL: 'customers:getAll',
  CUSTOMERS_GET_BY_ID: 'customers:getById',
  CUSTOMERS_GET_WITH_OVERDUE: 'customers:getWithOverdueInvoices',

  // Stripe
  STRIPE_GET_PAYMENT_LINK: 'stripe:getPaymentLink',
  STRIPE_GET_CUSTOMER_STATEMENT: 'stripe:getCustomerStatement',
  STRIPE_GET_OPEN_INVOICES: 'stripe:getOpenInvoices',
  STRIPE_TEST_CONNECTION: 'stripe:testConnection',

  // Email
  EMAIL_GET_TEMPLATES: 'email:getTemplates',
  EMAIL_GET_TEMPLATE_BY_ID: 'email:getTemplateById',
  EMAIL_SAVE_TEMPLATE: 'email:saveTemplate',
  EMAIL_DELETE_TEMPLATE: 'email:deleteTemplate',
  EMAIL_GET_SUGGESTIONS: 'email:getSuggestions',
  EMAIL_SEND: 'email:send',
  EMAIL_GET_HISTORY: 'email:getHistory',
  EMAIL_TEST_SMTP: 'email:testSmtp',

  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  SETTINGS_GET_ALL: 'settings:getAll',
} as const;

export type IPCChannel = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS];
