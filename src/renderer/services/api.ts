import type { Invoice, Customer, ARSummary, EmailTemplate } from '../types';

const api = window.electronAPI;

export const settingsAPI = {
  get: (key: string) => api.getSetting(key),
  set: (key: string, value: any) => api.setSetting(key, value),
  getAll: () => api.getAllSettings(),
};

export const syncAPI = {
  start: () => api.startSync(),
  getHistory: () => api.getSyncHistory(),
};

export const invoicesAPI = {
  getAll: (filters?: any): Promise<Invoice[]> => api.getAllInvoices(filters),
  getById: (id: string): Promise<Invoice> => api.getInvoiceById(id),
  getByCustomer: (customerId: string): Promise<Invoice[]> => api.getInvoicesByCustomer(customerId),
  getSummary: (): Promise<ARSummary> => api.getInvoiceSummary(),
};

export const customersAPI = {
  getAll: (): Promise<Customer[]> => api.getAllCustomers(),
  getById: (id: string): Promise<Customer> => api.getCustomerById(id),
  getWithOverdue: (): Promise<Customer[]> => api.getCustomersWithOverdue(),
};

export const emailAPI = {
  getTemplates: (): Promise<EmailTemplate[]> => api.getEmailTemplates(),
  getTemplateById: (id: string): Promise<EmailTemplate> => api.getEmailTemplateById(id),
  saveTemplate: (template: any) => api.saveEmailTemplate(template),
  getSuggestions: () => api.getEmailSuggestions(),
  send: (emailData: any) => api.sendEmail(emailData),
  getHistory: (customerId?: string) => api.getEmailHistory(customerId),
};

export const stripeAPI = {
  getPaymentLink: (invoiceId: string): Promise<string> => api.getPaymentLink(invoiceId),
  getCustomerStatement: (customerId: string) => api.getCustomerStatement(customerId),
};
